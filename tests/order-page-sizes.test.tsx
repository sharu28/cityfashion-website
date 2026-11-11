import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OrderCartProvider } from "@/components/order-cart-provider";
import { OrderPage } from "@/components/order-page";
import { OrderSizesProvider } from "@/components/order-sizes-provider";

const productSlug = "style-1390-printed-long-frock";

describe("OrderPage size orders", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("sends the size split with each sized item", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "x", publicNumber: 1001, reference: "CF-1001", productTotalLkr: 9000, createdAt: "", duplicate: false }),
    });
    vi.stubGlobal("fetch", fetchMock);
    localStorage.setItem("city-fashion-order-cart-v1", JSON.stringify([{ productSlug, quantity: 6 }]));
    const user = userEvent.setup();
    render(
      <OrderCartProvider>
        <OrderSizesProvider>
          <OrderPage />
        </OrderSizesProvider>
      </OrderCartProvider>,
    );

    await screen.findByText("Style 1390 Printed Long Frock");
    await user.type(screen.getByLabelText("Name"), "Nimali");
    await user.type(screen.getByLabelText("WhatsApp number"), "0742216040");
    await user.click(screen.getByRole("button", { name: "Place order" }));

    const [, options] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(options.body)).items).toEqual([
      {
        productSlug,
        quantity: 6,
        sizes: [
          { size: "M", quantity: 1 },
          { size: "L", quantity: 2 },
          { size: "XL", quantity: 2 },
          { size: "2XL", quantity: 1 },
        ],
      },
    ]);
  });

  it("treats a size change after a failed try as a new order", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ message: "Try again" }) });
    vi.stubGlobal("fetch", fetchMock);
    localStorage.setItem("city-fashion-order-cart-v1", JSON.stringify([{ productSlug, quantity: 6 }]));
    const user = userEvent.setup();
    render(
      <OrderCartProvider>
        <OrderSizesProvider>
          <OrderPage />
        </OrderSizesProvider>
      </OrderCartProvider>,
    );

    await screen.findByText("Style 1390 Printed Long Frock");
    await user.type(screen.getByLabelText("Name"), "Nimali");
    await user.type(screen.getByLabelText("WhatsApp number"), "0742216040");
    await user.click(screen.getByRole("button", { name: "Place order" }));
    await screen.findByText("Try again");

    // Same 6 pieces, different mix: M 2 · L 2 · XL 2 instead of M 1 · L 2 · XL 2 · 2XL 1.
    await user.click(screen.getByRole("button", { name: "Add one piece, size M" }));
    await user.click(screen.getByRole("button", { name: "Remove one piece, size 2XL" }));
    await user.click(screen.getByRole("button", { name: "Place order" }));

    const [first, second] = fetchMock.mock.calls.map(([, options]) => JSON.parse(String(options.body)));
    expect(second.items[0].quantity).toBe(first.items[0].quantity);
    expect(second.idempotencyKey).not.toBe(first.idempotencyKey);
  });
});
