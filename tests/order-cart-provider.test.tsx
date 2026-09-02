import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import {
  OrderCartProvider,
  useOrderCart,
} from "@/components/order-cart-provider";

function Harness() {
  const cart = useOrderCart();

  return (
    <div>
      <output data-testid="loaded">{cart.isLoaded ? "yes" : "no"}</output>
      <output data-testid="quantity">{cart.entries[0]?.quantity ?? 0}</output>
      <button onClick={() => cart.add("style-1390")}>Add</button>
      <button onClick={() => cart.setQuantity("style-1390", 7)}>Seven</button>
      <button onClick={cart.clear}>Clear</button>
    </div>
  );
}

describe("OrderCartProvider", () => {
  beforeEach(() => localStorage.clear());

  it("starts at six and persists cart changes", async () => {
    const user = userEvent.setup();
    render(
      <OrderCartProvider>
        <Harness />
      </OrderCartProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("loaded")).toHaveTextContent("yes"));
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByTestId("quantity")).toHaveTextContent("6");
    expect(localStorage.getItem("city-fashion-order-cart-v1")).toContain('"quantity":6');

    await user.click(screen.getByRole("button", { name: "Seven" }));
    expect(screen.getByTestId("quantity")).toHaveTextContent("7");
    expect(localStorage.getItem("city-fashion-order-cart-v1")).toContain('"quantity":7');
  });

  it("loads sanitized entries and clears them", async () => {
    localStorage.setItem(
      "city-fashion-order-cart-v1",
      JSON.stringify([
        { productSlug: "style-1390", quantity: 6 },
        { productSlug: "bad", quantity: "six" },
      ]),
    );
    const user = userEvent.setup();

    render(
      <OrderCartProvider>
        <Harness />
      </OrderCartProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("quantity")).toHaveTextContent("6"));
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByTestId("quantity")).toHaveTextContent("0");
    expect(localStorage.getItem("city-fashion-order-cart-v1")).toBe("[]");
  });
});
