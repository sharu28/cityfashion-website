# Running Todo

## Now

- [ ] Create the Supabase project and enable phone auth for retailer OTP.  
  owner: user | status: active | context: `supabase/schema.sql`
- [ ] Add Supabase env vars locally and in Vercel.  
  owner: user | status: active | context: `.env.example`
- [ ] QA retailer signup, shortlist save, and WhatsApp order flow on mobile.  
  owner: agent | status: active | context: `src/components/retailer-provider.tsx`
- [ ] Seed `existing_retailers`, `campaigns`, and `weekly_reports` in the live Google Sheets ops hub.  
  owner: agent | status: active | context: `../cityfashion-ops/ops-hub/README.md`
- [ ] Review highest-priority messy product folders and pick usable images.  
  owner: user | status: active | context: `PRODUCT_REVIEW_NOTES.md`
- [ ] Confirm provisional categories for the 29-product starter batch.  
  owner: user | status: active | context: `data/product-overrides.json`
- [ ] Fill real starting prices and MOQ for current imported styles.  
  owner: user | status: active | context: `data/product-overrides.json`
- [ ] Add colors and short descriptions for the current batch.  
  owner: user | status: active | context: `data/product-overrides.json`

## Next

- [ ] Run a visual mobile review after the product data is cleaned.  
  owner: agent | status: queued | context: `PRODUCT_REVIEW_NOTES.md`
- [ ] Start the first SEO/GEO backlog pass for launch pages and product pages.  
  owner: agent | status: queued | context: `.memory/SEO_GEO.md`
- [ ] Debug Paperclip local embedded PostgreSQL startup in `../cityfashion-ops` or switch the sidecar to a different supported database path.  
  owner: agent | status: queued | context: `.memory/EXPERIMENTS.md`
- [ ] Use the new sidecar programs to generate low-risk launch, SEO, and catalog process tasks while product cleanup waits.  
  owner: agent | status: queued | context: `../cityfashion-ops/programs/`

## Later

- [ ] Track WhatsApp click events in analytics.  
  owner: agent | status: backlog | context: `.memory/IMPROVEMENTS.md`
- [ ] Improve product-category confidence with a better review workflow or image-assisted classification.  
  owner: agent | status: backlog | context: `.memory/IMPROVEMENTS.md`
- [ ] Generalize the memory/todo system for other business projects.  
  owner: agent | status: backlog | context: `.memory/EXPERIMENTS.md`

## Blocked

- [ ] Final product categories depend on business review of the new styles.  
  owner: user | status: blocked | context: `PRODUCT_REVIEW_NOTES.md`

## Done Recently

- [x] Launched `cityfashion.shop` on Vercel.  
  owner: agent | status: done | context: `README.md`
- [x] Added launch polish, metadata, analytics, sitemap, robots, and share images.  
  owner: agent | status: done | context: `AGENTS.md`
- [x] Imported 29 starter product folders and generated starter overrides.  
  owner: agent | status: done | context: `PRODUCT_REVIEW_NOTES.md`
- [x] Scaffolded the first Paperclip sidecar workspace and program files in `../cityfashion-ops`.  
  owner: agent | status: done | context: `.memory/EXPERIMENTS.md`
- [x] Added retailer OTP, server-side shortlist, gated WhatsApp order flow, and Supabase setup docs.  
  owner: agent | status: done | context: `README.md`
- [x] Created the first live Google Sheets ops hub and API write path.  
  owner: agent | status: done | context: `../cityfashion-ops/ops-hub/README.md`
