import type { Metadata } from "next";

import { formattedWhatsAppNumber, whatsappNumber } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How City Fashion uses retailer account and website measurement data.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--accent)]">City Fashion</p>
      <h1 className="mt-3 text-4xl font-black uppercase italic tracking-[-0.04em] sm:text-6xl">Privacy</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-soft)]">
        This page explains the information used when retailers browse the catalog, save styles, sign in, and start an order on WhatsApp.
      </p>

      <div className="mt-10 space-y-8 text-sm leading-7 text-[var(--text-soft)] sm:text-base">
        <section className="hard-panel p-5 sm:p-7">
          <h2 className="text-xl font-black uppercase tracking-[-0.02em] text-[var(--text-strong)]">Website measurement</h2>
          <p className="mt-3">
            Google Analytics and Vercel website analytics help us understand visits, product views, shortlist changes, retailer login steps, campaign sources, and WhatsApp order starts. This can include device, browser, approximate location, referring page, and the pages used on this website.
          </p>
          <p className="mt-3">
            We do not intentionally send phone numbers or one-time-password values to analytics. Google Analytics event-level and user-level data is configured to be retained for 14 months.
          </p>
        </section>

        <section className="hard-panel p-5 sm:p-7">
          <h2 className="text-xl font-black uppercase tracking-[-0.02em] text-[var(--text-strong)]">Your choices</h2>
          <p className="mt-3">
            “Allow measurement” permits Google analytics and advertising storage. “Only necessary” denies those storage permissions. Google tags receive these choices through Google Consent Mode and adjust their behaviour. You can reopen Cookie settings in the footer at any time.
          </p>
          <p className="mt-3">
            When measurement is not allowed, Vercel Analytics and Speed Insights are not loaded. Google may still receive limited cookieless consent and measurement signals when storage is denied.
          </p>
        </section>

        <section className="hard-panel p-5 sm:p-7">
          <h2 className="text-xl font-black uppercase tracking-[-0.02em] text-[var(--text-strong)]">Retailer account and orders</h2>
          <p className="mt-3">
            If retailer login is enabled, phone details are used to provide phone OTP access, saved styles, and the gated order flow. When you choose WhatsApp, WhatsApp receives the message and account information you send under its own terms and privacy practices.
          </p>
        </section>

        <section className="hard-panel p-5 sm:p-7">
          <h2 className="text-xl font-black uppercase tracking-[-0.02em] text-[var(--text-strong)]">Questions</h2>
          <p className="mt-3">
            Contact City Fashion at 131 Keyzer Street, Colombo 11, or on{" "}
            <a className="font-black text-[var(--accent)] underline underline-offset-4" href={`https://wa.me/${whatsappNumber}`}>
              WhatsApp {formattedWhatsAppNumber}
            </a>
            .
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.12em]">Last updated: 27 August 2026</p>
        </section>
      </div>
    </main>
  );
}
