"use client";

import Link from "next/link";
import { useState } from "react";

import { useOrderLine } from "@/components/order-sizes-provider";
import { QuantityInput } from "@/components/quantity-input";
import { SizeQuantityRows } from "@/components/size-quantity-rows";
import { buildWhatsAppLink, type CatalogProductView, formatLkr } from "@/lib/catalog";
import { MIN_ORDER_QUANTITY } from "@/lib/order-cart";
import { type SizeSplit, sumSplit } from "@/lib/sizes";

type ProductOrderPanelProps = {
  product: CatalogProductView;
};

/** Product page quantities: pre-filled, editable, and one button to add or update the order. */
export function ProductOrderPanel({ product }: ProductOrderPanelProps) {
  const line = useOrderLine(product);
  // null = nothing edited yet, so show what is saved (or the starter split).
  const [draftSplit, setDraftSplit] = useState<SizeSplit | null>(null);
  const [draftQuantity, setDraftQuantity] = useState<number | null>(null);

  if (!product.orderable || !product.unitPriceLkr) {
    return (
      <a
        href={buildWhatsAppLink(product)}
        target="_blank"
        rel="noreferrer"
        className="flex min-h-12 items-center justify-center bg-[var(--whatsapp)] px-5 text-sm font-semibold text-white"
      >
        Ask price on WhatsApp
      </a>
    );
  }

  const unitPrice = product.unitPriceLkr;
  const split = draftSplit ?? line.split;
  const quantity = draftQuantity ?? line.quantity;
  const pieces = line.isSized ? sumSplit(split) : quantity;
  const canSave = pieces >= MIN_ORDER_QUANTITY;
  const isEdited = draftSplit !== null || draftQuantity !== null;
  const action = line.inOrder ? "Update order" : "Add to order";

  function save() {
    const saved = line.isSized ? line.setSplit(split) : line.setQuantity(quantity);
    if (saved) {
      setDraftSplit(null);
      setDraftQuantity(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="label mb-2 text-[var(--text-soft)]">{line.isSized ? "Pieces per size" : "Pieces"}</p>
        {line.isSized ? (
          <SizeQuantityRows sizes={line.sizes} split={split} unitPriceLkr={unitPrice} onChange={setDraftSplit} />
        ) : (
          <div className="flex items-center justify-between gap-4 border-y border-[var(--line)] py-3">
            <p className="text-sm text-[var(--text-soft)]">Staff confirm sizes with you</p>
            <QuantityInput value={quantity} min={MIN_ORDER_QUANTITY} onChange={setDraftQuantity} />
          </div>
        )}
      </div>

      {/* Sticky on phones so the main action is always in reach. */}
      <div className="sticky bottom-0 z-10 -mx-4 border-t border-[var(--line)] bg-white px-4 py-3 sm:static sm:mx-0 sm:border-0 sm:p-0">
        <button
          type="button"
          onClick={save}
          disabled={!canSave || (line.inOrder && !isEdited)}
          className="flex min-h-12 w-full items-center justify-center bg-[var(--ink)] px-5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {action} · {pieces} pcs · {formatLkr(pieces * unitPrice)}
        </button>
        {line.inOrder ? (
          <p className="mt-2 flex items-center justify-between text-xs text-[var(--text-soft)]">
            <span>In your order: {line.quantity} pcs</span>
            <Link href="/order" className="font-semibold text-[var(--ink)] underline underline-offset-4">
              View order
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
