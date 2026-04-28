"use client";

import Image from "next/image";
import Link from "next/link";

import { RetailerOrderButton } from "@/components/retailer-order-button";
import { RetailerStatusCard, useRetailer } from "@/components/retailer-provider";
import { SaveProductButton } from "@/components/save-product-button";

export function ShortlistPage() {
  const { isLoaded, openAuth, retailer, shortlist } = useRetailer();

  if (!isLoaded) {
    return (
      <div className="rounded-[1.4rem] border border-[var(--line)] bg-[var(--panel)] p-5">
        <div className="h-5 w-36 rounded-full bg-[var(--sand)]" />
        <div className="mt-5 h-12 max-w-lg rounded-[1rem] bg-[var(--sand)]" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="h-64 rounded-[1.2rem] bg-[var(--sand)]" />
          <div className="h-64 rounded-[1.2rem] bg-[var(--sand)]" />
        </div>
      </div>
    );
  }

  if (!retailer) {
    return (
      <section className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--panel)] p-6 sm:p-7">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[var(--text-soft)]">Retailer shortlist</p>
        <h1 className="mt-3 max-w-3xl text-5xl font-bold leading-[1.03] tracking-[-0.01em] text-[var(--text-strong)]">
          Save styles for your next order
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--text-soft)]">
          Sign up with your phone to keep a shortlist, stay logged in, and start WhatsApp orders faster.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => openAuth({ type: "save" })}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--whatsapp)] px-6 text-sm font-bold text-white transition hover:-translate-y-0.5 active:translate-y-px active:scale-[0.98]"
          >
            Sign up with phone
          </button>
          <Link
            href="/#new-arrivals"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--line)] px-6 text-sm font-bold text-[var(--text-strong)] transition hover:bg-white active:scale-[0.98]"
          >
            Browse latest styles
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--panel)] p-6 sm:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[var(--text-soft)]">Retailer shortlist</p>
            <h1 className="mt-3 max-w-3xl text-5xl font-bold leading-[1.03] tracking-[-0.01em] text-[var(--text-strong)]">
              Saved styles for your next order
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--text-soft)]">
              Keep styles here, then start WhatsApp with your saved list when you are ready.
            </p>
          </div>
          <RetailerOrderButton label="Start WhatsApp order" />
        </div>
        <div className="mt-6">
          <RetailerStatusCard />
        </div>
      </section>

      {shortlist.length === 0 ? (
        <section className="rounded-[1.4rem] border border-[var(--line)] bg-[rgba(255,253,248,0.82)] p-6 sm:p-7">
          <p className="text-2xl font-bold tracking-normal text-[var(--text-strong)]">No saved styles yet.</p>
          <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">Open products and tap Save. Your shortlist will stay here after login.</p>
          <Link
            href="/#categories"
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--sand)] px-6 text-sm font-bold text-[var(--text-strong)] transition hover:bg-[var(--sand-strong)] active:scale-[0.98]"
          >
            Browse categories
          </Link>
        </section>
      ) : (
        <section className="grid gap-5 lg:grid-cols-2">
          {shortlist.map((product) => (
            <article
              key={product.slug}
              className="overflow-hidden rounded-[1.35rem] border border-[var(--line)] bg-[rgba(255,253,248,0.9)] shadow-[0_18px_45px_rgba(33,31,27,0.06)]"
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
                      <p className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[var(--text-soft)]">{product.id}</p>
                      <h2 className="mt-2 text-3xl font-bold leading-[1.06] tracking-[-0.01em] text-[var(--text-strong)]">{product.title}</h2>
                      <p className="mt-2 text-sm text-[var(--text-soft)]">{product.category}</p>
                    </div>
                    <SaveProductButton productSlug={product.slug} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[1rem] bg-[var(--sand)] p-4">
                      <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--text-soft)]">Start</p>
                      <p className="mt-2 font-bold text-[var(--text-strong)]">{product.startingPrice}</p>
                    </div>
                    <div className="rounded-[1rem] bg-[var(--sand)] p-4">
                      <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--text-soft)]">MOQ</p>
                      <p className="mt-2 font-bold text-[var(--text-strong)]">{product.moq}</p>
                    </div>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-3">
                    <Link
                      href={`/products/${product.slug}`}
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] px-5 text-sm font-bold text-[var(--text-strong)] transition hover:bg-white active:scale-[0.98]"
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
