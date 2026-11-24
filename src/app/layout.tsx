import type { Metadata } from "next";
import { Geist_Mono, Schibsted_Grotesk } from "next/font/google";

import { AttributionTracker } from "@/components/attribution-tracker";
import { ConsentAwareCloudflareAnalytics, CookieConsent } from "@/components/cookie-consent";
import { GoogleAnalytics } from "@/components/google-analytics";
import { OrderCartBar } from "@/components/order-cart-bar";
import { OrderCartProvider } from "@/components/order-cart-provider";
import { OrderSizesProvider } from "@/components/order-sizes-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { catalogShareDescription, catalogShareTitle, shareMetadata } from "@/lib/share-metadata";
import { siteDescription, siteName, siteUrl } from "@/lib/site";

import "./globals.css";

const sans = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} | Wholesale ladies wear`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  ...shareMetadata("/", catalogShareTitle, catalogShareDescription),
  keywords: [
    "City Fashion",
    "wholesale ladies wear Sri Lanka",
    "Keyzer Street Colombo",
    "retailer catalog",
    "online wholesale order",
  ],
  category: "fashion",
  verification: {
    google: "fMZuit_rw1_e8LUQFKzIBp-Rs74h0llLHqBqkvhbBW8",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="dns-prefetch" href="//res.cloudinary.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
      </head>
      <body className={`${sans.variable} ${mono.variable} bg-[var(--bg)] text-[var(--text-strong)] antialiased`}>
        <GoogleAnalytics />
        <a href="#main-content" className="skip-link">
          Skip to catalog
        </a>
        <OrderCartProvider>
          <OrderSizesProvider>
            <AttributionTracker />
            <SiteHeader />
            <div id="main-content">{children}</div>
            <SiteFooter />
            <OrderCartBar />
            <WhatsAppFloat />
          </OrderSizesProvider>
        </OrderCartProvider>
        <CookieConsent />
        <ConsentAwareCloudflareAnalytics />
      </body>
    </html>
  );
}
