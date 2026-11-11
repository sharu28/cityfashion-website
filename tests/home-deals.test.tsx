import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Home from "@/app/page";
import { OrderCartProvider } from "@/components/order-cart-provider";
import { OrderSizesProvider } from "@/components/order-sizes-provider";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

vi.mock("@/lib/catalog", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/catalog")>();
  return { ...actual, retailerDeals: actual.allProducts.slice(0, 1) };
});

describe("home page with a deal", () => {
  it("shows deals when some exist", () => {
    render(
      <OrderCartProvider>
        <OrderSizesProvider>
          <Home />
        </OrderSizesProvider>
      </OrderCartProvider>,
    );

    expect(screen.getByRole("heading", { name: "Deals for shops" })).toBeInTheDocument();
  });
});
