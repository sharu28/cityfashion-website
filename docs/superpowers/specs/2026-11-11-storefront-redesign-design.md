# Storefront redesign: "Quiet Gallery" — design

Date: 2026-11-11
Branch: `claude/storefront-redesign-5fc499`
Status: draft for owner approval

## Why

cityfashion.shop is City Fashion's wholesale ladies'-wear catalog for small and mid-sized Sri Lankan
retailers. Most buyers open it on a phone from a link a salesperson sent on WhatsApp. The owner wants
the storefront to look gorgeous, be easy to get around, and make shop owners want to buy. The owner
also wants as few steps and decisions as possible between seeing a style and placing the order.

Success means a buyer who taps a WhatsApp link can:

1. see a clean, photo-led catalog right away
2. swipe a product card to see its other colours/photos without opening it
3. add a style to the order with one tap
4. change pieces per size only if they want to
5. place the order with just their name and WhatsApp number

## Goals

- A clean, modern, photo-first look modelled on Arket and COS (owner picked "Look A · Quiet Gallery"
  from a three-look mockup board).
- A scrollable catalog grid. Every card shows the price, the minimum order (MOQ) and the fabric.
- Swiping a card's photo sideways on a phone shows that style's other photos, which are mostly its
  colour variants. Desktop has an equivalent.
- One-tap add to order from the card, pre-filled so the buyer does not have to decide anything.
- A product page with every order option: sizes with a quantity per size, the colour list and add to
  order.
- A simple cart and order request that collects only name and WhatsApp number.
- Clear, highlighted lanes for **New arrivals** and **Deals for shops** (the existing Retailer Deal
  lane).

## Non-goals

- No change to the order backend, API routes, Supabase/D1 code, admin dashboard, analytics or deploy
  config. The `shop-cloudflare` session owns those.
- No colour choice on the site. Buyers do not pick colours. Staff confirm colours on WhatsApp as they
  do today, because the site cannot stay in sync with which colours are actually in stock.
- No stock status anywhere.
- No accounts, login, wishlist, reviews, filters by price, or payment.

## Anti-goals (would be a failure even if it works)

- Marketplace clutter: banners, pop-ups, countdown timers, "only 2 left", many competing colours.
- Luxury-brand or startup wording, long brand-story sections. Copy stays short and in very simple
  English.
- Making the buyer do sums or make choices before they can add a style.
- Slow pages from heavy images.

## Owner decisions (as they were made)

1. **Look:** Look A, Quiet Gallery.
2. **Colours:** shown for browsing only and never chosen. "We can't sync up the colours on the site
   with the colours available."
3. **Sizes:** buyers choose pieces per size.
4. **Minimum:** 6 pieces for the whole style, not per size.
5. **Quantities:** start at 6. Buyers can add one piece at a time or type a number.
6. **Autofill:** "remove the cognitive load". Adding a style fills in a starter size split straight
   away, and buyers edit it only if they want to.

## Constraints

- Next.js 16 App Router, React 19, Tailwind 4. Stay in the UI layer: `src/components/**`,
  `src/app/**/page.tsx` for storefront pages, `src/app/globals.css`, and the visuals in
  `src/app/layout.tsx`.
- Keep the accessible names that the order tests use: buttons "Add one piece", "Remove one piece",
  "Place order"; output/label "Quantity"; inputs labelled "Name" and "WhatsApp number"; link
  "Message us on WhatsApp". `shop-cloudflare`'s Playwright order tests rely on these. A single-quantity
  line keeps exactly these names. Per-size controls add the size, for example "Add one piece, size M".
