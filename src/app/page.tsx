import Link from "next/link";
import type { Metadata } from "next";

import { CategoryTabs } from "@/components/category-tabs";
import { HeroCarousel, type HeroSlide } from "@/components/hero-carousel";
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
  { title: "Pick your styles", body: "Tap + on a style. It adds 6 pieces in a mix of sizes." },
  { title: "Check your order", body: "Change sizes or pieces if you want. 6 pieces or more a style." },
  { title: "Send your details", body: "Just your name and WhatsApp number. Our staff call to confirm." },
];

export default function Home() {
  const homepageNewArrivals = [
    ...homepageNewArrivalSlugs
      .map((slug) => newArrivals.find((product) => product.slug === slug))
      .filter((product): product is (typeof newArrivals)[number] => Boolean(product)),
    ...newArrivals.filter((product) => !homepageNewArrivalSlugs.includes(product.slug)),
  ];
  const arrivals = (homepageNewArrivals.length > 0 ? homepageNewArrivals : featuredProducts).slice(0, 8);
  // The newest styles with a photo take turns in the hero.
  const heroSlides: HeroSlide[] = [...arrivals, ...featuredProducts]
    .filter((product, index, list) => product.coverImage && list.findIndex((p) => p.slug === product.slug) === index)
    .slice(0, 5)
    .map((product) => ({
      slug: product.slug,
      title: product.title,
      image: product.coverImage as string,
      price: product.startingPrice,
    }));

  return (
    <main>
      <HeroCarousel slides={heroSlides} />

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

      <section aria-labelledby="how-ordering-works" className="mt-20 bg-[var(--fill)] py-14 sm:py-16">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <h2 id="how-ordering-works" className="label">
            How ordering works
          </h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-10">
            {orderingSteps.map((step, index) => (
              <li key={step.title} className="border-t border-[var(--ink)] pt-5">
                <p className="text-sm text-[var(--text-soft)]">0{index + 1}</p>
                <p className="mt-3 text-xl font-semibold tracking-[-0.01em]">{step.title}</p>
                <p className="mt-2 max-w-xs text-sm leading-6 text-[var(--text-soft)]">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="visit-us" aria-labelledby="visit-us-title" className="bg-[var(--ink)] py-14 text-white sm:py-16">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-4 sm:px-6 md:grid-cols-[1.3fr_1fr] md:items-end lg:px-10">
          <div>
            <p className="label text-white/60">Visit or message us</p>
            <h2 id="visit-us-title" className="mt-3 max-w-lg text-3xl font-semibold leading-tight tracking-[-0.02em] sm:text-4xl">
              Come to our shop, or send us a message any time.
            </h2>
            <p className="mt-4 text-sm text-white/70">{company.address}</p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <a
              href={buildWhatsAppLink()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 bg-[var(--whatsapp)] px-6 text-sm font-semibold text-white md:min-w-72"
            >
              WhatsApp {formattedWhatsAppNumber}
            </a>
            <Link
              href="/order"
              className="inline-flex min-h-12 items-center justify-center border border-white/40 px-6 text-sm font-semibold text-white hover:bg-white/10 md:min-w-72"
            >
              View your order
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
