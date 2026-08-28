# City Fashion Odoo-to-Website Catalog Integration

Date: 2026-08-28
Status: Proposed for implementation review

## Purpose

Connect the City Fashion wholesale website to the same product and inventory operation represented in Odoo, while keeping the website focused on two business outcomes:

1. attract new retailers with new goods;
2. recover capital from excess stock through suitable wholesale offers.

The website must remain a fast, image-led catalog that sends qualified buyers into WhatsApp. It must not become a public copy of the Odoo database, expose stock quantities or costs, or publish unreviewed product data.

## Agreed Product Direction

- Odoo is the operational source for product identity, active state, selling-price evidence, receipts, inventory quantities, and sales/movement history.
- The website is the merchandising source for public title, category, photos, cover-image order, description, colors, fabric, size range, MOQ, and publication approval.
- “Retailer Deals” are publicly discoverable.
- Exact deal price, lot quantity, color availability, and final availability are confirmed after retailer login and through WhatsApp.
- The public site never shows stock quantities, stock-status labels, Odoo costs, supplier information, or internal clearance scores.
- Odoo is read-only from this integration. Website activity does not create or change Odoo products, quantities, prices, orders, customers, or accounting records.

## Why a Curated Snapshot

Three integration approaches were considered.

### 1. Curated snapshot — selected

A server-side sync command reads approved fields from Odoo, produces an internal snapshot and review report, and then the existing importer builds the public catalog from that snapshot plus website overrides and product photos.

Benefits:

- Odoo credentials never reach the browser.
- The deployed site does not depend on Odoo being available for every page request.
- A failed sync cannot erase or replace the last valid catalog.
- Product categories, photos, MOQ, and public copy remain reviewable.
- Generated catalog data remains compatible with the current static Next.js product pages.

Trade-off: a receipt in Odoo can create a review candidate immediately, but the product is published only after its website photos and required public fields are approved.

### 2. Live server-side Odoo reads — rejected for v1

Fetching Odoo during page rendering would make availability fresher, but it would add latency, make the public site depend on Odoo uptime, complicate caching, and put production credentials in the website hosting environment.

### 3. Manual CSV export and import — rejected as the target design

This would be quick to start but would not reliably surface new goods or identify excess stock. A manual export remains an emergency fallback if Odoo access is temporarily unavailable.

## Current Data Findings

The current website has 29 imported product folders. Comparing their leading numeric design codes with the latest local Odoo reconciliation artifact found:

- 27 folders with one active Odoo product candidate;
- no active candidate for website folders `3145` and `3168`;
- `3003 V-3` and `3003 V-6` both pointing to the same active Odoo product;
- historical duplicate Odoo records for several design codes, with one active record and one inactive record.

These findings make automatic code guessing unsafe as a publication rule. The sync may suggest a candidate by normalized design code, but every website product must store an explicit reviewed Odoo product mapping before Odoo facts can affect it.

## System Boundary

```text
Odoo (private operational truth)
  -> read-only catalog sync
  -> private/internal snapshot + review report
  -> reviewed website product mapping and overrides
  -> existing image importer
  -> public generated catalog
  -> Next.js pages, shortlist and WhatsApp flow

Website activity
  -> Supabase activity events
  -> campaign/ops reporting
  -X-> Odoo writes in v1
```

The integration has four isolated parts:

1. **Odoo reader** — authenticates server-side and retrieves only the fields needed for matching and classification.
2. **Catalog policy engine** — suggests new-arrival and retailer-deal candidates without publishing them.
3. **Website catalog merger** — combines approved Odoo facts with website-controlled overrides and photos.
4. **Buyer-intent tracking** — records which merchandising lane and product led to a WhatsApp order intent.

## Data Ownership

### Odoo-owned inputs

- Odoo product ID
- internal reference/default code
- product name used as matching evidence
- active and sale-enabled state
- list/selling price used as review evidence
- current internal quantity used only for eligibility calculations
- most recent completed incoming receipt date
- most recent completed outgoing sale/delivery date
- completed outgoing units over the configured lookback window
- product and stock-movement write timestamps

Odoo standard cost, valuation, supplier identity, accounting data, customer data, and exact stock quantities must never be written into the public generated catalog.

### Website-owned public fields

- public product ID and slug
- public title
- category
- starting-price text
- MOQ
- fabric
- size range
- description
- colors
- cover image and image order
- source folders and excluded images
- public badges
- publication state

