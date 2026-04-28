import type { Metadata } from "next";
import Image from "next/image";
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
  const coverProduct = products[0];

  return (
    <main className="overflow-hidden pb-16 pt-28">
      <CatalogShell>
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm font-medium text-[var(--text-soft)]">
          <Link href="/" className="hover:text-[var(--text-strong)]">
            Home
          </Link>
          <span>/</span>
          <span className="text-[var(--text-strong)]">{category.name}</span>
        </div>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div className="space-y-6">
            <SectionTitle
              eyebrow="Category"
              title={category.name}
              body={category.intro}
              action={<RetailerOrderButton label="Retailer order" />}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.1rem] border border-[var(--line)] bg-[rgba(255,253,248,0.76)] p-4">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[var(--text-soft)]">Styles</p>
                <p className="mt-2 text-3xl font-bold tracking-normal text-[var(--text-strong)]">{products.length}</p>
              </div>
              <div className="rounded-[1.1rem] bg-[var(--sand)] p-4 sm:col-span-2">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[var(--text-soft)]">Order flow</p>
                <p className="mt-2 text-base font-bold text-[var(--text-strong)]">
                  Save style, log in with phone, then send WhatsApp order.
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] bg-[var(--hero)]">
            <div className="grid min-h-80 sm:grid-cols-[1fr_0.78fr]">
              <div className="relative min-h-80 bg-[var(--muted)]">
                {coverProduct?.coverImage ? (
                  <Image
                    src={coverProduct.coverImage}
                    alt={`${category.name} cover style`}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 45vw"
                  />
                ) : null}
              </div>
              <div className="flex flex-col justify-between gap-6 p-5 text-white">
                <div>
                  <p className="text-sm font-bold text-white">{formattedWhatsAppNumber}</p>
                  <p className="mt-2 text-sm leading-6 text-white/68">131 Keyzer Street, Colombo 11</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((item) => (
                    <Link
                      key={item.slug}
                      href={`/category/${item.slug}`}
                      className={`rounded-full border px-3 py-2 text-sm font-bold transition ${
                        item.slug === category.slug
                          ? "border-white bg-white text-[var(--text-strong)]"
                          : "border-white/12 bg-white/8 text-white hover:bg-white/14"
                      }`}
                    >
                      {item.shortName}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          {products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <div className="rounded-[1.3rem] border border-[var(--line)] bg-[var(--panel)] px-6 py-10 text-sm leading-6 text-[var(--text-soft)]">
              No products are mapped to this category yet. Browse new arrivals or add this category in product data and run the importer again.
              <div className="mt-5">
                <Link
                  href="/#new-arrivals"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--sand)] px-6 text-sm font-bold text-[var(--text-strong)]"
                >
                  Browse new arrivals
                </Link>
              </div>
            </div>
          )}
        </section>
      </CatalogShell>
    </main>
  );
}
