import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Home from "@/app/page";
import { OrderCartProvider } from "@/components/order-cart-provider";
import { OrderSizesProvider } from "@/components/order-sizes-provider";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

function renderHome() {
  return render(
    <OrderCartProvider>
      <OrderSizesProvider>
        <Home />
      </OrderSizesProvider>
    </OrderCartProvider>,
  );
}

describe("home page", () => {
  it("shows new arrivals and all styles", () => {
    const { container } = renderHome();

    expect(screen.getByRole("heading", { name: "New arrivals" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "All styles" })).toBeInTheDocument();
    expect(container.querySelector("#all-styles")).not.toBeNull();
    expect(screen.getByRole("link", { name: "Shop new styles" })).toHaveAttribute("href", "#new-arrivals");
  });

  it("hides deals when none exist", () => {
    renderHome();

    expect(screen.queryByRole("heading", { name: "Deals for shops" })).not.toBeInTheDocument();
  });
});
