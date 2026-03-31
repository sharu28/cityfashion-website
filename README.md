# City Fashion Website

Wholesale ladies' wear catalog website for Sri Lanka retailers.

## Current status

- Primary public domain: `https://cityfashion.shop`
- GitHub repo: `https://github.com/sharu28/cityfashion-website`
- Deployment: live on Vercel
- Current generated starter batch: `29` imported products
- Retailer flow now includes phone OTP gate before saving styles or starting WhatsApp order
- Google Sheets ops hub is now live for campaigns, prospects, and weekly reporting
- Source product photos live outside the repo in `../products`
- Imported assets and generated data must be committed before push
- Repo-local operating memory now lives in `.memory/`

## Local workflow

1. Put product folders in `../products`
2. Review or update `data/product-overrides.json`
3. Run `npm run import-products`
4. Run `npm run check`
5. Run `npm run dev`

## Retailer auth setup

This app now expects Supabase for retailer phone OTP, shortlist storage, and activity events.

1. Create a Supabase project.
2. Enable phone auth and configure an SMS provider in Supabase Auth.
3. Run `supabase/schema.sql` in the SQL editor.
4. Copy `.env.example` to `.env.local`.
5. Fill:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Without those env vars, the site still builds and browses normally, but retailer login and shortlist actions stay disabled.

## Product import flow

- Raw product source: `C:\Users\sharu\Projects\family-biz\products`
- Website-ready copied images: `public/products`
- Generated catalog data: `data/generated/products.generated.json`
- Starter overrides for the current batch: `data/product-overrides.json`

## Verify and deploy

Run:

```bash
npm run import-products
npm run check
npm run build
```

Then push:

```bash
git add .
git commit -m "Update City Fashion catalog"
git push origin main
```

## Related docs

- `AGENTS.md` -> repo rules and current implementation guidance
- `supabase/schema.sql` -> retailer auth, shortlist, and event tables
- `../cityfashion-ops/ops-hub/README.md` -> Google Sheets ops hub structure
- `.memory/PROJECT.md` -> stable project truth
- `.memory/STATE.md` -> current working context and resume point
- `.memory/TODO.md` -> running task list
- `.memory/IMPROVEMENTS.md` -> backlog and future ideas
- `.memory/SEO_GEO.md` -> search visibility memory
- `.memory/EXPERIMENTS.md` -> tool and workflow experiments
- `PRODUCT_IMPORT_GUIDE.md` -> repeatable product import workflow
- `PRODUCT_REVIEW_NOTES.md` -> temporary checklist for the current 29-product batch
- `data/product-overrides.template.json` -> starter metadata template