An Odoo list price is a suggestion until the business confirms it represents the correct wholesale starting price. It must not silently replace an explicit website price.

### Derived internal fields

- mapping status
- last successful Odoo sync timestamp
- new-arrival candidate and reason
- retailer-deal candidate and reason
- stock-age band
- sales-velocity band
- review warnings

Only approved public booleans and labels derived from these fields may enter the public catalog.

## Product Mapping Contract

`data/product-overrides.json` will gain these supported fields:

- `odooProductId`: exact active `product.product` ID approved for this website entry;
- `odooDesignKey`: stable human-readable design key such as `D1210`;
- `odooSyncMode`: `mapped` or `website-only`;
- `publicationStatus`: `draft`, `published`, or `hidden`;
- `newArrivalApproval`: `auto`, `yes`, or `no`;
- `retailerDealApproval`: `yes` or `no`;
- `priceSource`: `override` or `odoo-list-price`.

Rules:

- `odooProductId` is the authoritative mapping when `odooSyncMode` is `mapped`. Name or numeric matching only creates a suggestion.
- `website-only` is an explicit reviewed exception for a product that should publish without Odoo-derived facts.
- Multiple website photo entries may map to the same Odoo product when they represent photo/color groups, as with the current `3003` folders.
- One website entry must not map to multiple Odoo products in v1.
- A missing, inactive, duplicated-active, or changed Odoo mapping blocks Odoo-derived updates for that entry and creates a review warning.
- A product can still remain on the website using its last approved public data when Odoo is temporarily unavailable.
- New Odoo products without a website photo folder appear only in the review report.

## Snapshot Files

The implementation will produce two different outputs so private operational facts do not leak into the site.

### Internal sync snapshot

Path: `data/odoo/odoo-catalog.snapshot.json`

This file is local-only and gitignored. It may contain exact quantities, movement dates, Odoo IDs, matching evidence, and derived candidate reasons. It is input to local review and catalog generation, not a deployable asset.

### Review report

Path: `data/odoo/catalog-review.json`

This file is local-only and gitignored. It contains:

- new Odoo products needing photos or metadata;
- unmapped website folders;
- changed or invalid mappings;
- new-arrival candidates;
- retailer-deal candidates;
- products whose Odoo price differs from the approved website price;
- sync warnings and counts.

### Public generated catalog

Path: `data/generated/products.generated.json`

The existing generated catalog remains the only product data imported by the Next.js app. It contains public merchandising fields, images, approved badges, and a non-sensitive `merchandisingLane` value of `new`, `deal`, `standard`, or `new-and-deal`.

It contains no exact inventory, cost, supplier, internal score, or raw Odoo movement data.

## New Arrivals Workflow

### Candidate rule

A mapped active product becomes a new-arrival candidate when it has a completed incoming stock movement into the configured internal inventory location within the last 30 days. The reader resolves that location by stable warehouse/location identity and verifies it on every run; it does not reuse a remembered numeric Odoo ID.

Incoming evidence means a completed incoming picking or a completed movement from a supplier/non-internal location into the configured internal location. Internal transfers, manufacturing movements, returns, and inventory adjustments do not make a product new.

The 30-day window is a configuration value in the sync policy, not scattered through UI code.

### Publication rule

A candidate becomes publicly “New” only when all of the following are true:

- the Odoo mapping is valid;
- `publicationStatus` is `published`;
- at least one website-ready image exists;
- category, starting-price text, MOQ, and description are present;
- `newArrivalApproval` is `auto` or `yes`.

`auto` means the badge follows the 30-day Odoo receipt rule after the product's mapping and public fields have already been approved. It does not mean a completely new Odoo product can publish without review.

When the receipt leaves the 30-day window, the “New” badge is removed on the next successful import unless `newArrivalApproval` is explicitly `yes`.

## Retailer Deals Workflow

### Candidate rule

The policy engine creates an internal retailer-deal candidate when all of these are true:

- the product has a valid mapping and is active;
- internal available quantity is greater than zero;
- the last incoming receipt is at least 90 days old;
- there has been no completed outgoing quantity in the last 45 days, or the last 90 days of outgoing units are less than 20% of the current internal quantity.

