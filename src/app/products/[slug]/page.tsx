import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CatalogShell } from "@/components/catalog-shell";
import { ProductBadges } from "@/components/product-badges";
import { ProductGrid } from "@/components/product-grid";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { buildWhatsAppLink, getProduct, getRelatedProducts } from "@/lib/catalog";
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

  const description = `${product.description} Starting price ${product.startingPrice}. MOQ ${product.moq}.`;

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
    <main className="pb-16 pt-24">
      <CatalogShell>
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[var(--text-soft)]">
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
          <section className="rounded-[2.4rem] border border-[var(--line)] bg-[rgba(255,249,242,0.9)] p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {product.images.map((image, index) => (
                <div
                  key={image}
                  className={`overflow-hidden rounded-[1.7rem] bg-[var(--muted)] ${index === 0 ? "sm:col-span-2" : ""}`}
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
            <div className="rounded-[2.4rem] bg-[var(--hero)] p-6 text-white shadow-[0_24px_60px_rgba(32,19,13,0.2)]">
              <p className="text-[0.72rem] uppercase tracking-[0.28em] text-white/46">{product.id}</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-white">{product.title}</h1>
              <p className="mt-4 text-sm leading-6 text-white/72">{product.description}</p>
              <div className="mt-5">
                <ProductBadges badges={product.badges} categoryLabel={product.categoryMeta.name} invert />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-[1.5rem] border border-white/12 bg-white/8 p-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-white/46">Starting price</p>
                  <p className="mt-2 text-xl font-semibold text-white">{product.startingPrice}</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/12 bg-white/8 p-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-white/46">MOQ</p>
                  <p className="mt-2 text-xl font-semibold text-white">{product.moq}</p>
                </div>
              </div>

              <div className="mt-6 rounded-[1.7rem] border border-white/12 bg-white/8 p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.24em] text-white/46">Available colors</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.colors.length > 0 ? (
                    product.colors.map((color) => (
                      <span
                        key={color}
                        className="rounded-full border border-white/12 bg-white/10 px-4 py-2 text-sm text-white"
                      >
                        {color}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-white/72">Color names can be added in the product data.</span>
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <WhatsAppButton href={buildWhatsAppLink(product)} label="Order on WhatsApp" />
                <p className="text-sm text-white/68">
                  Send style code <span className="font-semibold text-white">{product.id}</span> for faster help.
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-[var(--line)] bg-[var(--panel)] p-5">
              <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[var(--text-soft)]">Order help</p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-soft)]">
                <p>1. Check all product images.</p>
                <p>2. Pick color names you need.</p>
                <p>3. Send style code on WhatsApp.</p>
                <p className="pt-2 font-semibold text-[var(--text-strong)]">{formattedWhatsAppNumber}</p>
                <p>131 Keyzer Street, Colombo 11</p>
              </div>
            </div>
          </aside>
        </div>

        {relatedProducts.length > 0 ? (
          <section className="mt-8 rounded-[2.4rem] border border-[var(--line)] bg-[rgba(255,249,242,0.88)] p-5 sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[var(--text-soft)]">More styles</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
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
