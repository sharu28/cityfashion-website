import Link from "next/link";

import { RetailerAccountControls } from "@/components/retailer-account-controls";
import { RetailerOrderButton } from "@/components/retailer-order-button";
import { company } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-7xl px-3 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 rounded-full border border-[rgba(51,45,37,0.12)] bg-[rgba(255,253,248,0.9)] px-3 py-2 shadow-[0_18px_44px_rgba(33,31,27,0.08)] backdrop-blur-xl sm:px-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-[var(--text-strong)] text-sm font-bold tracking-normal text-white">
              CF
            </span>
            <span className="hidden text-sm font-bold tracking-[-0.02em] text-[var(--text-strong)] sm:block">{company.name}</span>
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-medium text-[var(--text-soft)] md:flex">
            <Link className="transition hover:text-[var(--text-strong)]" href="/#categories">
              Categories
            </Link>
            <Link className="transition hover:text-[var(--text-strong)]" href="/#new-arrivals">
              New arrivals
            </Link>
            <Link className="transition hover:text-[var(--text-strong)]" href="/shortlist">
              Shortlist
            </Link>
            <Link className="transition hover:text-[var(--text-strong)]" href="/#visit-us">
              Visit
            </Link>
            <RetailerOrderButton label="WhatsApp order" />
          </nav>
          <div className="hidden md:block">
            <RetailerAccountControls />
          </div>
          <div className="md:hidden">
            <RetailerAccountControls />
          </div>
        </div>
      </div>
    </header>
  );
}
