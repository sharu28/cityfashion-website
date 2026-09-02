import fs from "node:fs";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";
import {
  buildPublicProduct,
  hasRequiredNewProductFields,
  isPublishedOverride,
  resolveMapping,
  validateOverride,
  validatePublicProduct,
} from "./catalog-publication.mjs";

const projectRoot = process.cwd();
const sourceRoot = path.resolve(projectRoot, "..", "products");
const publicRoot = path.join(projectRoot, "public", "products");
const overridesPath = path.join(projectRoot, "data", "product-overrides.json");
const outputPath = path.join(projectRoot, "data", "generated", "products.generated.json");
const odooSnapshotPath = path.join(projectRoot, "data", "odoo", "odoo-catalog.snapshot.json");
const cloudinaryFolderPrefix = "cityfashion/products";
const fallbackImageWidth = 1600;
const fallbackImageHeight = 2000;
const fallbackImageQuality = 80;

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
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
};

let cloudinaryConfigured = false;
let warnedAboutMissingCloudinaryConfig = false;

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

const hasCloudinaryConfig = () =>
  Boolean(cloudinaryConfig.cloud_name && cloudinaryConfig.api_key && cloudinaryConfig.api_secret);

const ensureCloudinaryConfig = () => {
  if (!hasCloudinaryConfig()) {
    if (!warnedAboutMissingCloudinaryConfig) {
      console.warn("Cloudinary credentials missing. Reusing saved Cloudinary URLs when available, otherwise using local images.");
      warnedAboutMissingCloudinaryConfig = true;
    }

    return false;
  }

  if (!cloudinaryConfigured) {
    cloudinary.config(cloudinaryConfig);
    cloudinaryConfigured = true;
  }

  return true;
};

const buildCloudinaryImageUrl = (publicId, version) =>
  cloudinary.url(publicId, {
    secure: true,
    version,
    transformation: [
      {
        crop: "limit",
        width: 1200,
        fetch_format: "auto",
        quality: "auto",
      },
    ],
  });

const copyDirectoryImages = async (sourceDir, targetDir, slug, options) => {
  fs.rmSync(targetDir, { recursive: true, force: true });
  ensureDir(targetDir);

  const entries = sortEntries(
    listImageEntries(sourceDir, normalizeSubfolders(options.sourceSubfolders), options.excludeImages ?? []),
    options.imageOrder ?? [],
  );

  const usedNames = new Set();
  const assets = [];

  for (const entry of entries) {
    const parsed = path.parse(entry.relativeKey);
    const safeName = `${toSlug(parsed.name)}.webp`;

    if (usedNames.has(safeName)) {
      console.warn(`Duplicate source image name skipped for ${slug}: ${entry.relativeKey}`);
      continue;
    }

    usedNames.add(safeName);

    const targetPath = path.join(targetDir, safeName);
    const publicId = `${cloudinaryFolderPrefix}/${slug}/${path.parse(safeName).name}`;

    await sharp(entry.sourcePath)
      .rotate()
      .resize({
        width: fallbackImageWidth,
        height: fallbackImageHeight,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: fallbackImageQuality, effort: 4 })
      .toFile(targetPath);

    assets.push({
      localPath: targetPath,
      localUrl: `/products/${slug}/${safeName}`,
      publicId,
    });
  }

  return assets;
};

const reuseExistingCloudinaryImages = (assets, existingImages) => {
  if (!existingImages.length) {
    return [];
  }

  let matchedImages = 0;
  const resolvedImages = assets.map((asset) => {
    const existingImage = existingImages.find((image) => image.includes(`/${asset.publicId}`));

    if (existingImage) {
      matchedImages += 1;
      return existingImage;
    }

    return asset.localUrl;
  });

  return matchedImages > 0 ? resolvedImages : [];
};

