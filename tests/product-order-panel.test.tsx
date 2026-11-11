import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { OrderCartProvider, useOrderCart } from "@/components/order-cart-provider";
import { OrderSizesProvider } from "@/components/order-sizes-provider";
import { ProductOrderPanel } from "@/components/product-order-panel";
import { allProducts } from "@/lib/catalog";

function product(id: string) {
  const found = allProducts.find((item) => item.id === id);
  if (!found) throw new Error(`no product ${id}`);
  return found;
}

function CartState() {
  const cart = useOrderCart();
  return (
    <>
      <output data-testid="loaded">{cart.isLoaded ? "yes" : "no"}</output>
      <output data-testid="cart">{JSON.stringify(cart.entries)}</output>
    </>
  );
}

async function renderPanel(id: string) {
  render(
    <OrderCartProvider>
      <OrderSizesProvider>
        <CartState />
        <ProductOrderPanel product={product(id)} />
      </OrderSizesProvider>
    </OrderCartProvider>,
  );
  await waitFor(() => expect(screen.getByTestId("loaded")).toHaveTextContent("yes"));
}

describe("ProductOrderPanel", () => {
  beforeEach(() => localStorage.clear());

  it("starts with the starter split and adds it to the order", async () => {
    const user = userEvent.setup();
    await renderPanel("1390");

    expect(screen.getByText("6 pcs · Rs. 9,000")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Add to order/ }));

    expect(screen.getByTestId("cart")).toHaveTextContent('[{"productSlug":"style-1390-printed-long-frock","quantity":6}]');
    expect(localStorage.getItem("city-fashion-order-sizes-v1")).toContain('{"M":1,"L":2,"XL":2,"2XL":1}');
    expect(screen.getByRole("button", { name: /^Update order/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View order" })).toHaveAttribute("href", "/order");
  });

  it("updates the button when a size is typed", async () => {
    const user = userEvent.setup();
    await renderPanel("1390");

    const field = screen.getByRole("textbox", { name: "Quantity, size M" });
    await user.clear(field);
    await user.type(field, "3");
    await user.tab();

    expect(screen.getByRole("button", { name: /^Add to order · 8 pcs/ })).toBeInTheDocument();
  });

  it("disables the button under six pieces", async () => {
    const user = userEvent.setup();
    await renderPanel("1390");

    await user.click(screen.getByRole("button", { name: "Remove one piece, size L" }));

    expect(screen.getByRole("button", { name: /^Add to order/ })).toBeDisabled();
  });

  it("uses one quantity for a style without sizes", async () => {
    const user = userEvent.setup();
    await renderPanel("1710");

    expect(screen.getByRole("textbox", { name: "Quantity" })).toHaveValue("6");
    expect(screen.getByRole("button", { name: "Remove one piece" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Add one piece" }));
    await user.click(screen.getByRole("button", { name: /^Add to order · 7 pcs/ }));

    expect(screen.getByTestId("cart")).toHaveTextContent('"quantity":7');
  });
});
