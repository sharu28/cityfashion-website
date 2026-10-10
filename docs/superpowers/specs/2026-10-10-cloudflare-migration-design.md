# Cloudflare Migration Design

Date: 2026-10-10
Status: Draft for owner review

## Goal

Move `cityfashion.shop` off Vercel and drop Supabase. The whole site, including the
website order checkout, runs on Cloudflare: Workers for hosting, D1 for orders,
Cloudflare Access for the owner dashboard.

Success means:

- `cityfashion.shop` and `www.cityfashion.shop` are served by a Cloudflare Worker
- A retailer can place an order; it is stored in D1 and the owner gets the email alert
- `/admin/orders` opens only for `sharukeshk.seker@gmail.com` after a Cloudflare Access email code
- URLs, sitemap, robots, canonical/host redirects and share images behave as today
- No downtime during the DNS switch
- Vercel is disconnected and all Supabase code and packages are removed

## Decisions

| Topic | Decision |
| --- | --- |
| Hosting | `@opennextjs/cloudflare` on Cloudflare Workers, one Worker named `cityfashion-website` |
| Order storage | Cloudflare D1 database `cityfashion-orders`, bound to the Worker |
| Owner login | Cloudflare Access (email one-time code), allow list: `sharukeshk.seker@gmail.com` |
| Order email | Resend, unchanged; API key becomes a Worker secret |
| Deploy tooling | Wrangler (stable, used by OpenNext) for build/deploy and D1 migrations |
| Account setup tooling | `cf` CLI (open beta) for Access, DNS zone and Web Analytics; dashboard as fallback |
| Images | Cloudinary URLs unchanged; local `/products/*.webp` served as-is via a custom `next/image` loader |
| Analytics | Remove Vercel Analytics and Speed Insights; keep GA4 behind consent; add Cloudflare Web Analytics |
| Domain registrar | Stays at Namecheap; only nameservers move to Cloudflare |
| Existing order data | None. Supabase was never provisioned, so no data migration |

## Architecture

```
Browser ──► Cloudflare edge (cityfashion.shop zone)
              ├─ Access policy on /admin/* and /api/admin/*
              └─► Worker: cityfashion-website (OpenNext build of the Next.js app)
                    ├─ D1 binding: ORDERS_DB  → cityfashion-orders
                    ├─ Secrets: RESEND_API_KEY, ORDER_RATE_LIMIT_SALT
                    └─ Vars: ADMIN_EMAIL, ORDER_NOTIFICATION_EMAIL, ORDER_EMAIL_FROM,
                             PAYMENT_INSTRUCTIONS, CF_ACCESS_TEAM_DOMAIN, CF_ACCESS_AUD,
                             NEXT_PUBLIC_GA_MEASUREMENT_ID
```

New files:

- `wrangler.jsonc`: Worker name, compatibility date and flags (`nodejs_compat`), D1 binding, vars
- `open-next.config.ts`: OpenNext config (defaults; no incremental cache needed beyond static assets)
- `migrations/0001_create_website_orders.sql`: D1 schema
- `src/lib/d1-order-repository.ts`: `OrderRepository` implementation on D1
- `src/lib/d1-order-admin.ts`: dashboard reads and status updates on D1 (replaces Supabase calls in `order-admin.ts`)
- `src/lib/cloudflare-access.ts`: verifies the `Cf-Access-Jwt-Assertion` token
- `src/lib/image-loader.ts`: custom `next/image` loader

Removed:

- `src/lib/supabase/**`, `supabase/**`, `src/app/admin/login`, `src/app/api/admin/auth`
- Supabase sign-in logic in `src/lib/admin-auth.ts` (file rewritten to use Access)
- Packages: `@supabase/ssr`, `@supabase/supabase-js`, `@vercel/analytics`, `@vercel/speed-insights`

Unchanged: `submitOrder()` in `order-service.ts`, `src/app/api/orders/route.ts` flow, order domain
rules, cart, catalog import, `src/proxy.ts` host redirect.

## Data model (D1 / SQLite)

`orders`

