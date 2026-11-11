// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { createResendOrderNotifier } = await import("@/lib/order-email");

const order = {
  id: "0b0b0b0b-0000-4000-8000-000000000001",
  publicNumber: 1001,
  reference: "CF-1001",
  productTotalLkr: 9000,
  createdAt: "2026-11-11T08:00:00.000Z",
  duplicate: false,
  customerName: "Test <Shop>",
  whatsappPhone: "+94771234567",
  items: [{ productId: "1390", productTitle: "Style 1390", unitPriceLkr: 1500, quantity: 6, lineTotalLkr: 9000 }],
};

const env = {
  RESEND_API_KEY: "re_test_not_a_real_key",
  ORDER_EMAIL_FROM: "Orders <orders@example.com>",
  ORDER_NOTIFICATION_EMAIL: "owner@example.com",
};

beforeEach(() => {
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("order email", () => {
  it("posts the order to the Resend API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "email-1" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await createResendOrderNotifier().sendNewOrder(order);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer re_test_not_a_real_key");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      from: "Orders <orders@example.com>",
      to: ["owner@example.com"],
      subject: "New order CF-1001",
    });
    expect(body.text).toContain("Style 1390 (1390) — 6 × Rs. 1,500 = Rs. 9,000");
    expect(body.html).toContain("Test &lt;Shop&gt;");
    expect(body.html).not.toContain("Test <Shop>");
  });

  it("uses the test base URL when one is set", async () => {
    vi.stubEnv("RESEND_API_BASE_URL", "http://127.0.0.1:8788/");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await createResendOrderNotifier().sendNewOrder(order);

    expect(fetchMock.mock.calls[0][0]).toBe("http://127.0.0.1:8788/emails");
  });

  it("fails loudly when Resend rejects the email", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("domain not verified", { status: 403 })));

    await expect(createResendOrderNotifier().sendNewOrder(order)).rejects.toThrow(/Resend returned 403/);
  });

  it("fails when email is not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    await expect(createResendOrderNotifier().sendNewOrder(order)).rejects.toThrow(/not configured/);
  });
});
