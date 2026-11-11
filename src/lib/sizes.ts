// Garment sizes for the per-size order picker. Shared by the browser and the server.

export type SizeQuantity = { size: string; quantity: number };

export const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"] as const;

/** The order API stores `items[].sizes`, so buyers' size splits are sent with the order. */
export const SIZE_ORDERS_SENT = true;

export const STARTER_TOTAL = 6;

/** Pieces per size for one style in the browser, e.g. { M: 1, L: 2 }. */
export type SizeSplit = Record<string, number>;

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

/** Indices from the middle size outwards: for 4 sizes → [1, 2, 0, 3]. */
function middleOutOrder(count: number) {
  const start = Math.floor((count - 1) / 2);
  const order = [start];
  for (let step = 1; order.length < count; step += 1) {
    if (start + step < count) order.push(start + step);
    if (start - step >= 0) order.push(start - step);
  }
  return order;
}

function emptySplit(sizes: string[]): SizeSplit {
  return Object.fromEntries(sizes.map((size) => [size, 0]));
}

export function sumSplit(split: SizeSplit) {
  return Object.values(split).reduce((total, quantity) => total + quantity, 0);
}

/** A ready-made split so buyers can add a style without choosing sizes. */
export function starterSplit(sizes: string[], total = STARTER_TOTAL): SizeSplit {
  const split = emptySplit(sizes);
  if (sizes.length === 0) return split;

  const order = middleOutOrder(sizes.length);
  let remaining = total;
  if (total >= sizes.length) {
    for (const size of sizes) split[size] = 1;
    remaining -= sizes.length;
  }
  for (let index = 0; remaining > 0; index += 1, remaining -= 1) {
    split[sizes[order[index % order.length]]] += 1;
  }
  return split;
}

/** Grow from the middle sizes or shrink from the outer sizes until the split sums to `total`. */
export function fitSplitToTotal(split: SizeSplit, sizes: string[], total: number): SizeSplit {
  const fitted = emptySplit(sizes);
  for (const size of sizes) fitted[size] = Math.max(0, Math.floor(split[size] ?? 0));
  if (sizes.length === 0) return fitted;

  const order = middleOutOrder(sizes.length).map((index) => sizes[index]);
  let difference = Math.max(0, total) - sumSplit(fitted);

  for (let index = 0; difference > 0; index += 1, difference -= 1) {
    fitted[order[index % order.length]] += 1;
  }

  const shrinkOrder = [...order].reverse();
  for (let index = 0; difference < 0; index += 1) {
    const size = shrinkOrder[index % shrinkOrder.length];
    if (fitted[size] > 0) {
      fitted[size] -= 1;
      difference += 1;
    }
  }
  return fitted;
}

/** "M 1 · L 2 · XL 2 · 2XL 1" with empty sizes left out. */
export function formatSplit(split: SizeSplit, sizes: string[]) {
  return sizes
    .filter((size) => (split[size] ?? 0) > 0)
    .map((size) => `${size} ${split[size]}`)
    .join(" · ");
}
