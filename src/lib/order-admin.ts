import type { Database } from "@/lib/supabase/types";

export type OrderStatus = Database["public"]["Enums"]["website_order_status"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];

export type AdminOrderListItem = Pick<
  OrderRow,
  | "id"
  | "public_number"
  | "created_at"
  | "customer_name"
  | "whatsapp_phone"
  | "product_total_lkr"
  | "status"
> & {
  reference: string;
  styleCount: number;
};

export type AdminOrderDetail = OrderRow & {
  items: OrderItemRow[];
  reference: string;
  paymentInstructions: string;
};

export type AdminOrderPatch = {
  status?: OrderStatus;
  deliveryChargeLkr?: number | null;
  privateNote?: string | null;
};

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  new: ["confirmed", "cancelled"],
  confirmed: ["new", "paid", "cancelled"],
  paid: ["confirmed", "completed"],
  completed: ["paid"],
  cancelled: [],
};

export const orderStatuses: OrderStatus[] = ["new", "confirmed", "paid", "completed", "cancelled"];

export class AdminOrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminOrderValidationError";
  }
}

export class AdminOrderNotFoundError extends Error {
  constructor() {
    super("Order not found");
    this.name = "AdminOrderNotFoundError";
  }
}

export function canTransitionOrder(from: OrderStatus, to: OrderStatus) {
  return allowedTransitions[from].includes(to);
}

export function calculateFinalTotal(productTotalLkr: number, deliveryChargeLkr: number | null) {
  return deliveryChargeLkr === null ? null : productTotalLkr + deliveryChargeLkr;
}

function formatLkr(amount: number) {
  return `Rs. ${amount.toLocaleString("en-LK")}`;
}

export function buildPaymentWhatsAppLink(input: {
  reference: string;
  whatsappPhone: string;
  productTotalLkr: number;
  deliveryChargeLkr: number | null;
  paymentInstructions: string;
}) {
  const finalTotal = calculateFinalTotal(input.productTotalLkr, input.deliveryChargeLkr);
  if (finalTotal === null) throw new AdminOrderValidationError("Add delivery charge first");

  const message = [
    `Hello, your City Fashion order ${input.reference} is confirmed.`,
    `Final amount: ${formatLkr(finalTotal)}.`,
    input.paymentInstructions.trim(),
  ]
    .filter(Boolean)
    .join("\n");
  const phone = input.whatsappPhone.replace(/\D/g, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

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
