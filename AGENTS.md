# AGENTS.md

## Project

City Fashion website built with Next.js.

- Business: Sri Lankan wholesale ladies' wear supplier for retailers
- Main goal: help buyers browse styles fast and move into WhatsApp orders
- WhatsApp number: `+94742216040`
- Address: `131 Keyzer Street, Colombo 11`

## Product And UX Rules

- Keep the site mobile-first
- Keep the site image-heavy and product-led
- Use very simple English in UI copy
- Avoid luxury-brand language, startup wording, and long company-story sections
- Strong WhatsApp CTA should stay visible and obvious across the site
- Main user flow:
  1. Browse category or new arrivals
  2. Open product
  3. View all colors
  4. Order on WhatsApp
- Show starting price and MOQ
- Do not show stock status

## Categories

Use only these category slugs unless the business asks to expand them:

- `frocks`
- `embroidered-tops`
- `top-and-pant-sets`
- `side-open-tops`
- `lungi-sets`
- `leggings`
- `plaza-pants`
- `printed-tops`

## Product Source Folders

Raw product photos live outside the repo here:

`C:\Users\sharu\Projects\family-biz\products`

Expected structure:

```text
C:\Users\sharu\Projects\family-biz\products
  4080
    ref_model.jpeg
    IMG_7397 (1).png
    IMG_7398 (1).png
  4081
    front.jpg
    back.jpg
    red.jpg
```

Rules:

- Put each product in its own folder
- Prefer folder name = product code
- Keep only website-ready images in that folder when possible
- If extra images must stay, exclude them in overrides
- Prefer one clear cover image and set it first with `imageOrder`

## Product Metadata

Product metadata is maintained in:

`data/product-overrides.json`

Each top-level key should match the product folder name.

Supported fields:

- `title`
- `slug`
- `category`
- `startingPrice`
- `moq`
- `description`
- `colors`
- `isNewArrival`
- `isSaleItem`
- `imageOrder`
- `sourceSubfolders`
- `excludeImages`
- `notes`

Example:

```json
{
  "4081": {
    "title": "Style 4081",
    "category": "frocks",
    "startingPrice": "Rs. 2,250",
    "moq": "6 pcs",
    "description": "Easy frock for retail shops.",
    "colors": ["Black", "Blue", "Rose"],
    "isNewArrival": true,
    "isSaleItem": false,
    "imageOrder": ["front.jpg", "back.jpg", "red.jpg"],
    "sourceSubfolders": ["."],
    "excludeImages": ["draft.jpg"],
    "notes": "Optional internal note"
  }
}
```

## Import Workflow

Importer script:

`scripts/import-products.mjs`

What it does:

- reads product folders from `../products`
- copies images into `public/products`
- generates `data/generated/products.generated.json`
- validates category slugs
- warns on missing folders, empty image sets, or bad overrides

Run this after product changes:

```bash
npm run import-products
```

Then verify:

```bash
npm run check
npm run build
```

For local preview:

```bash
npm run dev
```

## Files That Matter Most

- `src/app/page.tsx` for homepage
- `src/app/category/[slug]/page.tsx` for category pages
- `src/app/products/[slug]/page.tsx` for product pages
- `src/lib/catalog.ts` for catalog shaping and WhatsApp links
- `data/product-overrides.json` for business-managed product metadata
- `scripts/import-products.mjs` for import rules

## Deployment Notes

This project is intended for GitHub push and later Vercel deployment.

Important:

- Vercel can only deploy files inside the repo
- Always run `npm run import-products` before pushing
- Commit generated assets in `public/products`
- Commit generated data in `data/generated/products.generated.json`

Typical publish flow:

```bash
git add .
git commit -m "Update City Fashion catalog"
git push origin main
```

Then import the repo into Vercel and deploy as a standard Next.js app.

## Editing Guidance For Future Agents

- Preserve user files
- Prefer practical maintainable code over overengineering
- Keep copy short and clear
- Do not add stock-status UI
- Do not turn the site into a copy-heavy brand site
- If expanding data fields, keep the importer and generated data in sync
- If changing product rendering, keep WhatsApp order flow obvious on mobile
