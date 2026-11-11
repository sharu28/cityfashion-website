import {
  type AdminOrderDetail,
  type AdminOrderListItem,
  type AdminOrderPatch,
  AdminOrderNotFoundError,
  AdminOrderValidationError,
  calculateFinalTotal,
  canTransitionOrder,
  type OrderItemRow,
  type OrderRow,
} from "@/lib/order-admin-shared";

export * from "@/lib/order-admin-shared";

type StoredOrderRow = Omit<OrderRow, "final_total_lkr">;

function withFinalTotal(row: StoredOrderRow): OrderRow {
  return { ...row, final_total_lkr: calculateFinalTotal(row.product_total_lkr, row.delivery_charge_lkr) };
}

export async function listOrders(db: D1Database): Promise<AdminOrderListItem[]> {
  const { results } = await db
    .prepare(
      `SELECT o.id, o.public_number, o.created_at, o.customer_name, o.whatsapp_phone,
              o.product_total_lkr, o.status,
              (SELECT count(*) FROM order_items i WHERE i.order_id = o.id) AS style_count
       FROM orders o
       ORDER BY o.created_at DESC, o.public_number DESC`,
    )
    .all<Omit<AdminOrderListItem, "reference" | "styleCount"> & { style_count: number }>();

  return results.map(({ style_count, ...order }) => ({
    ...order,
    reference: `CF-${order.public_number}`,
    styleCount: style_count,
  }));
}

export async function getOrder(db: D1Database, id: string): Promise<AdminOrderDetail> {
  const [order, items] = await Promise.all([
    db.prepare("SELECT * FROM orders WHERE id = ?").bind(id).first<StoredOrderRow>(),
    db
      .prepare("SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at, product_title")
      .bind(id)
      .all<OrderItemRow>(),
  ]);

  if (!order) throw new AdminOrderNotFoundError();

  return {
    ...withFinalTotal(order),
    items: items.results,
    reference: `CF-${order.public_number}`,
    paymentInstructions: process.env.PAYMENT_INSTRUCTIONS?.trim() ?? "",
  };
}

export async function updateOrder(
  db: D1Database,
  id: string,
  patch: AdminOrderPatch,
  now: () => Date = () => new Date(),
) {
  const current = await getOrder(db, id);
  if (patch.status && patch.status !== current.status && !canTransitionOrder(current.status, patch.status)) {
    throw new AdminOrderValidationError("This status change is not allowed");
  }
  if (
    patch.deliveryChargeLkr !== undefined &&
    patch.deliveryChargeLkr !== null &&
    (!Number.isInteger(patch.deliveryChargeLkr) || patch.deliveryChargeLkr < 0)
  ) {
    throw new AdminOrderValidationError("Delivery charge must be a whole number");
  }
  if (patch.privateNote !== undefined && (patch.privateNote?.length ?? 0) > 2000) {
    throw new AdminOrderValidationError("Private note is too long");
  }

  const assignments: string[] = [];
  const values: Array<string | number | null> = [];
  if (patch.status !== undefined) {
    assignments.push("status = ?");
    values.push(patch.status);
  }
  if (patch.deliveryChargeLkr !== undefined) {
    assignments.push("delivery_charge_lkr = ?");
    values.push(patch.deliveryChargeLkr);
  }
  if (patch.privateNote !== undefined) {
    assignments.push("private_note = ?");
    values.push(patch.privateNote);
  }
  if (assignments.length === 0) throw new AdminOrderValidationError("No changes provided");

  assignments.push("updated_at = ?");
  values.push(now().toISOString());

  await db
    .prepare(`UPDATE orders SET ${assignments.join(", ")} WHERE id = ?`)
    .bind(...values, id)
    .run();

  return getOrder(db, id);
}
