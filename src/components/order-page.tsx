"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { useOrderCart } from "@/components/order-cart-provider";
import { useOrderLine, useOrderSplits } from "@/components/order-sizes-provider";
import { ProductGrid } from "@/components/product-grid";
import { QuantityInput } from "@/components/quantity-input";
import { SizeQuantityRows } from "@/components/size-quantity-rows";
import { allProducts, type CatalogProductView, formatLkr, newArrivals } from "@/lib/catalog";
import { MIN_ORDER_QUANTITY } from "@/lib/order-cart";
import {
  buildOrderSupportWhatsAppLink,
  type OrderReceipt,
  type PlaceOrderPayload,
} from "@/lib/order-domain";
import {
  fitSplitToTotal,
  formatSplit,
  parseSizeRange,
  SIZE_ORDERS_SENT,
  type SizeSplit,
  starterSplit,
  sumSplit,
} from "@/lib/sizes";

const recoveryMessage =
  "We could not place your order. Your items are still saved. Try again or message us on WhatsApp.";

const fieldClass =
  "min-h-12 w-full border border-[var(--line)] bg-white px-4 text-base outline-none transition-colors focus:border-[var(--ink)]";

type PayloadItem = PlaceOrderPayload["items"][number];

export function OrderPage() {
  const { clear, entries, isLoaded, summary } = useOrderCart();
  const splits = useOrderSplits();
  const [customerName, setCustomerName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);
  // Styles whose size rows show an unsaved change under 6 pieces. The order waits until they are fixed.
  const [shortStyles, setShortStyles] = useState<ReadonlySet<string>>(() => new Set());

  // The form sits low on a phone; bring the order number into view once it is placed.
  useEffect(() => {
    if (receipt) window.scrollTo({ top: 0 });
  }, [receipt]);
  const idempotency = useRef<{ cartSignature: string; key: string } | null>(null);
  const productBySlug = useMemo(
    () => new Map(allProducts.map((product) => [product.slug, product])),
    [],
  );
  // Sizes are part of the order, so changing them after a failed try counts as a new order.
  const cartSignature = JSON.stringify({ entries, splits });
  const hasShortStyle = summary.lines.some((line) => shortStyles.has(line.productSlug));

  function markShort(slug: string, isShort: boolean) {
    setShortStyles((current) => {
      if (current.has(slug) === isShort) return current;
      const next = new Set(current);
      if (isShort) next.add(slug);
      else next.delete(slug);
      return next;
    });
  }

  if (receipt) {
    return (
      <section className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        <p className="label text-[var(--text-soft)]">Order received</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-[-0.02em] sm:text-6xl">{receipt.reference}</h1>
        <div className="mt-8 flex items-baseline justify-between border-y border-[var(--line)] py-4">
          <p className="text-sm text-[var(--text-soft)]">Product total</p>
          <p className="text-2xl font-semibold">{formatLkr(receipt.productTotalLkr)}</p>
        </div>
        <p className="mt-6 text-base leading-7 text-[var(--text-soft)]">
          Our staff will contact you shortly to confirm delivery and payment.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <a
            href={buildOrderSupportWhatsAppLink(receipt.reference)}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-12 items-center justify-center bg-[var(--whatsapp)] px-6 text-sm font-semibold text-white"
          >
            Message us on WhatsApp
          </a>
          <Link href="/#new-arrivals" className="flex min-h-12 items-center justify-center border border-[var(--ink)] px-6 text-sm font-semibold">
            Continue shopping
          </Link>
        </div>
      </section>
    );
  }

  if (!isLoaded) {
    return <p className="px-4 py-16 text-sm text-[var(--text-soft)] sm:px-6 lg:px-10">Loading your order...</p>;
  }

  if (summary.lines.length === 0) {
    return (
      <section className="py-10">
        <div className="px-4 sm:px-6 lg:px-10">
          <h1 className="text-3xl font-semibold tracking-[-0.01em]">Your order is empty</h1>
          <p className="mt-2 text-sm text-[var(--text-soft)]">Tap + on any style to add 6 pieces.</p>
          <Link
            href="/#all-styles"
            className="mt-6 inline-flex min-h-12 items-center justify-center bg-[var(--ink)] px-6 text-sm font-semibold text-white"
          >
            Browse styles
          </Link>
        </div>
        <p className="label mb-4 mt-12 px-4 sm:px-6 lg:px-10">New arrivals</p>
        <ProductGrid products={newArrivals.slice(0, 4)} />
      </section>
    );
  }

  function payloadItems(): PayloadItem[] {
    return entries.map(({ productSlug, quantity }) => {
      const item: PayloadItem = { productSlug, quantity };
      const sizes = parseSizeRange(productBySlug.get(productSlug)?.sizeRange);
      if (SIZE_ORDERS_SENT && sizes.length > 0) {
        const split = fitSplitToTotal(splits[productSlug] ?? starterSplit(sizes), sizes, quantity);
        item.sizes = sizes
          .filter((size) => split[size] > 0)
          .map((size) => ({ size, quantity: split[size] }));
      }
      return item;
    });
  }

  async function placeOrder() {
    const activeKey =
      idempotency.current?.cartSignature === cartSignature
        ? idempotency.current.key
        : crypto.randomUUID();
    idempotency.current = { cartSignature, key: activeKey };
    const payload: PlaceOrderPayload = {
      customerName,
      whatsappNumber,
      idempotencyKey: activeKey,
      items: payloadItems(),
    };

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as OrderReceipt & { message?: string };
      if (!response.ok) {
        setErrorMessage(result.message || recoveryMessage);
        return;
      }

      idempotency.current = null;
      setReceipt(result);
      clear();
    } catch {
      setErrorMessage(recoveryMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start lg:px-10">
      <section>
        <p className="label text-[var(--text-soft)]">Your order</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-[-0.01em]">Check your styles</h1>

        <div className="mt-6 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {summary.lines.map((line) => {
            const product = productBySlug.get(line.productSlug);
            if (!product) return null;
            return (
              <OrderLineItem
                key={line.productSlug}
                product={product}
                lineTotalLkr={line.lineTotalLkr}
                onShortChange={(isShort) => markShort(line.productSlug, isShort)}
              />
            );
          })}
        </div>

        <Link href="/#all-styles" className="mt-5 inline-block text-sm underline underline-offset-4">
          Continue shopping
        </Link>
      </section>

      <section className="border border-[var(--line)] p-5 sm:p-6 lg:sticky lg:top-20">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-[var(--text-soft)]">Styles</dt>
            <dd>{summary.styleCount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--text-soft)]">Pieces</dt>
            <dd>{summary.itemCount}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-[var(--line)] pt-3">
            <dt className="font-semibold">Product total</dt>
            <dd className="text-2xl font-semibold">{formatLkr(summary.productTotalLkr)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-5 text-[var(--text-soft)]">
          Delivery and payment are confirmed by our staff on WhatsApp.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void placeOrder();
          }}
        >
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Name</span>
            <input
              required
              maxLength={100}
              autoComplete="name"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">WhatsApp number</span>
            <input
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="078 323 2414"
              value={whatsappNumber}
              onChange={(event) => setWhatsappNumber(event.target.value)}
              className={fieldClass}
            />
          </label>

          {errorMessage ? (
            <p role="alert" className="border border-[var(--danger)] p-3 text-sm leading-6 text-[var(--danger)]">
              {errorMessage}
            </p>
          ) : null}

          {hasShortStyle ? (
            <p className="text-sm leading-6 text-[var(--danger)]">
              Each style needs 6 pieces or more before you place the order.
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || hasShortStyle}
            className="flex min-h-12 w-full items-center justify-center bg-[var(--ink)] px-6 text-sm font-semibold uppercase tracking-[0.08em] text-white disabled:opacity-60"
          >
            {isSubmitting ? "Placing order..." : "Place order"}
          </button>
          <p className="text-xs text-[var(--text-soft)]">We only ask for your name and WhatsApp number.</p>
        </form>
      </section>
    </div>
  );
}

