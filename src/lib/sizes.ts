export const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"] as const;

/**
 * Turn on once shop-cloudflare's order API accepts `items[].sizes`.
 * Until then the size split is kept in the browser only and orders send one quantity per style.
 */
export const SIZE_ORDERS_SENT = false;

export const STARTER_TOTAL = 6;

export type SizeSplit = Record<string, number>;

/** "M - 2XL" → ["M", "L", "XL", "2XL"]. Empty or unknown ranges give no sizes. */
export function parseSizeRange(range: string | undefined): string[] {
  const match = range?.match(/^\s*(\w+)\s*-\s*(\w+)\s*$/);
  if (!match) return [];

  const order: readonly string[] = SIZE_ORDER;
  const start = order.indexOf(match[1].toUpperCase());
  const end = order.indexOf(match[2].toUpperCase());
  if (start < 0 || end < 0 || end < start) return [];

  return order.slice(start, end + 1);
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
