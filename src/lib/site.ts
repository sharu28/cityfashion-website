export const whatsappNumber = "94742216040";
export const formattedWhatsAppNumber = "+94 74 221 6040";
export const siteUrl = "https://cityfashion.shop";
export const siteName = "City Fashion";
export const siteDescription =
  "Wholesale ladies wear for Sri Lanka retailers. Browse styles and build your wholesale order online.";

export const company = {
  name: siteName,
  tagline: "Wholesale ladies wear for Sri Lanka retailers",
  address: "131 Keyzer Street, Colombo 11",
  retailerLine: "For ladies wear retailers in Sri Lanka",
  orderLine: "Open a product, view colors, and add it to your order.",
};

export function getAbsoluteUrl(path = "/") {
  return new URL(path, siteUrl).toString();
}
