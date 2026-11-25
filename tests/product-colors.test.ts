import { describe, expect, it, vi } from "vitest";

import { OrderValidationError, validatePlaceOrderPayload } from "@/lib/order-domain";
import { submitOrder } from "@/lib/order-service";
import { colorOptions, groupColorOptions, photoCaption } from "@/lib/product-colors";

const images = [
  "/products/style-x/01-d3502-black-dotted-leaf.webp",
  "/products/style-x/02-d3502-navy-dotted-leaf.webp",
  "/products/style-x/03-d3502-green-lotus.webp",
  "/products/style-x/04-d3502-blue-lotus.webp",
  "/products/style-x/05-d3502-green-tropical.webp",
  "/products/style-x/06-d3502-red-tropical.webp",
  "/products/style-x/07-d3502-green-lotus-neckline.webp",
  "/products/style-x/08-d3502-green-tropical-back.webp",
];
const colors = ["Black Dotted Leaf", "Navy Dotted Leaf", "Green Lotus", "Blue Lotus", "Green Tropical", "Red Tropical"];

describe("product colours", () => {
  it("groups colours by print and links each to its own photo, not a close-up", () => {
    const options = colorOptions({ slug: "style-x", colors, images });
    expect(groupColorOptions(options).map((group) => [group.name, group.options.length])).toEqual([
      ["Dotted Leaf", 2],
      ["Lotus", 2],
      ["Tropical", 2],
    ]);
    expect(options.find((option) => option.name === "Green Lotus")?.image).toBe(images[2]);
    expect(options.find((option) => option.name === "Navy Dotted Leaf")?.hex).toMatch(/^#/);
  });

  it("does not group plain colour names", () => {
    const options = colorOptions({ slug: "plain", colors: ["Red", "Blue", "Black", "White", "Pink", "Navy"], images: [] });
    expect(groupColorOptions(options)).toHaveLength(1);
    expect(options[0].hex).toMatch(/^#/);
  });

  it("captions photos with the close-up type and colour", () => {
    expect(photoCaption(images[6], colors)).toBe("Neckline · Green Lotus");
    expect(photoCaption(images[7], colors)).toBe("Back · Green Tropical");
    expect(photoCaption(images[3], colors)).toBe("Blue Lotus");
    expect(photoCaption("/products/a/ref-model.webp", colors)).toBe("");
  });
});

describe("colours in an order", () => {
  const base = {
    customerName: "Nimali",
    whatsappNumber: "0742216040",
    idempotencyKey: "9b0c79fd-cf5c-4eef-b44f-6dbf8353e75e",
  };

  it("keeps picked colours and drops repeats", () => {
    const order = validatePlaceOrderPayload({
      ...base,
      items: [{ productSlug: "style-x", quantity: 6, colors: ["Green Lotus", "Green Lotus", "Red Tropical"] }],
    });
    expect(order.items[0].colors).toEqual(["Green Lotus", "Red Tropical"]);
  });

  it("rejects colours that are not a list of names", () => {
    expect(() =>
      validatePlaceOrderPayload({ ...base, items: [{ productSlug: "style-x", quantity: 6, colors: "Green" }] }),
    ).toThrow(OrderValidationError);
  });

  it("rejects colours the style does not come in, and saves known ones", async () => {
    const catalog = [{ id: "x", slug: "style-x", title: "Style X", unitPriceLkr: 2300, colors }];
    const repository = {
      create: vi.fn().mockResolvedValue({
        id: "id",
        publicNumber: 1001,
        reference: "CF-1001",
        productTotalLkr: 13800,
        createdAt: "2026-11-25T10:00:00.000Z",
        duplicate: true,
      }),
    };
    const deps = { catalog, identityHash: "h", notifier: { sendNewOrder: vi.fn() }, repository };

    await expect(
      submitOrder({ ...base, items: [{ productSlug: "style-x", quantity: 6, colors: ["Purple"] }] }, deps),
    ).rejects.toThrow(OrderValidationError);

    await submitOrder({ ...base, items: [{ productSlug: "style-x", quantity: 6, colors: ["Green Lotus"] }] }, deps);
    expect(repository.create.mock.calls[0][0].items[0].colors).toEqual(["Green Lotus"]);
  });
});
