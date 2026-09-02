import { whatsappNumber } from "@/lib/site";

export type PlaceOrderPayload = {
  customerName: string;
  whatsappNumber: string;
  idempotencyKey: string;
  items: Array<{ productSlug: string; quantity: number }>;
};

export type OrderReceipt = {
  id: string;
  publicNumber: number;
  reference: string;
  productTotalLkr: number;
  createdAt: string;
  duplicate: boolean;
};

export class OrderValidationError extends Error {
  constructor(
    public code: "invalid_name" | "invalid_phone" | "invalid_items" | "style_unavailable",
  ) {
    super(code);
    this.name = "OrderValidationError";
  }
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeSriLankaMobile(value: string) {
  if (typeof value !== "string") throw new OrderValidationError("invalid_phone");

  const compact = value.trim().replace(/[\s()-]/g, "").replace(/^\+/, "");
  const local = compact.startsWith("94")
    ? compact.slice(2)
    : compact.startsWith("0")
      ? compact.slice(1)
      : compact;

  if (!/^7[0-9]{8}$/.test(local)) {
    throw new OrderValidationError("invalid_phone");
  }

  return `+94${local}`;
}

export function validatePlaceOrderPayload(value: unknown): PlaceOrderPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new OrderValidationError("invalid_items");
  }

  const customerName = Reflect.get(value, "customerName");
  if (typeof customerName !== "string" || customerName.trim().length < 1 || customerName.trim().length > 100) {
    throw new OrderValidationError("invalid_name");
  }

  const whatsappNumberValue = Reflect.get(value, "whatsappNumber");
  if (typeof whatsappNumberValue !== "string") {
    throw new OrderValidationError("invalid_phone");
  }
  normalizeSriLankaMobile(whatsappNumberValue);

  const idempotencyKey = Reflect.get(value, "idempotencyKey");
  const rawItems = Reflect.get(value, "items");
  if (
    typeof idempotencyKey !== "string" ||
    !uuidPattern.test(idempotencyKey) ||
    !Array.isArray(rawItems) ||
    rawItems.length === 0
  ) {
    throw new OrderValidationError("invalid_items");
  }

  const seenSlugs = new Set<string>();
  const items = rawItems.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new OrderValidationError("invalid_items");
    }

    const productSlug = Reflect.get(item, "productSlug");
    const quantity = Reflect.get(item, "quantity");
    if (
      typeof productSlug !== "string" ||
      productSlug.trim() === "" ||
      seenSlugs.has(productSlug) ||
      !Number.isInteger(quantity) ||
      Number(quantity) < 6
    ) {
      throw new OrderValidationError("invalid_items");
    }

    seenSlugs.add(productSlug);
    return { productSlug, quantity: Number(quantity) };
  });

  return {
    customerName: customerName.trim(),
    whatsappNumber: whatsappNumberValue,
    idempotencyKey,
    items,
  };
}

export function buildOrderSupportWhatsAppLink(reference: string) {
  const message = `Hello City Fashion, I placed order ${reference}.`;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}