Outgoing evidence means completed customer-delivery movements from the configured internal location. Internal transfers, manufacturing consumption, inventory adjustments, and supplier returns do not count as customer demand. If the sync cannot establish a reliable receipt/stock-age date, it reports the product for manual review instead of assigning an automatic deal candidate.

These thresholds are conservative defaults and will be stored together in one policy configuration. They can be adjusted after the first real report without changing page components.

### Approval and publication rule

- Candidate status is internal only.
- A product is shown in Retailer Deals only when `retailerDealApproval` is `yes` and `publicationStatus` is `published`.
- A product is not automatically removed because a live quantity changes. Staff confirm the deal on WhatsApp, and the next review can remove its approval.
- Exact lot quantity and deal price remain private.
- The public card uses “Retailer Deal,” not “Sale,” “Clearance,” “Old Stock,” or an availability label.
- The public starting-price field may show an approved wholesale starting price or “Ask for lot price.”

The first version does not calculate or publish a discount percentage. It also does not automatically reduce Odoo prices.

## Buyer Experience

### Public discovery

- The homepage keeps New Arrivals as the first product-led acquisition section.
- The existing sale section becomes “Retailer Deals.”
- Deal copy explains that selected wholesale lots have special terms for retailers and asks the buyer to message for lot details.
- New and deal items remain available in normal category browsing.
- Product cards and pages never display stock status or units remaining.

### Login and WhatsApp

The current phone-login gate, shortlist, and WhatsApp intent route remain the ordering boundary.

The WhatsApp message will include:

- public style ID;
- public title;
- MOQ;
- merchandising lane when the item is a Retailer Deal;
- a request for colors, price, fabric, sizes, and lot terms.

It will not include exact Odoo quantity, internal score, cost, or supplier information.

### Inquiry qualification

The retailer profile will support optional `store_name`, `location`, `shop_type`, `interested_categories`, and `usual_order_size` fields. These fields help staff route suitable excess-stock lots after an inquiry. They are not required before browsing and should be collected progressively rather than through a long signup form.

## Activity and Outcome Measurement

Existing product-view, shortlist, and WhatsApp-intent tracking will gain a `merchandisingLane` property.

The minimum measures are:

- product views by lane;
- shortlist saves by lane;
- WhatsApp order intents by lane;
- new verified retailer leads attributed to new-arrival products;
- deal-product inquiries;
- manually confirmed Odoo sales for deal products.

The website can measure intent automatically. Capital recovered is an Odoo outcome and must be reported from verified sales, not inferred from clicks. The first version may join these outcomes in the existing Google Sheets ops hub using product code and campaign period; it does not need automated Odoo customer/order creation.

## Sync Command and Scheduling

The website repository will expose two separate commands:

- `npm run sync-odoo-catalog` — read Odoo and write the internal snapshot and review report;
- `npm run import-products` — merge the last valid snapshot with approved overrides and images to build public assets.

The existing `npm run check` and `npm run build` remain required before publishing.

Initial operation is deliberately review-driven:

1. run the Odoo sync after new purchase receipts and during the weekly stock review;
2. inspect the generated review report;
3. update explicit mappings and approvals;
4. import products;
5. check, build, visually review, commit, and deploy.

After this flow is stable for two review cycles, scheduling may run the read-only sync daily. Scheduled execution must not commit, push, deploy, or change public approvals automatically. A human-reviewed catalog change remains the deployment trigger in v1.

## Failure Handling

- Authentication, XML-RPC, missing-field, or timeout errors fail the sync command with a non-zero exit code.
- A failed sync does not overwrite the last valid snapshot.
- The snapshot is written to a temporary file, validated, and then atomically replaces the previous snapshot.
- If Odoo changes a mapped product's ID, active state, or design evidence, that entry is warned and its last approved public data is retained.
- If multiple active Odoo products match a suggested design code, no automatic mapping is made.
- If a required public field or all images are missing, the product cannot newly publish.
- If Cloudinary upload fails, the existing importer keeps its current local/existing-URL fallback behavior.
- The build must not require live Odoo access.

## Security and Privacy

- Odoo credentials remain in environment variables or the existing DPAPI-protected local secret path.
- Credentials must never be placed in the repository, generated catalog, client bundle, logs, or review report.
- The Odoo reader uses read-only methods and a dedicated read-only Odoo account when available.
- Internal snapshots and review reports are gitignored.
- Public catalog generation uses an allowlist, not removal of known-sensitive fields.
- Odoo standard cost, stock valuation, supplier data, customer data, accounting records, and exact inventory never enter public output.
- Supabase row-level policies continue to protect retailer data; inquiry qualification fields remain tied to the authenticated retailer.

