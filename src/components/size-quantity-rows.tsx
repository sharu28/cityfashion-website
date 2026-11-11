"use client";

import { QuantityInput } from "@/components/quantity-input";
import { formatLkr } from "@/lib/catalog";
import { MIN_ORDER_QUANTITY } from "@/lib/order-cart";
import { type SizeSplit, sumSplit } from "@/lib/sizes";

type SizeQuantityRowsProps = {
  sizes: string[];
  split: SizeSplit;
  unitPriceLkr: number;
  /** Called on every change, including drafts under the minimum. The parent decides when to save. */
  onChange(next: SizeSplit): void;
};

export function SizeQuantityRows({ sizes, split, unitPriceLkr, onChange }: SizeQuantityRowsProps) {
  const total = sumSplit(split);
  const isUnderMinimum = total < MIN_ORDER_QUANTITY;

  return (
    <div>
      <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
        {sizes.map((size) => (
          <li key={size} className="flex items-center justify-between gap-4 py-2">
            <span className="text-sm font-semibold">{size}</span>
            <QuantityInput
              size="sm"
              value={split[size] ?? 0}
              min={0}
              label={`Quantity, size ${size}`}
              addLabel={`Add one piece, size ${size}`}
              removeLabel={`Remove one piece, size ${size}`}
              onChange={(next) => onChange({ ...split, [size]: next })}
            />
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-baseline justify-between gap-3 text-sm">
        <p role="status" className={isUnderMinimum ? "text-[var(--danger)]" : "text-[var(--text-soft)]"}>
          {isUnderMinimum ? "Minimum 6 pieces for this style" : "Any mix of sizes, 6 pieces or more"}
        </p>
        <p className="shrink-0 font-semibold">
          {total} pcs · {formatLkr(total * unitPriceLkr)}
        </p>
      </div>
    </div>
  );
}
