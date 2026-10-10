import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProductImageCarousel } from "@/components/product-image-carousel";

const images = ["/one.webp", "/two.webp", "/three.webp"];

function setReducedMotion(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockReturnValue({ matches }),
  });
}

describe("ProductImageCarousel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setReducedMotion(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("cycles product images on mouse hover and resets on exit", () => {
    render(
      <ProductImageCarousel
        href="/products/style-4110"
        imageSizes="25vw"
        images={images}
        title="Style 4110"
      />,
    );

    const link = screen.getByRole("link");
    expect(screen.getByRole("img")).toHaveAccessibleName("Style 4110, photo 1 of 3");

    fireEvent.pointerEnter(link, { pointerType: "mouse" });
    expect(screen.getByRole("img")).toHaveAccessibleName("Style 4110, photo 2 of 3");

    act(() => vi.advanceTimersByTime(900));
    expect(screen.getByRole("img")).toHaveAccessibleName("Style 4110, photo 3 of 3");

    fireEvent.pointerLeave(link);
    expect(screen.getByRole("img")).toHaveAccessibleName("Style 4110, photo 1 of 3");
  });

  it("keeps the cover image still when reduced motion is requested", () => {
    setReducedMotion(true);

    render(
      <ProductImageCarousel
        href="/products/style-1390"
        imageSizes="25vw"
        images={images}
        title="Style 1390"
      />,
    );

    fireEvent.pointerEnter(screen.getByRole("link"), { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(1800));

    expect(screen.getByRole("img")).toHaveAccessibleName("Style 1390, photo 1 of 3");
  });

  it("renders a plain frame when the parent card already links", () => {
    render(<ProductImageCarousel imageSizes="25vw" images={images} title="Style 3017" />);

    expect(screen.queryByRole("link")).toBeNull();
    fireEvent.pointerEnter(screen.getByRole("img").parentElement!, { pointerType: "mouse" });
    expect(screen.getByRole("img")).toHaveAccessibleName("Style 3017, photo 2 of 3");
  });
});
