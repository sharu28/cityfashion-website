import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrderCartBar } from "@/components/order-cart-bar";
import { OrderCartProvider } from "@/components/order-cart-provider";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

describe("OrderCartBar", () => {
  beforeEach(() => localStorage.clear());

  it("keeps the link text the order tests read", async () => {
    localStorage.setItem(
      "city-fashion-order-cart-v1",
      JSON.stringify([{ productSlug: "style-1390-printed-long-frock", quantity: 6 }]),
    );
    render(
      <OrderCartProvider>
        <OrderCartBar />
      </OrderCartProvider>,
    );

    const link = await screen.findByRole("link", { name: /^View order/ });
    expect(link).toHaveAccessibleName("View order · 1 style · Rs. 9,000");
    expect(link).toHaveAttribute("href", "/order");
    expect(screen.getByText("6 pcs")).toBeInTheDocument();
  });

  it("is hidden when the order is empty", async () => {
    render(
      <OrderCartProvider>
        <OrderCartBar />
      </OrderCartProvider>,
    );

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByRole("link", { name: /^View order/ })).not.toBeInTheDocument();
  });
});
