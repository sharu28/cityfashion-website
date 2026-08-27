"use client";

import { useDeferredValue, useMemo, useState } from "react";

import { ProductGrid } from "@/components/product-grid";
import type { CatalogProductView } from "@/lib/catalog";

type ProductBrowserProps = {
  products: CatalogProductView[];
};

export function ProductBrowser({ products }: ProductBrowserProps) {
  const [query, setQuery] = useState("");
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
      <div className="mb-7 grid gap-3 border border-[var(--line)] bg-[var(--panel)] p-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <label className="flex min-h-12 items-center gap-3 border border-[var(--line)] bg-white px-4">
          <span className="font-mono text-xs font-black uppercase tracking-[0.16em] text-[var(--text-soft)]">Find</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search style code"
            aria-label="Search products by style code"
            className="min-w-0 flex-1 bg-transparent text-base text-[var(--text-strong)] outline-none placeholder:text-[var(--text-soft)]"
          />
        </label>
        <p className="px-1 text-sm font-black text-[var(--text-strong)]" aria-live="polite">
          {visibleProducts.length} {visibleProducts.length === 1 ? "style" : "styles"}
        </p>
      </div>

      {visibleProducts.length > 0 ? (
        <ProductGrid products={visibleProducts} />
      ) : (
        <div className="border border-[var(--line)] bg-[var(--panel)] px-5 py-10 text-center">
          <p className="text-2xl font-black text-[var(--text-strong)]">No matching style</p>
          <p className="mt-2 text-sm text-[var(--text-soft)]">Check the style code or clear the search.</p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-5 inline-flex min-h-11 items-center justify-center bg-[var(--text-strong)] px-5 text-[0.78rem] font-black uppercase tracking-[0.12em] text-white"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}
