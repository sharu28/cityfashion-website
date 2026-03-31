import Link from "next/link";

import { buildWhatsAppLink } from "@/lib/catalog";
import { company } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between rounded-full border border-[rgba(76,54,34,0.12)] bg-[rgba(255,250,244,0.86)] px-4 py-3 shadow-[0_14px_38px_rgba(63,40,19,0.08)] backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--text-strong)] font-serif text-lg text-white">
              CF
            </span>
            <span className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-strong)]">
              {company.name}
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-[var(--text-soft)] md:flex">
            <Link href="/#categories">Categories</Link>
            <Link href="/#new-arrivals">New</Link>
            <Link href="/#visit-us">Visit</Link>
            <Link href="/#sale-items">Sale</Link>
            <Link href={buildWhatsAppLink()} className="rounded-full bg-[var(--text-strong)] px-4 py-2 font-semibold text-white">
              WhatsApp
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
