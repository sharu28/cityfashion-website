import type { CatalogProductView } from "@/lib/catalog";

import { ProductTile } from "@/components/product-tile";

type ProductGridProps = {
  products: CatalogProductView[];
};

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid grid-flow-dense gap-x-3 gap-y-7 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-4 lg:gap-y-9">
      {products.map((product, index) => (
        <ProductTile
          key={product.slug}
          product={product}
          className={index === 0 || index === 7 ? "lg:col-span-2" : ""}
          imageSizes={index === 0 || index === 7 ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, 25vw"}
        />
      ))}
    </div>
  );
}
