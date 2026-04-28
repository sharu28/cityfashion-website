"use client";

import { useRetailer } from "@/components/retailer-provider";

type SaveProductButtonProps = {
  productSlug: string;
};

export function SaveProductButton({ productSlug }: SaveProductButtonProps) {
  const { isSaved, toggleShortlist } = useRetailer();
  const saved = isSaved(productSlug);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void toggleShortlist(productSlug);
      }}
      className={`inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-semibold transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 active:translate-y-px active:scale-[0.98] ${
        saved
          ? "bg-[var(--text-strong)] text-white shadow-[0_10px_24px_rgba(33,31,27,0.18)]"
          : "border border-white/70 bg-[rgba(255,253,248,0.92)] text-[var(--text-strong)] shadow-[0_10px_20px_rgba(33,31,27,0.12)] backdrop-blur"
      }`}
      aria-pressed={saved}
    >
      {saved ? "Saved" : "Save"}
    </button>
  );
}
