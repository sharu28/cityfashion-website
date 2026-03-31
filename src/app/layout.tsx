import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Manrope, Playfair_Display } from "next/font/google";

import { AttributionTracker } from "@/components/attribution-tracker";
import { RetailerProvider } from "@/components/retailer-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { company, getAbsoluteUrl, siteDescription, siteName, siteUrl } from "@/lib/site";

import "./globals.css";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const serif = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
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
  openGraph: {
    title: `${siteName} | Wholesale ladies wear`,
    description: siteDescription,
    url: siteUrl,
    siteName,
    type: "website",
    locale: "en_LK",
    images: [
      {
        url: getAbsoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: `${siteName} wholesale catalog`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} | Wholesale ladies wear`,
    description: siteDescription,
    images: [getAbsoluteUrl("/twitter-image")],
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  keywords: [
    "City Fashion",
    "wholesale ladies wear Sri Lanka",
    "Keyzer Street Colombo",
    "retailer catalog",
    "WhatsApp wholesale order",
  ],
  category: "fashion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${serif.variable} bg-[var(--bg)] text-[var(--text-strong)] antialiased`}>
        <RetailerProvider>
          <AttributionTracker />
          <SiteHeader />
          {children}
          <SiteFooter />
        </RetailerProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
