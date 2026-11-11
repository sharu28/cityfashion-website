import Link from "next/link";

import { buildWhatsAppLink } from "@/lib/catalog";

export default function NotFound() {
  return (
    <main className="px-4 pb-16 pt-12 sm:px-6 lg:px-10">
      <p className="label text-[var(--text-soft)]">Page not found</p>
      <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-[1.05] tracking-[-0.02em] md:text-5xl">
        This style page is not available
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--text-soft)]">
        Browse current styles or ask City Fashion on WhatsApp for help with the style code.
      </p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/#new-arrivals"
          className="inline-flex min-h-12 items-center justify-center border border-[var(--ink)] px-6 text-sm font-semibold"
        >
          Browse new arrivals
        </Link>
        <a
          href={buildWhatsAppLink()}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-12 items-center justify-center bg-[var(--whatsapp)] px-6 text-sm font-semibold text-white"
        >
          Ask on WhatsApp
        </a>
      </div>
    </main>
  );
}
