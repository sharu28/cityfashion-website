import { describe, expect, it, vi } from "vitest";

import { cleanSizeCounts, sanitizeCart, setCartQuantity, setCartSizes, toOrderItem } from "@/lib/order-cart";
import { OrderValidationError } from "@/lib/order-domain";
import { submitOrder } from "@/lib/order-service";
import { formatSizeBreakdown, parseSizeRange } from "@/lib/sizes";

describe("size ranges", () => {
  it("expands catalog ranges into pickable sizes", () => {
    expect(parseSizeRange("M - 2XL")).toEqual(["M", "L", "XL", "2XL"]);
    expect(parseSizeRange("S-XL")).toEqual(["S", "M", "L", "XL"]);
    expect(parseSizeRange("M - XXL")).toEqual(["M", "L", "XL", "2XL"]);
    expect(parseSizeRange("L, M, S")).toEqual(["S", "M", "L"]);
    expect(parseSizeRange("Free size")).toEqual([]);
    expect(parseSizeRange("")).toEqual([]);
    expect(parseSizeRange(undefined)).toEqual([]);
    expect(parseSizeRange("2XL - M")).toEqual([]);
  });

  it("formats a breakdown for the owner", () => {
    expect(formatSizeBreakdown([{ size: "M", quantity: 2 }, { size: "L", quantity: 2 }, { size: "XL", quantity: 2 }])).toBe(
      "M 2 · L 2 · XL 2",
    );
    expect(formatSizeBreakdown(null)).toBe("");
  });
});

describe("cart sizes", () => {
  const plain = [{ productSlug: "style-1390", quantity: 6 }];

  it("keeps old entries without sizes and valid entries with sizes", () => {
    expect(
      sanitizeCart([
        { productSlug: "style-1390", quantity: 6 },
        { productSlug: "style-1570", quantity: 6, sizes: { M: 2, L: 4, XL: 0 } },
      ]),
    ).toEqual([
      { productSlug: "style-1390", quantity: 6 },
      { productSlug: "style-1570", quantity: 6, sizes: { M: 2, L: 4 } },
    ]);
  });

  it("drops broken size data but keeps the style", () => {
    expect(sanitizeCart([{ productSlug: "style-1570", quantity: 6, sizes: { M: 2, L: 2 } }])).toEqual([
      { productSlug: "style-1570", quantity: 6 },
    ]);
    expect(sanitizeCart([{ productSlug: "style-1570", quantity: 6, sizes: { M: -1, L: 7 } }])).toEqual([
      { productSlug: "style-1570", quantity: 6 },
    ]);
    expect(cleanSizeCounts({ M: 1.5 })).toBeNull();
    expect(cleanSizeCounts({ M: 0 })).toBeNull();
  });

  it("sets sizes and makes the style total their sum, never below 6", () => {
    expect(setCartSizes(plain, "style-1390", { M: 2, L: 2, XL: 3 })).toEqual([
      { productSlug: "style-1390", quantity: 7, sizes: { M: 2, L: 2, XL: 3 } },
    ]);
    expect(setCartSizes(plain, "style-1390", { M: 2, L: 3 })).toBe(plain);
    expect(setCartSizes(plain, "missing", { M: 6 })).toBe(plain);
  });

  it("leaves a sized style alone when only the total is changed", () => {
    const sized = setCartSizes(plain, "style-1390", { M: 6 });
    expect(setCartQuantity(sized, "style-1390", 7)).toBe(sized);
  });

  it("sends sizes to the order API as a list", () => {
    expect(toOrderItem({ productSlug: "style-1390", quantity: 6, sizes: { M: 2, L: 4 } })).toEqual({
      productSlug: "style-1390",
      quantity: 6,
      sizes: [
        { size: "M", quantity: 2 },
        { size: "L", quantity: 4 },
      ],
    });
    expect(toOrderItem({ productSlug: "style-1390", quantity: 6 })).toEqual({ productSlug: "style-1390", quantity: 6 });
  });
});

describe("order sizes on the server", () => {
  const catalog = [
    { id: "1390", slug: "style-1390", title: "Style 1390", unitPriceLkr: 1500, sizeRange: "M - 2XL" },
    { id: "1710", slug: "style-1710", title: "Style 1710", unitPriceLkr: 2000, sizeRange: "" },
  ];
  const receipt = {
    id: "4bb7dcf4-6e9f-4ad1-a284-028d99751818",
    publicNumber: 1001,
    reference: "CF-1001",
    productTotalLkr: 9000,
    createdAt: "2026-11-11T10:00:00.000Z",
    duplicate: false,
  };

  function payload(items: unknown[]) {
    return {
      customerName: "Nimali",
      whatsappNumber: "0742216040",
      idempotencyKey: "9b0c79fd-cf5c-4eef-b44f-6dbf8353e75e",
      items,
    };
  }

  async function submit(items: unknown[]) {
    const repository = { create: vi.fn().mockResolvedValue(receipt) };
    const notifier = { sendNewOrder: vi.fn().mockResolvedValue(undefined) };
    await submitOrder(payload(items), { catalog, identityHash: "h".repeat(64), notifier, repository });
    return { repository, notifier };
  }

  it("stores sizes in catalog order without zero sizes and emails them", async () => {
    const { repository, notifier } = await submit([
      {
        productSlug: "style-1390",
        quantity: 7,
        sizes: [
          { size: "XL", quantity: 3 },
          { size: "M", quantity: 2 },
          { size: "L", quantity: 2 },
          { size: "2XL", quantity: 0 },
        ],
      },
      { productSlug: "style-1710", quantity: 6 },
    ]);

    const items = repository.create.mock.calls[0][0].items;
    expect(items[0].sizes).toEqual([
      { size: "M", quantity: 2 },
      { size: "L", quantity: 2 },
      { size: "XL", quantity: 3 },
    ]);
    expect(items[0]).toMatchObject({ quantity: 7, lineTotalLkr: 10500 });
    expect(items[1].sizes).toBeUndefined();
    expect(notifier.sendNewOrder.mock.calls[0][0].items[0].sizes).toHaveLength(3);
  });

  it.each([
    ["sizes that do not add up", [{ productSlug: "style-1390", quantity: 6, sizes: [{ size: "M", quantity: 5 }] }]],
    ["fewer than 6 pieces", [{ productSlug: "style-1390", quantity: 5, sizes: [{ size: "M", quantity: 5 }] }]],
    ["a size the style does not come in", [{ productSlug: "style-1390", quantity: 6, sizes: [{ size: "S", quantity: 6 }] }]],
    ["sizes on a style without a size range", [{ productSlug: "style-1710", quantity: 6, sizes: [{ size: "M", quantity: 6 }] }]],
    ["the same size twice", [{ productSlug: "style-1390", quantity: 6, sizes: [{ size: "M", quantity: 3 }, { size: "M", quantity: 3 }] }]],
    ["a part piece", [{ productSlug: "style-1390", quantity: 6, sizes: [{ size: "M", quantity: 5.5 }, { size: "L", quantity: 0.5 }] }]],
    ["only zero sizes", [{ productSlug: "style-1390", quantity: 6, sizes: [{ size: "M", quantity: 0 }] }]],
    ["an empty size list", [{ productSlug: "style-1390", quantity: 6, sizes: [] }]],
  ])("rejects %s", async (_label, items) => {
    await expect(submit(items)).rejects.toMatchObject({ code: "invalid_items" });
    await expect(submit(items)).rejects.toBeInstanceOf(OrderValidationError);
  });
});
