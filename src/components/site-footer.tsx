import Link from "next/link";

import { RetailerOrderButton } from "@/components/retailer-order-button";
import { company, formattedWhatsAppNumber } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-[var(--line)] bg-[rgba(255,249,242,0.92)]">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
        <div className="space-y-3">
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[var(--text-soft)]">City Fashion</p>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
            Wholesale styles for repeat shop orders.
          </h2>
          <p className="max-w-md text-sm leading-6 text-[var(--text-soft)]">
            {company.retailerLine}. {company.orderLine}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[var(--text-soft)]">Contact</p>
          <div className="space-y-2 text-sm text-[var(--text-soft)]">
            <p className="font-semibold text-[var(--text-strong)]">{formattedWhatsAppNumber}</p>
            <p>{company.address}</p>
            <RetailerOrderButton label="Retailer order" />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[var(--text-soft)]">Best for</p>
          <div className="space-y-2 text-sm text-[var(--text-soft)]">
            <p>Retail shops</p>
            <p>Resellers</p>
            <p>Repeat wholesale buyers</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
