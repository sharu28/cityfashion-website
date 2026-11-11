import type { SizeQuantity } from "@/lib/sizes";

export type OrderStatus = "new" | "confirmed" | "paid" | "completed" | "cancelled";

export type OrderRow = {
  id: string;
  public_number: number;
  idempotency_key: string;
  customer_name: string;
  whatsapp_phone: string;
  product_total_lkr: number;
  delivery_charge_lkr: number | null;
  /** Computed: product total + delivery charge, or null until delivery is set. */
  final_total_lkr: number | null;
  status: OrderStatus;
  private_note: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string;
  product_slug: string;
  product_title: string;
  unit_price_lkr: number;
  quantity: number;
  line_total_lkr: number;
  /** Pieces per size, or null when sizes are confirmed by staff. */
  sizes: SizeQuantity[] | null;
  created_at: string;
};

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
