import Link from "next/link";

import { RetailerAccountControls } from "@/components/retailer-account-controls";
import { RetailerOrderButton } from "@/components/retailer-order-button";
import { company } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-[rgba(18,17,15,0.96)] text-white shadow-[0_16px_50px_rgba(18,17,15,0.18)] backdrop-blur-xl">
      <div className="mx-auto max-w-[1500px] px-3 py-3 sm:px-5 lg:px-7">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3" aria-label={`${company.name} home`}>
            <span className="flex h-10 w-10 items-center justify-center border border-white/18 bg-white text-sm font-black tracking-[-0.04em] text-[var(--text-strong)]">
              CF
            </span>
            <span className="text-sm font-black uppercase italic tracking-[-0.02em] text-white sm:text-base">{company.name}</span>
          </Link>
          <nav className="hidden items-center gap-5 text-[0.72rem] font-black uppercase tracking-[0.12em] text-white/78 md:flex">
            <Link className="transition hover:text-white" href="/#categories">
              Categories
            </Link>
            <Link className="transition hover:text-white" href="/#new-arrivals">
              New arrivals
            </Link>
            <Link className="transition hover:text-white" href="/shortlist">
              Shortlist
            </Link>
            <Link className="transition hover:text-white" href="/#visit-us">
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
