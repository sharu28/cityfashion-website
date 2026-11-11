"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { useOrderCart } from "@/components/order-cart-provider";
import { formatLkr } from "@/lib/catalog";

export function OrderCartBar() {
  const { isLoaded, summary } = useOrderCart();
  const pathname = usePathname();
  const barRef = useRef<HTMLDivElement>(null);
  const isVisible = isLoaded && summary.styleCount > 0 && pathname !== "/order";

  // Tell the WhatsApp button (and page padding) how tall the bar is, so nothing hides behind it.
  useEffect(() => {
    const bar = barRef.current;
    const setHeight = (height: number) => document.body.style.setProperty("--order-bar-h", `${height}px`);
    if (!isVisible || !bar) {
      setHeight(0);
      return;
    }
    setHeight(bar.offsetHeight);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setHeight(bar.offsetHeight));
    observer.observe(bar);
    return () => {
      observer.disconnect();
      setHeight(0);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const styles = `${summary.styleCount} ${summary.styleCount === 1 ? "style" : "styles"}`;

  return (
    <div ref={barRef} className="fixed inset-x-0 bottom-0 z-40 bg-[var(--ink)] text-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
        <p className="py-4 text-xs text-white/70">{summary.itemCount} pcs</p>
        <Link
          href="/order"
          className="flex min-h-14 items-center gap-2 text-sm font-semibold"
        >
          View order · {styles} · {formatLkr(summary.productTotalLkr)}
          <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
