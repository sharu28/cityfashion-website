import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CatalogShell } from "@/components/catalog-shell";
import { ProductBadges } from "@/components/product-badges";
import { ProductGrid } from "@/components/product-grid";
import { RetailerOrderButton } from "@/components/retailer-order-button";
import { SaveProductButton } from "@/components/save-product-button";
import { getProduct, getRelatedProducts } from "@/lib/catalog";
import { formattedWhatsAppNumber, getAbsoluteUrl, siteName } from "@/lib/site";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);

  if (!product) {
    return {};
  }

  const detailLine = [product.fabric, product.sizeRange].filter(Boolean).join(". ");
  const description = `${product.description} Starting price ${product.startingPrice}. MOQ ${product.moq}.${detailLine ? ` ${detailLine}.` : ""}`;

  return {
    title: `${product.title}`,
    description,
    alternates: {
      canonical: `/products/${product.slug}`,
    },
    openGraph: {
      title: `${product.title} | ${siteName}`,
      description,
      url: getAbsoluteUrl(`/products/${product.slug}`),
      images: product.coverImage
        ? [
            {
              url: getAbsoluteUrl(product.coverImage),
              width: 1200,
              height: 1500,
              alt: product.title,
            },
          ]
        : undefined,
    },
    twitter: {
      images: [product.coverImage ? getAbsoluteUrl(product.coverImage) : getAbsoluteUrl("/twitter-image")],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProduct(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = getRelatedProducts(product);

  return (
    <main className="overflow-hidden pb-16 pt-28">
      <CatalogShell>
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm font-medium text-[var(--text-soft)]">
          <Link href="/" className="hover:text-[var(--text-strong)]">
            Home
          </Link>
          <span>/</span>
          <Link href={`/category/${product.categoryMeta.slug}`} className="hover:text-[var(--text-strong)]">
            {product.categoryMeta.name}
          </Link>
          <span>/</span>
          <span className="text-[var(--text-strong)]">{product.title}</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <section>
            <div className="grid gap-4 sm:grid-cols-2">
              {product.images.map((image, index) => (
                <div
                  key={image}
                  className={`overflow-hidden rounded-[1.25rem] bg-[var(--muted)] shadow-[0_18px_48px_rgba(33,31,27,0.07)] ${
                    index === 0 ? "sm:col-span-2" : ""
                  }`}
                >
                  <div className="relative aspect-[4/5]">
                    <Image
                      src={image}
                      alt={`${product.title} image ${index + 1}`}
                      fill
                      className="object-cover"
                      priority={index === 0}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-[1.5rem] border border-[var(--line)] bg-[rgba(255,253,248,0.9)] p-5 shadow-[0_24px_70px_rgba(33,31,27,0.1)] sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[var(--text-soft)]">{product.id}</p>
                </div>
                <SaveProductButton productSlug={product.slug} />
              </div>
              <h1 className="mt-4 text-balance text-5xl font-bold leading-[1.03] tracking-[-0.01em] text-[var(--text-strong)]">
                {product.title}
              </h1>
              <p className="mt-4 text-pretty text-sm leading-6 text-[var(--text-soft)]">{product.description}</p>
              <div className="mt-5">
                <ProductBadges badges={product.badges} categoryLabel={product.categoryMeta.name} />
              </div>

              <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-[1.2rem] border border-[var(--line)] bg-[rgba(235,229,217,0.48)]">
                <div className="border-r border-b border-[var(--line)] p-4">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--text-soft)]">Starting price</p>
                  <p className="mt-2 text-xl font-bold text-[var(--text-strong)]">{product.startingPrice}</p>
                </div>
                <div className="border-b border-[var(--line)] p-4">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--text-soft)]">MOQ</p>
                  <p className="mt-2 text-xl font-bold text-[var(--text-strong)]">{product.moq}</p>
                </div>
                <div className="border-r border-[var(--line)] p-4">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--text-soft)]">Fabric</p>
                  <p className="mt-2 text-base font-bold text-[var(--text-strong)]">{product.fabric || "Ask on WhatsApp"}</p>
                </div>
                <div className="p-4">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--text-soft)]">Size range</p>
                  <p className="mt-2 text-base font-bold text-[var(--text-strong)]">{product.sizeRange || "Ask on WhatsApp"}</p>
                </div>
              </div>

              <div className="mt-6 rounded-[1.2rem] border border-[var(--line)] bg-[rgba(255,253,248,0.78)] p-4">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--text-soft)]">Available colors</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.colors.length > 0 ? (
                    product.colors.map((color) => (
                      <span
                        key={color}
                        className="rounded-full border border-[var(--line)] bg-[var(--sand)] px-4 py-2 text-sm font-bold text-[var(--text-strong)]"
                      >
                        {color}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm leading-6 text-[var(--text-soft)]">Color names can be added in the product data.</span>
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <RetailerOrderButton productSlug={product.slug} label="Order on WhatsApp" />
                <p className="text-sm leading-6 text-[var(--text-soft)]">
                  Save this style first if you want it kept in your shortlist. Send style code{" "}
                  <span className="font-bold text-[var(--text-strong)]">{product.id}</span> for faster help.
                </p>
              </div>
            </div>

            <div className="rounded-[1.3rem] border border-[var(--line)] bg-[var(--panel)] p-5">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[var(--text-soft)]">Order help</p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-soft)]">
                <p>1. Check all product images.</p>
                <p>2. Save the style or pick color names you need.</p>
                <p>3. Start WhatsApp order after retailer login.</p>
                <p className="pt-2 font-semibold text-[var(--text-strong)]">{formattedWhatsAppNumber}</p>
                <p>131 Keyzer Street, Colombo 11</p>
              </div>
            </div>
          </aside>
        </div>

        {relatedProducts.length > 0 ? (
          <section className="mt-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[var(--text-soft)]">More styles</p>
                <h2 className="mt-2 text-4xl font-bold leading-[1.06] tracking-[-0.01em] text-[var(--text-strong)]">
                  More from {product.categoryMeta.name}
                </h2>
              </div>
              <Link
                href={`/category/${product.categoryMeta.slug}`}
                className="text-sm font-semibold text-[var(--text-strong)] underline decoration-[var(--accent)] underline-offset-4"
              >
                View category
              </Link>
            </div>
            <div className="mt-8">
              <ProductGrid products={relatedProducts} />
            </div>
          </section>
        ) : null}
      </CatalogShell>
    </main>
  );
}
