"use client";

import Link from "next/link";

import { useRetailer } from "@/components/retailer-provider";

export function RetailerAccountControls() {
  const { isLoaded, openAuth, retailer, shortlist, signOut } = useRetailer();

  if (!isLoaded) {
    return <div className="h-11 w-28 rounded-full bg-[var(--sand)]" aria-hidden="true" />;
  }

  if (!retailer) {
    return (
      <button
        type="button"
        onClick={() => openAuth({ type: "order" })}
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--sand)] px-4 text-sm font-semibold text-[var(--text-strong)]"
      >
        Retailer login
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/shortlist"
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--sand)] px-4 text-sm font-semibold text-[var(--text-strong)]"
      >
        Shortlist ({shortlist.length})
      </Link>
      <button
        type="button"
        onClick={() => {
          void signOut();
        }}
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] px-4 text-sm font-semibold text-[var(--text-strong)]"
      >
        {retailer.phone}
      </button>
    </div>
  );
}
