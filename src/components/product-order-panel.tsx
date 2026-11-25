"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useOrderCart } from "@/components/order-cart-provider";
import { useOrderLine } from "@/components/order-sizes-provider";
import { QuantityInput } from "@/components/quantity-input";
import { SizeQuantityRows } from "@/components/size-quantity-rows";
import { buildWhatsAppLink, type CatalogProductView, formatLkr } from "@/lib/catalog";
import { MIN_ORDER_QUANTITY } from "@/lib/order-cart";
import { type SizeSplit, sumSplit } from "@/lib/sizes";

type ProductOrderPanelProps = {
  product: CatalogProductView;
};

/** Tells the page how tall the phone bar is, so the WhatsApp button sits above it. */
function useBarHeight(bar: HTMLDivElement | null, visible: boolean) {
  useEffect(() => {
    const setHeight = (height: number) => document.body.style.setProperty("--order-bar-h", `${height}px`);
    if (!visible || !bar) {
      setHeight(0);
      return;
    }
    setHeight(bar.offsetHeight);
    if (typeof ResizeObserver === "undefined") return () => setHeight(0);
    const observer = new ResizeObserver(() => setHeight(bar.offsetHeight));
    observer.observe(bar);
    return () => {
      observer.disconnect();
      setHeight(0);
    };
  }, [bar, visible]);
}

/** Product page quantities: pre-filled, editable, and one button to add or update the order. */
export function ProductOrderPanel({ product }: ProductOrderPanelProps) {
  const line = useOrderLine(product);
  const { summary } = useOrderCart();
  // null = nothing edited yet, so show what is saved (or the starter split).
  const [draftSplit, setDraftSplit] = useState<SizeSplit | null>(null);
  const [draftQuantity, setDraftQuantity] = useState<number | null>(null);
  const inlineRef = useRef<HTMLDivElement>(null);
  const [inlineVisible, setInlineVisible] = useState(true);
  const [isPhone, setIsPhone] = useState(false);
  const [bar, setBar] = useState<HTMLDivElement | null>(null);

  // On phones the main button is far down the page, so a bar with it stays at the bottom until it scrolls into view.
  useEffect(() => {
    const target = inlineRef.current;
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(max-width: 639px)");
    const updatePhone = () => setIsPhone(query.matches);
    updatePhone();
    query.addEventListener("change", updatePhone);
    if (!target || typeof IntersectionObserver === "undefined") return () => query.removeEventListener("change", updatePhone);
    const observer = new IntersectionObserver(([entry]) => setInlineVisible(entry.isIntersecting), { threshold: 0.6 });
    observer.observe(target);
    return () => {
      observer.disconnect();
      query.removeEventListener("change", updatePhone);
    };
  }, []);

  const orderable = product.orderable && Boolean(product.unitPriceLkr);
  const showBar = orderable && isPhone && !inlineVisible;
  useBarHeight(bar, showBar);

  if (!orderable) {
    return (
      <a
        href={buildWhatsAppLink(product, line.colors)}
        target="_blank"
        rel="noreferrer"
        className="flex min-h-12 items-center justify-center bg-[var(--whatsapp)] px-5 text-sm font-semibold text-white"
      >
        {product.unitPriceLkr || product.startingPrice.startsWith("Rs") ? "Order on WhatsApp" : "Ask price on WhatsApp"}
      </a>
    );
  }

  const unitPrice = Number(product.unitPriceLkr);
  const split = draftSplit ?? line.split;
  const quantity = draftQuantity ?? line.quantity;
  const pieces = line.isSized ? sumSplit(split) : quantity;
  const canSave = pieces >= MIN_ORDER_QUANTITY;
  const isEdited = draftSplit !== null || draftQuantity !== null;
  const action = line.inOrder ? "Update order" : "Add to order";
  const disabled = !canSave || (line.inOrder && !isEdited);
  const label = line.inOrder && !isEdited ? "In your order" : `${action} · ${pieces} pcs · ${formatLkr(pieces * unitPrice)}`;

  // What is in the order apart from this style, so the order total is never mistaken for this style's price.
  const others = summary.lines.filter((entry) => entry.productSlug !== product.slug);
  const othersTotal = others.reduce((total, entry) => total + entry.lineTotalLkr, 0);

  function save() {
    const saved = line.isSized ? line.setSplit(split) : line.setQuantity(quantity);
    if (saved) {
      setDraftSplit(null);
      setDraftQuantity(null);
    }
  }

  const orderSummary =
    summary.styleCount > 0 ? (
      <Link href="/order" className="font-semibold text-[var(--ink)] underline underline-offset-4">
        View order ({summary.styleCount} {summary.styleCount === 1 ? "style" : "styles"} · {formatLkr(summary.productTotalLkr)})
      </Link>
    ) : null;

  return (
    <div className="space-y-4">
      <div>
        <p className="label mb-2 text-[var(--text-soft)]">{line.isSized ? "Pieces per size" : "Pieces"}</p>
        {line.isSized ? (
          <SizeQuantityRows sizes={line.sizes} split={split} unitPriceLkr={unitPrice} onChange={setDraftSplit} />
        ) : (
          <div className="flex items-center justify-between gap-4 border-y border-[var(--line)] py-3">
            <p className="text-sm text-[var(--text-soft)]">Any sizes. Staff confirm them with you.</p>
            <QuantityInput value={quantity} min={MIN_ORDER_QUANTITY} onChange={setDraftQuantity} />
          </div>
        )}
      </div>

      <div ref={inlineRef}>
        <button
          type="button"
          onClick={save}
          disabled={disabled}
          className="flex min-h-12 w-full items-center justify-center bg-[var(--ink)] px-5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {label}
        </button>
        <p className="mt-2 text-xs text-[var(--text-soft)]">
          {line.colors.length > 0 ? `Colours: ${line.colors.join(", ")}` : "Colours: staff help you choose"}
        </p>
        {line.inOrder || others.length > 0 ? (
          <p className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-[var(--text-soft)]">
            <span>
              {line.inOrder ? `This style: ${line.quantity} pcs in your order` : `Also in your order: ${others.length} ${others.length === 1 ? "style" : "styles"} · ${formatLkr(othersTotal)}`}
            </span>
            {orderSummary}
          </p>
        ) : null}
      </div>

      {showBar ? (
        <div
          ref={setBar}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 sm:hidden"
        >
          <button
            type="button"
            onClick={save}
            disabled={disabled}
            className="flex min-h-12 w-full items-center justify-center bg-[var(--ink)] px-5 text-sm font-semibold text-white disabled:opacity-40"
          >
            {label}
          </button>
          <p className="mt-1.5 flex items-center justify-between gap-3 text-[0.6875rem] text-[var(--text-soft)]">
            <span className="truncate">
              {line.colors.length > 0 ? `${line.colors.length} ${line.colors.length === 1 ? "colour" : "colours"} picked` : "No colour picked"}
            </span>
            {orderSummary}
          </p>
        </div>
      ) : null}
    </div>
  );
}
