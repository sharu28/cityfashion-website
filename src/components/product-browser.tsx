"use client";

import { useDeferredValue, useMemo, useState } from "react";

import { ProductGrid } from "@/components/product-grid";
import type { CatalogProductView } from "@/lib/catalog";

type ProductBrowserProps = {
  products: CatalogProductView[];
};

// Render a page of tiles at a time. Each tile carries several photos, so painting the whole
// catalogue up front made the homepage ~740 KB of HTML and ~290 image tags.
const PAGE_SIZE = 24;

export function ProductBrowser({ products }: ProductBrowserProps) {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const visibleProducts = useMemo(() => {
    if (!deferredQuery) {
      return products;
    }

    return products.filter((product) =>
      [product.id, product.title, product.categoryMeta.name, ...product.colors]
        .join(" ")
        .toLowerCase()
        .includes(deferredQuery),
    );
  }, [deferredQuery, products]);

  return (
    <div>
      <div className="mb-6 flex items-center gap-4 px-4 sm:px-6 lg:px-10">
        <label className="flex min-h-12 flex-1 items-center gap-3 border border-[var(--line)] bg-white px-4 focus-within:border-[var(--ink)] sm:max-w-sm">
          <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="shrink-0 text-[var(--text-soft)]">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setLimit(PAGE_SIZE);
            }}
            placeholder="Search style code"
            aria-label="Search products by style code"
            className="min-w-0 flex-1 bg-transparent text-base text-[var(--ink)] outline-none placeholder:text-[var(--text-soft)]"
          />
        </label>
        <p className="shrink-0 text-xs text-[var(--text-soft)]" aria-live="polite">
          {visibleProducts.length} {visibleProducts.length === 1 ? "style" : "styles"}
        </p>
      </div>

      {visibleProducts.length > 0 ? (
        <>
          <ProductGrid products={visibleProducts.slice(0, limit)} />
          {visibleProducts.length > limit ? (
            <div className="mt-8 flex justify-center px-4">
              <button
                type="button"
                onClick={() => setLimit((current) => current + PAGE_SIZE)}
                className="inline-flex min-h-12 items-center justify-center border border-[var(--ink)] px-8 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--ink)] hover:text-white"
              >
                Show more styles ({visibleProducts.length - limit} left)
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="mx-4 border border-[var(--line)] px-5 py-10 text-center sm:mx-6 lg:mx-10">
          <p className="text-xl font-semibold">No matching style</p>
          <p className="mt-2 text-sm text-[var(--text-soft)]">Check the style code or clear the search.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setLimit(PAGE_SIZE);
            }}
            className="mt-5 inline-flex min-h-11 items-center justify-center bg-[var(--ink)] px-5 text-sm font-semibold text-white"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}
