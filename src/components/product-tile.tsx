import Link from "next/link";

import { AddToOrderButton } from "@/components/add-to-order-button";
import { ProductPhotoStrip } from "@/components/product-photo-strip";
import { buildWhatsAppLink, type CatalogProductView, formatLkr } from "@/lib/catalog";

type ProductTileProps = {
  className?: string;
  imageSizes?: string;
  product: CatalogProductView;
  /** Use the inverted colours inside the black deals band. */
  invert?: boolean;
};

export const tileImageSizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw";

export function ProductTile({ className = "", imageSizes = tileImageSizes, product, invert = false }: ProductTileProps) {
  const href = `/products/${product.slug}`;
  const isDeal = product.merchandisingLane === "deal" || product.merchandisingLane === "new-and-deal";
  const soft = invert ? "text-white/65" : "text-[var(--text-soft)]";

  return (
    <article className={`min-w-0 ${className}`.trim()}>
      <ProductPhotoStrip href={href} images={product.images} title={product.title} imageSizes={imageSizes}>
        {isDeal ? (
          <span className="label pointer-events-none absolute left-2 top-2 bg-white px-1.5 py-1 text-[0.625rem] text-[var(--ink)]">
            Deal
          </span>
        ) : null}
        {product.orderable ? (
          <div className="absolute bottom-2 right-2">
            <AddToOrderButton product={product} />
          </div>
        ) : null}
      </ProductPhotoStrip>

      <div className="space-y-0.5 px-2.5 pb-1 pt-2 text-xs leading-[1.45] sm:text-[0.8125rem]">
        <Link href={href} className="line-clamp-2 text-[0.8125rem] font-medium hover:underline hover:underline-offset-2 sm:text-sm">
          {product.title}
        </Link>
        <p className="font-semibold">{product.startingPrice || (product.unitPriceLkr ? formatLkr(product.unitPriceLkr) : "Ask price")}</p>
        <p className={soft}>
          Min {product.moq || "6 pcs"} · {product.fabric || "Fabric: ask us"}
        </p>
        {product.colors.length > 0 ? (
          <p className={soft}>
            {product.colors.length} {product.colors.length === 1 ? "colour" : "colours"}
          </p>
        ) : null}
        {!product.orderable ? (
          <a href={buildWhatsAppLink(product)} target="_blank" rel="noreferrer" className="mt-1 inline-block font-semibold text-[var(--whatsapp)] underline underline-offset-2">
            Ask price on WhatsApp
          </a>
        ) : null}
      </div>
    </article>
  );
}
