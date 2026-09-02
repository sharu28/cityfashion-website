import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CatalogShell } from "@/components/catalog-shell";
import { ProductBrowser } from "@/components/product-browser";
import { RetailerOrderButton } from "@/components/retailer-order-button";
import { SectionTitle } from "@/components/section-title";
import { getCategory, populatedCategories, productsByCategory } from "@/lib/catalog";
import { formattedWhatsAppNumber, getAbsoluteUrl, siteName } from "@/lib/site";

type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return populatedCategories.map((category) => ({
    slug: category.slug,
  }));
}

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
  const secondaryProducts = products.slice(1, 4);

  return (
    <main className="overflow-hidden pb-16 pt-20">
      <section className="bg-[var(--hero)] py-5 text-white">
        <CatalogShell className="max-w-[1500px] px-3 sm:px-5 lg:px-7">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-sm font-bold text-white/58">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span>/</span>
            <span className="text-white">{category.name}</span>
          </div>

          <div className="grid gap-3 lg:grid-cols-[0.82fr_1.18fr] lg:items-stretch">
            <div className="flex min-h-96 flex-col justify-between border border-white/14 p-5 sm:p-7">
              <SectionTitle
                eyebrow="Category"
                title={category.name}
                body={category.intro}
                action={<RetailerOrderButton label="Retailer order" variant="light" />}
                invert
              />
              <div className="mt-8 grid gap-px bg-white/14 sm:grid-cols-3">
                <div className="bg-[var(--hero)] p-4">
                  <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-white/44">Styles</p>
                  <p className="mt-2 text-4xl font-black text-white">{products.length}</p>
                </div>
                <div className="bg-[var(--hero)] p-4 sm:col-span-2">
                  <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-white/44">Order flow</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-white/72">
                    Save styles, log in with phone, then send one WhatsApp order.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid min-h-96 grid-cols-2 gap-2 sm:grid-cols-4">
              {[coverProduct, ...secondaryProducts].filter(Boolean).map((product, index) => (
                <Link
                  key={product.slug}
                  href={`/products/${product.slug}`}
                  className={`group relative overflow-hidden border border-white/12 bg-white/8 ${
                    index === 0 ? "col-span-2 row-span-2" : ""
                  }`}
                >
                  {product.coverImage ? (
                    <Image
                      src={product.coverImage}
                      alt={`${product.title} cover style`}
                      fill
                      preload={index === 0}
                      className="object-cover transition duration-700 group-hover:scale-[1.04]"
                      sizes={index === 0 ? "(max-width: 768px) 100vw, 48vw" : "(max-width: 768px) 50vw, 18vw"}
                    />
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(18,17,15,0.88)] to-transparent p-3">
                    <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-white/64">Style {product.id}</p>
                    <p className="mt-1 text-sm font-black text-white">{product.startingPrice}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </CatalogShell>
      </section>

      <section className="py-8 md:py-12">
        <CatalogShell className="max-w-[1500px] px-3 sm:px-5 lg:px-7">
          <div className="mb-7 flex gap-2 overflow-x-auto pb-2">
            {populatedCategories.map((item) => (
              <Link
                key={item.slug}
                href={`/category/${item.slug}`}
                className={`shrink-0 border px-4 py-3 text-[0.7rem] font-black uppercase tracking-[0.14em] transition ${
                  item.slug === category.slug
                    ? "border-[var(--text-strong)] bg-[var(--text-strong)] !text-white"
                    : "border-[var(--line)] bg-[var(--panel)] text-[var(--text-strong)] hover:bg-[var(--sand)]"
                }`}
              >
                {item.shortName}
              </Link>
            ))}
          </div>

          <ProductBrowser products={products} />

          <div className="mt-10 border-t border-[var(--line)] pt-5 text-sm leading-6 text-[var(--text-soft)]">
            Need help choosing colors or sizes? Message {formattedWhatsAppNumber} with the style codes you like.
          </div>
        </CatalogShell>
      </section>
    </main>
  );
}