## Implementation Scope by Repository

### Website repository

- add the read-only sync command and policy configuration;
- add snapshot validation and public-field allowlisting;
- extend override validation and importer merge behavior;
- update catalog types and badges from “Sale” to “Retailer Deal”;
- update homepage and product copy;
- add merchandising-lane analytics metadata;
- extend retailer profile types/schema for optional qualification fields;
- document the operator workflow and mapping review;
- add unit/fixture tests for matching, policy rules, redaction, and failure retention.

### Odoo repository

No Odoo write or schema change is required for v1. Existing XML-RPC connection patterns and field discovery can be reused as reference. If shared code is later extracted, that is a separate refactor and not required for this delivery.

### Ops hub

Use the existing Google Sheets ops hub only for campaign and outcome reporting in v1. Do not make the website build depend on Sheets availability.

## Verification

### Automated verification

- mapping suggestions never publish without an explicit `odooProductId`;
- duplicate and missing mappings generate warnings;
- internal quantity and cost are absent from public JSON;
- new-arrival boundaries are tested at 29, 30, and 31 days;
- deal boundaries are tested for stock age, recent movement, and velocity ratio;
- a failed sync preserves the previous valid snapshot byte-for-byte;
- products with missing required fields or images cannot newly publish;
- `npm run check` passes;
- `npm run build` passes without Odoo credentials.

### Fixture cases

- one website folder to one active Odoo product;
- two website photo folders to one Odoo product (`3003 V-3` and `3003 V-6` pattern);
- inactive historical duplicate plus one active canonical product;
- missing mappings (`3145` and `3168` pattern);
- new receipt inside and outside the configured window;
- aged stock with and without recent outgoing movement;
- an approved deal whose current live quantity changes;
- Odoo price disagreement with an explicit website override.

### Manual verification

- inspect the first 29-product mapping report;
- confirm that no stock quantities or stock labels render on desktop or mobile;
- confirm that New Arrivals lead the homepage;
- confirm that Retailer Deals are publicly browsable;
- confirm that login and shortlist behavior still work;
- confirm that the WhatsApp message identifies deal items and contains no private data;
- verify a production deployment directly on `https://cityfashion.shop` before calling the integration live.

## Rollout

### Phase 1: Safe catalog link

- implement read-only sync, explicit mappings, redaction, and review reports;
- map the current 29 website folders;
- block `3145` and `3168` from Odoo-derived facts until reviewed;
- keep existing public data unchanged unless explicitly approved.

### Phase 2: New-arrival automation

- derive new-arrival candidates from completed receipts;
- approve the initial mappings and public fields;
- verify badge aging and homepage ordering.

### Phase 3: Retailer Deals

- generate the first aged-stock candidate report;
- have staff approve a small first deal set;
- publish Retailer Deals and validate WhatsApp routing;
- compare inquiry quality and verified Odoo sales over the first campaign period.

### Phase 4: Operational cadence

- run two successful review cycles;
- schedule the read-only sync if desired;
- retain human approval for mappings, public pricing, and deal selection.

## Non-Goals

- live public stock status;
- exact online inventory reservation;
- website checkout or payment;
- automatic Odoo sale-order creation;
- automatic price discounting;
- automatic publication of every Odoo product;
- exposing cost, margins, suppliers, customers, or accounting data;
- making Supabase or Google Sheets a second product/inventory source of truth;
- changing the existing canonical domain, redirect behavior, or supported category slugs.

## Acceptance Criteria

The design is successfully implemented when:

1. every published website product has an explicit reviewed Odoo mapping or is intentionally marked website-only;
2. new Odoo receipts generate reviewable new-product/new-arrival candidates without directly publishing them;
3. approved aged-stock candidates can appear publicly as Retailer Deals;
4. the public catalog contains no exact inventory, cost, supplier, customer, or internal scoring data;
5. website builds and serves the last approved catalog when Odoo is unavailable;
6. WhatsApp intent records distinguish new, standard, and deal products;
7. the complete mobile browse-save-login-WhatsApp flow still works;
8. `npm run check` and `npm run build` pass;
9. the deployed experience is verified on `cityfashion.shop`.
