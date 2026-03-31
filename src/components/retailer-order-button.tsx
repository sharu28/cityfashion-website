"use client";

import { useRetailer } from "@/components/retailer-provider";

type RetailerOrderButtonProps = {
  label: string;
  productSlug?: string;
  variant?: "dark" | "light" | "brand";
};

export function RetailerOrderButton({
  label,
  productSlug,
  variant = "brand",
}: RetailerOrderButtonProps) {
  const { startOrder } = useRetailer();

  const styles =
    variant === "dark"
      ? "bg-[var(--text-strong)] text-white"
      : variant === "light"
        ? "bg-white text-[var(--text-strong)]"
        : "bg-[var(--whatsapp)] text-white shadow-[0_14px_30px_rgba(37,150,95,0.28)]";

  return (
    <button
      type="button"
      onClick={() => {
        void startOrder(productSlug);
      }}
      className={`inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-semibold transition hover:-translate-y-0.5 ${styles}`}
    >
      {label}
    </button>
  );
}