function OrderLineItem({
  product,
  lineTotalLkr,
  onShortChange,
}: {
  product: CatalogProductView;
  lineTotalLkr: number;
  onShortChange: (isShort: boolean) => void;
}) {
  const line = useOrderLine(product);
  const [showSizes, setShowSizes] = useState(false);
  // A size change that drops under 6 stays here as a draft until it is valid again.
  const [draft, setDraft] = useState<SizeSplit | null>(null);
  const split = draft ?? line.split;
  const href = `/products/${product.slug}`;

  function changeSplit(next: SizeSplit) {
    const saved = sumSplit(next) >= MIN_ORDER_QUANTITY && line.setSplit(next);
    setDraft(saved ? null : next);
    onShortChange(!saved);
  }

  function remove() {
    onShortChange(false);
    line.remove();
  }

  return (
    <article className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 py-5 sm:grid-cols-[6rem_minmax(0,1fr)]">
      <Link href={href} className="relative aspect-[3/4] bg-[var(--fill)]" tabIndex={-1} aria-hidden>
        {product.coverImage ? <Image src={product.coverImage} alt="" fill sizes="96px" className="object-cover" /> : null}
      </Link>

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="label text-[var(--text-soft)]">Style {product.id}</p>
            <Link href={href} className="mt-0.5 block text-sm font-semibold leading-snug hover:underline">
              {product.title}
            </Link>
          </div>
          <p className="shrink-0 text-sm font-semibold">{formatLkr(lineTotalLkr)}</p>
        </div>
        <p className="mt-1 text-xs text-[var(--text-soft)]">{formatLkr(product.unitPriceLkr ?? 0)} each</p>

        {line.isSized ? (
          <div className="mt-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              {/* What is saved in the order; an unsaved draft under 6 shows only in the rows below. */}
              <p>{formatSplit(line.split, line.sizes)}</p>
              <button
                type="button"
                aria-expanded={showSizes}
                onClick={() => setShowSizes((value) => !value)}
                className="min-h-11 shrink-0 px-1 text-xs underline underline-offset-4 md:hidden"
              >
                {showSizes ? "Hide sizes" : "Change sizes"}
              </button>
            </div>
            <div className={`mt-2 ${showSizes ? "block" : "hidden md:block"}`}>
              <SizeQuantityRows sizes={line.sizes} split={split} unitPriceLkr={product.unitPriceLkr ?? 0} onChange={changeSplit} />
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <QuantityInput value={line.quantity} min={MIN_ORDER_QUANTITY} onChange={(next) => line.setQuantity(next)} />
          </div>
        )}

        <button
          type="button"
          onClick={remove}
          className="mt-2 min-h-11 text-xs text-[var(--danger)] underline underline-offset-4"
        >
          Remove
        </button>
      </div>
    </article>
  );
}
