# Project State

Last updated: `2026-03-31`

## Current focus

- Finish Supabase project setup for retailer phone OTP and shortlist
- QA the new retailer login and shortlist flow on mobile
- Seed the Google Sheets ops hub with first real retailer and campaign rows
- Review and clean the current 29-product starter batch
- Keep the site growth-ready on `cityfashion.shop`

## Recent decisions

- `cityfashion.shop` is the primary public domain
- Repo-local memory is the source of truth
- Private notes belong in `.memory-private/`
- A future Paperclip-style orchestration pilot should live in a separate sibling workspace
- `autoresearch` ideas should shape repeatable `program.md`-style experiment runs later
- SEO/GEO skill ideas should shape recurring optimization workflows, not replace repo memory
- The first sidecar workspace now lives at `../cityfashion-ops`
- Retailer phone OTP is required before wishlist or WhatsApp order
- `Supabase + Sheets` is the default v1 stack for retailer capture and growth ops
- The sidecar now includes a reporting program and ops-hub sheet templates
- The first Google Sheets ops hub is now created and writable by service account

## Open blockers

- Most current category assignments are still provisional
- Many starter product folders still need cleanup or image-order review
- Prices, MOQ, colors, and descriptions are incomplete for most imported styles
- Supabase project env vars and phone auth provider are not configured in this repo or Vercel yet
- Paperclip local server startup is blocked on this Windows machine by embedded PostgreSQL startup failure after successful onboarding and doctor checks

## Resume here

1. Create or connect the Supabase project and run `supabase/schema.sql`
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` locally and in Vercel
3. QA OTP signup, save, shortlist, and WhatsApp order flow on mobile
4. Seed the Google Sheets ops hub with existing retailers, first campaigns, and weekly report rows
5. Review `PRODUCT_REVIEW_NOTES.md` and clean product metadata

## External memory / orchestration direction

- Repo = source of truth
- Separate sidecar workspace at `../cityfashion-ops` = orchestration and experiment runner
- Any updates promoted back into repo memory must be summarized and human-reviewable
