# Running Todo

## Now

- [ ] Cut over cityfashion.shop to Cloudflare (D1, secrets, DNS, Access, disconnect Vercel).  
  owner: agent + user | status: active | context: `docs/superpowers/plans/2026-11-11-cloudflare-migration.md`
- [ ] After the nameserver switch: turn on Email Routing for cityfashion.shop and verify the owner's Gmail as a destination address.  
  owner: user | status: active | context: `README.md`
- [ ] Ask the owner for the fabric (and size range) of style 1490, then fill `fabric` and `sizeRange` in `data/product-overrides.json`. Both are blank on the live page. The owner asked to be reminded.  
  owner: user | status: reminder | context: `data/product-overrides.json` key `1490`
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
- [ ] Start Docker Desktop and run the external Postgres Paperclip recovery flow in `../cityfashion-ops/scripts/`.  
  owner: agent | status: queued | context: `../cityfashion-ops/PAPERCLIP_EXTERNAL_POSTGRES.md`
- [ ] Debug Paperclip local embedded PostgreSQL startup in `../cityfashion-ops` only if external Postgres recovery is not good enough.  
  owner: agent | status: backlog | context: `.memory/EXPERIMENTS.md`
- [ ] Use the new sidecar programs to generate low-risk launch, SEO, and catalog process tasks while product cleanup waits.  
  owner: agent | status: queued | context: `../cityfashion-ops/programs/`
- [ ] Populate the first real weekly growth report once order and analytics inputs are available.  
  owner: agent | status: queued | context: `../cityfashion-ops/outputs/2026-04-01-reporting-draft.md`

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

- [x] Moved order storage to D1, admin to Cloudflare Access, email to the Resend HTTP API; added Playwright order E2E tests.  
  owner: agent | status: done | context: `tests/e2e/`

- [x] Launched `cityfashion.shop` on Vercel.  
  owner: agent | status: done | context: `README.md`
- [x] Added launch polish, metadata, analytics, sitemap, robots, and share images.  
  owner: agent | status: done | context: `AGENTS.md`
- [x] Imported 29 starter product folders and generated starter overrides.  
  owner: agent | status: done | context: `PRODUCT_REVIEW_NOTES.md`
- [x] Scaffolded the first Paperclip sidecar workspace and program files in `../cityfashion-ops`.  
  owner: agent | status: done | context: `.memory/EXPERIMENTS.md`
- [x] Created the first live Google Sheets ops hub and API write path.  
  owner: agent | status: done | context: `../cityfashion-ops/ops-hub/README.md`
