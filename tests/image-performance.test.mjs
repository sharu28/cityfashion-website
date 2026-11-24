import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(path, "utf8");

test("local product photos get build-time variants at the same widths the loader asks for", () => {
  const widths = (source) => source.match(/variantWidths = \[([^\]]+)\]/)?.[1].replace(/\s/g, "");
  const script = read("scripts/make-image-variants.mjs");
  const loader = read("src/lib/image-loader.ts");
  const pkg = JSON.parse(read("package.json"));
  const headers = read("public/_headers");

  assert.ok(widths(script));
  assert.equal(widths(loader), widths(script));
  assert.match(pkg.scripts.build, /npm run image-variants && next build/);
  assert.match(read(".gitignore"), /^\/public\/_img\/$/m);
  assert.match(headers, /\/products\/\*\n\s+Cache-Control: public, max-age=604800/);
  assert.match(headers, /\/_img\/\*\n\s+Cache-Control: public, max-age=604800/);
});

test("images stay resized through the Cloudinary loader with bounded responsive widths", () => {
  const config = read("next.config.ts");

  assert.doesNotMatch(config, /unoptimized\s*:\s*true/);
  assert.match(config, /loader:\s*"custom"/);
  assert.match(config, /loaderFile:\s*"\.\/src\/lib\/image-loader\.ts"/);
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
  const homeHero = read("src/components/hero-carousel.tsx");

  assert.doesNotMatch(productGrid, /priority=/);
  assert.doesNotMatch(homePage, /preload=/);
  assert.match(homeHero, /preload=\{panel === 0 && index === 0\}/);
});
