"use client";

import { MIN_ORDER_QUANTITY } from "@/lib/order-cart";
import { useOrderCart } from "@/components/order-cart-provider";

type OrderQuantityControlProps = {
  productSlug: string;
  quantity: number;
};

export function OrderQuantityControl({
  productSlug,
  quantity,
}: OrderQuantityControlProps) {
  const { setQuantity } = useOrderCart();

  return (
    <div className="inline-grid min-h-11 grid-cols-[2.75rem_3rem_2.75rem] items-stretch border border-[var(--text-strong)] bg-white text-[var(--text-strong)]">
      <button
        type="button"
        aria-label="Remove one piece"
        disabled={quantity <= MIN_ORDER_QUANTITY}
        onClick={() => setQuantity(productSlug, quantity - 1)}
        className="text-lg font-black transition hover:bg-[var(--sand)] disabled:cursor-not-allowed disabled:opacity-35"
      >
        −
      </button>
      <output
        aria-label="Quantity"
        className="flex items-center justify-center border-x border-[var(--text-strong)] font-mono text-sm font-black"
      >
        {quantity}
      </output>
      <button
        type="button"
        aria-label="Add one piece"
        onClick={() => setQuantity(productSlug, quantity + 1)}
        className="text-lg font-black transition hover:bg-[var(--sand)]"
      >
        +
      </button>
    </div>
  );
}
