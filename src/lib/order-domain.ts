import { whatsappNumber } from "@/lib/site";
import type { SizeQuantity } from "@/lib/sizes";

export type PlaceOrderItem = {
  productSlug: string;
  /** Total pieces for the style, at least 6. */
  quantity: number;
  /** Optional pieces per size; zero sizes dropped; they add up to `quantity`. */
  sizes?: SizeQuantity[];
};

export type PlaceOrderPayload = {
  customerName: string;
  whatsappNumber: string;
  idempotencyKey: string;
  items: PlaceOrderItem[];
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

function validateSizes(value: unknown, quantity: number): SizeQuantity[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value) || value.length === 0) throw new OrderValidationError("invalid_items");

  const seen = new Set<string>();
  const sizes: SizeQuantity[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new OrderValidationError("invalid_items");
    const size = Reflect.get(entry, "size");
    const count = Reflect.get(entry, "quantity");
    if (typeof size !== "string" || size.trim() === "" || seen.has(size.trim()) || !Number.isInteger(count) || Number(count) < 0) {
      throw new OrderValidationError("invalid_items");
    }
    seen.add(size.trim());
    if (Number(count) > 0) sizes.push({ size: size.trim(), quantity: Number(count) });
  }

  const total = sizes.reduce((sum, entry) => sum + entry.quantity, 0);
  if (sizes.length === 0 || total !== quantity) throw new OrderValidationError("invalid_items");
  return sizes;
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
    const sizes = validateSizes(Reflect.get(item, "sizes"), Number(quantity));
    return sizes ? { productSlug, quantity: Number(quantity), sizes } : { productSlug, quantity: Number(quantity) };
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
