export const phoneNumber = "+94761949852";
export const formattedWhatsAppNumber = phoneNumber.replace(/^(\+94)(\d{2})(\d{3})(\d{4})$/, "$1 $2 $3 $4");
export const whatsappUrl = `https://wa.me/${phoneNumber.slice(1)}`;
export const siteUrl = "https://cityfashion.shop";
export const siteName = "City Fashion";
export const siteDescription =
  "Wholesale ladies wear for Sri Lanka retailers. Browse styles and build your wholesale order online.";

const streetAddress = "131 Keyzer Street";
const addressLocality = "Colombo 11";

export const company = {
  name: siteName,
  tagline: "Wholesale ladies wear for Sri Lanka retailers",
  address: `${streetAddress}, ${addressLocality}`,
  streetAddress,
  addressLocality,
  retailerLine: "For ladies wear retailers in Sri Lanka",
  orderLine: "Open a product, view colors, and add it to your order.",
};

export function getAbsoluteUrl(path = "/") {
  return new URL(path, siteUrl).toString();
}
