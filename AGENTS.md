# AGENTS.md

## Project

City Fashion website built with Next.js.

- Business: Sri Lankan wholesale ladies' wear supplier for retailers
- Main goal: help buyers browse styles fast and move into WhatsApp orders
- Primary launch domain: `https://cityfashion.shop`
- WhatsApp number: `+94742216040`
- Address: `131 Keyzer Street, Colombo 11`

## Current repo reality

- `cityfashion.shop` is the primary public domain
- Redirect and canonical behavior for the primary domain already exists and should be preserved
- Analytics, sitemap, robots, OG image, and Twitter image routes are already part of the app shell
- Retailer login, shortlist, and gated WhatsApp order flow now exist and depend on Supabase env vars
- The first Google Sheets ops hub is live and should be treated as the working campaign database
- There is an active starter batch of `29` imported product folders
- Most new product category assignments are provisional and should not be treated as business-final
- Source product images live outside the repo in `C:\Users\sharu\Projects\family-biz\products`
- Repo-local operating memory lives in `.memory/`
- Local-only sensitive notes belong in `.memory-private/` and must never be committed

## First stop on resume

When resuming this project, read these first:

- `.memory/PROJECT.md`
- `.memory/STATE.md`
- `.memory/TODO.md`

## Product And UX Rules

- Keep the site mobile-first
- Keep the site image-heavy and product-led
- Use very simple English in UI copy
- Avoid luxury-brand language, startup wording, and long company-story sections
- Strong WhatsApp CTA should stay visible and obvious across the site
- Main user flow:
  1. Browse category or new arrivals
  2. Open product
  3. Save style or view all colors
  4. Login with phone OTP before wishlist or WhatsApp order
  5. Start WhatsApp order
- Show starting price, MOQ, fabric, and size range
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
- Treat the current 29-product batch as a review pass, not final product truth

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
- `fabric`
- `sizeRange`
- `description`
- `colors`
- `isNewArrival`
- `isSaleItem`
- `imageOrder`
- `sourceSubfolders`
- `excludeImages`
- `notes`

Use these docs when working with product data:

- `PRODUCT_IMPORT_GUIDE.md` for the repeatable workflow
- `PRODUCT_REVIEW_NOTES.md` for the current batch cleanup checklist
- `.memory/TODO.md` for the live operating task list

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

- `src/app/layout.tsx` for site shell, metadata, analytics, and footer
- `src/app/page.tsx` for homepage
- `src/app/category/[slug]/page.tsx` for category pages
- `src/app/products/[slug]/page.tsx` for product pages
- `src/app/shortlist/page.tsx` and `src/components/retailer-provider.tsx` for retailer flow
- `src/app/api/**` and `src/lib/supabase/**` for phone OTP, shortlist, and event APIs
- `src/proxy.ts` for host redirect behavior
- `src/lib/catalog.ts` and `src/lib/site.ts` for catalog and site constants
- `supabase/schema.sql` for retailer data tables and policies
- `data/product-overrides.json` for business-managed product metadata
- `scripts/import-products.mjs` for import rules

## Deployment Notes

This project is live on Vercel and connected to GitHub.

Important:

- Vercel can only deploy files inside the repo
- Always run `npm run import-products` before pushing
- Commit generated assets in `public/products`
- Commit generated data in `data/generated/products.generated.json`
- Add Supabase env vars in Vercel before expecting retailer login to work

Typical publish flow:

```bash
git add .
git commit -m "Update City Fashion catalog"
git push origin main
```

## Memory and experiment notes

- `.memory/*` is the public-safe source of truth for ongoing project memory
- `.memory-private/*` is local-only and ignored by git
- Future Paperclip-style orchestration should consume repo memory from a separate sibling workspace
- Future `program.md`-style runs should be treated as experiments and summarized back into `.memory/EXPERIMENTS.md`
- The live ops hub sits outside the repo in Google Sheets and should be updated through the service-account path, not manual repo files

## Editing Guidance For Future Agents

- Preserve user files
- Prefer practical maintainable code over overengineering
- Keep copy short and clear
- Do not add stock-status UI
- Do not turn the site into a copy-heavy brand site
- If expanding data fields, keep the importer and generated data in sync
- If changing product rendering, keep WhatsApp order flow obvious on mobile
- Do not assume provisional categories are correct without business review
