import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CategoryTabs } from "@/components/category-tabs";
import { ProductBrowser } from "@/components/product-browser";
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

  const description = `${category.intro} Browse ${category.name.toLowerCase()} and build your wholesale order online.`;

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
    <main className="pb-16">
      <nav aria-label="Breadcrumb" className="px-4 pt-4 text-xs text-[var(--text-soft)] sm:px-6 lg:px-10">
        <Link href="/" className="hover:text-[var(--ink)]">
          Home
        </Link>
        <span aria-hidden> / </span>
        <span className="text-[var(--ink)]">{category.name}</span>
      </nav>

      <header className="px-4 pt-4 sm:px-6 lg:px-10">
        <h1 className="text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">{category.name}</h1>
        <p className="mt-1 text-sm text-[var(--text-soft)]">
          {products.length} {products.length === 1 ? "style" : "styles"}
        </p>
      </header>

      <CategoryTabs activeSlug={category.slug} className="mt-5" />

      <div className="mt-6">
        <ProductBrowser products={products} />
      </div>

      <p className="mt-10 border-t border-[var(--line)] px-4 pt-5 text-sm leading-6 text-[var(--text-soft)] sm:px-6 lg:px-10">
        Need help with sizes? Message {formattedWhatsAppNumber} with the style codes you like.
      </p>
    </main>
  );
}
