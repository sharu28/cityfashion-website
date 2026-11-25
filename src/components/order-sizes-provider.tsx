"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { useOrderCart } from "@/components/order-cart-provider";
import { MIN_ORDER_QUANTITY } from "@/lib/order-cart";
import {
  fitSplitToTotal,
  parseSizeRange,
  type SizeSplit,
  starterSplit,
  sumSplit,
} from "@/lib/sizes";

const storageKey = "city-fashion-order-sizes-v1";
const colorsStorageKey = "city-fashion-order-colors-v1";

type Splits = Record<string, SizeSplit>;
/** Colours a shop picked per style, kept apart from the cart so picks made before adding are not lost. */
type ColorPicks = Record<string, string[]>;

type OrderSizesContextValue = {
  splits: Splits;
  setSplitFor(slug: string, split: SizeSplit | null): void;
  colorPicks: ColorPicks;
  setColorsFor(slug: string, colors: string[] | ((current: string[]) => string[])): void;
};

const OrderSizesContext = createContext<OrderSizesContextValue | null>(null);

function sanitizeSplits(value: unknown): Splits {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const splits: Splits = {};
  for (const [slug, split] of Object.entries(value)) {
    if (!split || typeof split !== "object" || Array.isArray(split)) continue;
    const clean = Object.fromEntries(
      Object.entries(split).filter(
        ([, quantity]) => Number.isInteger(quantity) && Number(quantity) >= 0,
      ),
    ) as SizeSplit;
    splits[slug] = clean;
  }
  return splits;
}

export function sanitizeColorPicks(value: unknown): ColorPicks {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const picks: ColorPicks = {};
  for (const [slug, colors] of Object.entries(value)) {
    if (!Array.isArray(colors)) continue;
    const clean = [...new Set(colors.filter((color): color is string => typeof color === "string" && color.trim() !== ""))];
    if (clean.length) picks[slug] = clean.slice(0, 60);
  }
  return picks;
}

function readStored<T>(key: string, sanitize: (value: unknown) => T, empty: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? sanitize(JSON.parse(stored)) : empty;
  } catch {
    return empty;
  }
}

function writeStored(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be full or blocked; the value still lives in memory.
  }
}

function readStoredSplits() {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? sanitizeSplits(JSON.parse(stored)) : {};
  } catch {
    return {};
  }
}

export function OrderSizesProvider({ children }: { children: React.ReactNode }) {
  const [splits, setSplits] = useState<Splits>({});
  const [colorPicks, setColorPicks] = useState<ColorPicks>({});

  useEffect(() => {
    let isActive = true;
    const stored = readStoredSplits();
    const storedColors = readStored(colorsStorageKey, sanitizeColorPicks, {});
    queueMicrotask(() => {
      if (!isActive) return;
      setSplits(stored);
      setColorPicks(storedColors);
    });
    return () => {
      isActive = false;
    };
  }, []);

  function setSplitFor(slug: string, split: SizeSplit | null) {
    setSplits((current) => {
      const next = { ...current };
      if (split) next[slug] = split;
      else delete next[slug];
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Storage can be full or blocked; the split still lives in memory.
      }
      return next;
    });
  }

  function setColorsFor(slug: string, update: string[] | ((current: string[]) => string[])) {
    setColorPicks((current) => {
      const colors = typeof update === "function" ? update(current[slug] ?? []) : update;
      const next = { ...current };
      if (colors.length) next[slug] = colors;
      else delete next[slug];
      writeStored(colorsStorageKey, next);
      return next;
    });
  }

  return (
    <OrderSizesContext.Provider value={{ splits, setSplitFor, colorPicks, setColorsFor }}>{children}</OrderSizesContext.Provider>
  );
}

function useOrderSizes() {
  const context = useContext(OrderSizesContext);
  if (!context) throw new Error("useOrderLine must be used inside OrderSizesProvider.");
  return context;
}

export function useOrderSplits() {
  return useOrderSizes().splits;
}

export function useOrderColorPicks() {
  return useOrderSizes().colorPicks;
}

export type OrderLine = {
  sizes: string[];
  isSized: boolean;
  inOrder: boolean;
  quantity: number;
  split: SizeSplit;
  /** Colours the shop picked; empty means staff confirm colours. */
  colors: string[];
  setColors(next: string[] | ((current: string[]) => string[])): void;
  addWithDefaults(): void;
  setSplit(next: SizeSplit): boolean;
  setQuantity(next: number): boolean;
  remove(): void;
};

/** Everything a card, product page or order line needs to show and change one style in the order. */
export function useOrderLine(product: { slug: string; sizeRange?: string }): OrderLine {
  const cart = useOrderCart();
  const { splits, setSplitFor, colorPicks, setColorsFor } = useOrderSizes();
  const { slug } = product;

  const sizes = parseSizeRange(product.sizeRange);
  const isSized = sizes.length > 0;
  const entry = cart.entries.find((item) => item.productSlug === slug);
  const inOrder = Boolean(entry);
  const quantity = entry?.quantity ?? MIN_ORDER_QUANTITY;

  const baseSplit = splits[slug] ?? starterSplit(sizes);
  const split = isSized ? fitSplitToTotal(baseSplit, sizes, quantity) : {};

  return {
    sizes,
    isSized,
    inOrder,
    quantity,
    split,
    colors: colorPicks[slug] ?? [],
    setColors(next) {
      setColorsFor(slug, next);
    },
    addWithDefaults() {
      cart.add(slug);
      if (isSized) setSplitFor(slug, starterSplit(sizes));
    },
    setSplit(next) {
      const cleaned = fitSplitToTotal(next, sizes, sumSplit(next));
      const total = sumSplit(cleaned);
      if (!isSized || total < MIN_ORDER_QUANTITY) return false;
      if (!inOrder) cart.add(slug);
      cart.setQuantity(slug, total);
      setSplitFor(slug, cleaned);
      return true;
    },
    setQuantity(next) {
      if (!Number.isInteger(next) || next < MIN_ORDER_QUANTITY) return false;
      if (!inOrder) cart.add(slug);
      cart.setQuantity(slug, next);
      return true;
    },
    remove() {
      cart.remove(slug);
      setSplitFor(slug, null);
      setColorsFor(slug, []);
    },
  };
}
