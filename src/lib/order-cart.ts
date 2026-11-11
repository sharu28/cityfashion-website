import type { SizeQuantity } from "@/lib/sizes";

export const MIN_ORDER_QUANTITY = 6;

export type CartEntry = {
  productSlug: string;
  /** Total pieces for the style (at least 6). Equals the sum of `sizes` when sizes are set. */
  quantity: number;
  /** Pieces per size, e.g. { M: 2, L: 2, XL: 2 }. Only for styles with a size range. */
  sizes?: Record<string, number>;
};

/** Valid size counts: whole numbers >= 0, zeros dropped, at least one size. Else null. */
export function cleanSizeCounts(value: unknown): Record<string, number> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.some(([size, count]) => size.trim() === "" || !Number.isInteger(count) || Number(count) < 0)) {
    return null;
  }
  const kept = entries.filter(([, count]) => Number(count) > 0).map(([size, count]) => [size, Number(count)] as const);
  return kept.length ? Object.fromEntries(kept) : null;
}

function sumSizes(sizes: Record<string, number>) {
  return Object.values(sizes).reduce((total, count) => total + count, 0);
}

export type PricedProduct = {
  slug: string;
  unitPriceLkr: number | null;
};

export function sanitizeCart(value: unknown): CartEntry[] {
  if (!Array.isArray(value)) return [];

  const seenSlugs = new Set<string>();

  return value.flatMap((entry): CartEntry[] => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];

    const productSlug = Reflect.get(entry, "productSlug");
    const quantity = Reflect.get(entry, "quantity");
    if (
      typeof productSlug !== "string" ||
      productSlug.trim() === "" ||
      seenSlugs.has(productSlug) ||
      !Number.isInteger(quantity) ||
      Number(quantity) < MIN_ORDER_QUANTITY
    ) {
      return [];
    }

    seenSlugs.add(productSlug);
    // Entries saved before sizes existed have no `sizes` and stay valid.
    const sizes = cleanSizeCounts(Reflect.get(entry, "sizes"));
    if (sizes && sumSizes(sizes) === Number(quantity)) {
      return [{ productSlug, quantity: Number(quantity), sizes }];
    }
    return [{ productSlug, quantity: Number(quantity) }];
  });
}

export function addCartItem(entries: CartEntry[], productSlug: string): CartEntry[] {
  if (productSlug.trim() === "" || entries.some((entry) => entry.productSlug === productSlug)) {
    return entries;
  }

  return [...entries, { productSlug, quantity: MIN_ORDER_QUANTITY }];
}

/**
 * Sets the total pieces for a style without sizes. A style that has sizes set must be
 * changed with setCartSizes instead, so this leaves it unchanged.
 */
export function setCartQuantity(
  entries: CartEntry[],
  productSlug: string,
  quantity: number,
): CartEntry[] {
  const target = entries.find((entry) => entry.productSlug === productSlug);
  if (!Number.isInteger(quantity) || quantity < MIN_ORDER_QUANTITY || !target || target.sizes) {
    return entries;
  }

  return entries.map((entry) =>
    entry.productSlug === productSlug ? { ...entry, quantity } : entry,
  );
}

/**
 * Sets pieces per size for a style already in the cart; the style total becomes their sum.
 * Unchanged when the counts are not whole numbers >= 0 or add up to fewer than 6 pieces.
 */
export function setCartSizes(
  entries: CartEntry[],
  productSlug: string,
  sizes: Record<string, number>,
): CartEntry[] {
  const cleaned = cleanSizeCounts(sizes);
  if (!cleaned || sumSizes(cleaned) < MIN_ORDER_QUANTITY) return entries;
  if (!entries.some((entry) => entry.productSlug === productSlug)) return entries;

  return entries.map((entry) =>
    entry.productSlug === productSlug ? { productSlug, quantity: sumSizes(cleaned), sizes: cleaned } : entry,
  );
}

/** Order API item for a cart entry. Sizes go as a list, in the order given. */
export function toOrderItem(entry: CartEntry): { productSlug: string; quantity: number; sizes?: SizeQuantity[] } {
  const item = { productSlug: entry.productSlug, quantity: entry.quantity };
  if (!entry.sizes) return item;
  return { ...item, sizes: Object.entries(entry.sizes).map(([size, quantity]) => ({ size, quantity })) };
}

export function removeCartItem(entries: CartEntry[], productSlug: string): CartEntry[] {
  return entries.filter((entry) => entry.productSlug !== productSlug);
}

export function summarizeCart(entries: CartEntry[], products: PricedProduct[]) {
  const productBySlug = new Map(products.map((product) => [product.slug, product]));
  const lines = entries.flatMap((entry) => {
    const product = productBySlug.get(entry.productSlug);
    if (
      !product ||
      !Number.isInteger(product.unitPriceLkr) ||
      Number(product.unitPriceLkr) <= 0
    ) {
      return [];
    }

    const unitPriceLkr = Number(product.unitPriceLkr);
    return [
      {
        ...entry,
        unitPriceLkr,
        lineTotalLkr: unitPriceLkr * entry.quantity,
      },
    ];
  });

  return {
    lines,
    itemCount: lines.reduce((total, line) => total + line.quantity, 0),
    styleCount: lines.length,
    productTotalLkr: lines.reduce((total, line) => total + line.lineTotalLkr, 0),
  };
}
