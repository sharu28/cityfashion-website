import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { OrderCartProvider, useOrderCart } from "@/components/order-cart-provider";
import { OrderSizesProvider, type OrderLine, useOrderLine } from "@/components/order-sizes-provider";

const sizesKey = "city-fashion-order-sizes-v1";
const cartKey = "city-fashion-order-cart-v1";

let line: OrderLine;
let cart: ReturnType<typeof useOrderCart>;

type CartValue = ReturnType<typeof useOrderCart>;

function capture(nextLine: OrderLine, nextCart: CartValue) {
  line = nextLine;
  cart = nextCart;
}

function Harness({ slug, sizeRange, onRender }: { slug: string; sizeRange: string; onRender: typeof capture }) {
  const line = useOrderLine({ slug, sizeRange });
  const cart = useOrderCart();
  onRender(line, cart);
  return (
    <div>
      <output data-testid="loaded">{cart.isLoaded ? "yes" : "no"}</output>
      <output data-testid="quantity">{line.quantity}</output>
      <output data-testid="split">{JSON.stringify(line.split)}</output>
    </div>
  );
}

async function renderLine(slug: string, sizeRange: string) {
  render(
    <OrderCartProvider>
      <OrderSizesProvider>
        <Harness slug={slug} sizeRange={sizeRange} onRender={capture} />
      </OrderSizesProvider>
    </OrderCartProvider>,
  );
  await waitFor(() => expect(screen.getByTestId("loaded")).toHaveTextContent("yes"));
}

const splitOf = () => JSON.parse(screen.getByTestId("split").textContent ?? "{}");

describe("useOrderLine", () => {
  beforeEach(() => localStorage.clear());

  it("quick add stores the starter split and quantity 6", async () => {
    await renderLine("style-1390", "M - 2XL");
    expect(line.inOrder).toBe(false);

    act(() => line.addWithDefaults());

    expect(cart.entries).toEqual([{ productSlug: "style-1390", quantity: 6 }]);
    expect(splitOf()).toEqual({ M: 1, L: 2, XL: 2, "2XL": 1 });
    expect(localStorage.getItem(sizesKey)).toContain('"style-1390"');
  });

  it("setSplit updates the cart quantity to the sum", async () => {
    await renderLine("style-1390", "M - 2XL");
    act(() => line.addWithDefaults());

    let accepted = false;
    act(() => {
      accepted = line.setSplit({ M: 2, L: 2, XL: 2, "2XL": 2 });
    });

    expect(accepted).toBe(true);
    expect(screen.getByTestId("quantity")).toHaveTextContent("8");
    expect(splitOf()).toEqual({ M: 2, L: 2, XL: 2, "2XL": 2 });
  });

  it("setSplit on a style not yet in the order adds it", async () => {
    await renderLine("style-1390", "M - 2XL");

    act(() => {
      line.setSplit({ M: 0, L: 3, XL: 3, "2XL": 1 });
    });

    expect(cart.entries).toEqual([{ productSlug: "style-1390", quantity: 7 }]);
    expect(line.inOrder).toBe(true);
  });

  it("setSplit refuses totals under 6", async () => {
    await renderLine("style-1390", "M - 2XL");
    act(() => line.addWithDefaults());

    let accepted = true;
    act(() => {
      accepted = line.setSplit({ M: 1, L: 1, XL: 1, "2XL": 1 });
    });

    expect(accepted).toBe(false);
    expect(screen.getByTestId("quantity")).toHaveTextContent("6");
    expect(splitOf()).toEqual({ M: 1, L: 2, XL: 2, "2XL": 1 });
  });

  it("old cart entries get a starter split", async () => {
    localStorage.setItem(cartKey, JSON.stringify([{ productSlug: "style-1390", quantity: 6 }]));
    await renderLine("style-1390", "M - 2XL");

    expect(line.inOrder).toBe(true);
    expect(splitOf()).toEqual({ M: 1, L: 2, XL: 2, "2XL": 1 });
  });

  it("split follows a changed cart quantity", async () => {
    await renderLine("style-1390", "M - 2XL");
    act(() => line.addWithDefaults());

    act(() => cart.setQuantity("style-1390", 9));

    expect(Object.values(splitOf()).reduce((a: number, b) => a + Number(b), 0)).toBe(9);
  });

  it("remove clears both stores", async () => {
    await renderLine("style-1390", "M - 2XL");
    act(() => line.addWithDefaults());

    act(() => line.remove());

    expect(cart.entries).toEqual([]);
    expect(localStorage.getItem(sizesKey)).not.toContain("style-1390");
  });

  it("unsized styles use a single quantity of at least 6", async () => {
    await renderLine("style-1710", "");
    expect(line.isSized).toBe(false);

    act(() => line.addWithDefaults());
    expect(localStorage.getItem(sizesKey) ?? "").not.toContain("style-1710");

    let accepted = true;
    act(() => {
      accepted = line.setQuantity(5);
    });
    expect(accepted).toBe(false);

    act(() => {
      line.setQuantity(10);
    });
    expect(screen.getByTestId("quantity")).toHaveTextContent("10");
  });
});
