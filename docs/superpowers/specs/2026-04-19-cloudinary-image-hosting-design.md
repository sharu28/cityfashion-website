# Cloudinary Image Hosting Design

Date: 2026-04-19

## Goal

Use Cloudinary to host City Fashion product images so pages load faster, while keeping repo-local product images as a fallback cache.

## Scope

This design covers:

- product image import changes
- Cloudinary upload behavior
- generated catalog data changes
- app image URL selection
- verification and operational docs

This design does not cover:

- product metadata cleanup
- category review
- Cloudinary admin workflows outside the importer
- image editing or background removal

## Current State

- `scripts/import-products.mjs` reads source images from `../products`
- the importer copies ordered images into `public/products/<slug>/`
- generated catalog data in `data/generated/products.generated.json` stores local image paths only
- the app renders product images with `next/image`
- the site currently relies on repo-hosted product files for catalog rendering

## Chosen Approach

Extend `npm run import-products` so one command does both:

1. copy website-ready product images into `public/products` for local fallback
2. upload the same ordered images to Cloudinary automatically
3. write both local and Cloudinary image URLs into generated catalog data
4. make the app prefer Cloudinary URLs while falling back to local paths when Cloudinary is unavailable

This keeps the existing workflow familiar and preserves safe rollback behavior.

## Rejected Alternatives

### Cloudinary fetch-only rewrite

Using Cloudinary fetch URLs without uploading source assets would be faster to wire initially, but it gives weaker control over asset naming, invalidation, and upload reliability. It also ties production rendering to remote fetch behavior instead of a managed upload step.

### Separate sync command

Splitting upload into a second manual command would reduce importer responsibility, but it increases operator error and makes it easier for generated data to drift from hosted assets.

### Manifest-and-hash sync layer

A hash manifest would reduce repeat uploads and is a good future optimization, but it adds complexity that is not necessary for the current catalog size.

## Architecture

### Import pipeline

For each product folder:

1. resolve the ordered source image list using existing override rules
2. copy files into `public/products/<slug>/`
3. upload the copied files to Cloudinary under a stable public path
4. collect local fallback URLs and Cloudinary hosted URLs
5. write both URL sets into the generated product record

### Cloudinary path scheme

Use a stable folder structure:

- `cityfashion/products/<product-slug>/<image-slug>`

This keeps URLs predictable across repeated imports and makes replacement behavior straightforward.

### Generated data shape

Each product record will continue to include local `images`.

It will also add:

- `cloudinaryImages: string[]`

The app will treat `cloudinaryImages` as the primary source and `images` as fallback.

### App selection behavior

Catalog normalization in `src/lib/catalog.ts` will expose a single resolved image list that prefers Cloudinary when present. Existing product UI components should keep consuming normalized image URLs instead of knowing about Cloudinary directly.

### Next.js image config

`next.config` will allow remote images from the Cloudinary delivery host so `next/image` can optimize and serve them correctly.

## Failure Handling

### Missing credentials

If Cloudinary environment variables are missing:

- importer logs a clear warning
- local copy still runs
- generated catalog remains usable with local image paths only

### Partial upload failures

If one or more uploads fail:

- importer logs each failed file
- import continues for the rest of the batch
- failed images keep using local fallback paths
- the generated catalog should never point to an empty preferred image list if local images exist

### Duplicate reruns

Repeated imports should overwrite or refresh the same Cloudinary public IDs instead of generating random asset names.

## Environment Variables

The importer will use:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

These should be documented for:

- local development
- CI or local import automation
- Vercel runtime only if any future server-rendered Cloudinary helper requires them

The public storefront should not need the API secret in browser code.

## Verification Plan

After implementation:

1. run `npm run import-products`
2. inspect generated product JSON for both local and Cloudinary image fields
3. run `npm run check`
4. run `npm run build`
5. verify at least one product card and one product page use valid image URLs

## Rollout Notes

- keep `public/products` committed as the repo-local fallback cache
- do not remove existing product image copies from the repo workflow
- do not block deploys on Cloudinary upload if local fallback generation succeeds
- preserve current product rendering and WhatsApp order flow behavior

## Open Questions Resolved

- Keep repo-local images: yes
- Cloudinary upload trigger: automatic inside `npm run import-products`
- Main priority: faster image delivery without adding operational fragility
