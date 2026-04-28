import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import type { CSSProperties } from "react";

import { CatalogShell } from "@/components/catalog-shell";
import { ProductGrid } from "@/components/product-grid";
import { RetailerOrderButton } from "@/components/retailer-order-button";
import { RetailerShortlistInlineLink } from "@/components/retailer-provider";
import { SectionTitle } from "@/components/section-title";
import {
  categories,
  featuredProducts,
  newArrivals,
  productsByCategory,
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
  const heroProducts = featuredProducts.slice(0, 4);
  const categoryCards = categories.map((category) => {
    const products = productsByCategory(category.slug);

    return {
      ...category,
      count: products.length,
      coverImage: products[0]?.coverImage ?? null,
    };
  });

  return (
    <main className="overflow-hidden pb-28 md:pb-16">
      <section className="grain relative px-3 pb-14 pt-28 sm:px-6 lg:px-8">
        <CatalogShell className="px-0 sm:px-0 lg:px-0">
          <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-end">
            <div className="editorial-reveal max-w-5xl space-y-7" style={{ "--index": 0 } as CSSProperties}>
              <div className="space-y-5">
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[var(--text-soft)]">
                  Wholesale ladies wear, Colombo
                </p>
                <h1 className="max-w-5xl text-balance text-[clamp(2.75rem,6.7vw,6rem)] font-bold leading-[1] tracking-[-0.015em] text-[var(--text-strong)]">
                  Wholesale ladies wear for Sri Lanka shops.
                </h1>
                <p className="max-w-xl text-pretty text-base leading-7 text-[var(--text-soft)] sm:text-lg">
                  Browse real product photos, check starting price and MOQ, save styles, and send your order on WhatsApp.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <RetailerOrderButton label="Order on WhatsApp" />
                <Link
                  href="#new-arrivals"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--line)] bg-[rgba(255,253,248,0.72)] px-6 text-sm font-bold text-[var(--text-strong)] transition duration-300 hover:-translate-y-0.5 hover:bg-white active:translate-y-px active:scale-[0.98]"
                >
                  View new arrivals
                </Link>
                <RetailerShortlistInlineLink />
              </div>

              <div className="grid max-w-3xl gap-3 border-t border-[var(--line)] pt-5 text-sm text-[var(--text-soft)] sm:grid-cols-3">
                <div>
                  <p className="font-bold text-[var(--text-strong)]">{formattedWhatsAppNumber}</p>
                  <p className="mt-1">WhatsApp orders</p>
                </div>
                <div>
                  <p className="font-bold text-[var(--text-strong)]">{company.address}</p>
                  <p className="mt-1">Visit us</p>
                </div>
                <div>
                  <p className="font-bold text-[var(--text-strong)]">{featuredProducts.length} styles</p>
                  <p className="mt-1">Starter catalog</p>
                </div>
              </div>
            </div>

            <div className="editorial-reveal grid grid-cols-[0.72fr_1fr] gap-3 lg:-mb-6" style={{ "--index": 1 } as CSSProperties}>
              <div className="space-y-3 pt-12">
                {heroProducts.slice(1, 3).map((product, index) => (
                  <Link
                    key={product.slug}
                    href={`/products/${product.slug}`}
                    className="group block overflow-hidden rounded-[1.25rem] bg-[var(--muted)]"
                  >
                    <div className="relative aspect-[4/5]">
                      {product.coverImage ? (
                        <Image
                          src={product.coverImage}
                          alt={product.title}
                          fill
                          className="object-cover transition duration-700 group-hover:scale-[1.05]"
                          sizes="(max-width: 768px) 42vw, 18vw"
                        />
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>

              {heroProducts[0] ? (
                <Link
                  href={`/products/${heroProducts[0].slug}`}
                  className="group block overflow-hidden rounded-[1.65rem] bg-[var(--hero)] shadow-[0_28px_80px_rgba(33,31,27,0.18)]"
                >
                  <div className="relative aspect-[4/5]">
                    {heroProducts[0].coverImage ? (
                      <Image
                        src={heroProducts[0].coverImage}
                        alt={heroProducts[0].title}
                        fill
                        priority
                        className="object-cover transition duration-700 group-hover:scale-[1.04]"
                        sizes="(max-width: 768px) 58vw, 32vw"
                      />
                    ) : null}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(24,22,19,0.78)] to-transparent p-4 text-white">
                      <p className="font-mono text-[0.72rem] uppercase tracking-[0.14em] text-white/72">{heroProducts[0].id}</p>
                      <p className="mt-1 text-xl font-bold tracking-normal">{heroProducts[0].title}</p>
                      <p className="mt-2 text-sm text-white/78">Start {heroProducts[0].startingPrice}</p>
                    </div>
                  </div>
                </Link>
              ) : null}
            </div>
          </div>
        </CatalogShell>
      </section>

      <section id="categories" className="py-12 md:py-20">
        <CatalogShell>
          <SectionTitle
            eyebrow="Categories"
            title="Browse by product type"
            body="Choose frocks, tops, sets, leggings, or pants. Open any style to see photos, colors, starting price, and MOQ."
          />
          <div className="mt-8 grid grid-flow-dense gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categoryCards.map((category, index) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className={`editorial-reveal group overflow-hidden rounded-[1.35rem] border border-[var(--line)] bg-[rgba(255,253,248,0.76)] transition duration-500 hover:-translate-y-1 hover:bg-white hover:shadow-[0_24px_60px_rgba(33,31,27,0.08)] ${
                  index === 0 || index === 5 ? "lg:col-span-2" : ""
                }`}
                style={{ "--index": index } as CSSProperties}
              >
                <div className="relative aspect-[16/11] bg-[var(--muted)]">
                  {category.coverImage ? (
                    <Image
                      src={category.coverImage}
                      alt={`${category.name} cover style`}
                      fill
                      className="object-cover transition duration-700 group-hover:scale-[1.04]"
                      sizes={index === 0 || index === 5 ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, 25vw"}
                    />
                  ) : null}
                </div>
                <div className="flex items-end justify-between gap-4 p-4">
                  <div>
                    <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-[var(--text-soft)]">
                      {category.count} styles
                    </p>
                    <h3 className="mt-2 text-2xl font-bold leading-[1.06] tracking-[-0.005em] text-[var(--text-strong)]">
                      {category.name}
                    </h3>
                  </div>
                  <span className="text-sm font-bold text-[var(--text-strong)]">Open</span>
                </div>
              </Link>
            ))}
          </div>
        </CatalogShell>
      </section>

      <section id="new-arrivals" className="py-12 md:py-20">
        <CatalogShell>
          <SectionTitle
            eyebrow="New arrivals"
            title="New wholesale styles"
            body="Fresh styles recently added to the catalog. Save what you like and order on WhatsApp after retailer login."
            action={<RetailerOrderButton label="Start order" />}
          />
          <div className="mt-8">
            <ProductGrid products={newArrivals.length > 0 ? newArrivals : featuredProducts.slice(0, 8)} />
          </div>
        </CatalogShell>
      </section>

      <section className="py-12 md:py-20">
        <CatalogShell>
          <div className="grid gap-8 border-y border-[var(--line)] py-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[var(--text-soft)]">Why order from us</p>
              <h2 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.06] tracking-[-0.01em] text-[var(--text-strong)] md:text-5xl">
                Simple wholesale buying for ladies wear retailers.
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.2rem] border border-[var(--line)] bg-[rgba(255,253,248,0.76)] p-5">
                <p className="text-sm font-bold text-[var(--text-strong)]">See the style before you ask</p>
                <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
                  Each product page shows clear photos, color names when added, price, MOQ, fabric, and size range.
                </p>
              </div>
              <div className="rounded-[1.2rem] bg-[var(--accent-soft)] p-5">
                <p className="text-sm font-bold text-[var(--text-strong)]">Save styles for one order</p>
                <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
                  Shortlist products as you browse, then send the styles together on WhatsApp.
                </p>
              </div>
              <div className="rounded-[1.2rem] bg-[var(--sand)] p-5">
                <p className="text-sm font-bold text-[var(--text-strong)]">Made for shop buyers</p>
                <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
                  Best for ladies wear shops, resellers, and repeat wholesale buyers in Sri Lanka.
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-[var(--line)] bg-[rgba(255,253,248,0.76)] p-5">
                <p className="text-sm font-bold text-[var(--text-strong)]">Order where buyers already chat</p>
                <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
                  Start from the catalog and continue the order on WhatsApp with the style code included.
                </p>
              </div>
            </div>
          </div>
        </CatalogShell>
      </section>

      <section id="sale-items" className="py-12 md:py-20">
        <CatalogShell>
          <div className="rounded-[1.6rem] bg-[var(--hero)] p-5 text-white sm:p-7">
            <SectionTitle
              eyebrow="Sale items"
              title="Ask for sale and fast-moving styles"
              body="Send us a WhatsApp message if you want lower-price picks for quick shop sales."
              action={<RetailerOrderButton label="Ask on WhatsApp" variant="light" />}
              invert
            />
            <div className="mt-8">
              {saleItems.length > 0 ? (
                <ProductGrid products={saleItems} />
              ) : (
                <div className="rounded-[1.1rem] border border-white/12 bg-white/8 px-5 py-8 text-sm leading-6 text-white/72">
                  Sale items are not added yet. New wholesale styles are ready above.
                </div>
              )}
            </div>
          </div>
        </CatalogShell>
      </section>

      <section id="visit-us" className="py-12 md:py-20">
        <CatalogShell>
          <div className="grid gap-6 border-y border-[var(--line)] py-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[var(--text-soft)]">Who this is for</p>
              <h2 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.06] tracking-[-0.01em] text-[var(--text-strong)] md:text-5xl">
                For ladies wear shops, resellers, and repeat wholesale buyers.
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.2rem] bg-[var(--accent-soft)] p-5">
                <p className="text-sm font-bold text-[var(--text-strong)]">Why use the website</p>
                <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
                  It helps you check styles faster before messaging. You can compare photos and save the products you want.
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-[var(--line)] bg-[rgba(255,253,248,0.76)] p-5">
                <p className="text-sm font-bold text-[var(--text-strong)]">{formattedWhatsAppNumber}</p>
                <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
                  Visit us at {company.address}, or start your order on WhatsApp.
                </p>
                <div className="mt-5">
                  <RetailerOrderButton label="Order on WhatsApp" />
                </div>
              </div>
            </div>
          </div>
        </CatalogShell>
      </section>

      <div className="fixed inset-x-3 bottom-3 z-40 rounded-full border border-[var(--line)] bg-[rgba(255,253,248,0.92)] p-2 shadow-[0_18px_48px_rgba(33,31,27,0.18)] backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <RetailerOrderButton label="WhatsApp order" />
          <Link
            href="/shortlist"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--sand)] px-4 text-sm font-bold text-[var(--text-strong)]"
          >
            Shortlist
          </Link>
        </div>
      </div>
    </main>
  );
}
