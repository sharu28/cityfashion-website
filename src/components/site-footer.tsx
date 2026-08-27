import Link from "next/link";

import { CookieSettingsButton } from "@/components/cookie-consent";
import { RetailerOrderButton } from "@/components/retailer-order-button";
import { categories } from "@/lib/catalog";
import { company, formattedWhatsAppNumber } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-10 bg-[var(--hero)] text-white">
      <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="border-b border-white/14 pb-8">
          <p className="catalog-heading text-[clamp(4rem,15vw,15rem)] font-black leading-[0.78] tracking-[-0.08em] text-white">
            City Fashion
          </p>
        </div>

        <div className="grid gap-8 py-9 lg:grid-cols-[1.25fr_0.8fr_1fr]">
          <div className="space-y-3">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-white/48">Wholesale catalog</p>
            <h2 className="max-w-lg text-3xl font-black uppercase italic leading-[0.98] tracking-[-0.035em] text-white md:text-5xl">
              Styles ready for repeat shop orders
            </h2>
            <p className="max-w-md text-sm leading-6 text-white/62">
            {company.retailerLine}. {company.orderLine}
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-white/48">Contact</p>
            <div className="space-y-2 text-sm text-white/68">
              <p className="font-black text-white">{formattedWhatsAppNumber}</p>
              <p>{company.address}</p>
            </div>
            <RetailerOrderButton label="Retailer order" />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-white/48">Browse</p>
              <div className="space-y-2 text-sm font-bold text-white/72">
                <Link href="/#new-arrivals" className="block hover:text-white">
                  New arrivals
                </Link>
                <Link href="/shortlist" className="block hover:text-white">
                  Shortlist
                </Link>
                <Link href="/#visit-us" className="block hover:text-white">
                  Visit us
                </Link>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-white/48">Categories</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm font-bold text-white/72">
                {categories.map((category) => (
                  <Link key={category.slug} href={`/category/${category.slug}`} className="hover:text-white">
                    {category.shortName}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/14 pt-5 text-xs text-white/46 sm:flex-row sm:items-center sm:justify-between">
          <p>Wholesale ladies wear, Colombo 11</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <CookieSettingsButton />
            <p>Browse styles. Save picks. Order on WhatsApp.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
