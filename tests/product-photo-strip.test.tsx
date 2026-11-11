import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { HOVER_PHOTO_MS, ProductPhotoStrip } from "@/components/product-photo-strip";

const photos = (count: number) => Array.from({ length: count }, (_, index) => `/p/${index + 1}.webp`);

function stripOf(container: HTMLElement) {
  const strip = container.querySelector<HTMLElement>("[data-photo-strip]");
  if (!strip) throw new Error("strip not found");
  return strip;
}

function sizeStrip(strip: HTMLElement, width: number) {
  Object.defineProperty(strip, "clientWidth", { configurable: true, value: width });
  // jsdom has no element scrollTo; record the target like a browser would.
  if (!strip.scrollTo) strip.scrollTo = ((options: ScrollToOptions) => { strip.scrollLeft = options.left ?? 0; }) as typeof strip.scrollTo;
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

  it("shows a repeated photo only once", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ProductPhotoStrip images={["/p/1.webp", "/p/2.webp", "/p/1.webp"]} title="Printed frock" imageSizes="50vw" />);

    expect(screen.getAllByRole("img")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Photo 2 of 2" })).toBeInTheDocument();
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });

  it("keeps photo markers out of the keyboard tab order", () => {
    render(<ProductPhotoStrip images={photos(4)} title="Printed frock" imageSizes="50vw" />);

    for (const marker of screen.getAllByRole("button", { name: /^Photo \d of 4$/ })) {
      expect(marker).toHaveAttribute("tabindex", "-1");
    }
    expect(screen.getByRole("button", { name: "Next photo" })).not.toHaveAttribute("tabindex", "-1");
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

  it("plays the photos slowly while the mouse rests on the card", () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<ProductPhotoStrip images={photos(3)} title="Printed frock" imageSizes="50vw" />);
      sizeStrip(stripOf(container), 200);
      const card = container.firstElementChild as HTMLElement;

      fireEvent.pointerEnter(card, { pointerType: "mouse" });
      act(() => vi.advanceTimersByTime(HOVER_PHOTO_MS - 50));
      expect(screen.getByRole("button", { name: "Photo 1 of 3" })).toHaveAttribute("aria-current", "true");

      act(() => vi.advanceTimersByTime(100));
      expect(screen.getByRole("button", { name: "Photo 2 of 3" })).toHaveAttribute("aria-current", "true");

      act(() => vi.advanceTimersByTime(HOVER_PHOTO_MS * 2));
      expect(screen.getByRole("button", { name: "Photo 1 of 3" })).toHaveAttribute("aria-current", "true");
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not change photo when the mouse just moves across", () => {
    const { container } = render(<ProductPhotoStrip images={photos(4)} title="Printed frock" imageSizes="50vw" />);
    const strip = stripOf(container);
    sizeStrip(strip, 200);

    fireEvent.pointerMove(strip, { pointerType: "mouse", clientX: 150 });

    expect(strip.scrollLeft).toBe(0);
    expect(screen.getByRole("button", { name: "Photo 1 of 4" })).toHaveAttribute("aria-current", "true");
  });

  it("stops and goes back to the first photo when the mouse leaves", () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<ProductPhotoStrip images={photos(3)} title="Printed frock" imageSizes="50vw" />);
      sizeStrip(stripOf(container), 200);
      const card = container.firstElementChild as HTMLElement;

      fireEvent.pointerEnter(card, { pointerType: "mouse" });
      act(() => vi.advanceTimersByTime(HOVER_PHOTO_MS + 10));
      fireEvent.pointerLeave(card, { pointerType: "mouse" });
      act(() => vi.advanceTimersByTime(HOVER_PHOTO_MS * 3));

      expect(screen.getByRole("button", { name: "Photo 1 of 3" })).toHaveAttribute("aria-current", "true");
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not play photos on touch", () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<ProductPhotoStrip images={photos(3)} title="Printed frock" imageSizes="50vw" />);
      sizeStrip(stripOf(container), 200);
      const card = container.firstElementChild as HTMLElement;

      fireEvent.pointerEnter(card, { pointerType: "touch" });
      act(() => vi.advanceTimersByTime(HOVER_PHOTO_MS * 2));

      expect(screen.getByRole("button", { name: "Photo 1 of 3" })).toHaveAttribute("aria-current", "true");
    } finally {
      vi.useRealTimers();
    }
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
