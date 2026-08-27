"use client";

import Image from "next/image";
import Link from "next/link";

import { RetailerOrderButton } from "@/components/retailer-order-button";
import { RetailerStatusCard, useRetailer } from "@/components/retailer-provider";
import { SaveProductButton } from "@/components/save-product-button";

export function ShortlistPage() {
  const { enabled, isLoaded, openAuth, retailer, shortlist } = useRetailer();

  if (!isLoaded) {
    return (
      <div className="border border-[var(--line)] bg-[var(--panel)] p-5">
        <div className="h-5 w-36 bg-[var(--sand)]" />
        <div className="mt-5 h-12 max-w-lg bg-[var(--sand)]" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="h-64 bg-[var(--sand)]" />
          <div className="h-64 bg-[var(--sand)]" />
        </div>
      </div>
    );
  }

  if (enabled && !retailer) {
    return (
      <section className="border border-[var(--line)] bg-[var(--panel)] p-6 sm:p-7">
        <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-[var(--text-soft)]">Retailer shortlist</p>
        <h1 className="catalog-heading mt-3 max-w-4xl text-5xl font-black leading-[0.92] text-[var(--text-strong)] md:text-7xl">
          Save styles for your next order
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--text-soft)]">
          Sign up with your phone to keep a shortlist, stay logged in, and start WhatsApp orders faster.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => openAuth({ type: "save" })}
            className="inline-flex min-h-11 items-center justify-center bg-[var(--whatsapp)] px-5 text-[0.78rem] font-black uppercase tracking-[0.12em] text-white transition hover:-translate-y-0.5 active:translate-y-px active:scale-[0.98]"
          >
            Sign up with phone
          </button>
          <Link
            href="/#new-arrivals"
            className="inline-flex min-h-11 items-center justify-center border border-[var(--line)] px-5 text-[0.78rem] font-black uppercase tracking-[0.12em] text-[var(--text-strong)] transition hover:bg-white active:scale-[0.98]"
          >
            Browse latest styles
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="border border-[var(--line)] bg-[var(--panel)] p-6 sm:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-[var(--text-soft)]">Retailer shortlist</p>
            <h1 className="catalog-heading mt-3 max-w-4xl text-5xl font-black leading-[0.92] text-[var(--text-strong)] md:text-7xl">
              {enabled ? "Saved styles for your next order" : "Your saved styles"}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--text-soft)]">
              {enabled
                ? "Keep styles here, then start WhatsApp with your saved list when you are ready."
                : "These styles are saved on this device. Send the list together on WhatsApp when you are ready."}
            </p>
          </div>
          <RetailerOrderButton label="Start WhatsApp order" />
        </div>
        <div className="mt-6">
          <RetailerStatusCard />
        </div>
      </section>

      {shortlist.length === 0 ? (
        <section className="border border-[var(--line)] bg-[rgba(255,253,248,0.9)] p-6 sm:p-7">
          <p className="text-2xl font-black tracking-normal text-[var(--text-strong)]">No saved styles yet.</p>
          <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
            {enabled ? "Open products and tap Save. Your shortlist will stay here after login." : "Open products and tap Save. Your shortlist will stay on this device."}
          </p>
          <Link
            href="/#categories"
            className="mt-5 inline-flex min-h-11 items-center justify-center bg-[var(--text-strong)] px-5 text-[0.78rem] font-black uppercase tracking-[0.12em] text-white transition hover:bg-[var(--hero)] active:scale-[0.98]"
          >
            Browse categories
          </Link>
        </section>
      ) : (
        <section className="grid gap-5 lg:grid-cols-2">
          {shortlist.map((product) => (
            <article
              key={product.slug}
              className="overflow-hidden border border-[var(--line)] bg-[rgba(255,253,248,0.9)]"
            >
              <div className="grid gap-0 sm:grid-cols-[0.9fr_1.1fr]">
                <div className="relative min-h-64 bg-[var(--muted)]">
                  {product.coverImage ? (
                    <Image src={product.coverImage} alt={product.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 40vw" />
                  ) : null}
                </div>
                <div className="flex flex-col gap-4 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-[0.72rem] font-black uppercase tracking-[0.14em] text-[var(--text-soft)]">Style {product.id}</p>
                      <h2 className="mt-2 text-3xl font-black leading-[1.06] tracking-[-0.01em] text-[var(--text-strong)]">{product.title}</h2>
                      <p className="mt-2 text-sm text-[var(--text-soft)]">{product.category}</p>
                    </div>
                    <SaveProductButton productSlug={product.slug} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="border border-[var(--line)] bg-[var(--sand)] p-4">
                      <p className="text-[0.68rem] font-black uppercase tracking-[0.12em] text-[var(--text-soft)]">Start</p>
                      <p className="mt-2 font-black text-[var(--text-strong)]">{product.startingPrice}</p>
                    </div>
                    <div className="border border-[var(--line)] bg-[var(--sand)] p-4">
                      <p className="text-[0.68rem] font-black uppercase tracking-[0.12em] text-[var(--text-soft)]">MOQ</p>
                      <p className="mt-2 font-black text-[var(--text-strong)]">{product.moq}</p>
                    </div>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-3">
                    <Link
                      href={`/products/${product.slug}`}
                      className="inline-flex min-h-11 items-center justify-center border border-[var(--line)] px-5 text-[0.78rem] font-black uppercase tracking-[0.12em] text-[var(--text-strong)] transition hover:bg-white active:scale-[0.98]"
                    >
                      Open product
                    </Link>
                    <RetailerOrderButton productSlug={product.slug} label="Order this style" />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
