import Image from "next/image";
import Link from "next/link";

import type { CatalogProductView } from "@/lib/catalog";

import { ProductBadges } from "@/components/product-badges";
import { SaveProductButton } from "@/components/save-product-button";

type ProductTileProps = {
  className?: string;
  imageSizes?: string;
  priority?: boolean;
  product: CatalogProductView;
};

export function ProductTile({
  className = "",
  imageSizes = "(max-width: 768px) 100vw, 25vw",
  priority = false,
  product,
}: ProductTileProps) {
  const image = product.coverImage;

  return (
    <Link
      href={`/products/${product.slug}`}
      className={`group relative flex h-full flex-col bg-[var(--panel)] transition duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 active:translate-y-px active:scale-[0.99] ${className}`.trim()}
    >
      <div className="absolute right-3 top-3 z-10">
        <SaveProductButton productSlug={product.slug} />
      </div>
      <div className="relative aspect-[4/5] overflow-hidden border border-[var(--line)] bg-white">
        {image ? (
          <Image
            src={image}
            alt={product.title}
            fill
            className="object-cover transition duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
            priority={priority}
            sizes={imageSizes}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-black uppercase tracking-[0.18em] text-[var(--text-soft)]">
            No Image
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 border-x border-b border-[var(--line)] px-3 pb-3 pt-3">
        <div className="space-y-2">
          <div className="space-y-1">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[var(--text-soft)]">Style {product.id}</p>
            <h3 className="text-base font-black leading-[1.08] tracking-[-0.01em] text-[var(--text-strong)] sm:text-lg">{product.title}</h3>
          </div>
          <ProductBadges badges={product.badges} categoryLabel={product.categoryMeta.shortName} />
        </div>
        {product.colors.length > 0 ? (
          <div className="flex items-center gap-2 text-xs text-[var(--text-soft)]" aria-label={`${product.colors.length} available colors`}>
            <span className="font-black text-[var(--text-strong)]">{product.colors.length} colors</span>
            <span className="truncate">{product.colors.slice(0, 3).join(", ")}</span>
          </div>
        ) : null}
        <div className="mt-auto grid grid-cols-2 border-t border-[var(--line)] pt-3 text-sm">
          <div className="border-r border-[var(--line)] pr-3">
            <p className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-[var(--text-soft)]">Start</p>
            <p className="mt-1 font-black text-[var(--text-strong)]">{product.startingPrice}</p>
          </div>
          <div className="pl-3">
            <p className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-[var(--text-soft)]">MOQ</p>
            <p className="mt-1 font-black text-[var(--text-strong)]">{product.moq}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
