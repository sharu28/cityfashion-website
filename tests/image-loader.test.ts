import { describe, expect, it } from "vitest";

import imageLoader from "@/lib/image-loader";

const base = "https://res.cloudinary.com/ds4xc6fcf/image/upload";

describe("image loader", () => {
  it("swaps the Cloudinary width for the requested one", () => {
    expect(
      imageLoader({ src: `${base}/c_limit,f_auto,q_auto,w_1200/v1776596003/cityfashion/products/a/1?_a=BAMAOGWO0`, width: 480 }),
    ).toBe(`${base}/c_limit,f_auto,q_auto,w_480/v1776596003/cityfashion/products/a/1?_a=BAMAOGWO0`);
  });

  it("adds a resize step when the Cloudinary URL has none", () => {
    expect(imageLoader({ src: `${base}/v1776596003/cityfashion/products/a/1`, width: 640 })).toBe(
      `${base}/c_limit,f_auto,q_auto,w_640/v1776596003/cityfashion/products/a/1`,
    );
  });

  it("leaves local product images and other hosts unchanged", () => {
    expect(imageLoader({ src: "/products/style-1390/1.webp", width: 640 })).toBe("/products/style-1390/1.webp");
    expect(imageLoader({ src: "https://example.com/a.jpg", width: 640 })).toBe("https://example.com/a.jpg");
  });
});
