import { describe, expect, it } from "vitest";
import {
  addCartItem,
  removeCartItem,
  sanitizeCart,
  setCartQuantity,
  summarizeCart,
} from "@/lib/order-cart";

describe("order cart", () => {
  it("adds a style at six and increments one piece at a time", () => {
    const added = addCartItem([], "style-1390");
    expect(added).toEqual([{ productSlug: "style-1390", quantity: 6 }]);
    expect(addCartItem(added, "style-1390")).toEqual(added);
    expect(setCartQuantity(added, "style-1390", 7)).toEqual([
      { productSlug: "style-1390", quantity: 7 },
    ]);
  });

  it("keeps six as the minimum and accepts integer piece changes only", () => {
    const entries = [{ productSlug: "style-1390", quantity: 6 }];
    expect(setCartQuantity(entries, "style-1390", 5)).toBe(entries);
    expect(setCartQuantity(entries, "style-1390", 6.5)).toBe(entries);
    expect(setCartQuantity(entries, "missing", 7)).toBe(entries);
  });

  it("removes a style", () => {
    const entries = [
      { productSlug: "style-1390", quantity: 6 },
      { productSlug: "style-1490", quantity: 7 },
    ];
    expect(removeCartItem(entries, "style-1390")).toEqual([
      { productSlug: "style-1490", quantity: 7 },
    ]);
  });

  it("calculates exact totals from current catalog prices", () => {
    const summary = summarizeCart(
      [
        { productSlug: "style-1390", quantity: 6 },
        { productSlug: "style-1490", quantity: 7 },
      ],
      [
        { slug: "style-1390", unitPriceLkr: 1500 },
        { slug: "style-1490", unitPriceLkr: 1700 },
      ],
    );
    expect(summary).toEqual({
      lines: [
        {
          productSlug: "style-1390",
          quantity: 6,
          unitPriceLkr: 1500,
          lineTotalLkr: 9000,
        },
        {
          productSlug: "style-1490",
          quantity: 7,
          unitPriceLkr: 1700,
          lineTotalLkr: 11900,
        },
      ],
      itemCount: 13,
      styleCount: 2,
      productTotalLkr: 20900,
    });
  });

  it("drops stale and non-orderable products from summaries", () => {
    const summary = summarizeCart(
      [
        { productSlug: "missing", quantity: 6 },
        { productSlug: "ask-price", quantity: 6 },
      ],
      [{ slug: "ask-price", unitPriceLkr: null }],
    );
    expect(summary.lines).toEqual([]);
    expect(summary.productTotalLkr).toBe(0);
  });

  it("drops malformed browser data and duplicate slugs", () => {
    expect(
      sanitizeCart([
        { productSlug: "style-1390", quantity: "six" },
        { productSlug: "", quantity: 6 },
        { productSlug: "style-1490", quantity: 5 },
        { productSlug: "style-1710", quantity: 6 },
        { productSlug: "style-1710", quantity: 7 },
      ]),
    ).toEqual([{ productSlug: "style-1710", quantity: 6 }]);
    expect(sanitizeCart({ productSlug: "style-1390", quantity: 6 })).toEqual([]);
  });
});
