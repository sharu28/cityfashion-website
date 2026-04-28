import Link from "next/link";

import { RetailerOrderButton } from "@/components/retailer-order-button";
import { company, formattedWhatsAppNumber } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-[var(--line)] bg-[rgba(255,253,248,0.8)]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.35fr_0.8fr_0.65fr] lg:px-8">
        <div className="space-y-3">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[var(--text-soft)]">City Fashion</p>
          <h2 className="max-w-lg text-4xl font-bold leading-[1.06] tracking-[-0.01em] text-[var(--text-strong)]">
            Wholesale styles for repeat shop orders
          </h2>
          <p className="max-w-md text-sm leading-6 text-[var(--text-soft)]">
            {company.retailerLine}. {company.orderLine}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[var(--text-soft)]">Contact</p>
          <div className="space-y-2 text-sm text-[var(--text-soft)]">
            <p className="font-bold text-[var(--text-strong)]">{formattedWhatsAppNumber}</p>
            <p>{company.address}</p>
            <RetailerOrderButton label="Retailer order" />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[var(--text-soft)]">Browse</p>
          <div className="space-y-2 text-sm text-[var(--text-soft)]">
            <Link href="/#categories" className="block hover:text-[var(--text-strong)]">
              Categories
            </Link>
            <Link href="/#new-arrivals" className="block hover:text-[var(--text-strong)]">
              New arrivals
            </Link>
            <Link href="/shortlist" className="block hover:text-[var(--text-strong)]">
              Shortlist
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
