# Project State

Last updated: `2026-11-11`

## Current focus

- Website orders move from Vercel + Supabase (never provisioned, so no orders reached the owner) to Cloudflare:
  Worker hosting, D1 order storage, Cloudflare Access on `/admin/*`, order email through Cloudflare Email Routing
- Cutover steps and owner actions: `docs/superpowers/plans/2026-11-11-cloudflare-migration.md` (Task 9)
- Review and clean the current product batch
- Keep the site growth-ready on `cityfashion.shop`

## Recent decisions

- 2026-11-11: owner approved the Cloudflare migration spec (`docs/superpowers/specs/2026-10-10-cloudflare-migration-design.md`)
- Supabase and Vercel Analytics/Speed Insights removed from the code; GA4 (consent-gated) stays; Cloudflare Web Analytics added (consent-gated, needs `NEXT_PUBLIC_CF_BEACON_TOKEN`)
- 2026-11-11: owner chose Cloudflare Email Routing over Resend (Resend free plan has no domain slot left) and Brevo. The `ORDER_EMAIL` send_email binding sends free to verified destination addresses; no API key. It works only after `cityfashion.shop` is on Cloudflare with Email Routing on and the owner's Gmail verified as a destination
- Admin pages show the normal 404 to anyone without a valid Access token for `ADMIN_EMAIL`; admin API returns 403
- Images: custom `next/image` loader asks Cloudinary for the right width; local `/products/*.webp` served as-is
- End-to-end tests (`npm run test:e2e`) run the real Worker build with `wrangler dev`, a local D1, wrangler's local send_email store (read through the local explorer API) and fake Access keys (`scripts/e2e/`); selectors use roles and labels only
- Retailer phone OTP / shortlist plans from April are dropped; the checkout is name + WhatsApp number only
- `cityfashion.shop` is the primary public domain; repo-local memory is the source of truth; private notes in `.memory-private/`

## Open blockers

- Most current category assignments are still provisional
- Prices, MOQ, colors, and descriptions are incomplete for some imported styles
- Order email cannot be sent until the nameservers move and Email Routing is on (orders are still saved meanwhile)
- Turning on Email Routing replaces the Namecheap eforward MX records; owner said no domain email is used

## Resume here

1. Finish the cutover in the plan's Task 9 (each outward step needs the owner's yes)
2. After go-live: place one labelled TEST order, confirm the email and `/admin/orders`, then cancel it
3. Review `PRODUCT_REVIEW_NOTES.md` and clean product metadata

## External memory / orchestration direction

- Repo = source of truth
- Separate sidecar workspace at `../cityfashion-ops` = orchestration and experiment runner
- Any updates promoted back into repo memory must be summarized and human-reviewable
