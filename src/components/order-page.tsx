"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { OrderQuantityControl } from "@/components/order-quantity-control";
import { useOrderCart } from "@/components/order-cart-provider";
import { allProducts, formatLkr } from "@/lib/catalog";
import {
  buildOrderSupportWhatsAppLink,
  type OrderReceipt,
  type PlaceOrderPayload,
} from "@/lib/order-domain";

const recoveryMessage =
  "We could not place your order. Your items are still saved. Try again or message us on WhatsApp.";

export function OrderPage() {
  const { clear, entries, isLoaded, remove, summary } = useOrderCart();
  const [customerName, setCustomerName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);

  // The form sits low on a phone; bring the order number into view once it is placed.
  useEffect(() => {
    if (receipt) window.scrollTo({ top: 0 });
  }, [receipt]);
  const idempotency = useRef<{ cartSignature: string; key: string } | null>(null);
  const productBySlug = useMemo(
    () => new Map(allProducts.map((product) => [product.slug, product])),
    [],
  );
  const cartSignature = JSON.stringify(entries);

  if (receipt) {
    return (
      <section className="border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-8">
        <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[var(--text-soft)]">
          Order received
        </p>
        <h1 className="catalog-heading mt-3 text-6xl font-black leading-none text-[var(--text-strong)] sm:text-8xl">
          {receipt.reference}
        </h1>
        <div className="mt-7 border-y border-[var(--line)] py-5">
          <p className="text-sm font-black text-[var(--text-soft)]">Product total</p>
          <p className="mt-2 text-3xl font-black text-[var(--text-strong)]">
            {formatLkr(receipt.productTotalLkr)}
          </p>
        </div>
        <p className="mt-6 max-w-xl text-base leading-7 text-[var(--text-soft)]">
          Our staff will contact you shortly to confirm delivery and payment.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <a
            href={buildOrderSupportWhatsAppLink(receipt.reference)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center bg-[var(--whatsapp)] px-6 text-sm font-black text-white"
          >
            Message us on WhatsApp
          </a>
          <Link
            href="/#new-arrivals"
            className="inline-flex min-h-12 items-center justify-center border border-[var(--line)] px-6 text-sm font-black text-[var(--text-strong)]"
          >
            Continue shopping
          </Link>
        </div>
      </section>
    );
  }

  if (!isLoaded) {
    return <p className="py-16 text-sm text-[var(--text-soft)]">Loading your order...</p>;
  }

  if (summary.lines.length === 0) {
    return (
      <section className="border border-[var(--line)] bg-[var(--panel)] p-6 sm:p-8">
        <h1 className="catalog-heading text-5xl font-black leading-none text-[var(--text-strong)] sm:text-7xl">
          Your order is empty
        </h1>
        <Link
          href="/#new-arrivals"
          className="mt-7 inline-flex min-h-12 items-center justify-center bg-[var(--text-strong)] px-6 text-sm font-black text-white"
        >
          Browse styles
        </Link>
      </section>
    );
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
      items: entries.map(({ productSlug, quantity }) => ({ productSlug, quantity })),
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
    <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
      <section className="border border-[var(--line)] bg-[var(--panel)]">
        <div className="border-b border-[var(--line)] p-5 sm:p-6">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[var(--text-soft)]">
            Your order
          </p>
          <h1 className="catalog-heading mt-2 text-5xl font-black leading-none text-[var(--text-strong)] sm:text-7xl">
            Check your styles
          </h1>
        </div>

        <div className="divide-y divide-[var(--line)]">
          {summary.lines.map((line) => {
            const product = productBySlug.get(line.productSlug);
            if (!product) return null;

            return (
              <article key={line.productSlug} className="grid grid-cols-[5.5rem_1fr] gap-4 p-4 sm:grid-cols-[7rem_1fr] sm:p-5">
                <Link href={`/products/${product.slug}`} className="relative aspect-[4/5] overflow-hidden bg-[var(--sand)]">
                  {product.coverImage ? (
                    <Image
                      src={product.coverImage}
                      alt={product.title}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  ) : null}
                </Link>
                <div className="min-w-0">
                  <p className="font-mono text-[0.68rem] font-black uppercase tracking-[0.14em] text-[var(--text-soft)]">
                    Style {product.id}
                  </p>
                  <Link href={`/products/${product.slug}`} className="mt-1 block text-lg font-black leading-tight text-[var(--text-strong)]">
                    {product.title}
                  </Link>
                  <p className="mt-2 text-sm text-[var(--text-soft)]">
                    {formatLkr(line.unitPriceLkr)} each
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <OrderQuantityControl productSlug={line.productSlug} quantity={line.quantity} />
                    <button
                      type="button"
                      onClick={() => remove(line.productSlug)}
                      className="min-h-11 px-2 text-sm font-black text-[var(--danger)] underline underline-offset-4"
                    >
                      Remove
                    </button>
                  </div>
                  <p className="mt-4 text-sm font-black text-[var(--text-strong)]">
                    {formatLkr(line.lineTotalLkr)}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="border-t border-[var(--line)] p-5">
          <Link href="/#new-arrivals" className="text-sm font-black text-[var(--text-strong)] underline underline-offset-4">
            Continue shopping
          </Link>
        </div>
      </section>

      <section className="border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6 lg:sticky lg:top-24">
        <div className="flex items-end justify-between gap-4 border-b border-[var(--line)] pb-5">
          <p className="text-sm font-black text-[var(--text-soft)]">Product total</p>
          <p className="text-3xl font-black text-[var(--text-strong)]">
            {formatLkr(summary.productTotalLkr)}
          </p>
        </div>
        <p className="mt-4 text-sm leading-6 text-[var(--text-soft)]">
          Delivery will be confirmed by our staff.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void placeOrder();
          }}
        >
          <label className="block space-y-2">
            <span className="text-sm font-black text-[var(--text-strong)]">Name</span>
            <input
              required
              maxLength={100}
              autoComplete="name"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              className="min-h-12 w-full border border-[var(--line)] bg-white px-4 text-base text-[var(--text-strong)] outline-none focus:border-[var(--text-strong)]"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-black text-[var(--text-strong)]">WhatsApp number</span>
            <input
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="078 323 2414"
              value={whatsappNumber}
              onChange={(event) => setWhatsappNumber(event.target.value)}
              className="min-h-12 w-full border border-[var(--line)] bg-white px-4 text-base text-[var(--text-strong)] outline-none focus:border-[var(--text-strong)]"
            />
          </label>

          {errorMessage ? (
            <p role="alert" className="border border-[var(--danger)]/20 bg-red-50 p-3 text-sm leading-6 text-[var(--danger)]">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-12 w-full items-center justify-center bg-[var(--text-strong)] px-6 text-sm font-black text-white disabled:opacity-60"
          >
            {isSubmitting ? "Placing order..." : "Place order"}
          </button>
        </form>
      </section>
    </div>
  );
}
