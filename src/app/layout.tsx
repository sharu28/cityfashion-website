import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";

import { SiteHeader } from "@/components/site-header";
import { company } from "@/lib/catalog";

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
  title: `${company.name} | Wholesale ladies wear`,
  description:
    "Mobile-first wholesale catalog for Sri Lanka retailers. Browse styles, view colors, and order on WhatsApp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${serif.variable} bg-[var(--bg)] text-[var(--text-strong)] antialiased`}>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
