"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

import { useOrderLine } from "@/components/order-sizes-provider";
import { QuantityInput } from "@/components/quantity-input";
import { SizeQuantityRows } from "@/components/size-quantity-rows";
import { type CatalogProductView, formatLkr } from "@/lib/catalog";
import { MIN_ORDER_QUANTITY } from "@/lib/order-cart";
import { type SizeSplit, sumSplit } from "@/lib/sizes";

type OrderSheetProps = {
  product: CatalogProductView;
  open: boolean;
  onClose(): void;
};

/** Edit one style in the order: a bottom sheet on phones, a small dialog on bigger screens. */
export function OrderSheet({ product, open, onClose }: OrderSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const line = useOrderLine(product);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // A click on the backdrop lands on the dialog element itself.
        if (event.target === event.currentTarget) onClose();
      }}
      className="order-sheet fixed inset-0 h-full w-full"
    >
      {open ? <SheetBody product={product} line={line} titleId={titleId} onClose={onClose} /> : null}
    </dialog>
  );
}

function SheetBody({
  product,
  line,
  titleId,
  onClose,
}: {
  product: CatalogProductView;
  line: ReturnType<typeof useOrderLine>;
  titleId: string;
  onClose(): void;
}) {
  // The draft starts from what is saved; nothing is written until Done.
  const [draftSplit, setDraftSplit] = useState<SizeSplit>(line.split);
  const [draftQuantity, setDraftQuantity] = useState(line.quantity);
  const unitPrice = product.unitPriceLkr ?? 0;
  const total = line.isSized ? sumSplit(draftSplit) : draftQuantity;
  const canSave = total >= MIN_ORDER_QUANTITY;

  function save() {
    const saved = line.isSized ? line.setSplit(draftSplit) : line.setQuantity(draftQuantity);
    if (saved || (!line.isSized && draftQuantity === line.quantity)) onClose();
  }

  return (
    <div className="order-sheet-panel absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto bg-white p-5 text-[var(--ink)] md:inset-auto md:left-1/2 md:top-1/2 md:w-[420px] md:-translate-x-1/2 md:-translate-y-1/2">
      <div className="flex gap-4">
        {product.coverImage ? (
          <div className="relative aspect-[3/4] w-16 shrink-0 bg-[var(--fill)]">
            <Image src={product.coverImage} alt="" fill sizes="64px" className="object-cover" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="label text-[var(--text-soft)]">Style {product.id}</p>
          <h2 id={titleId} className="mt-1 text-sm font-semibold leading-snug">
            {product.title}
          </h2>
          <p className="mt-1 text-sm">{formatLkr(unitPrice)} / piece</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center">
          <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      <div className="mt-5">
        {line.isSized ? (
          <SizeQuantityRows sizes={line.sizes} split={draftSplit} unitPriceLkr={unitPrice} onChange={setDraftSplit} />
        ) : (
          <div className="flex items-center justify-between gap-4 border-y border-[var(--line)] py-3">
            <span className="text-sm font-semibold">Pieces</span>
            <QuantityInput value={draftQuantity} min={MIN_ORDER_QUANTITY} onChange={setDraftQuantity} />
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-2">
        <button
          type="button"
          onClick={save}
          disabled={!canSave}
          className="min-h-12 bg-[var(--ink)] text-sm font-semibold uppercase tracking-[0.08em] text-white disabled:opacity-40"
        >
          Done
        </button>
        <button
          type="button"
          onClick={() => {
            line.remove();
            onClose();
          }}
          className="min-h-11 text-sm underline underline-offset-4"
        >
          Remove from order
        </button>
      </div>
    </div>
  );
}