- `shop-cloudflare`'s Playwright test (`tests/e2e/order-flow.spec.ts` on its branch) orders style
  1390, which is sized. Today it expects one quantity reading "6", the link "View order · 1 style" and
  inline quantity controls under "Check your styles" on `/order`. The size picker changes that flow,
  so the e2e test has to be updated with `shop-cloudflare` and should not be worked around in the UI.
  To keep that change small: the order bar link keeps the text "View order · N style(s)", the `/order`
  heading stays "Check your styles", and `/order` keeps its quantity controls inline (see Order page).
  *(Builder's call.)*
- Build on `main` as it is now and rebase after `shop-cloudflare` lands. `shop-cloudflare` replaces the
  image loader (a Cloudinary custom loader) and its version of `tests/image-performance.test.mjs`.
  Image code here must go through `next/image` and the shared `sizes` strings so either pipeline
  works. Whichever version of the image test is on `main` at merge time must pass: no `priority=` in
  `product-grid.tsx`, and only the lead image on the home page preloads (`preload={index === 0}`).
- Keep `npm run check` and `npm test` passing. Update UI tests that assert the old hover-only carousel
  behaviour.
- Mobile-first. The main viewport is 375px wide. Tap targets are at least 44px.
- `prefers-reduced-motion` turns off auto motion and smooth scrolling.
- Do not push to production until the owner approves a preview.

## Dependencies

**Per-size quantities need a backend change that `shop-cloudflare` owns.** The orders and API today
store one quantity per style. A request was sent to that session, and the note is in the shared notes
folder as `storefront-size-breakdown.md`. Suggested shape:

- API `items[]` gains an optional `sizes: [{ size, quantity }]`. The sizes come from that product's
  list, each quantity is ≥ 0 (zeros dropped), and they sum to `item.quantity` (≥ 6).
- `order_items.size_breakdown` is nullable JSON, shown in the owner email and admin detail as
  "M 1 · L 2 · XL 2 · 2XL 1".
- The browser cart entry becomes `{ productSlug, quantity, sizes?: Record<size, number> }`, and old
  entries stay valid. `src/lib/order-cart.ts` sits in `shop-cloudflare`'s area. Agree with them who
  edits it.

The redesign can be built and previewed before that lands. The size picker must not reach production
until the backend stores sizes; otherwise sizes the buyer chose would be silently lost. If the backend
change is delayed, ship the redesign with sized styles behaving like unsized ones (one quantity) and
switch the picker on later.

## Visual system

- **Colour:** white page `#ffffff`, ink `#111111`, secondary text `#6b6b6b` (check contrast ≥ 4.5:1 on
  white), hairlines `#e6e6e6`, and a quiet section fill `#f5f5f3` used sparingly. Black is the only
  strong colour. WhatsApp green (`#18834e`, existing) appears only on WhatsApp actions. The "Deals for
  shops" band is the one inverted (black) section.
- **Type:** one clean grotesk throughout. The mockup used Schibsted Grotesk, loaded with
  `next/font/google`. Small uppercase labels with letter-spacing (`0.12–0.16em`) for section titles
  and badges. Product names in sentence case at 13–14px on cards. Prices and numbers use tabular
  figures. Drop the italic uppercase `catalog-heading` style and the graph-paper body background.
- **Shape:** square corners everywhere. Hairline borders instead of shadows. Photos are edge to edge
  with 2px gutters in the grid on phones.
- **Photos:** 3:4 portrait frames, `object-fit: cover`. Real product photos only.
- **Motion:** short and quiet. Image fade on change, a slide-up sheet, a small tick when added. None
  when reduced motion is set.

## Pages and behaviour

### Site shell

- **Header (sticky, white, hairline bottom):** the "CITY FASHION" wordmark (spaced uppercase) on the
  left. On the right, a search icon that goes to search on the all-styles view, and a bag icon with
  the number of styles in the order, linking to `/order`. On desktop, the category links sit inline.
- **WhatsApp button:** a small round green button fixed bottom-right on every storefront page. It sits
  above the order bar when that bar shows.
- **Order bar:** shows once the order has at least one style, on every page except `/order`. It is a
  full-width black bar pinned to the bottom with "3 styles · 18 pcs · Rs 30,600" and "View order →".
- **Footer:** address, WhatsApp number and category links, in plain small type.

### Home (`/`)

In order:

1. **Hero:** one large photo, full width (4:5 on phones, wide on desktop). Over it: a small label
   "Wholesale ladies wear · Colombo", the line "Fresh styles for your shop", and a "Shop new styles"
   link. This is the only preloaded image.
2. **Category tabs:** a horizontal swipe row of square outlined chips (All, Frocks, Printed tops,
   …). Only categories that have products appear. Each chip links to its category page. "All" jumps
   to the all-styles grid.
3. **New arrivals:** a section label with "See all" and a grid of styles in the `new` /
   `new-and-deal` lanes, in the existing home order (the pinned slugs first). First 4 on phones,
   8 on desktop. *(Builder's call: the data has no arrival date, so the section is called "New
   arrivals" rather than "New this week".)*
4. **Deals for shops:** a black band with a horizontal swipe rail of deal cards. Hidden when no style
   is in the deal lane (none are today).
5. **All styles:** every style in the grid, with the style-code search box above it.
6. A short "How ordering works" strip (3 steps, one line each) and a visit/WhatsApp block before the
   footer.

### Product card (grid)

2 columns on phones, 3 on tablets, 4 on desktop.

- **Photo frame:** a horizontal scroll-snap strip of the style's photos.
  - **Phone:** swipe sideways to move between photos. Vertical page scrolling must still work when the
    swipe starts on a photo.
  - **Desktop:** moving the mouse across the photo picks the photo under the pointer (left edge =
    first, right edge = last). Small prev/next arrow buttons appear on hover and on keyboard focus.
  - Only the first photo loads up front. Later photos load lazily as the strip nears them, and the
    next one may be fetched on first interaction.
  - Badge top-left: "Deal" only (white chip, uppercase). *(Builder's call: 18 of 20 styles are in
    the New lane, so a "New" badge would sit on almost every card and add noise. The New arrivals
    section does that job instead.)*
- **Photo position indicator:** under the photo, a row of small square markers, one per photo, with
  the current one filled black. Tapping a marker jumps to that photo. Markers are neutral, not colour
  swatches. *(Builder's call, flagged for the owner: the data does not say which photo shows which
  colour or what hex each colour is, so swatch colours would be guesses and sometimes wrong. A later
  data field could map photos to colours.)*
- **Text, under the markers:**
  - Product name. Two lines max with ellipsis, so long names don't break the grid.
  - Price, e.g. "Rs 1,900".
  - "Min 6 pcs · Cotton". When fabric is missing: "Min 6 pcs · Fabric: ask us".
  - "8 colours" when colours are listed. Nothing when they are not.
- **Quick add:** a square **+** button (44px) at the bottom-right of the photo, labelled
  "Add to order".
  - One tap adds the style straight away with 6 pieces. Sized styles get the starter split (below).
  - The button then becomes a black "6 in order" chip, and the order bar updates. A brief "Added"
    status is announced to screen readers.
  - Tapping the "6 in order" chip opens the **order sheet** for that style.
- **Not orderable** (no valid price or MOQ ≠ 6): the + is replaced by "Ask price on WhatsApp"
  (existing behaviour).
- Tapping the photo or name opens the product page.

### Starter size split (autofill)

- Sizes come from `sizeRange`. "M - 2XL" expands to M, L, XL, 2XL in the standard order
  S, M, L, XL, 2XL, 3XL. If `sizeRange` is empty or can't be parsed, the style is "unsized" and has a
  single quantity.
- Starting total: 6. Pieces go to the middle sizes first. For M–2XL that is **M 1 · L 2 · XL 2 ·
  2XL 1**. Other ranges follow the same rule: one each across the range, then the rest on the middle
  sizes, keeping the total at 6. *(Builder's call, flagged for the owner, who said "like two of each
  or something": two of each would start at 8 pieces, while this keeps the start at 6 as agreed.
  Easy to change.)*

### Order sheet (bottom sheet on phones, small dialog on desktop)

- Opens from the card's "in order" chip, and from "Edit" on a cart line.
- Header: thumbnail, name, price per piece.
- **Sized style:** one row per size: the size label, a "−" button, a number field you can type into,
  and a "+" button. Per-size minimum is 0. A running total shows "6 pcs · Rs 11,400". When the total
  is under 6, a short note says "Minimum 6 pieces for this style" and "Done" is disabled.
- **Unsized style:** one row with "−", a typed number field (min 6) and "+", keeping the exact names
  "Remove one piece", "Quantity" and "Add one piece".
- Buttons: "Done" (saves) and "Remove from order".
- Number fields use `inputmode="numeric"`. Typing replaces the value, and invalid or empty input
  falls back on blur.
- The sheet closes on Done, a backdrop tap or Escape. Focus stays inside while open and returns to
  the trigger after.

### Product page (`/products/[slug]`)

- **Gallery:**
  - **Phone:** a full-width swipe gallery (3:4) with a position counter "2 / 8".
  - **Desktop:** two-column layout. Photos on the left as a vertical stack or a large photo with
    thumbnails (builder's choice). Details are sticky on the right.
- **Details, in order:**
  - Style number (small uppercase), name, price "Rs 1,900 / piece".
  - Facts in a hairline table: Minimum order "6 pcs (any sizes)", Fabric, Sizes.
  - **Colours:** the list of colour names as plain text chips with the line "Our staff confirm
    colours with you on WhatsApp." It is not selectable.
  - **Quantity:** the same size rows as the order sheet, inline and pre-filled with the starter split
    (or 6 for unsized). If the style is already in the order, the rows show the saved numbers.
  - **Main button**, full width and black: "Add to order · 6 pcs · Rs 11,400". When the style is
    already in the order: "Update order" plus a "View order" link. On phones the button sits sticky
    at the bottom of the screen while the details are in view.
  - "Ask on WhatsApp" secondary link (existing message builder).
  - Description (short).
  - For deal-lane styles, keep the existing "special retailer terms" note.
- **More from this category:** a grid of related styles using the same cards.

### Category page (`/category/[slug]`)

- Category tabs at the top (current one filled), category name, style count, the style-code search
  (existing behaviour), then the grid. Empty search keeps the existing "No matching style" + "Clear
  search" behaviour.

### Order page (`/order`)

- **Empty cart:** "Your order is empty" with a "Browse styles" button and the New arrivals grid
  under it.
- **Lines:** a thumbnail, name, style number, line total and "Remove". The quantity controls sit
  inline, so the buyer edits without opening anything. Sized styles show the size rows (as in the
  order sheet), and unsized styles show the single "−  Quantity  +" control. Collapsed, a line shows
  the split as text ("M 1 · L 2 · XL 2 · 2XL 1"). On phones, tapping the line or "Change sizes"
  expands the rows. *(Builder's call: inline is one step fewer than a sheet and keeps the e2e change
  small.)*
- **Summary:** styles, pieces, product total, and a line saying delivery and payment are confirmed by
  staff.
- **Form:** "Name" and "WhatsApp number" only, plus the "Place order" button. Keep the existing
  submit, error recovery and receipt behaviour and the data sent, apart from the added size breakdown
  once the backend supports it.
- The receipt ("Order received", reference, total, "Message us on WhatsApp") is restyled only.

### Other pages

- `not-found`, `privacy`: restyle to the new look, with no content changes beyond tone.
- `/shortlist` already redirects to `/order`. Leave it.
- Admin pages: unchanged.

## Edge cases to check

- A style with 2 photos (3095) and one with 15–16 photos (1570, 3127). The markers must not overflow;
  cap the visible markers and show "1 / 16" instead when there are more than about 8.
- A style with no colours listed (14 of 20) and one with 8.
- A long product name (4117 "Style 4117 Button-Front Gathered Long Top").
- A style with no fabric (most).
- A non-orderable style.
- Empty cart, one line, many lines.
- No deal styles (the band is hidden) and some deal styles (the band shows).
- 375px phone and a 1440px desktop, keyboard-only use, and reduced motion.

## Testing

- Unit/component (vitest): starter split for several size ranges, card quick add (adds with split),
  the order sheet (typing, min-6 guard, per-size min 0), photo strip index and markers, and the empty
  order page. Update `tests/product-image-carousel.test.tsx` for the new swipe/scrub behaviour.
- Keep `tests/image-performance.test.mjs`, `npm run check` and `npm test` green.
- Browser check at 375px and desktop: swipe, scrub, quick add, edit sheet, empty cart, long names,
  2 vs 16 photos.
- After `shop-cloudflare` lands on `main`: rebase, then run its Playwright order tests against this
  design.

## Left to the builder

- Exact spacing, type sizes, breakpoints and the desktop gallery layout.
- Component structure and names. Reuse or replace the existing components as makes sense.
- Whether "See all" for New arrivals goes to a filtered view or scrolls to the all-styles grid.
- Icon drawing (inline SVG, no icon library needed).
- How the next photo is prefetched.
