import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CatalogShell } from "@/components/catalog-shell";
import { ProductGrid } from "@/components/product-grid";
import { RetailerOrderButton } from "@/components/retailer-order-button";
import { SectionTitle } from "@/components/section-title";
import { categories, getCategory, productsByCategory } from "@/lib/catalog";
import { formattedWhatsAppNumber, getAbsoluteUrl, siteName } from "@/lib/site";

type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);

  if (!category) {
    return {};
  }

  const description = `${category.intro} Browse ${category.name.toLowerCase()} and order on WhatsApp.`;

  return {
    title: `${category.name}`,
    description,
    alternates: {
      canonical: `/category/${category.slug}`,
    },
    openGraph: {
      title: `${category.name} | ${siteName}`,
      description,
      url: getAbsoluteUrl(`/category/${category.slug}`),
    },
    twitter: {
      images: [getAbsoluteUrl("/twitter-image")],
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getCategory(slug);

  if (!category) {
    notFound();
  }

  const products = productsByCategory(slug);

  return (
    <main className="pb-16 pt-24">
      <CatalogShell>
        <section className="rounded-[2.4rem] border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[0_18px_45px_rgba(63,40,19,0.06)] sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-5">
              <SectionTitle
                eyebrow="Category"
                title={category.name}
                body={category.intro}
                action={<RetailerOrderButton label="Retailer order" />}
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.5rem] bg-[var(--sand)] p-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[var(--text-soft)]">Styles</p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--text-strong)]">{products.length}</p>
                </div>
                <div className="rounded-[1.5rem] bg-[var(--sand)] p-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[var(--text-soft)]">Best flow</p>
                  <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">Save style and start order</p>
                </div>
                <div className="rounded-[1.5rem] bg-[var(--sand)] p-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[var(--text-soft)]">Details shown</p>
                  <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">Price, MOQ, colors, sizes</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-[var(--hero)] p-5 text-white">
              <p className="text-[0.72rem] uppercase tracking-[0.28em] text-white/48">Contact and browse</p>
              <div className="mt-4 space-y-1 text-sm text-white/74">
                <p>{formattedWhatsAppNumber}</p>
                <p>131 Keyzer Street, Colombo 11</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                {categories.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/category/${item.slug}`}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                      item.slug === category.slug
                        ? "border-white bg-white text-[var(--text-strong)]"
                        : "border-white/12 bg-white/8 text-white"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <p className="mt-6 text-sm leading-6 text-white/68">
                Need fast help? Save the style first, then start retailer order on WhatsApp.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2.4rem] border border-[var(--line)] bg-[rgba(255,249,242,0.88)] p-5 sm:p-7">
          {products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <div className="rounded-[1.8rem] border border-[var(--line)] bg-[var(--panel)] px-6 py-10 text-sm text-[var(--text-soft)]">
              No products are mapped to this category yet. Add the category in `data/product-overrides.json` and run the importer again.
            </div>
          )}
        </section>
      </CatalogShell>
    </main>
  );
}
