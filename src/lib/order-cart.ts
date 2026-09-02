export const MIN_ORDER_QUANTITY = 6;

export type CartEntry = {
  productSlug: string;
  quantity: number;
};

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
    return [{ productSlug, quantity: Number(quantity) }];
  });
}

export function addCartItem(entries: CartEntry[], productSlug: string): CartEntry[] {
  if (productSlug.trim() === "" || entries.some((entry) => entry.productSlug === productSlug)) {
    return entries;
  }

  return [...entries, { productSlug, quantity: MIN_ORDER_QUANTITY }];
}

export function setCartQuantity(
  entries: CartEntry[],
  productSlug: string,
  quantity: number,
): CartEntry[] {
  if (
    !Number.isInteger(quantity) ||
    quantity < MIN_ORDER_QUANTITY ||
    !entries.some((entry) => entry.productSlug === productSlug)
  ) {
    return entries;
  }

  return entries.map((entry) =>
    entry.productSlug === productSlug ? { ...entry, quantity } : entry,
  );
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
