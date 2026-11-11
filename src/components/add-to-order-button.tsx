"use client";

import { useEffect, useState } from "react";

import { OrderSheet } from "@/components/order-sheet";
import { useOrderLine } from "@/components/order-sizes-provider";
import type { CatalogProductView } from "@/lib/catalog";

type AddToOrderButtonProps = {
  product: CatalogProductView;
};

/** The card's one-tap add. After adding it shows "6 in order", which opens the order sheet. */
export function AddToOrderButton({ product }: AddToOrderButtonProps) {
  const line = useOrderLine(product);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) return;
    const timer = window.setTimeout(() => setJustAdded(false), 2000);
    return () => window.clearTimeout(timer);
  }, [justAdded]);

  return (
    <>
      {line.inOrder ? (
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-label={`${line.quantity} in order, change pieces`}
          className="flex h-11 items-center gap-1.5 bg-[var(--ink)] px-3 text-xs font-semibold text-white"
        >
          <svg aria-hidden width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="m5 12 5 5 9-10" />
          </svg>
          {line.quantity} in order
        </button>
      ) : (
        <button
          type="button"
          aria-label="Add to order"
          onClick={() => {
            line.addWithDefaults();
            setJustAdded(true);
          }}
          className="flex h-11 w-11 items-center justify-center border border-[var(--ink)] bg-white/95 text-[var(--ink)] transition-colors hover:bg-[var(--ink)] hover:text-white"
        >
          <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      )}
      <span aria-live="polite" className="sr-only">
        {justAdded ? `Added ${product.title}, ${line.quantity} pieces` : ""}
      </span>
      <OrderSheet product={product} open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
