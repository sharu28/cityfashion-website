// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createD1OrderRepository, OrderStorageValidationError } from "@/lib/d1-order-repository";
import { OrderRateLimitError, type OrderRepository } from "@/lib/order-service";

import { createTestD1 } from "./helpers/d1";

type Input = Parameters<OrderRepository["create"]>[0];

function input(overrides: Partial<Input> = {}): Input {
  const items = overrides.items ?? [
    {
      productId: "1390",
      productSlug: "style-1390",
      productTitle: "Style 1390",
      unitPriceLkr: 1500,
      quantity: 6,
      lineTotalLkr: 9000,
    },
    {
      productId: "1570",
      productSlug: "style-1570",
      productTitle: "Style 1570",
      unitPriceLkr: 2000,
      quantity: 7,
      lineTotalLkr: 14000,
    },
  ];
  return {
    customerName: "Test Shop",
    whatsappPhone: "+94771234567",
    idempotencyKey: crypto.randomUUID(),
    identityHash: "a".repeat(64),
    productTotalLkr: items.reduce((sum, item) => sum + item.unitPriceLkr * item.quantity, 0),
    items,
    ...overrides,
  };
}

let db: D1Database;
let dispose: () => Promise<void>;
let clock: Date;
let repository: OrderRepository;

beforeEach(async () => {
  ({ db, dispose } = await createTestD1());
  clock = new Date("2026-11-11T08:00:00.000Z");
  repository = createD1OrderRepository(db, { now: () => clock });
});

afterEach(async () => {
  await dispose?.();
});

function advance(minutes: number) {
  clock = new Date(clock.getTime() + minutes * 60 * 1000);
}

describe("D1 order repository", () => {
  it("stores the order and items and numbers orders from 1001", async () => {
    const first = await repository.create(input());
    advance(1);
    const second = await repository.create(input({ identityHash: "b".repeat(64) }));

    expect(first).toMatchObject({
      publicNumber: 1001,
      reference: "CF-1001",
      productTotalLkr: 23000,
      createdAt: "2026-11-11T08:00:00.000Z",
      duplicate: false,
    });
    expect(second.publicNumber).toBe(1002);

    const order = await db.prepare("SELECT * FROM orders WHERE id = ?").bind(first.id).first();
    expect(order).toMatchObject({
      customer_name: "Test Shop",
      whatsapp_phone: "+94771234567",
      product_total_lkr: 23000,
      status: "new",
      delivery_charge_lkr: null,
    });

    const { results: items } = await db
      .prepare("SELECT product_slug, quantity, unit_price_lkr, line_total_lkr FROM order_items WHERE order_id = ? ORDER BY product_slug")
      .bind(first.id)
      .all();
    expect(items).toEqual([
      { product_slug: "style-1390", quantity: 6, unit_price_lkr: 1500, line_total_lkr: 9000 },
      { product_slug: "style-1570", quantity: 7, unit_price_lkr: 2000, line_total_lkr: 14000 },
    ]);
  });

  it("stores pieces per size as JSON and leaves it empty when sizes are not picked", async () => {
    const order = await repository.create(
      input({
        items: [
          {
            productId: "1390",
            productSlug: "style-1390",
            productTitle: "Style 1390",
            unitPriceLkr: 1500,
            quantity: 6,
            lineTotalLkr: 9000,
            sizes: [
              { size: "M", quantity: 2 },
              { size: "L", quantity: 4 },
            ],
          },
          { productId: "1710", productSlug: "style-1710", productTitle: "Style 1710", unitPriceLkr: 2000, quantity: 6, lineTotalLkr: 12000 },
        ],
      }),
    );
    const { results } = await db
      .prepare("SELECT product_slug, size_breakdown FROM order_items WHERE order_id = ? ORDER BY product_slug")
      .bind(order.id)
      .all<{ product_slug: string; size_breakdown: string | null }>();
    expect(results).toEqual([
      { product_slug: "style-1390", size_breakdown: '[{"size":"M","quantity":2},{"size":"L","quantity":4}]' },
      { product_slug: "style-1710", size_breakdown: null },
    ]);
  });

  it("refuses sizes that do not add up to the style total", async () => {
    await expect(
      repository.create(
        input({
          items: [
            {
              productId: "1390",
              productSlug: "style-1390",
              productTitle: "Style 1390",
              unitPriceLkr: 1500,
              quantity: 6,
              lineTotalLkr: 9000,
              sizes: [{ size: "M", quantity: 5 }],
            },
          ],
        }),
      ),
    ).rejects.toMatchObject({ code: "invalid_order_items" });
  });

  it("returns the first order for a repeated idempotency key", async () => {
    const order = input();
    const first = await repository.create(order);
    const again = await repository.create(order);

    expect(again).toEqual({ ...first, duplicate: true });
    const count = await db.prepare("SELECT count(*) AS n FROM orders").first<{ n: number }>();
    expect(count?.n).toBe(1);
  });

  it("rejects the 6th attempt within 15 minutes and allows it later", async () => {
    for (let index = 0; index < 5; index += 1) {
      await repository.create(input());
      advance(1);
    }
    await expect(repository.create(input())).rejects.toBeInstanceOf(OrderRateLimitError);

    const otherShop = await repository.create(input({ identityHash: "c".repeat(64) }));
    expect(otherShop.duplicate).toBe(false);

    advance(15);
    await expect(repository.create(input())).resolves.toMatchObject({ duplicate: false });
  });

  it("prunes attempts older than 7 days", async () => {
    await repository.create(input());
    advance(8 * 24 * 60);
    await repository.create(input());

    const count = await db
      .prepare("SELECT count(*) AS n FROM order_submission_attempts WHERE identity_hash = ?")
      .bind("a".repeat(64))
      .first<{ n: number }>();
    expect(count?.n).toBe(1);
  });

  it.each([
    ["invalid_customer_name", input({ customerName: "   " })],
    ["invalid_customer_name", input({ customerName: "x".repeat(101) })],
    ["invalid_whatsapp_phone", input({ whatsappPhone: "0771234567" })],
    ["invalid_identity", input({ identityHash: "short" })],
    ["invalid_order_items", input({ items: [] })],
    [
      "invalid_order_items",
      input({
        items: [{ productId: "1", productSlug: "s", productTitle: "S", unitPriceLkr: 100, quantity: 5, lineTotalLkr: 500 }],
      }),
    ],
    [
      "invalid_order_items",
      input({
        items: [{ productId: "1", productSlug: "s", productTitle: "S", unitPriceLkr: 0, quantity: 6, lineTotalLkr: 0 }],
      }),
    ],
    [
      "order_total_too_large",
      input({
        items: [{ productId: "1", productSlug: "s", productTitle: "S", unitPriceLkr: 2_000_000_000, quantity: 6, lineTotalLkr: 0 }],
      }),
    ],
  ])("rejects bad input with %s", async (code, bad) => {
    await expect(repository.create(bad)).rejects.toMatchObject({ code });
    await expect(repository.create(bad)).rejects.toBeInstanceOf(OrderStorageValidationError);
    const count = await db.prepare("SELECT count(*) AS n FROM orders").first<{ n: number }>();
    expect(count?.n).toBe(0);
  });
});
