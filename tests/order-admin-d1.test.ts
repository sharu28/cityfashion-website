// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createD1OrderRepository } from "@/lib/d1-order-repository";
import {
  AdminOrderNotFoundError,
  AdminOrderValidationError,
  getOrder,
  listOrders,
  updateOrder,
} from "@/lib/order-admin";

import { createTestD1 } from "./helpers/d1";

let db: D1Database;
let dispose: () => Promise<void>;

async function placeOrder(name: string, minute: number, identity: string) {
  const repository = createD1OrderRepository(db, {
    now: () => new Date(Date.UTC(2026, 10, 11, 8, minute)),
  });
  return repository.create({
    customerName: name,
    whatsappPhone: "+94771234567",
    idempotencyKey: crypto.randomUUID(),
    identityHash: identity.repeat(64),
    productTotalLkr: 9000,
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
          { size: "L", quantity: 2 },
          { size: "XL", quantity: 2 },
        ],
      },
    ],
  });
}

beforeEach(async () => {
  ({ db, dispose } = await createTestD1());
});

afterEach(async () => {
  await dispose?.();
});

describe("admin orders on D1", () => {
  it("lists newest orders first with style counts", async () => {
    await placeOrder("First Shop", 0, "a");
    await placeOrder("Second Shop", 5, "b");

    const orders = await listOrders(db);

    expect(orders.map((order) => order.reference)).toEqual(["CF-1002", "CF-1001"]);
    expect(orders[0]).toMatchObject({ customer_name: "Second Shop", styleCount: 1, status: "new", product_total_lkr: 9000 });
  });

  it("shows order detail with items and no final total before delivery is set", async () => {
    const receipt = await placeOrder("First Shop", 0, "a");

    const order = await getOrder(db, receipt.id);

    expect(order).toMatchObject({ reference: "CF-1001", final_total_lkr: null, delivery_charge_lkr: null });
    expect(order.items).toHaveLength(1);
    expect(order.items[0]).toMatchObject({
      product_title: "Style 1390",
      quantity: 6,
      line_total_lkr: 9000,
      sizes: [
        { size: "M", quantity: 2 },
        { size: "L", quantity: 2 },
        { size: "XL", quantity: 2 },
      ],
    });
    expect(order.items[0]).not.toHaveProperty("size_breakdown");
  });

  it("saves an allowed change and computes the final total", async () => {
    const receipt = await placeOrder("First Shop", 0, "a");

    const updated = await updateOrder(
      db,
      receipt.id,
      { status: "confirmed", deliveryChargeLkr: 600, privateNote: "Call after 4pm" },
      () => new Date("2026-11-11T09:00:00.000Z"),
    );

    expect(updated).toMatchObject({
      status: "confirmed",
      delivery_charge_lkr: 600,
      final_total_lkr: 9600,
      private_note: "Call after 4pm",
      updated_at: "2026-11-11T09:00:00.000Z",
    });
  });

  it("refuses a status change that skips a step", async () => {
    const receipt = await placeOrder("First Shop", 0, "a");

    await expect(updateOrder(db, receipt.id, { status: "completed" })).rejects.toBeInstanceOf(AdminOrderValidationError);
    expect((await getOrder(db, receipt.id)).status).toBe("new");
  });

  it("reports a missing order", async () => {
    await expect(getOrder(db, "missing")).rejects.toBeInstanceOf(AdminOrderNotFoundError);
  });
});
