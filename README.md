# City Fashion Website

Wholesale ladies' wear catalog website for Sri Lanka retailers.

## Current status

- Primary public domain: `https://cityfashion.shop`
- GitHub repo: `https://github.com/sharu28/cityfashion-website`
- Hosting: Cloudflare Worker `cityfashion-website` (OpenNext build of the Next.js app)
- Orders: Cloudflare D1 database `cityfashion-orders`; owner dashboard behind Cloudflare Access
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

## Website orders, email and the owner dashboard

The site runs as one Cloudflare Worker. Orders are stored in Cloudflare D1 and the owner gets an email through Cloudflare Email Routing (the Worker's `send_email` binding). It is free because it only sends to a verified destination address. `/admin/orders` is protected by Cloudflare Access: only the owner email in `ADMIN_EMAIL` can sign in, with a one-time code sent by email. The Worker also checks the Access token itself.

Settings live in `wrangler.jsonc` (`vars`, not secret) and in Worker secrets:

| Name | Where | What |
| --- | --- | --- |
| `ORDERS_DB` | `wrangler.jsonc` D1 binding | the `cityfashion-orders` database |
| `ORDER_EMAIL` | `wrangler.jsonc` send_email binding | sends the new-order email |
| `ADMIN_EMAIL` | var | the one email allowed into `/admin/orders` |
| `ORDER_NOTIFICATION_EMAIL` | var | who gets the new-order email (comma-separated; each must be a verified destination address in Email Routing) |
| `ORDER_EMAIL_FROM` | var | a sender on `cityfashion.shop`, which needs Email Routing turned on |
| `CF_ACCESS_TEAM_DOMAIN` | var | e.g. `https://<team>.cloudflareaccess.com` |
| `CF_ACCESS_AUD` | var | the Access application's Audience (AUD) tag |
| `PAYMENT_INSTRUCTIONS` | var | short bank-transfer text sent after staff confirm |
| `ORDER_RATE_LIMIT_SALT` | secret | `npx wrangler secret put ORDER_RATE_LIMIT_SALT` (long random text) |

Email setup, once `cityfashion.shop` is on Cloudflare: **Email > Email Routing**, turn it on (it adds Cloudflare's MX records), then add `ORDER_NOTIFICATION_EMAIL` under **Destination addresses** and click the link Cloudflare emails to it. Until then orders are still saved and shown in the dashboard; only the email fails (logged in the Worker).

Never put secret values in the repo. If order storage is not available, the checkout keeps the cart and shows the WhatsApp support link.

For `npm run dev`, copy `.dev.vars.example` to `.dev.vars`, run `npm run db:migrate:local` once, and set `ADMIN_DEV_BYPASS=1` to open the dashboard locally. The bypass never works in a built Worker.

### Clearing a test order

Open it in `/admin/orders`, set **Status** to **Cancelled** and **Save changes**. Cancelled orders stay in the list for the record. To remove one completely:

```bash
npx wrangler d1 execute cityfashion-orders --remote --command "DELETE FROM orders WHERE public_number = 1001"
```

(Order items are removed with it.)

## Analytics setup

Cloudflare Web Analytics loads after a visitor allows measurement, when `NEXT_PUBLIC_CF_BEACON_TOKEN` is set at build time. To enable Google Analytics 4, create a GA4 web data stream for `https://cityfashion.shop` and set its measurement ID at build time:

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
npm test
npm run test:e2e
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
- `migrations/` -> D1 schema for website orders (`npm run db:migrate:remote` applies it)
- `docs/superpowers/specs/2026-10-10-cloudflare-migration-design.md` -> Cloudflare hosting design
- `docs/screenshots/` -> what customers and the owner see, step by step
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
