import type { Metadata } from "next";

import { formattedWhatsAppNumber, getAbsoluteUrl, siteDescription, siteName } from "@/lib/site";

export const catalogShareAlt = "City Fashion wholesale ladies wear catalog";
export const catalogShareSize = { width: 1200, height: 630 };
export const catalogShareTitle = `${siteName} | Wholesale ladies wear`;
export const catalogShareDescription = `${siteDescription} WhatsApp ${formattedWhatsAppNumber}.`;

const catalogShareImage = {
  url: getAbsoluteUrl("/opengraph-image?v=2"),
  ...catalogShareSize,
  type: "image/png",
  alt: catalogShareAlt,
};

export function shareMetadata(
  path: string,
  title: string,
  description: string,
  productImage?: { url: string; alt: string },
): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      type: "website",
      locale: "en_LK",
      siteName,
      url: getAbsoluteUrl(path),
      title,
      description,
      images: productImage ? [productImage, catalogShareImage] : [catalogShareImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [productImage ?? catalogShareImage],
    },
  };
}
