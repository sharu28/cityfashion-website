"use client";

import { useState } from "react";

type QuantityInputProps = {
  value: number;
  min: number;
  onChange(next: number): boolean | void;
  label?: string;
  addLabel?: string;
  removeLabel?: string;
  size?: "md" | "sm";
};

/** − [typed number] + control. Typing commits on blur or Enter; bad input falls back to the last value. */
export function QuantityInput({
  value,
  min,
  onChange,
  label = "Quantity",
  addLabel = "Add one piece",
  removeLabel = "Remove one piece",
  size = "md",
}: QuantityInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? String(value);
  const cell = size === "sm" ? "h-10 w-10" : "h-11 w-11";

  function commit() {
    if (draft === null) return;
    const next = Number(draft);
    setDraft(null);
    if (draft.trim() !== "" && Number.isInteger(next) && next >= min && next !== value) {
      onChange(next);
    }
  }

  return (
    <div className="inline-flex items-stretch border border-[var(--ink)] bg-white">
      <button
        type="button"
        aria-label={removeLabel}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className={`${cell} text-lg leading-none transition-colors hover:bg-[var(--fill)] disabled:cursor-not-allowed disabled:opacity-30`}
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={label}
        value={shown}
        onChange={(event) => setDraft(event.target.value.replace(/[^0-9]/g, ""))}
        onFocus={(event) => event.target.select()}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
        }}
        className={`${size === "sm" ? "w-10" : "w-12"} border-x border-[var(--ink)] bg-white text-center text-sm font-semibold outline-none focus:bg-[var(--fill)]`}
      />
      <button
        type="button"
        aria-label={addLabel}
        onClick={() => onChange(value + 1)}
        className={`${cell} text-lg leading-none transition-colors hover:bg-[var(--fill)]`}
      >
        +
      </button>
    </div>
  );
}
