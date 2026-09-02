# City Fashion Website

Wholesale ladies' wear catalog website for Sri Lanka retailers.

## Current status

- Primary public domain: `https://cityfashion.shop`
- GitHub repo: `https://github.com/sharu28/cityfashion-website`
- Deployment: live on Vercel
- Current generated starter batch: `29` imported products
- Customers can build and place an order with only their name and WhatsApp number
- The owner receives an email alert and manages orders in a private dashboard
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

## Website order and admin setup

The catalog works without service configuration, but placing an order and opening the owner dashboard require Supabase. Keep all secret values server-side.

1. Create or choose the Supabase project.
2. Run `supabase/schema.sql` for a new project, or apply `supabase/migrations/202609020001_create_website_orders.sql` to an existing project.
3. In Supabase Authentication, create one email/password user for the owner. There is no public customer account or OTP flow.
4. Copy `.env.example` to `.env.local` and fill:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for the owner sign-in session.
   - `SUPABASE_SECRET_KEY` for server-only order creation and dashboard reads.
   - `ADMIN_EMAIL` with the exact owner account email allowed into `/admin/orders`.
   - `ORDER_RATE_LIMIT_SALT` with a long random server-only value.
   - `PAYMENT_INSTRUCTIONS` with the short bank-transfer or pickup text sent after staff confirmation.
5. For email alerts, add `RESEND_API_KEY`, `ORDER_NOTIFICATION_EMAIL`, and a verified `ORDER_EMAIL_FROM` sender.

Never expose `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, or `ORDER_RATE_LIMIT_SALT` with a `NEXT_PUBLIC_` prefix. If order submission is temporarily unavailable, the checkout keeps the cart and shows the City Fashion WhatsApp support link so the customer can still contact staff.

## Analytics setup

Vercel Analytics and Speed Insights are enabled by default. To enable Google Analytics 4, create a GA4 web data stream for `https://cityfashion.shop` and add its measurement ID locally and in Vercel:

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

GA4 receives page views, product views, campaign attribution, and WhatsApp support clicks. Do not add customer names, phone numbers, order references, or internal order IDs to analytics events.

The site sends Google Consent Mode v2 signals for analytics and advertising storage. Until a visitor chooses **Allow measurement**, Google storage consent defaults to denied. Visitors can reopen **Cookie settings** from the footer, and `/privacy` documents the measurement and retailer-account data flows.

## Product import flow

- Raw product source: `C:\Users\sharu\Projects\family-biz\products`
- Website-ready copied images: `public/products`
- Generated catalog data: `data/generated/products.generated.json`
- Starter overrides for the current batch: `data/product-overrides.json`
- Cloudinary is now the preferred product image host when the import env vars are present

Add these to `.env.local` if you want automatic Cloudinary upload during `npm run import-products`:

```bash
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

If those env vars are missing, the importer still copies images into `public/products` and generates a working local-fallback catalog.

## Odoo catalog review

Odoo is the internal source for product identity and merchandising candidates. The website remains a reviewed public catalog: a sync never publishes a product, price, New badge, or Retailer Deal by itself.

Load the local Odoo connection variables and password through the existing private Odoo credential workflow, then run:

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

The sync uses read-only Odoo methods. Snapshot and review JSON stay local and are ignored by Git. A failed validation leaves the last good local snapshot unchanged, and normal builds never contact Odoo. Internal quantities, movement dates, costs, and candidate reasoning are not copied into the public generated catalog. Odoo list prices and candidate lanes publish only when the product override explicitly allows them.

## Verify and deploy

Run:

```bash
npm run import-products
npm run test:catalog-sync
npm run test:catalog-publication
npm run test:orders-schema
npm test
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
- `supabase/schema.sql` -> current database schema, including private website orders
- `supabase/migrations/202609020001_create_website_orders.sql` -> reviewed website-order migration
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
