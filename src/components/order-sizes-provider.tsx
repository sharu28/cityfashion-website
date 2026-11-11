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

type Splits = Record<string, SizeSplit>;

type OrderSizesContextValue = {
  splits: Splits;
  setSplitFor(slug: string, split: SizeSplit | null): void;
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

  useEffect(() => {
    let isActive = true;
    const stored = readStoredSplits();
    queueMicrotask(() => {
      if (isActive) setSplits(stored);
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

  return (
    <OrderSizesContext.Provider value={{ splits, setSplitFor }}>{children}</OrderSizesContext.Provider>
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

export type OrderLine = {
  sizes: string[];
  isSized: boolean;
  inOrder: boolean;
  quantity: number;
  split: SizeSplit;
  addWithDefaults(): void;
  setSplit(next: SizeSplit): boolean;
  setQuantity(next: number): boolean;
  remove(): void;
};

/** Everything a card, product page or order line needs to show and change one style in the order. */
export function useOrderLine(product: { slug: string; sizeRange?: string }): OrderLine {
  const cart = useOrderCart();
  const { splits, setSplitFor } = useOrderSizes();
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
    },
  };
}
