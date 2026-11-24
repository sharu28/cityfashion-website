// Writes smaller copies of every public/products/**/*.webp into public/_img/w<width>/products/...
// so next/image can hand phones a picture sized for their screen instead of the full original.
// Runs before `next build` (see package.json). The output is generated, not committed.
// The widths must match `variantWidths` in src/lib/image-loader.ts.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

export const variantWidths = [320, 480, 640, 828, 1200];
const quality = 72;
const sourceRoot = path.join("public", "products");
const outputRoot = path.join("public", "_img");

function listWebp(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listWebp(full);
    return entry.name.toLowerCase().endsWith(".webp") ? [full] : [];
  });
}

const sources = listWebp(sourceRoot);
const wanted = new Set();
const jobs = [];

for (const source of sources) {
  const relative = path.relative("public", source);
  const sourceTime = fs.statSync(source).mtimeMs;
  for (const width of variantWidths) {
    const target = path.join(outputRoot, `w${width}`, relative);
    wanted.add(path.resolve(target));
    if (fs.existsSync(target) && fs.statSync(target).mtimeMs >= sourceTime) continue;
    jobs.push({ source, target, width });
  }
}

let next = 0;
async function worker() {
  while (next < jobs.length) {
    const { source, target, width } = jobs[next++];
    fs.mkdirSync(path.dirname(target), { recursive: true });
    await sharp(source)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality, effort: 4 })
      .toFile(target);
  }
}
await Promise.all(Array.from({ length: Math.max(2, os.cpus().length) }, worker));

// Drop variants whose source picture was removed.
let removed = 0;
for (const file of listWebp(outputRoot)) {
  if (!wanted.has(path.resolve(file))) {
    fs.rmSync(file);
    removed++;
  }
}

console.log(
  `Image variants: ${sources.length} sources, ${jobs.length} written, ${removed} removed (widths ${variantWidths.join(", ")}).`,
);
