import Link from "next/link";
import type { Metadata } from "next";

import { CatalogShell } from "@/components/catalog-shell";
import { ProductGrid } from "@/components/product-grid";
import { SectionTitle } from "@/components/section-title";
import { WhatsAppButton } from "@/components/whatsapp-button";
import {
  buildWhatsAppLink,
  categories,
  featuredProducts,
  newArrivals,
  saleItems,
} from "@/lib/catalog";
import { company, formattedWhatsAppNumber, getAbsoluteUrl, siteDescription } from "@/lib/site";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: getAbsoluteUrl("/"),
  },
  twitter: {
    images: [getAbsoluteUrl("/twitter-image")],
  },
  description: siteDescription,
};

export default function Home() {
  const heroProducts = featuredProducts.slice(0, 3);

  return (
    <main className="pb-16">
      <section className="grain relative overflow-hidden px-4 pb-12 pt-24 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(243,215,186,0.7),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(32,146,93,0.14),transparent_22%)]" />
        <CatalogShell className="relative px-0 sm:px-0 lg:px-0">
          <div className="overflow-hidden rounded-[2.5rem] bg-[var(--hero)] px-5 py-6 text-white shadow-[0_28px_70px_rgba(32,19,13,0.22)] sm:px-7 sm:py-8 lg:px-10 lg:py-10">
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
              <div className="space-y-6">
                <div className="space-y-4">
                  <p className="text-[0.72rem] uppercase tracking-[0.32em] text-white/62">Wholesale catalog</p>
                  <h1 className="max-w-md font-serif text-5xl leading-[0.92] tracking-[-0.05em] sm:text-6xl">
                    Easy ladies wear for fast shop orders.
                  </h1>
                  <p className="max-w-md text-sm leading-6 text-white/74 sm:text-base">
                    Browse styles, check colors, and send your order on WhatsApp.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.6rem] border border-white/12 bg-white/8 p-4">
                    <p className="text-[0.68rem] uppercase tracking-[0.28em] text-white/52">For retailers</p>
                    <p className="mt-2 text-lg font-semibold text-white">Small and mid-size shops in Sri Lanka</p>
                  </div>
                  <div className="rounded-[1.6rem] border border-white/12 bg-white/8 p-4">
                    <p className="text-[0.68rem] uppercase tracking-[0.28em] text-white/52">Order flow</p>
                    <p className="mt-2 text-lg font-semibold text-white">Open product, view colors, WhatsApp order</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <WhatsAppButton href={buildWhatsAppLink()} label="Order on WhatsApp" />
                  <Link
                    href="#new-arrivals"
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/18 px-6 text-sm font-semibold text-white"
                  >
                    View new arrivals
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-white/12 pt-5 text-sm text-white/72 sm:grid-cols-3">
                  <div>
                    <p className="text-[0.68rem] uppercase tracking-[0.24em] text-white/44">WhatsApp</p>
                    <p className="mt-2">{formattedWhatsAppNumber}</p>
                  </div>
                  <div>
                    <p className="text-[0.68rem] uppercase tracking-[0.24em] text-white/44">Address</p>
                    <p className="mt-2">{company.address}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-[0.68rem] uppercase tracking-[0.24em] text-white/44">Best for</p>
                    <p className="mt-2">Wholesale buyers and repeat shop orders</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {heroProducts.map((product, index) => (
                  <Link
                    key={product.slug}
                    href={`/products/${product.slug}`}
                    className={`group overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/7 ${
                      index === 0 ? "sm:col-span-2" : ""
                    }`}
                  >
                    <div className="relative aspect-[4/5]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.coverImage ?? ""}
                        alt={product.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 px-4 py-4">
                      <div>
                        <p className="text-[0.68rem] uppercase tracking-[0.24em] text-white/48">{product.id}</p>
                        <p className="mt-1 text-lg font-semibold text-white">{product.title}</p>
                      </div>
                      <p className="text-sm text-white/66">Start {product.startingPrice}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </CatalogShell>
      </section>

      <section id="categories" className="pt-6">
        <CatalogShell>
          <div className="rounded-[2.2rem] border border-[var(--line)] bg-[rgba(255,249,242,0.92)] p-5 shadow-[0_18px_45px_rgba(63,40,19,0.06)] sm:p-7">
            <SectionTitle
              eyebrow="Browse"
              title="Shop by category"
              body="Choose a category and open styles fast. Each product page shows colors, starting price, MOQ, and WhatsApp order."
            />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/category/${category.slug}`}
                  className="group rounded-[1.8rem] border border-[var(--line)] bg-[var(--panel)] p-5 transition duration-300 hover:-translate-y-1 hover:border-[rgba(185,120,55,0.3)]"
                >
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[var(--text-soft)]">Category</p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
                    {category.name}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">{category.description}</p>
                  <span className="mt-6 inline-flex rounded-full bg-[var(--sand)] px-4 py-2 text-sm font-semibold text-[var(--text-strong)]">
                    Open styles
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </CatalogShell>
      </section>

      <section id="new-arrivals" className="pt-8">
        <CatalogShell>
          <div className="rounded-[2.2rem] border border-[var(--line)] bg-[rgba(255,249,242,0.78)] p-5 sm:p-7">
            <SectionTitle
              eyebrow="Latest"
              title="New arrivals"
              body="Fresh styles for your next order."
              action={<WhatsAppButton href={buildWhatsAppLink()} label="Ask on WhatsApp" />}
            />
            <div className="mt-8">
              <ProductGrid products={newArrivals.length > 0 ? newArrivals : featuredProducts.slice(0, 6)} />
            </div>
          </div>
        </CatalogShell>
      </section>

      <section id="sale-items" className="pt-8">
        <CatalogShell>
          <div className="rounded-[2.2rem] border border-[var(--line)] bg-[rgba(37,25,20,0.97)] p-5 text-white sm:p-7">
            <SectionTitle
              eyebrow="Value"
              title="Sale items"
              body="Good picks when you need better margin and quick movement."
              action={<WhatsAppButton href={buildWhatsAppLink()} label="Ask sale items" variant="light" />}
            />
            <div className="mt-8">
              {saleItems.length > 0 ? (
                <ProductGrid products={saleItems} />
              ) : (
                <div className="rounded-[1.8rem] border border-white/10 bg-white/6 px-5 py-8 text-sm text-white/70">
                  Sale items are not added yet. You can mark any product as sale in the product data.
                </div>
              )}
            </div>
          </div>
        </CatalogShell>
      </section>

      <section id="visit-us" className="pt-8">
        <CatalogShell>
          <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-[2.2rem] bg-[var(--accent-soft)] p-6">
              <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[var(--text-soft)]">Visit and order</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
                Wholesale styles from Keyzer Street, Colombo 11.
              </h2>
              <p className="mt-4 text-sm leading-6 text-[var(--text-soft)]">
                Best for shops that want simple browsing and fast repeat orders. Send the style code on WhatsApp for quick help.
              </p>
              <div className="mt-5 space-y-2 text-sm text-[var(--text-soft)]">
                <p className="font-semibold text-[var(--text-strong)]">{formattedWhatsAppNumber}</p>
                <p>{company.address}</p>
              </div>
            </div>
            <div className="rounded-[2.2rem] border border-[var(--line)] bg-[var(--panel)] p-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="max-w-xl">
                  <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[var(--text-soft)]">Buyer confidence</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
                    Made for existing buyers and easy reorder sharing.
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
                    Use this catalog to show styles, check colors, and message your order in one simple flow.
                  </p>
                </div>
                <WhatsAppButton href={buildWhatsAppLink()} label="Start WhatsApp Order" />
              </div>
            </div>
          </div>
        </CatalogShell>
      </section>

      <section className="pt-8">
        <CatalogShell>
          <div className="rounded-[2.2rem] border border-[var(--line)] bg-[rgba(255,249,242,0.92)] p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.7rem] bg-[var(--sand)] p-5">
                <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[var(--text-soft)]">Who this is for</p>
                <p className="mt-3 text-lg font-semibold text-[var(--text-strong)]">Ladies wear retailers and repeat wholesale buyers.</p>
              </div>
              <div className="rounded-[1.7rem] bg-[var(--sand)] p-5">
                <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[var(--text-soft)]">What you see</p>
                <p className="mt-3 text-lg font-semibold text-[var(--text-strong)]">Style code, images, colors, starting price, and MOQ.</p>
              </div>
              <div className="rounded-[1.7rem] bg-[var(--sand)] p-5">
                <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[var(--text-soft)]">How to order</p>
                <p className="mt-3 text-lg font-semibold text-[var(--text-strong)]">Open product and send the code on WhatsApp.</p>
              </div>
            </div>
          </div>
        </CatalogShell>
      </section>
    </main>
  );
}
