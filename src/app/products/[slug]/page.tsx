import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CatalogShell } from "@/components/catalog-shell";
import { ProductBadges } from "@/components/product-badges";
import { ProductGrid } from "@/components/product-grid";
import { ProductViewTracker } from "@/components/product-view-tracker";
import { RetailerOrderButton } from "@/components/retailer-order-button";
import { SaveProductButton } from "@/components/save-product-button";
import { allProducts, getProduct, getRelatedProducts } from "@/lib/catalog";
import { formattedWhatsAppNumber, getAbsoluteUrl, siteName } from "@/lib/site";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return allProducts.map((product) => ({
    slug: product.slug,
  }));
}

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
    <main className="overflow-hidden pb-28 pt-20 md:pb-16">
      <ProductViewTracker
        category={product.categoryMeta.name}
        productId={product.id}
        productName={product.title}
      />
      <CatalogShell className="max-w-[1500px] px-3 sm:px-5 lg:px-7">
        <div className="mb-5 flex flex-wrap items-center gap-2 pt-5 text-sm font-bold text-[var(--text-soft)]">
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

        <div className="grid min-w-0 gap-4 lg:grid-cols-[1.08fr_0.92fr]">
          <section className="min-w-0">
            <div className="mb-3 flex items-end justify-between gap-4 sm:hidden">
              <div>
                <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-[var(--text-soft)]">Product photos</p>
                <p className="mt-1 text-sm font-black text-[var(--text-strong)]">Swipe to view all colors</p>
              </div>
              <p className="font-mono text-xs font-black text-[var(--text-soft)]">{product.images.length} photos</p>
            </div>
            <div className="flex w-full max-w-full snap-x snap-mandatory gap-3 overflow-x-auto pb-3 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0">
              {product.images.map((image, index) => (
                <div
                  key={image}
                  className={`w-[84vw] max-w-[32rem] shrink-0 snap-center overflow-hidden border border-[var(--line)] bg-white sm:w-auto sm:max-w-none ${
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

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="border border-[var(--line)] bg-[var(--panel)]">
              <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] p-5">
                <div>
                  <p className="font-mono text-[0.72rem] font-black uppercase tracking-[0.16em] text-[var(--text-soft)]">Style {product.id}</p>
                  <ProductBadges badges={product.badges} categoryLabel={product.categoryMeta.name} />
                </div>
                <SaveProductButton productSlug={product.slug} />
              </div>

              <div className="p-5 sm:p-6">
                <h1 className="catalog-heading text-balance text-5xl font-black leading-[0.92] text-[var(--text-strong)] md:text-7xl">
                  {product.title}
                </h1>
                <p className="mt-4 text-pretty text-sm leading-6 text-[var(--text-soft)]">{product.description}</p>
              </div>

              <div className="grid grid-cols-2 border-y border-[var(--line)] text-sm">
                <div className="border-r border-b border-[var(--line)] p-4">
                  <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-[var(--text-soft)]">Starting price</p>
                  <p className="mt-2 text-xl font-black text-[var(--text-strong)]">{product.startingPrice}</p>
                </div>
                <div className="border-b border-[var(--line)] p-4">
                  <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-[var(--text-soft)]">MOQ</p>
                  <p className="mt-2 text-xl font-black text-[var(--text-strong)]">{product.moq}</p>
                </div>
                <div className="border-r border-[var(--line)] p-4">
                  <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-[var(--text-soft)]">Fabric</p>
                  <p className="mt-2 text-base font-black text-[var(--text-strong)]">{product.fabric || "Ask on WhatsApp"}</p>
                </div>
                <div className="p-4">
                  <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-[var(--text-soft)]">Size range</p>
                  <p className="mt-2 text-base font-black text-[var(--text-strong)]">{product.sizeRange || "Ask on WhatsApp"}</p>
                </div>
              </div>

              <div className="p-5">
                <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-[var(--text-soft)]">Available colors</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.colors.length > 0 ? (
                    product.colors.map((color) => (
                      <span
                        key={color}
                        className="border border-[var(--line)] bg-[var(--sand)] px-3 py-2 text-sm font-black text-[var(--text-strong)]"
                      >
                        {color}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm leading-6 text-[var(--text-soft)]">Ask on WhatsApp for available colors.</span>
                  )}
                </div>
              </div>

              <div className="border-t border-[var(--line)] p-5">
                {["deal", "new-and-deal"].includes(product.merchandisingLane) ? (
                  <p className="mb-4 border border-[var(--accent)] bg-[var(--accent-soft)] p-3 text-sm font-bold leading-6 text-[var(--text-strong)]">
                    This style has special retailer terms. Ask on WhatsApp for the lot price, colors, and order details.
                  </p>
                ) : null}
                <RetailerOrderButton productSlug={product.slug} label="Ask on WhatsApp" />
                <p className="mt-4 text-sm leading-6 text-[var(--text-soft)]">
                  Save this style first if you want it kept in your shortlist. Send style code{" "}
                  <span className="font-black text-[var(--text-strong)]">{product.id}</span> for faster help.
                </p>
              </div>
            </div>

            <div className="bg-[var(--hero)] p-5 text-white">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-white/46">Order help</p>
              <div className="mt-4 grid gap-px bg-white/12 text-sm leading-6 text-white/68">
                {["Check all product images.", "Save the style or note the colors you need.", "Send this style code on WhatsApp."].map((item, index) => (
                  <p key={item} className="bg-[var(--hero)] py-2">
                    <span className="font-mono text-white/38">0{index + 1}</span> {item}
                  </p>
                ))}
              </div>
              <p className="mt-4 font-black text-white">{formattedWhatsAppNumber}</p>
              <p className="mt-1 text-sm text-white/62">131 Keyzer Street, Colombo 11</p>
            </div>
          </aside>
        </div>

        {relatedProducts.length > 0 ? (
          <section className="mt-12">
            <div className="flex flex-col gap-3 border-t border-[var(--line)] pt-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-[var(--text-soft)]">More styles</p>
                <h2 className="catalog-heading mt-2 text-4xl font-black leading-[0.95] text-[var(--text-strong)] md:text-6xl">
                  More from {product.categoryMeta.name}
                </h2>
              </div>
              <Link
                href={`/category/${product.categoryMeta.slug}`}
                className="text-sm font-black uppercase tracking-[0.12em] text-[var(--text-strong)] underline decoration-[var(--accent)] underline-offset-4"
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

      <div className="fixed inset-x-3 bottom-3 z-40 border border-[var(--line)] bg-[rgba(255,253,247,0.96)] p-2 shadow-[0_18px_48px_rgba(18,17,15,0.2)] backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <SaveProductButton productSlug={product.slug} />
          <RetailerOrderButton productSlug={product.slug} label={`WhatsApp style ${product.id}`} />
        </div>
      </div>
    </main>
  );
}
