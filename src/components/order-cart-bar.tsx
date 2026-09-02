"use client";

import Link from "next/link";

import { useOrderCart } from "@/components/order-cart-provider";
import { formatLkr } from "@/lib/catalog";

export function OrderCartBar() {
  const { isLoaded, summary } = useOrderCart();

  if (!isLoaded || summary.styleCount === 0) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl border border-white/15 bg-[rgba(18,17,15,0.96)] p-2 text-white shadow-[0_20px_60px_rgba(18,17,15,0.28)] backdrop-blur-xl">
      <Link
        href="/order"
        className="flex min-h-12 items-center justify-center bg-[var(--accent)] px-4 text-center text-sm font-black text-[var(--text-strong)] transition hover:bg-white active:scale-[0.99]"
      >
        View order · {summary.styleCount} {summary.styleCount === 1 ? "style" : "styles"} ·{" "}
        {formatLkr(summary.productTotalLkr)}
      </Link>
    </div>
  );
}
