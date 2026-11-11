import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { CategoryTabs } from "@/components/category-tabs";
import { ProductBrowser } from "@/components/product-browser";
import { ProductGrid } from "@/components/product-grid";
import { ProductTile } from "@/components/product-tile";
import { SectionTitle } from "@/components/section-title";
import { allProducts, buildWhatsAppLink, featuredProducts, newArrivals, retailerDeals } from "@/lib/catalog";
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

const homepageNewArrivalSlugs = [
  "style-4118-short-top-china",
  "style-4110-printed-button-frock",
];

const orderingSteps = [
  "Tap + on a style. It adds 6 pieces in a mix of sizes.",
  "Change sizes or pieces in your order if you want.",
  "Send your name and WhatsApp number. Our staff call to confirm.",
];

export default function Home() {
  const homepageNewArrivals = [
    ...homepageNewArrivalSlugs
      .map((slug) => newArrivals.find((product) => product.slug === slug))
      .filter((product): product is (typeof newArrivals)[number] => Boolean(product)),
    ...newArrivals.filter((product) => !homepageNewArrivalSlugs.includes(product.slug)),
  ];
  const arrivals = (homepageNewArrivals.length > 0 ? homepageNewArrivals : featuredProducts).slice(0, 8);
  const heroImages = [arrivals[0]?.coverImage ?? featuredProducts[0]?.coverImage].filter(
    (src): src is string => Boolean(src),
  );

  return (
    <main className="pb-16">
      <section className="relative lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-stretch">
        <div className="relative aspect-[4/5] bg-[var(--fill)] lg:order-2 lg:aspect-auto lg:min-h-[min(82vh,860px)]">
          {heroImages.map((src, index) => (
            <Image
              key={src}
              src={src}
              alt="New City Fashion styles"
              fill
              preload={index === 0}
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover object-top"
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0 lg:hidden" />
        </div>
        <div className="absolute inset-x-0 bottom-0 px-4 pb-8 text-white sm:px-6 lg:static lg:flex lg:flex-col lg:justify-end lg:px-10 lg:pb-14 lg:text-[var(--ink)]">
          <p className="label text-white/80 lg:text-[var(--text-soft)]">Wholesale ladies wear · Colombo</p>
          <h1 className="mt-3 max-w-md text-[2.5rem] font-semibold leading-[1.02] tracking-[-0.02em] sm:text-5xl lg:text-6xl">
            Fresh styles for your shop
          </h1>
          <Link
            href="#new-arrivals"
            className="mt-6 inline-flex min-h-12 items-center justify-center bg-white px-6 text-sm font-semibold text-[var(--ink)] lg:self-start lg:bg-[var(--ink)] lg:text-white"
          >
            Shop new styles
          </Link>
        </div>
      </section>

      <CategoryTabs className="mt-6" />

      <section id="new-arrivals" aria-labelledby="new-arrivals-title" className="mt-10 scroll-mt-16">
        <SectionTitle id="new-arrivals-title" title="New arrivals" seeAllHref="#all-styles" />
        <ProductGrid
          products={arrivals}
          className="mt-4 [&>*:nth-child(n+5)]:hidden lg:[&>*:nth-child(n+5)]:block"
        />
      </section>

      {retailerDeals.length > 0 ? (
        <section
          id="retailer-deals"
          aria-labelledby="retailer-deals-title"
          className="mt-14 scroll-mt-16 bg-[var(--ink)] py-8 text-white"
        >
          <SectionTitle
            id="retailer-deals-title"
            title="Deals for shops"
            body="Special wholesale prices on these styles."
            invert
            action={
              <a
                href={buildWhatsAppLink()}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-xs underline underline-offset-4"
              >
                Ask on WhatsApp
              </a>
            }
          />
          <ul className="no-scrollbar mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:px-6 lg:px-10">
            {retailerDeals.map((product) => (
              <li key={product.slug} className="w-[46vw] shrink-0 snap-start sm:w-[30vw] lg:w-[22vw]">
                <ProductTile product={product} invert imageSizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 22vw" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section id="all-styles" aria-labelledby="all-styles-title" className="mt-14 scroll-mt-16">
        <SectionTitle id="all-styles-title" title="All styles" />
        <div className="mt-4">
          <ProductBrowser products={allProducts} />
        </div>
      </section>

      <section aria-labelledby="how-ordering-works" className="mt-16 border-y border-[var(--line)] py-8">
        <div className="px-4 sm:px-6 lg:px-10">
          <h2 id="how-ordering-works" className="label">
            How ordering works
          </h2>
          <ol className="mt-4 grid gap-4 text-sm leading-6 sm:grid-cols-3">
            {orderingSteps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="label text-[var(--text-soft)]">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="visit-us" aria-labelledby="visit-us-title" className="px-4 py-10 sm:px-6 lg:px-10">
        <h2 id="visit-us-title" className="label">
          Visit or message us
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">{company.address}</p>
        <a
          href={buildWhatsAppLink()}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex min-h-12 items-center justify-center bg-[var(--whatsapp)] px-6 text-sm font-semibold text-white"
        >
          WhatsApp {formattedWhatsAppNumber}
        </a>
      </section>
    </main>
  );
}
