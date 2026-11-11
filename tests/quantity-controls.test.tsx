import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { QuantityInput } from "@/components/quantity-input";
import { SizeQuantityRows } from "@/components/size-quantity-rows";
import type { SizeSplit } from "@/lib/sizes";

const sizes = ["M", "L", "XL", "2XL"];

function RowsHarness({ onChange = () => {} }: { onChange?: (next: SizeSplit) => void }) {
  const [split, setSplit] = useState<SizeSplit>({ M: 1, L: 2, XL: 2, "2XL": 1 });
  return (
    <SizeQuantityRows
      sizes={sizes}
      split={split}
      unitPriceLkr={1500}
      onChange={(next) => {
        setSplit(next);
        onChange(next);
      }}
    />
  );
}

describe("QuantityInput", () => {
  it("keeps the order test names for a single quantity", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<QuantityInput value={6} min={6} onChange={onChange} />);

    expect(screen.getByRole("textbox", { name: "Quantity" })).toHaveValue("6");
    expect(screen.getByRole("button", { name: "Remove one piece" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Add one piece" }));
    expect(onChange).toHaveBeenCalledWith(7);
  });

  it("commits a typed number on blur", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<QuantityInput value={6} min={6} onChange={onChange} />);

    const field = screen.getByRole("textbox", { name: "Quantity" });
    await user.clear(field);
    await user.type(field, "12");
    await user.tab();

    expect(onChange).toHaveBeenCalledWith(12);
  });

  it("restores the value when the typed number is empty or too small", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<QuantityInput value={6} min={6} onChange={onChange} />);

    const field = screen.getByRole("textbox", { name: "Quantity" });
    await user.clear(field);
    await user.tab();
    expect(field).toHaveValue("6");

    await user.clear(field);
    await user.type(field, "3");
    await user.keyboard("{Enter}");
    expect(field).toHaveValue("6");
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("SizeQuantityRows", () => {
  it("shows the split per size and the running total", () => {
    render(<RowsHarness />);

    expect(screen.getByRole("textbox", { name: "Quantity, size L" })).toHaveValue("2");
    expect(screen.getByRole("textbox", { name: "Quantity, size 2XL" })).toHaveValue("1");
    expect(screen.getByText("6 pcs · Rs. 9,000")).toBeInTheDocument();
  });

  it("changes one size at a time", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RowsHarness onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Add one piece, size M" }));

    expect(onChange).toHaveBeenLastCalledWith({ M: 2, L: 2, XL: 2, "2XL": 1 });
    expect(screen.getByText("7 pcs · Rs. 10,500")).toBeInTheDocument();
  });

  it("warns when the total drops under the minimum", async () => {
    const user = userEvent.setup();
    render(<RowsHarness />);

    await user.click(screen.getByRole("button", { name: "Remove one piece, size L" }));

    expect(screen.getByRole("status")).toHaveTextContent("Minimum 6 pieces for this style");
  });

  it("lets a size go down to zero but not below", async () => {
    const user = userEvent.setup();
    render(<RowsHarness />);

    await user.click(screen.getByRole("button", { name: "Remove one piece, size M" }));

    expect(screen.getByRole("textbox", { name: "Quantity, size M" })).toHaveValue("0");
    expect(screen.getByRole("button", { name: "Remove one piece, size M" })).toBeDisabled();
  });
});
