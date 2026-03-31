# Product Import Guide

## Goal

Use this workflow when preparing the next `50-100` products for the City Fashion site.

## 1. Put each style in one folder

Source folder:

`C:\Users\sharu\Projects\family-biz\products`

Example:

```text
products
  4081
    cover.jpg
    back.jpg
    red.jpg
  4082
    front.jpg
    side.jpg
    beige.jpg
```

Rules:

- Folder name should be the style code
- Keep only website-ready images when possible
- Use one clear cover image
- Remove collages, drafts, WhatsApp screenshots, and duplicate exports when possible

## 2. Minimum data needed per product

Every product should have:

- `code`
- `category`
- `startingPrice`
- `moq`
- `description`
- `colors`
- `cover image order`

Use this template:

`data/product-overrides.template.json`

Then copy entries into:

`data/product-overrides.json`

## 3. Suggested cleanup flow for messy folders

For each style:

1. Make one clean folder named by style code
2. Copy the best raw images into it
3. Keep one cover image first
4. Remove unwanted files or list them in `excludeImages`
5. Add the image order in `imageOrder`
6. Add business fields in `data/product-overrides.json`

## 4. Import and check

Run:

```bash
npm run import-products
npm run check
npm run build
```

## 5. Before push

Make sure these are updated:

- `public/products`
- `data/generated/products.generated.json`
- `data/product-overrides.json`

Then commit and push.
