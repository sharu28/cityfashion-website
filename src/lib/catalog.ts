import products from "../../data/generated/products.generated.json";
import { company, whatsappNumber } from "@/lib/site";

export const categories = [
  {
    slug: "frocks",
    name: "Frocks",
    shortName: "Frocks",
    description: "Easy frocks for daily shop sales.",
    intro: "Simple frocks with clear photos and ready order details.",
  },
  {
    slug: "embroidered-tops",
    name: "Embroidered Tops",
    shortName: "Embroidery",
    description: "Dressy tops with embroidery work.",
    intro: "Good for shops that need neat embroidered styles.",
  },
  {
    slug: "top-and-pant-sets",
    name: "Top and Pant Sets",
    shortName: "Sets",
    description: "Matching sets for quick retail picks.",
    intro: "Open full sets, view all colors, and order fast.",
  },
  {
    slug: "side-open-tops",
    name: "Side Open Tops",
    shortName: "Side Open",
    description: "Comfort styles with side-open cuts.",
    intro: "Popular easy-fit tops for repeat wholesale orders.",
  },
  {
    slug: "lungi-sets",
    name: "Lungi Sets",
    shortName: "Lungi Sets",
    description: "Matching tops and lungi styles.",
    intro: "Good bundle styles for retailers who sell full looks.",
  },
  {
    slug: "leggings",
    name: "Leggings",
    shortName: "Leggings",
    description: "Everyday leggings for fast-moving sales.",
    intro: "Basic leggings with clean product photos and MOQ details.",
  },
  {
    slug: "plaza-pants",
    name: "Plaza Pants",
    shortName: "Plaza Pants",
    description: "Loose-fit plaza pants for ladies wear shops.",
    intro: "Open the style, check color range, and place your order.",
  },
  {
    slug: "printed-tops",
    name: "Printed Tops",
    shortName: "Printed Tops",
    description: "Printed tops for easy everyday selling.",
    intro: "Browse printed tops with simple order flow on WhatsApp.",
  },
] as const;

export type Category = (typeof categories)[number];

export type CatalogProduct = {
  id: string;
  slug: string;
  title: string;
  category: string;
  startingPrice: string;
  moq: string;
  description: string;
  colors: string[];
  isNewArrival: boolean;
  isSaleItem: boolean;
  images: string[];
  sourceFolder?: string;
  notes?: string;
};

export type CatalogProductView = CatalogProduct & {
  categoryMeta: Category;
  coverImage: string | null;
  badges: string[];
};

const fallbackCategory: Category = {
  slug: "printed-tops",
  name: "Printed Tops",
  shortName: "Printed Tops",
  description: "Printed tops for easy everyday selling.",
  intro: "Browse printed tops with simple order flow on WhatsApp.",
};

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}

const normalizeProduct = (product: CatalogProduct): CatalogProductView => {
  const categoryMeta = getCategory(product.category) ?? fallbackCategory;
  const badges = [product.isNewArrival ? "New" : null, product.isSaleItem ? "Sale" : null].filter(
    (badge): badge is string => Boolean(badge),
  );

  return {
    ...product,
    categoryMeta,
    coverImage: product.images[0] ?? null,
    badges,
  };
};

const badgeScore = (product: CatalogProductView) => {
  if (product.isNewArrival && product.isSaleItem) {
    return 3;
  }

  if (product.isNewArrival) {
    return 2;
  }

  if (product.isSaleItem) {
    return 1;
  }

  return 0;
};

export const allProducts = (products as CatalogProduct[]).map(normalizeProduct);

export const featuredProducts = [...allProducts].sort((a, b) => badgeScore(b) - badgeScore(a));

export const newArrivals = allProducts.filter((product) => product.isNewArrival);

export const saleItems = allProducts.filter((product) => product.isSaleItem);

export const productsByCategory = (slug: string) =>
  allProducts.filter((product) => product.category === slug);

export const getProduct = (slug: string) => allProducts.find((product) => product.slug === slug);

export const getRelatedProducts = (product: CatalogProductView, limit = 4) =>
  allProducts.filter((item) => item.category === product.category && item.slug !== product.slug).slice(0, limit);

export const buildWhatsAppLink = (product?: CatalogProductView | CatalogProduct) => {
  const message = product
    ? `Hello City Fashion, I want ${product.title} (${product.id}). Please send price, colors, and order details.`
    : "Hello City Fashion, please send your latest wholesale styles and prices.";

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
};
