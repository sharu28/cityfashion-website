import { describe, expect, it, vi } from "vitest";

import {
  buildOrderSupportWhatsAppLink,
  normalizeSriLankaMobile,
  OrderValidationError,
} from "@/lib/order-domain";
import { submitOrder } from "@/lib/order-service";

const catalog = [
  {
    id: "1390",
    slug: "style-1390",
    title: "Style 1390",
    unitPriceLkr: 1500,
  },
  {
    id: "ask",
    slug: "ask-price",
    title: "Ask Price",
    unitPriceLkr: null,
  },
];

const validPayload = {
  customerName: "Nimali",
  whatsappNumber: "0742216040",
  idempotencyKey: "9b0c79fd-cf5c-4eef-b44f-6dbf8353e75e",
  items: [{ productSlug: "style-1390", quantity: 6 }],
};

function receipt(duplicate = false) {
  return {
    id: "4bb7dcf4-6e9f-4ad1-a284-028d99751818",
    publicNumber: 1001,
    reference: "CF-1001",
    productTotalLkr: 9000,
    createdAt: "2026-09-02T10:00:00.000Z",
    duplicate,
  };
}

describe("order service", () => {
  it("normalizes common Sri Lanka mobile formats", () => {
    expect(normalizeSriLankaMobile("0742216040")).toBe("+94742216040");
    expect(normalizeSriLankaMobile("742216040")).toBe("+94742216040");
    expect(normalizeSriLankaMobile("94742216040")).toBe("+94742216040");
    expect(normalizeSriLankaMobile("+94 74 221 6040")).toBe("+94742216040");
    expect(() => normalizeSriLankaMobile("0712345")).toThrow(OrderValidationError);
    expect(buildOrderSupportWhatsAppLink("CF-1001")).toContain("CF-1001");
  });

  it("uses catalog prices and keeps a saved order when email fails", async () => {
    const repository = { create: vi.fn().mockResolvedValue(receipt()) };
    const notifier = {
      sendNewOrder: vi.fn().mockRejectedValue(new Error("email unavailable")),
    };
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await submitOrder(validPayload, {
      catalog,
      identityHash: "salted-hash",
      notifier,
      repository,
    });

    expect(result.reference).toBe("CF-1001");
    expect(repository.create).toHaveBeenCalledWith({
      customerName: "Nimali",
      whatsappPhone: "+94742216040",
      idempotencyKey: validPayload.idempotencyKey,
      identityHash: "salted-hash",
      productTotalLkr: 9000,
      items: [
        {
          productId: "1390",
          productSlug: "style-1390",
          productTitle: "Style 1390",
          unitPriceLkr: 1500,
          quantity: 6,
          lineTotalLkr: 9000,
        },
      ],
    });
    expect(notifier.sendNewOrder).toHaveBeenCalledOnce();
    expect(errorSpy).toHaveBeenCalledOnce();
    errorSpy.mockRestore();
  });

  it.each([
    [{ ...validPayload, customerName: "   " }, "invalid_name"],
    [{ ...validPayload, whatsappNumber: "0112345678" }, "invalid_phone"],
    [{ ...validPayload, idempotencyKey: "not-a-uuid" }, "invalid_items"],
    [{ ...validPayload, items: [{ productSlug: "style-1390", quantity: 5 }] }, "invalid_items"],
    [
      {
        ...validPayload,
        items: [
          { productSlug: "style-1390", quantity: 6 },
          { productSlug: "style-1390", quantity: 7 },
        ],
      },
      "invalid_items",
    ],
  ])("rejects invalid customer input", async (payload, code) => {
    await expect(
      submitOrder(payload, {
        catalog,
        identityHash: "salted-hash",
        notifier: { sendNewOrder: vi.fn() },
        repository: { create: vi.fn() },
      }),
    ).rejects.toMatchObject({ code });
  });

  it.each(["missing-style", "ask-price"])(
    "rejects unavailable catalog styles",
    async (productSlug) => {
      await expect(
        submitOrder(
          { ...validPayload, items: [{ productSlug, quantity: 6 }] },
          {
            catalog,
            identityHash: "salted-hash",
            notifier: { sendNewOrder: vi.fn() },
            repository: { create: vi.fn() },
          },
        ),
      ).rejects.toMatchObject({ code: "style_unavailable" });
    },
  );

  it("does not send another email for an idempotent retry", async () => {
    const notifier = { sendNewOrder: vi.fn() };
    const result = await submitOrder(validPayload, {
      catalog,
      identityHash: "salted-hash",
      notifier,
      repository: { create: vi.fn().mockResolvedValue(receipt(true)) },
    });

    expect(result.duplicate).toBe(true);
    expect(notifier.sendNewOrder).not.toHaveBeenCalled();
  });
});
