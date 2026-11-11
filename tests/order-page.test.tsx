import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OrderPage } from "@/components/order-page";
import { OrderCartProvider } from "@/components/order-cart-provider";
import { OrderSizesProvider } from "@/components/order-sizes-provider";

const storageKey = "city-fashion-order-cart-v1";
const sizesKey = "city-fashion-order-sizes-v1";
const productSlug = "style-1390-printed-long-frock";

function renderWith(entries: Array<{ productSlug: string; quantity: number }>) {
  localStorage.setItem(storageKey, JSON.stringify(entries));
  return render(
    <OrderCartProvider>
      <OrderSizesProvider>
        <OrderPage />
      </OrderSizesProvider>
    </OrderCartProvider>,
  );
}

function renderOrderPage() {
  return renderWith([{ productSlug, quantity: 6 }]);
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

  it("lists sizes inline for a sized style", async () => {
    localStorage.setItem(sizesKey, JSON.stringify({ [productSlug]: { M: 1, L: 2, XL: 2, "2XL": 1 } }));
    renderOrderPage();

    expect(await screen.findByRole("heading", { name: "Check your styles" })).toBeInTheDocument();
    expect(screen.getByText("M 1 · L 2 · XL 2 · 2XL 1")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Quantity, size L" })).toHaveValue("2");
  });

  it("saves a size change straight to the order", async () => {
    const user = userEvent.setup();
    renderOrderPage();

    await user.click(await screen.findByRole("button", { name: "Add one piece, size M" }));

    await waitFor(() => expect(localStorage.getItem(storageKey)).toContain('"quantity":7'));
    expect(screen.getByText("M 2 · L 2 · XL 2 · 2XL 1")).toBeInTheDocument();
  });

  it("keeps showing the saved sizes while a change is under 6", async () => {
    const user = userEvent.setup();
    renderOrderPage();

    await user.click(await screen.findByRole("button", { name: "Remove one piece, size M" }));

    expect(screen.getByText("Minimum 6 pieces for this style")).toBeInTheDocument();
    expect(screen.getByText("M 1 · L 2 · XL 2 · 2XL 1")).toBeInTheDocument();
    expect(localStorage.getItem(storageKey)).toContain('"quantity":6');
  });

  it("blocks placing the order while a size change is under 6", async () => {
    const user = userEvent.setup();
    renderOrderPage();

    await user.click(await screen.findByRole("button", { name: "Remove one piece, size M" }));

    expect(screen.getByRole("button", { name: "Place order" })).toBeDisabled();
    expect(screen.getByText("Each style needs 6 pieces or more before you place the order.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add one piece, size L" }));

    expect(screen.getByRole("button", { name: "Place order" })).toBeEnabled();
    expect(screen.queryByText("Each style needs 6 pieces or more before you place the order.")).not.toBeInTheDocument();
  });

  it("keeps the single quantity control for a style without sizes", async () => {
    const user = userEvent.setup();
    renderWith([{ productSlug: "style-1710", quantity: 6 }]);

    await user.click(await screen.findByRole("button", { name: "Add one piece" }));

    expect(screen.getByRole("textbox", { name: "Quantity" })).toHaveValue("7");
    await waitFor(() => expect(localStorage.getItem(storageKey)).toContain('"quantity":7'));
  });

  it("shows a way back to the styles when the order is empty", async () => {
    renderWith([]);

    expect(await screen.findByText("Your order is empty")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse styles" })).toBeInTheDocument();
    expect(screen.getAllByRole("article").length).toBeGreaterThan(0);
  });
});
