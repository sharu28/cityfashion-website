import { whatsappUrl } from "@/lib/site";
import type { SizeQuantity } from "@/lib/sizes";

export type PlacedOrderItem = {
  productSlug: string;
  productId: string;
  title: string;
  coverImage: string | null;
  unitPriceLkr: number;
  quantity: number;
  lineTotalLkr: number;
  sizes?: SizeQuantity[];
  colors?: string[];
};

/** What the buyer saw when the order was placed, kept in the browser so a refresh does not lose it. */
export type PlacedOrder = {
  reference: string;
  productTotalLkr: number;
  createdAt: string;
  customerName: string;
  whatsappPhone: string;
  items: PlacedOrderItem[];
};

export const placedOrderStorageKey = "city-fashion-placed-order-v1";
export const placedOrderParam = "placed";

function formatAmount(amount: number) {
  return `Rs. ${amount.toLocaleString("en-LK")}`;
}

function isPlacedOrder(value: unknown): value is PlacedOrder {
  if (!value || typeof value !== "object") return false;
  const order = value as Partial<PlacedOrder>;
  return (
    typeof order.reference === "string" &&
    typeof order.productTotalLkr === "number" &&
    typeof order.customerName === "string" &&
    typeof order.whatsappPhone === "string" &&
    Array.isArray(order.items)
  );
}

export function savePlacedOrder(order: PlacedOrder) {
  try {
    localStorage.setItem(placedOrderStorageKey, JSON.stringify(order));
  } catch {
    // Storage can be full or blocked. The confirmation still shows until a refresh.
  }
}

export function loadPlacedOrder(reference: string): PlacedOrder | null {
  try {
    const stored = localStorage.getItem(placedOrderStorageKey);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    return isPlacedOrder(parsed) && parsed.reference === reference ? parsed : null;
  } catch {
    return null;
  }
}

/** "+94771234567" -> "077 123 4567". Anything else is shown as typed. */
export function formatSriLankaMobile(phone: string) {
  const match = /^\+94(7\d)(\d{3})(\d{4})$/.exec(phone);
  return match ? `0${match[1]} ${match[2]} ${match[3]}` : phone;
}

export function formatItemTitle(item: Pick<PlacedOrderItem, "productId" | "title">) {
  return item.title.includes(item.productId) ? item.title : `Style ${item.productId} ${item.title}`;
}

export function formatItemSizes(sizes: SizeQuantity[] | undefined) {
  return sizes?.length ? sizes.map(({ size, quantity }) => `${size} ${quantity}`).join(", ") : "";
}

export function buildPlacedOrderWhatsAppLink(order: PlacedOrder) {
  const itemLines = order.items.flatMap((item) => {
    const sizes = formatItemSizes(item.sizes);
    const lines = [
      `- ${formatItemTitle(item)}: ${item.quantity} pcs${sizes ? ` (${sizes})` : ""} = ${formatAmount(item.lineTotalLkr)}`,
    ];
    if (item.colors?.length) lines.push(`  Colours: ${item.colors.join(", ")}`);
    return lines;
  });

  const message = [
    `Hello City Fashion, I placed order ${order.reference}.`,
    "",
    ...itemLines,
    "",
    `Product total: ${formatAmount(order.productTotalLkr)}`,
    `Name: ${order.customerName}`,
  ].join("\n");

  return `${whatsappUrl}?text=${encodeURIComponent(message)}`;
}
