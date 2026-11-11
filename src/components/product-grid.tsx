import type { CatalogProductView } from "@/lib/catalog";

import { ProductTile } from "@/components/product-tile";

type ProductGridProps = {
  products: CatalogProductView[];
  className?: string;
};

/** 2 columns on phones, 3 on tablets, 4 on computers. Photos run nearly edge to edge on phones. */
export function ProductGrid({ products, className = "" }: ProductGridProps) {
  return (
    <div
      className={`grid grid-cols-2 gap-x-0.5 gap-y-6 sm:grid-cols-3 sm:gap-x-3 sm:px-6 lg:grid-cols-4 lg:gap-x-4 lg:gap-y-10 lg:px-10 ${className}`.trim()}
    >
      {products.map((product) => (
        <ProductTile key={product.slug} product={product} />
      ))}
    </div>
  );
}
