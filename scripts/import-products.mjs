import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const sourceRoot = path.resolve(projectRoot, "..", "products");
const publicRoot = path.join(projectRoot, "public", "products");
const overridesPath = path.join(projectRoot, "data", "product-overrides.json");
const outputPath = path.join(projectRoot, "data", "generated", "products.generated.json");

const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const validCategories = new Set([
  "frocks",
  "embroidered-tops",
  "top-and-pant-sets",
  "side-open-tops",
  "lungi-sets",
  "leggings",
  "plaza-pants",
  "printed-tops",
]);

const toSlug = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });

const loadJson = (filePath, fallback) => {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
};

const normalizeSubfolders = (value) => {
  if (!value || value.length === 0) {
    return ["."];
  }

  return value;
};

const listImageEntries = (sourceDir, subfolders, excludeImages) =>
  subfolders.flatMap((subfolder) => {
    const resolvedDir = subfolder === "." ? sourceDir : path.join(sourceDir, subfolder);

    if (!fs.existsSync(resolvedDir)) {
      console.warn(`Missing image folder: ${resolvedDir}`);
      return [];
    }

    const relativePrefix = subfolder === "." ? "" : `${subfolder}/`;

    return fs
      .readdirSync(resolvedDir, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .filter((entry) => allowedExtensions.has(path.extname(entry.name).toLowerCase()))
      .filter((entry) => !excludeImages.includes(entry.name))
      .map((entry) => ({
        sourcePath: path.join(resolvedDir, entry.name),
        relativeKey: `${relativePrefix}${entry.name}`.replace(/\\/g, "/"),
      }));
  });

const sortEntries = (entries, imageOrder) => {
  const orderMap = new Map(imageOrder.map((item, index) => [item, index]));

  return [...entries].sort((a, b) => {
    const orderA = orderMap.get(a.relativeKey) ?? orderMap.get(path.basename(a.relativeKey)) ?? Number.MAX_SAFE_INTEGER;
    const orderB = orderMap.get(b.relativeKey) ?? orderMap.get(path.basename(b.relativeKey)) ?? Number.MAX_SAFE_INTEGER;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return a.relativeKey.localeCompare(b.relativeKey);
  });
};

const copyDirectoryImages = (sourceDir, targetDir, slug, options) => {
  fs.rmSync(targetDir, { recursive: true, force: true });
  ensureDir(targetDir);

  const entries = sortEntries(
    listImageEntries(sourceDir, normalizeSubfolders(options.sourceSubfolders), options.excludeImages ?? []),
    options.imageOrder ?? [],
  );

  return entries.map((entry) => {
    const parsed = path.parse(entry.relativeKey);
    const safeName = `${toSlug(parsed.name)}${parsed.ext.toLowerCase()}`;
    const targetPath = path.join(targetDir, safeName);

    fs.copyFileSync(entry.sourcePath, targetPath);

    return `/products/${slug}/${safeName}`;
  });
};

const overrides = loadJson(overridesPath, {});

if (!fs.existsSync(sourceRoot)) {
  console.log("No ../products folder found. Skipping import.");
  process.exit(0);
}

ensureDir(publicRoot);

const sourceFolders = fs
  .readdirSync(sourceRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .sort((a, b) => a.name.localeCompare(b.name));

const sourceFolderNames = new Set(sourceFolders.map((folder) => folder.name));
const products = [];
const usedSlugs = new Set();

for (const folder of sourceFolders) {
  const override = overrides[folder.name] ?? {};
  const sourceDir = path.join(sourceRoot, folder.name);
  const category = validCategories.has(override.category) ? override.category : "printed-tops";
  const slug = override.slug ?? toSlug(override.title ?? `style-${folder.name}`);

  if (override.category && !validCategories.has(override.category)) {
    console.warn(`Invalid category "${override.category}" for ${folder.name}. Using printed-tops.`);
  }

  if (usedSlugs.has(slug)) {
    throw new Error(`Duplicate slug detected: ${slug}`);
  }

  usedSlugs.add(slug);

  const images = copyDirectoryImages(sourceDir, path.join(publicRoot, slug), slug, override);

  if (images.length === 0) {
    console.warn(`No images found for ${folder.name}.`);
  }

  products.push({
    id: folder.name,
    slug,
    title: override.title ?? `Style ${folder.name}`,
    category,
    startingPrice: override.startingPrice ?? "Call for price",
    moq: override.moq ?? "6 pcs",
    fabric: override.fabric ?? "",
    sizeRange: override.sizeRange ?? "",
    description: override.description ?? "Wholesale style for Sri Lanka retailers.",
    colors: override.colors ?? [],
    isNewArrival: override.isNewArrival ?? true,
    isSaleItem: override.isSaleItem ?? false,
    sourceFolder: folder.name,
    notes: override.notes ?? "",
    images,
  });
}

for (const overrideKey of Object.keys(overrides)) {
  if (!sourceFolderNames.has(overrideKey)) {
    console.warn(`Override exists for "${overrideKey}" but no matching product folder was found.`);
  }
}

ensureDir(path.dirname(outputPath));
fs.writeFileSync(outputPath, `${JSON.stringify(products, null, 2)}\n`);

console.log(`Imported ${products.length} product folders.`);
