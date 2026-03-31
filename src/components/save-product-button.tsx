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
      className={`inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-semibold transition ${
        saved
          ? "bg-[var(--text-strong)] text-white shadow-[0_10px_24px_rgba(37,25,20,0.2)]"
          : "bg-[rgba(255,250,244,0.92)] text-[var(--text-strong)] shadow-[0_10px_20px_rgba(37,25,20,0.14)]"
      }`}
      aria-pressed={saved}
    >
      {saved ? "Saved" : "Save"}
    </button>
  );
}
