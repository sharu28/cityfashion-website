// Cuts a small round-ready fabric swatch for each product colour from its photo (public/swatches/<slug>/<colour>.webp),
// measures its main colour, and writes both to data/color-swatches.json.
// A colour's photo is the first photo whose file name starts with the colour (close-ups skipped).
// Run after adding or changing product photos: node scripts/make-color-swatches.mjs
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const products = JSON.parse(await readFile(path.join(root, "data/generated/products.generated.json"), "utf8"));

const slug = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const photoKey = (image) =>
  image.split("/").pop().replace(/\.[a-z0-9]+$/i, "").replace(/^\d+-/, "").replace(/^d[0-9a-z]+-(\d+-)?/i, "");
const isCloseUp = (key) => /-(neckline|collar|print-sleeve|back)$/.test(key);

const bottomsCategories = new Set(["plaza-pants", "leggings"]);

/** Candidate square crops on the garment: around the chest for tops and frocks, the thigh for pants. */
function fabricRegions(width, height, category) {
  const size = Math.round(width * 0.18);
  const rows = bottomsCategories.has(category) ? [0.6, 0.66, 0.72] : [0.3, 0.36, 0.42, 0.48];
  return rows.flatMap((y) =>
    [0.42, 0.5, 0.58].map((x) => ({ left: Math.round(width * x - size / 2), top: Math.round(height * y), width: size, height: size })),
  );
}

async function meanColor(file, region) {
  const { data } = await sharp(file).extract(region).resize(24, 24, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const sum = [0, 0, 0];
  for (let i = 0; i < data.length; i += 3) for (let c = 0; c < 3; c += 1) sum[c] += data[i + c];
  return sum.map((value) => value / (data.length / 3));
}

/** Most common colour in a crop. */
async function mainColor(file, region) {
  const { data } = await sharp(file).extract(region).resize(40, 40, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const buckets = new Map();
  for (let i = 0; i < data.length; i += 3) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    const key = `${r >> 5},${g >> 5},${b >> 5}`;
    const bucket = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    bucket.n += 1;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    buckets.set(key, bucket);
  }
  const best = [...buckets.values()].sort((a, b) => b.n - a.n)[0];
  return `#${[best.r, best.g, best.b].map((sum) => Math.round(sum / best.n).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Writes the swatch image and returns its main colour. An arm, hand or background can sit in one crop, but the
 * garment fills most of them, so the crop closest to the median colour of all crops is kept.
 */
async function makeSwatch(file, out, category) {
  const { width, height } = await sharp(file).metadata();
  const regions = fabricRegions(width, height, category);
  const means = await Promise.all(regions.map((region) => meanColor(file, region)));
  const median = [0, 1, 2].map((c) => means.map((m) => m[c]).sort((a, b) => a - b)[Math.floor(means.length / 2)]);
  const distance = (m) => m.reduce((total, value, c) => total + (value - median[c]) ** 2, 0);
  const bestIndex = means.reduce((best, m, index) => (distance(m) < distance(means[best]) ? index : best), 0);
  const region = regions[bestIndex];
  await sharp(file).extract(region).resize(72, 72).webp({ quality: 70 }).toFile(out);
  return mainColor(file, region);
}

const swatchRoot = path.join(root, "public/swatches");
await rm(swatchRoot, { recursive: true, force: true });
const out = {};
for (const product of products) {
  if (!product.colors?.length) continue;
  const entries = {};
  await mkdir(path.join(swatchRoot, product.slug), { recursive: true });
  for (const color of product.colors) {
    const key = slug(color.split("/")[0]);
    const image = product.images.find((src) => {
      const photo = photoKey(src);
      return photo.startsWith(key) && !isCloseUp(photo);
    });
    if (!image || image.startsWith("http")) continue;
    try {
      const swatch = `/swatches/${product.slug}/${key}.webp`;
      const hex = await makeSwatch(path.join(root, "public", image), path.join(root, "public", swatch), product.category);
      entries[color] = { hex, swatch };
    } catch (error) {
      console.warn(`skip ${product.slug} ${color}: ${error.message}`);
    }
  }
  if (Object.keys(entries).length) out[product.slug] = entries;
}

await writeFile(path.join(root, "data/color-swatches.json"), `${JSON.stringify(out, null, 2)}\n`);
console.log(`swatches for ${Object.keys(out).length} styles`);
