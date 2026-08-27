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
        : "bg-[var(--whatsapp)] text-white";

  return (
    <button
      type="button"
      onClick={() => {
        void startOrder(productSlug);
      }}
      className={`inline-flex min-h-11 items-center justify-center border border-transparent px-5 text-[0.78rem] font-black uppercase tracking-[0.12em] transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 active:translate-y-px active:scale-[0.98] ${styles}`}
    >
      {label}
    </button>
  );
}
