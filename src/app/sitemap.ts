import type { MetadataRoute } from "next";

import { allProducts, categories } from "@/lib/catalog";
import { getAbsoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const categoryPages = categories.map((category) => ({
    url: getAbsoluteUrl(`/category/${category.slug}`),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const productPages = allProducts.map((product) => ({
    url: getAbsoluteUrl(`/products/${product.slug}`),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: getAbsoluteUrl("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...categoryPages,
    ...productPages,
  ];
}
