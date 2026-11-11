// Garment sizes for the per-size order picker. Shared by the browser and the server.

export type SizeQuantity = { size: string; quantity: number };

export const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"] as const;

const aliases: Record<string, string> = { XXL: "2XL", XXXL: "3XL", XXXXL: "4XL" };

function normalizeSize(value: string) {
  const upper = value.trim().toUpperCase().replace(/\s+/g, "");
  return aliases[upper] ?? upper;
}

/**
 * Turns a catalog size range into the sizes a shop can pick.
 * "M - 2XL" -> ["M", "L", "XL", "2XL"]; "S, M, L" -> ["S", "M", "L"].
 * Returns [] when there is no usable range (staff confirm sizes instead).
 */
export function parseSizeRange(range: string | null | undefined): string[] {
  if (!range?.trim()) return [];
  const order: readonly string[] = SIZE_ORDER;

  const span = range.split(/\s*(?:-|–|to)\s*/i);
  if (span.length === 2) {
    const from = order.indexOf(normalizeSize(span[0]));
    const to = order.indexOf(normalizeSize(span[1]));
    if (from !== -1 && to !== -1 && from <= to) return order.slice(from, to + 1);
    return [];
  }

  const list = range.split(/[,/]/).map(normalizeSize).filter(Boolean);
  if (list.length === 0 || list.some((size) => !order.includes(size))) return [];
  return [...new Set(list)].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

/** "M 2 · L 2 · XL 2" */
export function formatSizeBreakdown(sizes: SizeQuantity[] | null | undefined) {
  if (!sizes?.length) return "";
  return sizes.map(({ size, quantity }) => `${size} ${quantity}`).join(" · ");
}

/** Keeps sizes with a quantity, in catalog order. */
export function orderedSizes(sizes: SizeQuantity[], catalogSizes: readonly string[]) {
  return sizes
    .filter((entry) => entry.quantity > 0)
    .sort((a, b) => catalogSizes.indexOf(a.size) - catalogSizes.indexOf(b.size));
}
