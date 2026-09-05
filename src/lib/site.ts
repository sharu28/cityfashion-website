export const whatsappNumber = "94783232414";
export const formattedWhatsAppNumber = "+94 78 323 2414";
export const siteUrl = "https://cityfashion.shop";
export const siteName = "City Fashion";
export const siteDescription =
  "Wholesale ladies wear for Sri Lanka retailers. Browse styles, view colors, and order on WhatsApp.";

export const company = {
  name: siteName,
  tagline: "Wholesale ladies wear for Sri Lanka retailers",
  address: "131 Keyzer Street, Colombo 11",
  retailerLine: "For ladies wear retailers in Sri Lanka",
  orderLine: "Open product, view colors, and order on WhatsApp.",
};

export function getAbsoluteUrl(path = "/") {
  return new URL(path, siteUrl).toString();
}
