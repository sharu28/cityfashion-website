import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ProductPhotoStrip } from "@/components/product-photo-strip";

const photos = (count: number) => Array.from({ length: count }, (_, index) => `/p/${index + 1}.webp`);

function stripOf(container: HTMLElement) {
  const strip = container.querySelector<HTMLElement>("[data-photo-strip]");
  if (!strip) throw new Error("strip not found");
  return strip;
}

function sizeStrip(strip: HTMLElement, width: number) {
  Object.defineProperty(strip, "clientWidth", { configurable: true, value: width });
  strip.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width, height: width, right: width, bottom: width, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
}

describe("ProductPhotoStrip", () => {
  it("renders one image per photo and a marker for each", () => {
    render(<ProductPhotoStrip images={photos(4)} title="Printed frock" imageSizes="50vw" />);

    expect(screen.getAllByRole("img")).toHaveLength(4);
    expect(screen.getByRole("button", { name: "Photo 1 of 4" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: "Photo 4 of 4" })).not.toHaveAttribute("aria-current");
  });

  it("scrolls to a photo when its marker is tapped", async () => {
    const user = userEvent.setup();
    const { container } = render(<ProductPhotoStrip images={photos(4)} title="Printed frock" imageSizes="50vw" />);
    const strip = stripOf(container);
    sizeStrip(strip, 200);
    strip.scrollTo = vi.fn();

    await user.click(screen.getByRole("button", { name: "Photo 3 of 4" }));

    expect(strip.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ left: 400 }));
  });

  it("marks the photo in view after a swipe", () => {
    const { container } = render(<ProductPhotoStrip images={photos(4)} title="Printed frock" imageSizes="50vw" />);
    const strip = stripOf(container);
    sizeStrip(strip, 200);

    strip.scrollLeft = 400;
    fireEvent.scroll(strip);

    expect(screen.getByRole("button", { name: "Photo 3 of 4" })).toHaveAttribute("aria-current", "true");
  });

  it("shows a counter instead of markers for many photos", () => {
    render(<ProductPhotoStrip images={photos(16)} title="Printed top" imageSizes="50vw" />);

    expect(screen.queryByRole("button", { name: /^Photo/ })).not.toBeInTheDocument();
    expect(screen.getByText("1 / 16")).toBeInTheDocument();
  });

  it("picks the photo under the mouse on desktop", () => {
    const { container } = render(<ProductPhotoStrip images={photos(4)} title="Printed frock" imageSizes="50vw" />);
    const strip = stripOf(container);
    sizeStrip(strip, 200);

    fireEvent.pointerMove(strip, { pointerType: "mouse", clientX: 150 });

    expect(strip.scrollLeft).toBe(600);
  });

  it("ignores touch pointer moves so swiping stays native", () => {
    const { container } = render(<ProductPhotoStrip images={photos(4)} title="Printed frock" imageSizes="50vw" />);
    const strip = stripOf(container);
    sizeStrip(strip, 200);

    fireEvent.pointerMove(strip, { pointerType: "touch", clientX: 150 });

    expect(strip.scrollLeft).toBe(0);
  });

  it("lets the page scroll up and down from a photo", () => {
    const { container } = render(<ProductPhotoStrip images={photos(4)} title="Printed frock" imageSizes="50vw" />);

    expect(stripOf(container).style.touchAction).toContain("pan-y");
  });

  it("links photos to the product with the title in the name", () => {
    render(<ProductPhotoStrip images={photos(2)} title="Printed frock" imageSizes="50vw" href="/products/frock" />);

    const links = screen.getAllByRole("link", { name: /Printed frock/ });
    expect(links[0]).toHaveAttribute("href", "/products/frock");
  });

  it("has previous and next buttons", async () => {
    const user = userEvent.setup();
    const { container } = render(<ProductPhotoStrip images={photos(4)} title="Printed frock" imageSizes="50vw" />);
    const strip = stripOf(container);
    sizeStrip(strip, 200);
    strip.scrollTo = vi.fn();

    await user.click(screen.getByRole("button", { name: "Next photo" }));

    expect(strip.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ left: 200 }));
  });
});
