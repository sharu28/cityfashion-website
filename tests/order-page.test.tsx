import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OrderPage } from "@/components/order-page";
import { OrderCartProvider } from "@/components/order-cart-provider";

const storageKey = "city-fashion-order-cart-v1";
const productSlug = "style-1390-printed-long-frock";

function renderOrderPage() {
  localStorage.setItem(storageKey, JSON.stringify([{ productSlug, quantity: 6 }]));
  return render(
    <OrderCartProvider>
      <OrderPage />
    </OrderCartProvider>,
  );
}

describe("OrderPage", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it("submits only name, phone, idempotency key, and cart lines", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "4bb7dcf4-6e9f-4ad1-a284-028d99751818",
        publicNumber: 1001,
        reference: "CF-1001",
        productTotalLkr: 9000,
        createdAt: "2026-09-02T10:00:00.000Z",
        duplicate: false,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderOrderPage();

    await screen.findByText("Style 1390 Printed Long Frock");
    await user.type(screen.getByLabelText("Name"), "Nimali");
    await user.type(screen.getByLabelText("WhatsApp number"), "0742216040");
    await user.click(screen.getByRole("button", { name: "Place order" }));

    expect(await screen.findByText("Order received")).toBeVisible();
    expect(screen.getByText("CF-1001")).toBeVisible();
    expect(screen.getByRole("link", { name: "Message us on WhatsApp" })).toHaveAttribute(
      "href",
      expect.stringContaining("CF-1001"),
    );
    const [, options] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(options.body))).toEqual({
      customerName: "Nimali",
      whatsappNumber: "0742216040",
      idempotencyKey: expect.stringMatching(/^[0-9a-f-]{36}$/),
      items: [{ productSlug, quantity: 6 }],
    });
    expect(localStorage.getItem(storageKey)).toBe("[]");
  });

  it("keeps the cart and shows recovery copy when submission fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          message:
            "We could not place your order. Your items are still saved. Try again or message us on WhatsApp.",
        }),
      }),
    );
    const user = userEvent.setup();
    renderOrderPage();

    await screen.findByText("Style 1390 Printed Long Frock");
    await user.type(screen.getByLabelText("Name"), "Nimali");
    await user.type(screen.getByLabelText("WhatsApp number"), "0742216040");
    await user.click(screen.getByRole("button", { name: "Place order" }));

    expect(await screen.findByText(/We could not place your order/)).toBeVisible();
    expect(screen.getByText("Style 1390 Printed Long Frock")).toBeVisible();
    await waitFor(() => expect(localStorage.getItem(storageKey)).toContain(productSlug));
  });
});