| Column | Type | Rule |
| --- | --- | --- |
| `id` | TEXT PK | `crypto.randomUUID()` generated in the Worker |
| `public_number` | INTEGER UNIQUE NOT NULL | sequential, starts at 1001, assigned inside the write batch |
| `idempotency_key` | TEXT UNIQUE NOT NULL | client-supplied UUID |
| `customer_name` | TEXT NOT NULL | `CHECK (length(customer_name) BETWEEN 1 AND 100)` |
| `whatsapp_phone` | TEXT NOT NULL | `CHECK (whatsapp_phone GLOB '+947[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]')` |
| `product_total_lkr` | INTEGER NOT NULL | `CHECK (> 0)` |
| `delivery_charge_lkr` | INTEGER | `CHECK (>= 0)` when set |
| `status` | TEXT NOT NULL DEFAULT 'new' | `CHECK (status IN ('new','confirmed','paid','completed','cancelled'))` |
| `private_note` | TEXT | |
| `created_at`, `updated_at` | TEXT NOT NULL | ISO-8601 UTC |

`final_total_lkr` is not stored. The repository computes it as
`product_total_lkr + delivery_charge_lkr` when `delivery_charge_lkr` is set, else `null`.

`order_items`: `id` TEXT PK, `order_id` TEXT FK → `orders(id)` ON DELETE CASCADE, `product_id`,
`product_slug`, `product_title` TEXT NOT NULL, `unit_price_lkr` INTEGER `> 0`, `quantity` INTEGER `>= 6`,
`line_total_lkr` INTEGER `CHECK (line_total_lkr = unit_price_lkr * quantity)`, `created_at`.

