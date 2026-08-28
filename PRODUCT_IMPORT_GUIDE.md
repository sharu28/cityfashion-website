# Product Import Guide

## Goal

Use this workflow when preparing and reviewing product batches for the City Fashion site.

The current batch already has starter overrides for `29` imported styles.

## Source and generated locations

- Raw source folders: `C:\Users\sharu\Projects\family-biz\products`
- Website-ready copied images: `public/products`
- Generated catalog data: `data/generated/products.generated.json`
- Current starter overrides: `data/product-overrides.json`
- Reusable starter template: `data/product-overrides.template.json`
- Local Odoo snapshot: `data/odoo/odoo-catalog.snapshot.json` (ignored by Git)
- Local Odoo review: `data/odoo/odoo-catalog.review.json` (ignored by Git)

## Current staged workflow

1. Put each style in one folder inside `../products`
2. Clean obvious bad or duplicate images first
3. Review starter override data in `data/product-overrides.json`
4. Run `npm run import-products`
5. Run `npm run check`
6. Review the site visually
7. Commit and push
8. Update `.memory/STATE.md` and `.memory/TODO.md` if the batch review changed priorities

## What counts as messy

These are the main patterns to clean before trusting the import result:

- grid or collage exports
- random export names
- nested subfolders
- unused video files
- descriptive folder names that need review

## Suggested cleanup flow for messy folders

For each style:

1. Keep the best real product images
2. Remove or ignore grid/collage files
3. Remove duplicate `.jpg` and `.png` versions when possible
4. Ignore video files unless they are needed elsewhere
5. Review folders with names like `1570 KY Bamboo`, `3003 V-3`, `3003 V-6`
6. Set the best cover image first in `imageOrder`

## Product review order

For each product:

1. clean images
2. confirm category
3. fill price and MOQ
4. add colors and short description
5. re-import and review the site

## Minimum data needed per product

Every product should have:

- `code`
- `category`
- `startingPrice`
- `moq`
- `description`
- `colors`
- `cover image order`

## Import and verify

For an Odoo-backed catalog review, first load the local Odoo connection variables through the existing private credential workflow. Then run:

```powershell
npm run sync-odoo-catalog
# Review data/odoo/odoo-catalog.review.json locally.
# Update only explicit mappings and approvals in data/product-overrides.json.
npm run import-products
npm run test:catalog-sync
npm run test:catalog-publication
npm run check
npm run build
```

Review every proposed Odoo ID and merchandising candidate before editing the override. Use `odooSyncMode: "mapped"` only for a confirmed exact product, or `website-only` for a business-approved exception. New and Retailer Deal approvals are public merchandising decisions; the sync does not make them automatically unless the override explicitly uses `auto`.

If the sync or validation fails, the last good local snapshot remains in place. The import and build do not contact Odoo, and they still work when no snapshot is present. Snapshot and review JSON are local-only. Never copy Odoo quantities, movement dates, costs, supplier details, or internal candidate evidence into product overrides or generated public data.

## Before push

Make sure these are updated:

- `public/products`
- `data/generated/products.generated.json`
- `data/product-overrides.json`

Then commit and push.
