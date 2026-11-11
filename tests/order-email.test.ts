// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { createCloudflareOrderNotifier, parseEmailAddress } = await import("@/lib/order-email");

const order = {
  id: "0b0b0b0b-0000-4000-8000-000000000001",
  publicNumber: 1001,
  reference: "CF-1001",
  productTotalLkr: 9000,
  createdAt: "2026-11-11T08:00:00.000Z",
  duplicate: false,
  customerName: "Test <Shop>",
  whatsappPhone: "+94771234567",
  items: [
    {
      productId: "1390",
      productTitle: "Style 1390",
      unitPriceLkr: 1500,
      quantity: 6,
      lineTotalLkr: 9000,
      sizes: [
        { size: "M", quantity: 2 },
        { size: "L", quantity: 2 },
        { size: "XL", quantity: 2 },
      ],
    },
    { productId: "1710", productTitle: "Style 1710", unitPriceLkr: 2000, quantity: 6, lineTotalLkr: 12000 },
  ],
};

const env = {
  ORDER_EMAIL_FROM: "City Fashion Orders <orders@example.com>",
  ORDER_NOTIFICATION_EMAIL: "owner@example.com",
};

beforeEach(() => {
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("order email", () => {
  it("sends the order through the Cloudflare email binding", async () => {
    const sender = { send: vi.fn().mockResolvedValue({ messageId: "<m1@example.com>" }) };

    await createCloudflareOrderNotifier(sender).sendNewOrder(order);

    expect(sender.send).toHaveBeenCalledTimes(1);
    const message = sender.send.mock.calls[0][0];
    expect(message).toMatchObject({
      from: { email: "orders@example.com", name: "City Fashion Orders" },
      to: ["owner@example.com"],
      subject: "New order CF-1001",
    });
    expect(message.text).toContain("Style 1390 (1390) — 6 × Rs. 1,500 = Rs. 9,000");
    expect(message.text).toContain("Sizes: M 2 · L 2 · XL 2");
    expect(message.text).toContain("Sizes: staff to confirm");
    expect(message.html).toContain("Sizes: M 2 · L 2 · XL 2");
    expect(message.html).toContain("Test &lt;Shop&gt;");
    expect(message.html).not.toContain("Test <Shop>");
  });

  it("reports the Cloudflare error code when sending fails", async () => {
    const failure = Object.assign(new Error("Sender domain not verified"), { code: "E_SENDER_NOT_VERIFIED" });
    const sender = { send: vi.fn().mockRejectedValue(failure) };

    await expect(createCloudflareOrderNotifier(sender).sendNewOrder(order)).rejects.toThrow(
      /Cloudflare email failed \(E_SENDER_NOT_VERIFIED\): Sender domain not verified/,
    );
  });

  it("fails when the binding or addresses are missing", async () => {
    await expect(createCloudflareOrderNotifier(undefined).sendNewOrder(order)).rejects.toThrow(/not configured/);

    vi.stubEnv("ORDER_NOTIFICATION_EMAIL", "");
    const sender = { send: vi.fn() };
    await expect(createCloudflareOrderNotifier(sender).sendNewOrder(order)).rejects.toThrow(/not configured/);
    expect(sender.send).not.toHaveBeenCalled();
  });

  it("reads sender addresses with or without a name", () => {
    expect(parseEmailAddress("City Fashion Orders <orders@cityfashion.shop>")).toEqual({
      email: "orders@cityfashion.shop",
      name: "City Fashion Orders",
    });
    expect(parseEmailAddress('"Orders" <orders@cityfashion.shop>')).toEqual({ email: "orders@cityfashion.shop", name: "Orders" });
    expect(parseEmailAddress("orders@cityfashion.shop")).toBe("orders@cityfashion.shop");
    expect(parseEmailAddress("<orders@cityfashion.shop>")).toBe("orders@cityfashion.shop");
    expect(parseEmailAddress("not an address")).toBeNull();
  });
});
