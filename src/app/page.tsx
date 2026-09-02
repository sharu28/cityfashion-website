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
  featuredProducts,
  newArrivals,
  populatedCategories,
  productsByCategory,
  retailerDeals,
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

const homepageNewArrivalSlugs = ["style-4110-printed-button-frock"];

export default function Home() {
  const heroProducts = featuredProducts.slice(0, 6);
  const homepageNewArrivals = [
    ...homepageNewArrivalSlugs
      .map((slug) => newArrivals.find((product) => product.slug === slug))
      .filter((product): product is (typeof newArrivals)[number] => Boolean(product)),
    ...newArrivals.filter((product) => !homepageNewArrivalSlugs.includes(product.slug)),
  ];
  const categoryCards = populatedCategories.map((category) => {
    const products = productsByCategory(category.slug);

    return {
      ...category,
      count: products.length,
      coverImage: products[0]?.coverImage ?? null,
    };
  });

  return (
    <main className="overflow-hidden pb-28 md:pb-16">
      <section className="relative bg-[var(--hero)] pt-20 text-white">
        <CatalogShell className="max-w-[1500px] px-3 sm:px-5 lg:px-7">
          <div className="grid min-h-[calc(100dvh-5rem)] gap-4 py-4 lg:grid-cols-[0.86fr_1.14fr] lg:items-stretch">
            <div className="editorial-reveal flex flex-col justify-between gap-8 border border-white/12 p-5 sm:p-7 lg:p-8" style={{ "--index": 0 } as CSSProperties}>
              <div className="space-y-5">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-white/58">
                  Wholesale ladies wear, Colombo
                </p>
                <h1 className="catalog-heading max-w-4xl text-[clamp(3.4rem,9vw,8.7rem)] font-black leading-[0.84] text-white">
                  Pick styles fast. Order for your shop.
                </h1>
                <p className="max-w-xl text-pretty text-base leading-7 text-white/68 sm:text-lg">
                  Browse real product photos, check starting price and MOQ, save styles, and send your order on WhatsApp.
                </p>
              </div>

              <div className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="#new-arrivals"
                    className="inline-flex min-h-11 items-center justify-center border border-white bg-white px-5 text-[0.78rem] font-black uppercase tracking-[0.12em] text-[var(--text-strong)] transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--sand)] active:translate-y-px active:scale-[0.98]"
                  >
                    Browse latest styles
                  </Link>
                  <RetailerOrderButton label="WhatsApp order" />
                  <RetailerShortlistInlineLink />
                </div>

                <div className="grid gap-0 border border-white/14 text-sm text-white/64 sm:grid-cols-3">
                  <div className="border-b border-white/14 p-3 sm:border-b-0 sm:border-r">
                    <p className="font-black text-white">{formattedWhatsAppNumber}</p>
                    <p className="mt-1">WhatsApp orders</p>
                  </div>
                  <div className="border-b border-white/14 p-3 sm:border-b-0 sm:border-r">
                    <p className="font-black text-white">{company.address}</p>
                    <p className="mt-1">Visit us</p>
                  </div>
                  <div className="p-3">
                    <p className="font-black text-white">{featuredProducts.length} styles</p>
                    <p className="mt-1">Starter catalog</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="editorial-reveal grid min-h-[34rem] grid-cols-2 gap-2 sm:grid-cols-4" style={{ "--index": 1 } as CSSProperties}>
              {heroProducts.map((product, index) => (
                <Link
                  key={product.slug}
                  href={`/products/${product.slug}`}
                  className={`group relative overflow-hidden border border-white/12 bg-white/8 ${
                    index === 0 ? "col-span-2 row-span-2" : ""
                  } ${index === 5 ? "hidden sm:block" : ""}`}
                >
                  {product.coverImage ? (
                    <Image
                      src={product.coverImage}
                      alt={product.title}
                      fill
                      priority={index === 0}
                      className="object-cover transition duration-700 group-hover:scale-[1.04]"
                      sizes={index === 0 ? "(max-width: 768px) 100vw, 48vw" : "(max-width: 768px) 50vw, 18vw"}
                    />
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(18,17,15,0.9)] to-transparent p-3">
                    <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-white/64">Style {product.id}</p>
                    <p className="mt-1 text-sm font-black text-white sm:text-base">{product.title}</p>
                    {index === 0 ? <p className="mt-1 text-sm text-white/70">Start {product.startingPrice}</p> : null}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </CatalogShell>
      </section>

      <section id="new-arrivals" className="bg-[var(--panel)] py-10 md:py-16">
        <CatalogShell className="max-w-[1500px] px-3 sm:px-5 lg:px-7">
          <SectionTitle
            eyebrow="New wholesale styles"
            title="Fresh picks for shop buyers"
            body="Open a style to see photos, starting price, MOQ, fabric, size range, and colors when added."
            action={<RetailerOrderButton label="Start order" variant="dark" />}
          />
          <div className="mt-7">
            <ProductGrid
              products={homepageNewArrivals.length > 0 ? homepageNewArrivals.slice(0, 8) : featuredProducts.slice(0, 8)}
            />
          </div>
        </CatalogShell>
      </section>

      <section id="categories" className="py-10 md:py-16">
        <CatalogShell className="max-w-[1500px] px-3 sm:px-5 lg:px-7">
          <SectionTitle
            eyebrow="Available categories"
            title="Browse categories with styles"
            body="Only categories with products are shown. Open one, compare photos, and save the styles you like."
          />
          <div className={`mt-7 grid gap-3 sm:grid-cols-2 ${categoryCards.length <= 2 ? "lg:grid-cols-2" : "lg:grid-cols-4"}`}>
            {categoryCards.map((category, index) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className={`group relative min-h-72 overflow-hidden border border-[var(--line)] bg-[var(--hero)] ${
                  categoryCards.length > 2 && (index === 0 || index === 5) ? "lg:col-span-2" : ""
                }`}
              >
                {category.coverImage ? (
                  <Image
                    src={category.coverImage}
                    alt={`${category.name} cover style`}
                    fill
                    className="object-cover opacity-92 transition duration-700 group-hover:scale-[1.04]"
                    sizes={categoryCards.length <= 2 || index === 0 || index === 5 ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, 25vw"}
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(18,17,15,0.82)] via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-white/68">{category.count} styles</p>
                  <h3 className="catalog-heading mt-1 text-4xl font-black leading-[0.9]">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </CatalogShell>
      </section>

      <section className="bg-[var(--hero)] py-10 text-white md:py-16">
        <CatalogShell className="max-w-[1500px] px-3 sm:px-5 lg:px-7">
          <SectionTitle
            eyebrow="How retailer orders work"
            title="Browse. Save. WhatsApp."
            body="The website is made for repeat buyers who want to compare styles before messaging."
            action={<RetailerOrderButton label="Order on WhatsApp" variant="light" />}
            invert
          />
          <div className="mt-7 grid gap-px bg-white/12 md:grid-cols-4">
            {[
              ["01", "Browse styles", "Use categories or new arrivals to scan photos fast."],
              ["02", "Open product", "Check price, MOQ, fabric, size range, and colors."],
              ["03", "Save picks", "Keep styles in your shortlist before ordering."],
              ["04", "Send order", "Send your selected style codes together on WhatsApp."],
            ].map(([step, title, body]) => (
              <div key={step} className="bg-[var(--hero)] p-5">
                <p className="font-mono text-xs font-black text-white/42">{step}</p>
                <h3 className="mt-8 text-xl font-black uppercase italic tracking-[-0.03em] text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/62">{body}</p>
              </div>
            ))}
          </div>
        </CatalogShell>
      </section>

      {retailerDeals.length > 0 ? (
        <section id="retailer-deals" className="bg-[var(--panel)] py-10 md:py-16">
          <CatalogShell className="max-w-[1500px] px-3 sm:px-5 lg:px-7">
            <SectionTitle
              eyebrow="Retailer deals"
              title="Special wholesale lots for retailers"
              body="Selected styles have special wholesale terms. Open a style and ask on WhatsApp for the lot price and details."
              action={<RetailerOrderButton label="Ask for deal details" variant="dark" />}
            />
            <div className="mt-7">
              <ProductGrid products={retailerDeals.slice(0, 8)} />
            </div>
          </CatalogShell>
        </section>
      ) : null}

      <section id="visit-us" className="py-10 md:py-16">
        <CatalogShell className="max-w-[1500px] px-3 sm:px-5 lg:px-7">
          <div className="grid gap-px bg-[var(--line)] lg:grid-cols-[0.95fr_1.05fr]">
            <div className="bg-[var(--panel)] p-5 sm:p-7">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-[var(--text-soft)]">Visit or message</p>
              <h2 className="catalog-heading mt-4 max-w-3xl text-5xl font-black leading-[0.92] text-[var(--text-strong)] md:text-7xl">
                Built for ladies wear retailers.
              </h2>
            </div>
            <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2">
              <div className="bg-[var(--panel)] p-5">
                <p className="text-sm font-black text-[var(--text-strong)]">Why use the website</p>
                <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
                  Compare photos, prices, MOQ, and style codes before sending your WhatsApp order.
                </p>
              </div>
              <div className="bg-[var(--accent-soft)] p-5">
                <p className="text-sm font-black text-[var(--text-strong)]">{formattedWhatsAppNumber}</p>
                <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
                  Visit us at {company.address}, or start your order on WhatsApp.
                </p>
                <div className="mt-5">
                  <RetailerOrderButton label="Order now" />
                </div>
              </div>
            </div>
          </div>
        </CatalogShell>
      </section>

      <div className="fixed inset-x-3 bottom-3 z-40 border border-[var(--line)] bg-[rgba(255,253,247,0.94)] p-2 shadow-[0_18px_48px_rgba(18,17,15,0.2)] backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <RetailerOrderButton label="WhatsApp order" />
          <Link
            href="/shortlist"
            className="inline-flex min-h-11 items-center justify-center bg-[var(--text-strong)] px-4 text-[0.72rem] font-black uppercase tracking-[0.12em] text-white"
          >
            Shortlist
          </Link>
        </div>
      </div>
    </main>
  );
}
