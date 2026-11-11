import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { OrderCartProvider, useOrderCart } from "@/components/order-cart-provider";
import { OrderSizesProvider } from "@/components/order-sizes-provider";
import { ProductTile } from "@/components/product-tile";
import { allProducts } from "@/lib/catalog";

const sizesKey = "city-fashion-order-sizes-v1";

function product(id: string) {
  const found = allProducts.find((item) => item.id === id);
  if (!found) throw new Error(`no product ${id}`);
  return found;
}

function Loaded() {
  return <output data-testid="loaded">{useOrderCart().isLoaded ? "yes" : "no"}</output>;
}

async function renderTile(id: string) {
  render(
    <OrderCartProvider>
      <OrderSizesProvider>
        <Loaded />
        <ProductTile product={product(id)} />
      </OrderSizesProvider>
    </OrderCartProvider>,
  );
  await waitFor(() => expect(screen.getByTestId("loaded")).toHaveTextContent("yes"));
}

describe("ProductTile", () => {
  beforeEach(() => localStorage.clear());

  it("shows price, minimum and fabric", async () => {
    await renderTile("4118");

    expect(screen.getByText("Rs. 1,250")).toBeInTheDocument();
    expect(screen.getByText("Min 6 pcs · Cotton")).toBeInTheDocument();
  });

  it("says to ask about fabric when it is missing and counts colours", async () => {
    await renderTile("1390");

    expect(screen.getByText("Min 6 pcs · Fabric: ask us")).toBeInTheDocument();
    expect(screen.getByText("8 colours")).toBeInTheDocument();
  });

  it("adds six pieces with the starter size split in one tap", async () => {
    const user = userEvent.setup();
    await renderTile("1390");

    await user.click(screen.getByRole("button", { name: "Add to order" }));

    expect(screen.getByRole("button", { name: /6 in order/ })).toBeInTheDocument();
    expect(localStorage.getItem(sizesKey)).toContain('{"M":1,"L":2,"XL":2,"2XL":1}');
  });

  it("adds a single quantity of six for a style without sizes", async () => {
    const user = userEvent.setup();
    await renderTile("1710");

    await user.click(screen.getByRole("button", { name: "Add to order" }));

    expect(screen.getByRole("button", { name: /6 in order/ })).toBeInTheDocument();
    expect(localStorage.getItem(sizesKey) ?? "").not.toContain("style-1710");
  });

  it("opens the order sheet from the chip and saves changes on Done", async () => {
    const user = userEvent.setup();
    await renderTile("1390");
    await user.click(screen.getByRole("button", { name: "Add to order" }));

    await user.click(screen.getByRole("button", { name: /6 in order/ }));
    const sheet = screen.getByRole("dialog");
    await user.click(within(sheet).getByRole("button", { name: "Add one piece, size M" }));
    await user.click(within(sheet).getByRole("button", { name: "Done" }));

    expect(screen.getByRole("button", { name: /7 in order/ })).toBeInTheDocument();
  });

  it("sets its own dark text so the sheet stays readable inside the black deals band", async () => {
    const user = userEvent.setup();
    render(
      <OrderCartProvider>
        <OrderSizesProvider>
          <Loaded />
          <div className="text-white">
            <ProductTile product={product("1390")} invert />
          </div>
        </OrderSizesProvider>
      </OrderCartProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("loaded")).toHaveTextContent("yes"));
    await user.click(screen.getByRole("button", { name: "Add to order" }));
    await user.click(screen.getByRole("button", { name: /6 in order/ }));

    const panel = screen.getByRole("dialog").querySelector(".order-sheet-panel");
    expect(panel).toHaveClass("text-[var(--ink)]");
  });

  it("disables Done while the sheet is under six pieces", async () => {
    const user = userEvent.setup();
    await renderTile("1390");
    await user.click(screen.getByRole("button", { name: "Add to order" }));
    await user.click(screen.getByRole("button", { name: /6 in order/ }));

    const sheet = screen.getByRole("dialog");
    await user.click(within(sheet).getByRole("button", { name: "Remove one piece, size L" }));

    expect(within(sheet).getByRole("button", { name: "Done" })).toBeDisabled();
  });

  it("removes the style from the sheet", async () => {
    const user = userEvent.setup();
    await renderTile("1390");
    await user.click(screen.getByRole("button", { name: "Add to order" }));
    await user.click(screen.getByRole("button", { name: /6 in order/ }));

    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Remove from order" }));

    expect(screen.getByRole("button", { name: "Add to order" })).toBeInTheDocument();
  });

  it("clamps long names to two lines", async () => {
    await renderTile("4117");

    const name = screen.getByRole("link", { name: /Button-Front Gathered Long Top$/ });
    expect(name.className).toContain("line-clamp-2");
  });
});
