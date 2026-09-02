import type { Database } from "@/lib/supabase/types";
import {
  type AdminOrderDetail,
  type AdminOrderListItem,
  type AdminOrderPatch,
  AdminOrderNotFoundError,
  AdminOrderValidationError,
  canTransitionOrder,
} from "@/lib/order-admin-shared";

export * from "@/lib/order-admin-shared";

export async function listOrders(): Promise<AdminOrderListItem[]> {
  const { createSupabaseServiceClient } = await import("@/lib/supabase/service");
  const client = createSupabaseServiceClient();
  const [{ data: orders, error: ordersError }, { data: items, error: itemsError }] =
    await Promise.all([
      client
        .from("orders")
        .select("id,public_number,created_at,customer_name,whatsapp_phone,product_total_lkr,status")
        .order("created_at", { ascending: false }),
      client.from("order_items").select("order_id"),
    ]);

  if (ordersError) throw ordersError;
  if (itemsError) throw itemsError;

  const itemCounts = new Map<string, number>();
  for (const item of items ?? []) {
    itemCounts.set(item.order_id, (itemCounts.get(item.order_id) ?? 0) + 1);
  }

  return (orders ?? []).map((order) => ({
    ...order,
    reference: `CF-${order.public_number}`,
    styleCount: itemCounts.get(order.id) ?? 0,
  }));
}

export async function getOrder(id: string): Promise<AdminOrderDetail> {
  const { createSupabaseServiceClient } = await import("@/lib/supabase/service");
  const client = createSupabaseServiceClient();
  const [{ data: order, error: orderError }, { data: items, error: itemsError }] =
    await Promise.all([
      client.from("orders").select("*").eq("id", id).maybeSingle(),
      client.from("order_items").select("*").eq("order_id", id).order("created_at"),
    ]);

  if (orderError) throw orderError;
  if (!order) throw new AdminOrderNotFoundError();
  if (itemsError) throw itemsError;

  return {
    ...order,
    items: items ?? [],
    reference: `CF-${order.public_number}`,
    paymentInstructions: process.env.PAYMENT_INSTRUCTIONS?.trim() ?? "",
  };
}

export async function updateOrder(id: string, patch: AdminOrderPatch) {
  const current = await getOrder(id);
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

  const update: Database["public"]["Tables"]["orders"]["Update"] = {};
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.deliveryChargeLkr !== undefined) update.delivery_charge_lkr = patch.deliveryChargeLkr;
  if (patch.privateNote !== undefined) update.private_note = patch.privateNote;
  if (Object.keys(update).length === 0) throw new AdminOrderValidationError("No changes provided");

  const { createSupabaseServiceClient } = await import("@/lib/supabase/service");
  const client = createSupabaseServiceClient();
  const { error } = await client.from("orders").update(update).eq("id", id);
  if (error) throw error;

  return getOrder(id);
}
