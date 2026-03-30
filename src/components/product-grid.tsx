import type { CatalogProductView } from "@/lib/catalog";

import { ProductTile } from "@/components/product-tile";

type ProductGridProps = {
  products: CatalogProductView[];
};

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:gap-7 xl:grid-cols-3">
      {products.map((product) => (
        <ProductTile key={product.slug} product={product} />
      ))}
    </div>
  );
}
