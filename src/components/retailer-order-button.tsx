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
      ? "bg-[var(--text-strong)] text-white shadow-[0_12px_28px_rgba(33,31,27,0.16)]"
      : variant === "light"
        ? "bg-white text-[var(--text-strong)]"
        : "bg-[var(--whatsapp)] text-white shadow-[0_14px_30px_rgba(31,143,89,0.24)]";

  return (
    <button
      type="button"
      onClick={() => {
        void startOrder(productSlug);
      }}
      className={`inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-bold transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 active:translate-y-px active:scale-[0.98] ${styles}`}
    >
      {label}
    </button>
  );
}
