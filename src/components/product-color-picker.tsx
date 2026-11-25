"use client";

import { useState } from "react";

import { useOrderLine } from "@/components/order-sizes-provider";
import { useProductPageState } from "@/components/product-page-state";
import { type ColorOption, groupColorOptions } from "@/lib/product-colors";

type ProductColorPickerProps = {
  product: { slug: string; sizeRange?: string };
  options: ColorOption[];
};

function Swatch({ option }: { option: ColorOption }) {
  return (
    <span
      aria-hidden
      className="block h-full w-full rounded-full bg-cover bg-center"
      style={{
        backgroundColor: option.hex ?? "var(--fill)",
        backgroundImage: option.swatch ? `url(${option.swatch})` : undefined,
      }}
    />
  );
}

/** Round colour swatches. Tap to pick colours for the order; the photo of that colour shows above. */
export function ProductColorPicker({ product, options }: ProductColorPickerProps) {
  const line = useOrderLine(product);
  const pageState = useProductPageState();
  const [shown, setShown] = useState<string | null>(null);
  const picked = new Set(line.colors);
  const groups = groupColorOptions(options);

  function toggle(option: ColorOption) {
    line.setColors((current) => {
      const next = current.includes(option.name) ? current.filter((name) => name !== option.name) : [...current, option.name];
      // Keep the catalogue order so the order reads the same way as the page.
      return options.map((entry) => entry.name).filter((name) => next.includes(name));
    });
    setShown(option.name);
    if (option.image) pageState?.showPhoto(option.image);
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="label text-[var(--text-soft)]">
          {options.length} {options.length === 1 ? "colour" : "colours"}
          {picked.size > 0 ? <span className="text-[var(--ink)]"> · {picked.size} picked</span> : null}
        </p>
        {picked.size > 0 ? (
          <button type="button" onClick={() => line.setColors([])} className="min-h-8 text-xs underline underline-offset-4">
            Clear
          </button>
        ) : null}
      </div>

      <p className="mt-1 min-h-5 text-sm font-medium" aria-live="polite">
        {shown ?? "Tap a colour to see it and pick it"}
      </p>

      <div className="mt-2 divide-y divide-[var(--line)]">
        {groups.map((group) => (
          <div
            key={group.name || "all"}
            className={group.name ? "grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-2 py-1.5" : "py-1.5"}
          >
            {group.name ? <p className="text-xs leading-tight text-[var(--text-soft)]">{group.name}</p> : null}
            <ul className="flex flex-wrap gap-1.5">
              {group.options.map((option) => {
                const isPicked = picked.has(option.name);
                const hasSwatch = Boolean(option.swatch || option.hex);
                return (
                  <li key={option.name}>
                    <button
                      type="button"
                      onClick={() => toggle(option)}
                      onPointerEnter={(event) => event.pointerType === "mouse" && setShown(option.name)}
                      onFocus={() => setShown(option.name)}
                      aria-pressed={isPicked}
                      aria-label={option.name}
                      title={option.name}
                      className={
                        hasSwatch
                          ? `relative flex h-10 w-10 items-center justify-center rounded-full p-[3px] ring-offset-0 transition-shadow ${
                              isPicked ? "ring-2 ring-[var(--ink)]" : "ring-1 ring-[var(--line)] hover:ring-[var(--text-soft)]"
                            }`
                          : `min-h-9 border px-2.5 text-xs ${isPicked ? "border-[var(--ink)] bg-[var(--ink)] text-white" : "border-[var(--line)]"}`
                      }
                    >
                      {hasSwatch ? <Swatch option={option} /> : option.name}
                      {hasSwatch && isPicked ? (
                        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--ink)] text-white">
                          <svg aria-hidden width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="m5 12 5 5 9-10" />
                          </svg>
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-[var(--text-soft)]">
        {picked.size > 0
          ? `Picked: ${line.colors.join(", ")}.`
          : "No colour picked? Our staff help you choose on WhatsApp."}
      </p>
    </div>
  );
}
