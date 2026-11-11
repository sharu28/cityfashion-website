import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CategoryTabs } from "@/components/category-tabs";
import { OrderCartProvider } from "@/components/order-cart-provider";
import { SiteHeader } from "@/components/site-header";
import { WhatsAppFloat } from "@/components/whatsapp-float";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

describe("site shell", () => {
  it("renders the wordmark and an order link with the style count", () => {
    render(
      <OrderCartProvider>
        <SiteHeader />
      </OrderCartProvider>,
    );

    expect(screen.getByRole("link", { name: /City Fashion home/ })).toHaveAttribute("href", "/");
    const orderLink = screen.getByRole("link", { name: /Order, 0 styles/ });
    expect(orderLink).toHaveAttribute("href", "/order");
  });

  it("category tabs mark the active category", () => {
    render(<CategoryTabs activeSlug="frocks" />);

    expect(screen.getByRole("link", { name: "Frocks" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "All" })).toHaveAttribute("href", "/#all-styles");
  });

  it("whatsapp float links to the shop number", () => {
    render(<WhatsAppFloat />);

    const link = screen.getByRole("link", { name: "Chat on WhatsApp" });
    expect(link.getAttribute("href")).toContain("wa.me/94783232414");
  });
});
