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
      className={`group relative flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-[var(--line)] bg-[rgba(255,253,248,0.82)] p-2 shadow-[0_18px_45px_rgba(33,31,27,0.05)] transition duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:bg-[var(--panel)] hover:shadow-[0_24px_60px_rgba(33,31,27,0.1)] active:translate-y-px active:scale-[0.99] ${className}`.trim()}
    >
      <div className="absolute right-5 top-5 z-10">
        <SaveProductButton productSlug={product.slug} />
      </div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1rem] bg-[var(--muted)]">
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
          <div className="flex h-full items-center justify-center text-sm font-bold uppercase tracking-[0.18em] text-[var(--text-soft)]">
            No Image
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-4 px-2 pb-2 pt-4">
        <div className="space-y-3">
          <div className="space-y-2">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.14em] text-[var(--text-soft)]">{product.id}</p>
            <h3 className="text-xl font-bold leading-[1.1] tracking-normal text-[var(--text-strong)]">{product.title}</h3>
          </div>
          <ProductBadges badges={product.badges} categoryLabel={product.categoryMeta.shortName} />
        </div>
        <p className="text-pretty text-sm leading-6 text-[var(--text-soft)]">{product.description}</p>
        <div className="mt-auto grid grid-cols-2 overflow-hidden rounded-[1rem] border border-[var(--line)] bg-[rgba(235,229,217,0.5)] text-sm">
          <div className="border-r border-[var(--line)] px-3 py-3">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--text-soft)]">Start</p>
            <p className="mt-1 font-bold text-[var(--text-strong)]">{product.startingPrice}</p>
          </div>
          <div className="px-3 py-3">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--text-soft)]">MOQ</p>
            <p className="mt-1 font-bold text-[var(--text-strong)]">{product.moq}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
