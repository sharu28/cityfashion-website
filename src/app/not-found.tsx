import Link from "next/link";

import { CatalogShell } from "@/components/catalog-shell";
import { RetailerOrderButton } from "@/components/retailer-order-button";

export default function NotFound() {
  return (
    <main className="overflow-hidden pb-16 pt-28">
      <CatalogShell>
        <section className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--panel)] p-6 sm:p-8">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[var(--text-soft)]">Page not found</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-bold leading-[1.03] tracking-[-0.01em] text-[var(--text-strong)] md:text-7xl">
            This style page is not available
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-[var(--text-soft)]">
            Browse current styles or ask City Fashion on WhatsApp for help with the style code.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/#new-arrivals"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--line)] px-6 text-sm font-bold text-[var(--text-strong)] transition hover:bg-white active:scale-[0.98]"
            >
              Browse new arrivals
            </Link>
            <RetailerOrderButton label="Ask on WhatsApp" />
          </div>
        </section>
      </CatalogShell>
    </main>
  );
}
