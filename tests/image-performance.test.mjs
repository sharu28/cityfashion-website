import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(path, "utf8");

test("Next image optimization stays enabled with bounded responsive widths", () => {
  const config = read("next.config.ts");

  assert.doesNotMatch(config, /unoptimized\s*:\s*true/);
  assert.match(config, /deviceSizes:\s*\[360, 480, 640, 750, 828, 1080, 1200\]/);
  assert.match(config, /imageSizes:\s*\[160, 240, 320\]/);
});

test("product imports create bounded WebP fallbacks", () => {
  const importer = read("scripts/import-products.mjs");

  assert.match(importer, /import sharp from "sharp"/);
  assert.match(importer, /const fallbackImageWidth = 1600/);
  assert.match(importer, /const fallbackImageHeight = 2000/);
  assert.match(importer, /\.webp\(\{ quality: fallbackImageQuality/);
  assert.match(importer, /Duplicate source image name skipped/);
  assert.match(importer, /Removed unpublished generated assets/);
});

test("only the actual lead image is preloaded", () => {
  const productGrid = read("src/components/product-grid.tsx");
  const homePage = read("src/app/page.tsx");

  assert.doesNotMatch(productGrid, /priority=/);
  assert.match(homePage, /preload=\{index === 0\}/);
});
