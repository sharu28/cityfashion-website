"use client";

import Link from "next/link";

import { useRetailer } from "@/components/retailer-provider";

export function RetailerAccountControls() {
  const { enabled, isLoaded, openAuth, retailer, shortlist, signOut } = useRetailer();

  if (!isLoaded) {
    return <div className="h-11 w-28 bg-white/12" aria-hidden="true" />;
  }

  if (!enabled) {
    return (
      <Link
        href="/shortlist"
        className="inline-flex min-h-11 items-center justify-center border border-white/15 bg-white px-4 text-[0.72rem] font-black uppercase tracking-[0.12em] text-[var(--text-strong)] transition hover:bg-[var(--sand)] active:scale-[0.98]"
      >
        Saved ({shortlist.length})
      </Link>
    );
  }

  if (!retailer) {
    return (
      <button
        type="button"
        onClick={() => openAuth({ type: "order" })}
        className="inline-flex min-h-11 items-center justify-center border border-white/15 bg-white px-4 text-[0.72rem] font-black uppercase tracking-[0.12em] text-[var(--text-strong)] transition hover:bg-[var(--sand)] active:scale-[0.98]"
      >
        Login
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/shortlist"
        className="inline-flex min-h-11 items-center justify-center border border-white/15 bg-white px-4 text-[0.72rem] font-black uppercase tracking-[0.12em] text-[var(--text-strong)] transition hover:bg-[var(--sand)] active:scale-[0.98]"
      >
        Shortlist ({shortlist.length})
      </Link>
      <button
        type="button"
        onClick={() => {
          void signOut();
        }}
        className="inline-flex min-h-11 items-center justify-center border border-white/15 px-4 text-[0.72rem] font-black uppercase tracking-[0.12em] text-white transition hover:bg-white/10 active:scale-[0.98]"
      >
        {retailer.phone}
      </button>
    </div>
  );
}
