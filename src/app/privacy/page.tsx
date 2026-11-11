import type { Metadata } from "next";

import { formattedWhatsAppNumber, whatsappNumber } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How City Fashion uses order and website measurement data.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <p className="label text-[var(--text-soft)]">City Fashion</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">Privacy</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-soft)]">
        This page explains the information used when you browse the catalog, place an order, or contact us.
      </p>

      <div className="mt-10 space-y-8 text-sm leading-7 text-[var(--text-soft)] sm:text-base">
        <section className="border-t border-[var(--line)] pt-6">
          <h2 className="label text-[0.8125rem] text-[var(--ink)]">Website measurement</h2>
          <p className="mt-3">
            Google Analytics and Cloudflare Web Analytics help us understand visits, product views, campaign sources, and WhatsApp support clicks. This can include device, browser, approximate location, referring page, and the pages used on this website.
          </p>
          <p className="mt-3">
            We do not send your name, WhatsApp number, order reference, or internal order ID to analytics. Google Analytics event-level and user-level data is configured to be retained for 14 months.
          </p>
        </section>

        <section className="border-t border-[var(--line)] pt-6">
          <h2 className="label text-[0.8125rem] text-[var(--ink)]">Your choices</h2>
          <p className="mt-3">
            “Allow” permits Google analytics and advertising storage. “Only necessary” denies those storage permissions. Google tags receive these choices through Google Consent Mode and adjust their behaviour. You can reopen Cookie settings in the footer at any time.
          </p>
          <p className="mt-3">
            When measurement is not allowed, Cloudflare Web Analytics is not loaded. Google may still receive limited cookieless consent and measurement signals when storage is denied.
          </p>
        </section>

        <section className="border-t border-[var(--line)] pt-6">
          <h2 className="label text-[0.8125rem] text-[var(--ink)]">Your order</h2>
          <p className="mt-3">
            To process an order, we store your name, WhatsApp number, selected products, quantities, totals, order status, and order timestamps. Our staff use these details to call you, confirm delivery and payment, and complete the order.
          </p>
          <p className="mt-3">
            If you contact us on WhatsApp, WhatsApp receives the message and account information you send under its own terms and privacy practices.
          </p>
        </section>

        <section className="border-t border-[var(--line)] pt-6">
          <h2 className="label text-[0.8125rem] text-[var(--ink)]">Questions</h2>
          <p className="mt-3">
            Contact City Fashion at 131 Keyzer Street, Colombo 11, or on{" "}
            <a className="font-semibold text-[var(--ink)] underline underline-offset-4" href={`https://wa.me/${whatsappNumber}`}>
              WhatsApp {formattedWhatsAppNumber}
            </a>
            .
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.12em]">Last updated: 2 September 2026</p>
        </section>
      </div>
    </main>
  );
}
