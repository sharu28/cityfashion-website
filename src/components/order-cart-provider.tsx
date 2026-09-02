"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { allProducts } from "@/lib/catalog";
import {
  addCartItem,
  type CartEntry,
  removeCartItem,
  sanitizeCart,
  setCartQuantity,
  summarizeCart,
} from "@/lib/order-cart";

const storageKey = "city-fashion-order-cart-v1";

export type OrderCartContextValue = {
  entries: CartEntry[];
  summary: ReturnType<typeof summarizeCart>;
  isLoaded: boolean;
  add(productSlug: string): void;
  setQuantity(productSlug: string, quantity: number): void;
  remove(productSlug: string): void;
  clear(): void;
  has(productSlug: string): boolean;
};

const OrderCartContext = createContext<OrderCartContextValue | null>(null);

function readStoredCart() {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? sanitizeCart(JSON.parse(stored)) : [];
  } catch {
    return [];
  }
}

export function OrderCartProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<CartEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isActive = true;
    const storedEntries = readStoredCart();

    queueMicrotask(() => {
      if (!isActive) return;
      setEntries(storedEntries);
      setIsLoaded(true);
    });

    return () => {
      isActive = false;
    };
  }, []);

  function updateEntries(update: (current: CartEntry[]) => CartEntry[]) {
    setEntries((current) => {
      const next = update(current);
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  const summary = useMemo(() => summarizeCart(entries, allProducts), [entries]);
  const value: OrderCartContextValue = {
    entries,
    summary,
    isLoaded,
    add: (productSlug) => updateEntries((current) => addCartItem(current, productSlug)),
    setQuantity: (productSlug, quantity) =>
      updateEntries((current) => setCartQuantity(current, productSlug, quantity)),
    remove: (productSlug) =>
      updateEntries((current) => removeCartItem(current, productSlug)),
    clear: () => updateEntries(() => []),
    has: (productSlug) => entries.some((entry) => entry.productSlug === productSlug),
  };

  return <OrderCartContext.Provider value={value}>{children}</OrderCartContext.Provider>;
}

export function useOrderCart() {
  const context = useContext(OrderCartContext);
  if (!context) {
    throw new Error("useOrderCart must be used inside OrderCartProvider.");
  }

  return context;
}