`order_submission_attempts`: `id` TEXT PK (the new order's id), `identity_hash` TEXT NOT NULL,
`created_at` TEXT NOT NULL; index on `(identity_hash, created_at)`.

## Order creation flow

`createD1OrderRepository(db).createOrder(input)` keeps the `OrderRepository` contract:

1. Validate input in TypeScript with the same rules the Postgres function enforced: trimmed
   name 1–100 chars, phone matches `^\+947\d{8}$`, identity hash ≥ 32 chars, items non-empty,
   each item has non-empty id/slug/title, integer quantity ≥ 6, integer unit price > 0,
   running total ≤ 2,147,483,647. Errors use the existing codes (`invalid_customer_name`,
   `invalid_whatsapp_phone`, `invalid_order_items`, `order_total_too_large`).
2. Look up `idempotency_key`. If found, return that order with `duplicate: true`.
3. Generate the new order id in the Worker, then run one `db.batch()`. D1 runs a batch as a
   single transaction and serializes writes per database, so no other order can interleave:
   - delete this identity's attempts older than 7 days
   - insert the attempt row `(id = orderId, identity_hash, now)` only if fewer than 5 attempts
     exist for this identity in the last 15 minutes (`INSERT … SELECT … WHERE (SELECT count(*) …) < 5`)
   - insert the order with `public_number = COALESCE((SELECT max(public_number) FROM orders), 1000) + 1`
     only when `EXISTS (SELECT 1 FROM order_submission_attempts WHERE id = orderId)`, using
     `ON CONFLICT(idempotency_key) DO NOTHING`
   - insert each item with `INSERT … SELECT … WHERE EXISTS (SELECT 1 FROM orders WHERE id = orderId)`
4. Inspect batch results:
   - attempt insert affected 0 rows → throw `OrderRateLimitError`
   - order insert affected 0 rows (idempotency key arrived from a concurrent request between
     steps 2 and 3) → re-read and return the existing order with `duplicate: true`; that request's
     attempt row still counts toward the limit
   - otherwise return `{ id, publicNumber, productTotalLkr, createdAt, duplicate: false }`

Prices still come from the server catalog inside `submitOrder()`; the client cannot set them.

## Owner dashboard and Access

- Cloudflare Access self-hosted application covering `cityfashion.shop/admin*` and
  `cityfashion.shop/api/admin*`, policy "Allow: emails = sharukeshk.seker@gmail.com",
  identity via one-time PIN, session 24 hours.
- Defense in depth: `src/lib/cloudflare-access.ts` verifies the `Cf-Access-Jwt-Assertion` JWT
  against the team's JWKS (`https://<team>.cloudflareaccess.com/cdn-cgi/access/certs`), checks
  `aud` = `CF_ACCESS_AUD`, expiry, and `email` = `ADMIN_EMAIL`. Admin pages and admin API routes
  call this and return 403 / not-found when it fails. JWKS is cached in memory per isolate.
- Sign-out links to `/cdn-cgi/access/logout`.
- Local development: when `CF_ACCESS_AUD` is unset and `NODE_ENV !== "production"`, an explicit
  `ADMIN_DEV_BYPASS=1` var allows access; production never bypasses.

## Email, rate-limit identity, images, analytics

- Resend notifier unchanged. Email is sent after the order is stored; a send failure is logged
  and the order still succeeds (current behaviour).
- Identity hash input switches from the Vercel forwarded-for header to `CF-Connecting-IP`,
  salted with `ORDER_RATE_LIMIT_SALT` as today.
- `next.config.ts` sets `images.loader = "custom"` with `src/lib/image-loader.ts`: Cloudinary URLs
  get a width transform (`w_<width>`) in the path; local `/products/...` URLs are returned unchanged.
  `tests/image-performance.test.mjs` is updated to match.
- `layout.tsx` drops `<Analytics />` and `<SpeedInsights />`, keeps GA4 consent flow, adds the
  Cloudflare Web Analytics beacon with the site token from `NEXT_PUBLIC_CF_BEACON_TOKEN`.

## Cutover plan

1. **Build on workers.dev.** Create D1, apply the migration, set secrets, `npm run deploy`.
   Verify on `cityfashion-website.<account>.workers.dev`: all pages, sitemap, robots, OG images,
   product images, an end-to-end test order (D1 row + email), admin lock. Vercel still serves
   the live domain.
2. **Move DNS.** Add `cityfashion.shop` as a zone in Cloudflare. Compare every imported record
   with Namecheap, especially MX, SPF/DKIM/DMARC, Resend verification and Google verification
   TXT records. The owner switches nameservers at Namecheap. Traffic keeps going to Vercel
   through the copied records until step 3.
3. **Switch.** When the zone is active, attach `cityfashion.shop` and `www.cityfashion.shop` as
   Worker custom domains (replacing the Vercel records), then create the Access application.
4. **Verify live** on the real domain: same checks as step 1 plus host redirect and Search Console
   sitemap fetch.
5. **Disconnect Vercel** as soon as step 4 passes and public resolvers (Google `8.8.8.8`,
   Cloudflare `1.1.1.1`) return Cloudflare addresses for both hostnames: remove the domains from
   the Vercel project and disconnect its Git integration. Deleting the Vercel project is a
   separate owner decision.

Rollback before step 5: point the two hostname records back to Vercel's values in Cloudflare
DNS (minutes). After step 5: redeploy is on Cloudflare only; fixes roll forward.

## Testing

- Existing Vitest and node test suites stay green.
- New Vitest suite for `d1-order-repository` running on a real local D1 via Miniflare
  (`@cloudflare/vitest-pool-workers` or `getPlatformProxy`): happy path, duplicate idempotency key,
  6th attempt in 15 minutes rejected, attempts older than 7 days pruned, `public_number` starts at
  1001 and increments, each invalid input code, item line totals.
- `cloudflare-access` tests: missing token, wrong `aud`, expired token, wrong email, valid token
  (signed with a test key).
- `npm run check`, `opennextjs-cloudflare build`, and a `wrangler dev` smoke run before each deploy.

## Owner actions

These need the owner's own logins and cannot be done by the agent:

- Log in to Cloudflare (`sharukeshk.seker@gmail.com`) in the browser when `wrangler login` / `cf`
  login opens, and approve
- Change nameservers at Namecheap to the pair Cloudflare assigns
- Provide the Resend API key as a Worker secret (typed into the `wrangler secret put` prompt)
- Confirm Vercel project deletion if wanted

## Out of scope

Visual redesign, retailer accounts or OTP, Odoo sync changes, domain registrar transfer,
deleting the Vercel project.
