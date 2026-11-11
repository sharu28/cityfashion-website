import Link from "next/link";

import { CookieSettingsButton } from "@/components/cookie-consent";
import { buildWhatsAppLink, populatedCategories } from "@/lib/catalog";
import { company, formattedWhatsAppNumber } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[var(--line)] bg-white pb-28 text-sm">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-10">
        <div className="space-y-3">
          <p className="text-[0.95rem] font-bold uppercase tracking-[0.22em]">{company.name}</p>
          <p className="max-w-xs leading-6 text-[var(--text-soft)]">
            Wholesale ladies wear for shops in Sri Lanka. Minimum order 6 pieces per style.
          </p>
        </div>

        <div className="space-y-3">
          <p className="label text-[var(--text-soft)]">Contact</p>
          <p className="font-semibold">{formattedWhatsAppNumber}</p>
          <p className="text-[var(--text-soft)]">{company.address}</p>
          <a
            href={buildWhatsAppLink()}
            target="_blank"
            rel="noreferrer"
            className="inline-block underline underline-offset-4"
          >
            Message us on WhatsApp
          </a>
        </div>

        <div className="space-y-3">
          <p className="label text-[var(--text-soft)]">Styles</p>
          <ul className="space-y-2">
            <li>
              <Link href="/#new-arrivals" className="hover:underline hover:underline-offset-4">
                New arrivals
              </Link>
            </li>
            {populatedCategories.map((category) => (
              <li key={category.slug}>
                <Link href={`/category/${category.slug}`} className="hover:underline hover:underline-offset-4">
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/order" className="hover:underline hover:underline-offset-4">
                Your order
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1440px] flex-wrap gap-x-5 gap-y-2 border-t border-[var(--line)] px-4 pt-5 text-xs text-[var(--text-soft)] sm:px-6 lg:px-10">
        <p>Colombo 11</p>
        <Link href="/privacy" className="hover:text-[var(--ink)]">
          Privacy
        </Link>
        <CookieSettingsButton />
      </div>
    </footer>
  );
}
