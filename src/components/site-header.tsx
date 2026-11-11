"use client";

import Link from "next/link";

import { useOrderCart } from "@/components/order-cart-provider";
import { populatedCategories } from "@/lib/catalog";
import { company } from "@/lib/site";

export function SiteHeader() {
  const { summary } = useOrderCart();
  const styleCount = summary.styleCount;

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <Link href="/" aria-label={`${company.name} home`} className="text-[0.95rem] font-bold uppercase tracking-[0.22em]">
          {company.name}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 text-xs font-medium uppercase tracking-[0.1em] lg:flex">
          <Link href="/#new-arrivals" className="hover:underline hover:underline-offset-4">
            New arrivals
          </Link>
          {populatedCategories.map((category) => (
            <Link key={category.slug} href={`/category/${category.slug}`} className="hover:underline hover:underline-offset-4">
              {category.shortName}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link href="/#all-styles" aria-label="Search styles" className="flex h-11 w-11 items-center justify-center">
            <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </Link>
          <Link
            href="/order"
            aria-label={`Order, ${styleCount} ${styleCount === 1 ? "style" : "styles"}`}
            className="relative flex h-11 w-11 items-center justify-center"
          >
            <svg aria-hidden width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M5 8h14l-1 12H6z" />
              <path d="M9 8a3 3 0 0 1 6 0" />
            </svg>
            {styleCount > 0 ? (
              <span className="absolute right-0.5 top-1 flex h-4 min-w-4 items-center justify-center bg-[var(--ink)] px-1 text-[0.625rem] font-semibold text-white">
                {styleCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  );
}
