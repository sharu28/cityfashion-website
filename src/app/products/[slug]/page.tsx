import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductGrid } from "@/components/product-grid";
import { ProductOrderPanel } from "@/components/product-order-panel";
import { ProductPhotoStrip } from "@/components/product-photo-strip";
import { ProductViewTracker } from "@/components/product-view-tracker";
import { SectionTitle } from "@/components/section-title";
import { allProducts, buildWhatsAppLink, getProduct, getRelatedProducts } from "@/lib/catalog";
import { getAbsoluteUrl, siteName } from "@/lib/site";

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
  const description = `${product.description} Starting price ${product.startingPrice}. MOQ ${product.moq}.${detailLine ? ` ${detailLine}.` : ""} Add it to your wholesale order online.`;

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
  const isDeal = ["deal", "new-and-deal"].includes(product.merchandisingLane);
  const facts = [
    { label: "Minimum order", value: `${product.moq || "6 pcs"} (any sizes)` },
    { label: "Fabric", value: product.fabric || "Ask us" },
    { label: "Sizes", value: product.sizeRange || "Ask us" },
  ];

  return (
    <main className="pb-10">
      <ProductViewTracker
        category={product.categoryMeta.name}
        merchandisingLane={product.merchandisingLane}
        productId={product.id}
        productName={product.title}
      />

      <nav aria-label="Breadcrumb" className="mx-auto max-w-[1440px] px-4 py-3 text-xs text-[var(--text-soft)] sm:px-6 lg:px-10">
        <Link href="/" className="hover:text-[var(--ink)]">
          Home
        </Link>
        <span className="mx-1.5">/</span>
        <Link href={`/category/${product.categoryMeta.slug}`} className="hover:text-[var(--ink)]">
          {product.categoryMeta.name}
        </Link>
      </nav>

      <div className="mx-auto max-w-[1440px] lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-12 lg:px-10">
        <section aria-label="Photos" className="min-w-0">
          <div className="mx-auto w-full lg:max-w-[calc((100dvh-7rem)*0.75)]">
            <ProductPhotoStrip
              images={product.images}
              title={product.title}
              imageSizes="(max-width: 1024px) 100vw, 50vw"
              eagerFirst
            />
          </div>
        </section>

        <aside className="min-w-0 px-4 pt-5 sm:px-6 lg:sticky lg:top-20 lg:self-start lg:px-0 lg:pt-0">
          <p className="label text-[var(--text-soft)]">
            Style {product.id}
            {isDeal ? <span className="ml-2 bg-[var(--ink)] px-1.5 py-0.5 text-white">Deal</span> : null}
          </p>
          <h1 className="mt-2 text-balance text-2xl font-semibold leading-tight tracking-[-0.01em] sm:text-3xl">{product.title}</h1>
          <p className="mt-2 text-lg font-semibold">
            {product.startingPrice} <span className="text-sm font-normal text-[var(--text-soft)]">/ piece</span>
          </p>

          <dl className="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)] text-sm">
            {facts.map((fact) => (
              <div key={fact.label} className="flex justify-between gap-4 py-2.5">
                <dt className="text-[var(--text-soft)]">{fact.label}</dt>
                <dd className="text-right font-medium">{fact.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-5">
            <p className="label text-[var(--text-soft)]">
              {product.colors.length > 0 ? `${product.colors.length} colours` : "Colours"}
            </p>
            {product.colors.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {product.colors.map((color) => (
                  <li key={color} className="border border-[var(--line)] px-2.5 py-1 text-xs">
                    {color}
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="mt-2 text-xs text-[var(--text-soft)]">Our staff confirm colours with you on WhatsApp.</p>
          </div>

          <div className="mt-6">
            <ProductOrderPanel product={product} />
          </div>

          {isDeal ? (
            <p className="mt-4 border border-[var(--ink)] p-3 text-sm leading-6">
              This style has special retailer terms. Ask on WhatsApp for the lot price, colors, and order details.
            </p>
          ) : null}

          <a
            href={buildWhatsAppLink(product)}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--whatsapp)] underline underline-offset-4"
          >
            Ask on WhatsApp
          </a>

          {product.description ? (
            <p className="mt-4 text-pretty text-sm leading-6 text-[var(--text-soft)]">{product.description}</p>
          ) : null}
        </aside>
      </div>

      {relatedProducts.length > 0 ? (
        <section className="mx-auto mt-16 max-w-[1440px] space-y-4">
          <SectionTitle title={`More from ${product.categoryMeta.name}`} seeAllHref={`/category/${product.categoryMeta.slug}`} />
          <ProductGrid products={relatedProducts} />
        </section>
      ) : null}
    </main>
  );
}
