import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HERO_SLIDE_MS, HeroCarousel, type HeroSlide } from "@/components/hero-carousel";

const slides: HeroSlide[] = [
  { slug: "style-1", title: "Style 1", image: "/p/1.webp", price: "Rs. 1,000" },
  { slug: "style-2", title: "Style 2", image: "/p/2.webp", price: "Rs. 2,000" },
  { slug: "style-3", title: "Style 3", image: "/p/3.webp", price: "Rs. 3,000" },
];

function shownStyle() {
  return screen.getByRole("link", { name: /^See Style \d/ });
}

describe("HeroCarousel", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("shows the first style with a link to it", () => {
    render(<HeroCarousel slides={slides} />);

    expect(shownStyle()).toHaveAccessibleName("See Style 1 · Rs. 1,000");
    expect(shownStyle()).toHaveAttribute("href", "/products/style-1");
    expect(screen.getByRole("heading", { level: 1, name: "Fresh styles for your shop" })).toBeInTheDocument();
  });

  it("moves to the next style on its own and loops back", () => {
    render(<HeroCarousel slides={slides} />);

    act(() => vi.advanceTimersByTime(HERO_SLIDE_MS));
    expect(shownStyle()).toHaveAttribute("href", "/products/style-2");

    act(() => vi.advanceTimersByTime(HERO_SLIDE_MS));
    expect(shownStyle()).toHaveAttribute("href", "/products/style-3");

    act(() => vi.advanceTimersByTime(HERO_SLIDE_MS));
    expect(shownStyle()).toHaveAttribute("href", "/products/style-1");
  });

  it("shows a style when its marker is tapped", () => {
    render(<HeroCarousel slides={slides} />);

    fireEvent.click(screen.getByRole("button", { name: "Show style 3 of 3" }));

    expect(shownStyle()).toHaveAttribute("href", "/products/style-3");
    expect(screen.getByRole("button", { name: "Show style 3 of 3" })).toHaveAttribute("aria-current", "true");
  });

  it("waits while the mouse is on it", () => {
    const { container } = render(<HeroCarousel slides={slides} />);

    fireEvent.pointerEnter(container.firstElementChild as HTMLElement, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(HERO_SLIDE_MS * 2));
    expect(shownStyle()).toHaveAttribute("href", "/products/style-1");

    fireEvent.pointerLeave(container.firstElementChild as HTMLElement, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(HERO_SLIDE_MS));
    expect(shownStyle()).toHaveAttribute("href", "/products/style-2");
  });

  it("does not move on its own when the buyer prefers less motion", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("reduce"), media: query }));
    render(<HeroCarousel slides={slides} />);

    act(() => vi.advanceTimersByTime(HERO_SLIDE_MS * 2));

    expect(shownStyle()).toHaveAttribute("href", "/products/style-1");
  });

  it("keeps the shop buttons", () => {
    render(<HeroCarousel slides={slides} />);

    expect(screen.getByRole("link", { name: "Shop new styles" })).toHaveAttribute("href", "#new-arrivals");
    expect(screen.getByRole("link", { name: "Ask on WhatsApp" })).toBeInTheDocument();
  });
});
