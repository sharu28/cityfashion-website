import Image from "next/image";
import Link from "next/link";

import type { CatalogProductView } from "@/lib/catalog";

import { ProductBadges } from "@/components/product-badges";
import { SaveProductButton } from "@/components/save-product-button";

type ProductTileProps = { product: CatalogProductView };

export function ProductTile({ product }: ProductTileProps) {
  const image = product.coverImage;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[rgba(255,250,244,0.9)] p-3 shadow-[0_18px_45px_rgba(48,31,13,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(48,31,13,0.12)]"
    >
      <div className="absolute right-5 top-5 z-10">
        <SaveProductButton productSlug={product.slug} />
      </div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-[var(--muted)]">
        {image ? (
          <Image
            src={image}
            alt={product.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm uppercase tracking-[0.24em] text-[var(--text-soft)]">
            No Image
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-4 px-1 pb-1 pt-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[var(--text-soft)]">{product.id}</p>
              <h3 className="text-lg font-semibold text-[var(--text-strong)]">{product.title}</h3>
            </div>
            <span className="rounded-full bg-[var(--sand-strong)] px-3 py-1 text-xs font-semibold text-[var(--text-strong)]">
              {product.colors.length} colors
            </span>
          </div>
          <ProductBadges badges={product.badges} categoryLabel={product.categoryMeta.shortName} />
        </div>
        <p className="text-sm leading-6 text-[var(--text-soft)]">{product.description}</p>
        <div className="mt-auto flex items-center justify-between rounded-[1.25rem] bg-[var(--sand)] px-4 py-3 text-sm">
          <span className="font-semibold text-[var(--text-strong)]">Start {product.startingPrice}</span>
          <span className="text-[var(--text-soft)]">MOQ {product.moq}</span>
        </div>
      </div>
    </Link>
  );
}
