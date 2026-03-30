# City Fashion Website

Wholesale ladies' wear catalog website for Sri Lanka retailers.

## Local workflow

1. Put product folders in `../products`
2. Update `data/product-overrides.json`
3. Run `npm run import-products`
4. Run `npm run check`
5. Run `npm run dev`

## Product override fields

Each product is matched by folder name. Example:

```json
{
  "4080": {
    "title": "Style 4080",
    "category": "embroidered-tops",
    "startingPrice": "Rs. 1,950",
    "moq": "6 pcs",
    "description": "Easy-selling embroidered top for retail shops.",
    "colors": ["Brown", "Beige"],
    "isNewArrival": true,
    "isSaleItem": false,
    "imageOrder": ["ref_model.jpeg", "IMG_7397 (1).png"],
    "sourceSubfolders": ["."],
    "excludeImages": ["draft.png"],
    "notes": "Optional internal note"
  }
}
```

## Notes

- Imported product images are copied into `public/products`
- Generated product data is stored in `data/generated/products.generated.json`
- Importer warns for unknown categories, missing folders, and empty image sets
- Vercel can only deploy files inside this repo, so product imports need to be committed after syncing