const uploadImagesToCloudinary = async (assets, existingImages = []) => {
  if (!ensureCloudinaryConfig()) {
    return reuseExistingCloudinaryImages(assets, existingImages);
  }

  const uploadedImages = [];

  for (const asset of assets) {
    try {
      const result = await cloudinary.uploader.upload(asset.localPath, {
        overwrite: true,
        public_id: asset.publicId,
        resource_type: "image",
      });

      uploadedImages.push(buildCloudinaryImageUrl(result.public_id, result.version));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Cloudinary upload failed for ${asset.localPath}: ${message}`);
      uploadedImages.push(asset.localUrl);
    }
  }

  return uploadedImages;
};

const main = async () => {
  const overrides = loadJson(overridesPath, {});
  const existingProducts = loadJson(outputPath, []);
  const odooSnapshot = loadJson(odooSnapshotPath, null);
  const odooFacts = odooSnapshot?.schemaVersion === 1 && Array.isArray(odooSnapshot.products)
    ? odooSnapshot.products
    : [];
  const existingProductsByFolder = new Map(
    existingProducts.map((product) => [product.sourceFolder, product]),
  );

  if (!odooSnapshot) {
    console.warn("No local Odoo snapshot found. Preserving existing public catalog values.");
  }

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
    const existingProduct = existingProductsByFolder.get(folder.name) ?? null;
    const overrideValidation = validateOverride(override, {
      existingProduct: Boolean(existingProduct),
    });
    for (const warning of overrideValidation.warnings) {
      console.warn(`${folder.name}: ${warning}`);
    }
    if (!overrideValidation.valid) {
      console.warn(`${folder.name}: ${overrideValidation.errors.join("; ")}. Skipping publication.`);
      continue;
    }
    if (!isPublishedOverride(override, existingProduct)) {
      console.warn(`${folder.name}: draft product skipped.`);
      continue;
    }

    const mapping = resolveMapping(override, odooFacts);
    let mappedFact = mapping.status === "mapped" ? mapping.fact : null;
    if (mapping.warning && override.odooSyncMode) {
      console.warn(`${folder.name}: ${mapping.warning}`);
    }
    if (!existingProduct) {
      const validNewMapping = ["mapped", "website-only"].includes(mapping.status);
      if (!validNewMapping || !hasRequiredNewProductFields(override)) {
        console.warn(
          `${folder.name}: new products need publicationStatus, complete public fields, and a valid mapped or website-only mode. Skipping publication.`,
        );
        continue;
      }
    } else if (mapping.status !== "mapped") {
      mappedFact = null;
    }

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

    const copiedAssets = await copyDirectoryImages(sourceDir, path.join(publicRoot, slug), slug, override);
    const images = copiedAssets.map((asset) => asset.localUrl);
    const cloudinaryImages = await uploadImagesToCloudinary(
      copiedAssets,
      existingProduct?.cloudinaryImages ?? [],
    );

    if (images.length === 0) {
      console.warn(`No images found for ${folder.name}. Skipping publication.`);
      continue;
    }

    const product = buildPublicProduct({
      folderName: folder.name,
      images,
      cloudinaryImages,
      override: {
        ...override,
        slug,
        category,
      },
      fact: mappedFact,
      previousProduct: existingProduct,
    });
    validatePublicProduct(product);
    products.push(product);
  }

  for (const overrideKey of Object.keys(overrides)) {
    if (!sourceFolderNames.has(overrideKey)) {
      console.warn(`Override exists for "${overrideKey}" but no matching product folder was found.`);
    }
  }

  const publishedSlugs = new Set(products.map((product) => product.slug));
  const staleProductDirectories = fs
    .readdirSync(publicRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !publishedSlugs.has(entry.name));

  for (const directory of staleProductDirectories) {
    fs.rmSync(path.join(publicRoot, directory.name), { recursive: true, force: true });
    console.log(`Removed unpublished generated assets: ${directory.name}`);
  }

  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, `${JSON.stringify(products, null, 2)}\n`);

  console.log(`Imported ${products.length} product folders.`);
};

await main().catch((error) => {
  console.error(error);
  process.exit(1);
});
