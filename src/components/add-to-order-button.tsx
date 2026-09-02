"use client";

import { OrderQuantityControl } from "@/components/order-quantity-control";
import { useOrderCart } from "@/components/order-cart-provider";
import { buildWhatsAppLink, type CatalogProductView } from "@/lib/catalog";

type AddToOrderButtonProps = {
  product: CatalogProductView;
};

export function AddToOrderButton({ product }: AddToOrderButtonProps) {
  const { add, entries, has } = useOrderCart();
  const entry = entries.find((item) => item.productSlug === product.slug);

  if (!product.orderable) {
    return (
      <a
        href={buildWhatsAppLink(product)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-11 items-center justify-center bg-[var(--whatsapp)] px-4 text-center text-[0.72rem] font-black uppercase tracking-[0.1em] text-white"
      >
        Ask price on WhatsApp
      </a>
    );
  }

  if (has(product.slug) && entry) {
    return <OrderQuantityControl productSlug={product.slug} quantity={entry.quantity} />;
  }

  return (
    <button
      type="button"
      onClick={() => add(product.slug)}
      className="inline-flex min-h-11 items-center justify-center bg-[var(--text-strong)] px-5 text-[0.75rem] font-black uppercase tracking-[0.12em] text-white transition hover:-translate-y-0.5 active:translate-y-px active:scale-[0.98]"
    >
      Add to order
    </button>
  );
}
