# Storefront Redesign (Quiet Gallery) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the customer-facing storefront of cityfashion.shop in the owner-approved "Quiet Gallery"
look. It adds swipeable product cards, one-tap add with an autofilled size split, per-size quantities and
a restyled order flow.

**Architecture:** UI layer only. Size logic lives in a new pure module (`src/lib/sizes.ts`) and a new
UI-owned provider (`src/components/order-sizes-provider.tsx`). The provider stores each style's size split
in its own localStorage key, and its write helpers update the existing cart quantity to the sum of the
sizes. `src/lib/order-cart.ts`, `order-cart-provider.tsx`, `order-domain.ts` and the API stay untouched
(`shop-cloudflare` owns them). Sizes are sent with the order only when `SIZE_ORDERS_SENT` is switched
on, after `shop-cloudflare` ships the matching contract.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind 4, `next/font/google`, `next/image`, vitest +
Testing Library (jsdom).

**Spec:** `docs/superpowers/specs/2026-11-11-storefront-redesign-design.md`

## Global Constraints

- Stay in the UI layer. Do not edit `src/lib/order-*`, `src/lib/supabase/**`, `src/app/api/**`,
  `src/app/admin/**`, admin components, analytics, `next.config.ts` or deploy config.
- Colours: page `#ffffff`, ink `#111111`, secondary `#6b6b6b`, hairline `#e6e6e6`, section fill
  `#f5f5f3`, WhatsApp green `#18834e` only on WhatsApp actions. The "Deals for shops" band is the only
  black section. Square corners and no shadows.
- Font: Schibsted Grotesk via `next/font/google`, CSS variable `--font-sans`. Tabular figures.
- Copy is very simple English. No stock status. No colour selection.
- Prices use `formatLkr` → "Rs. 1,900".
- Accessible names to keep:
  - "Add to order" (prefix of the product page button name)
  - "Add one piece", "Remove one piece" and "Quantity" on unsized lines
  - order bar link "View order · N style(s) · Rs. X"
  - `/order` heading "Check your styles"
  - "Name", "WhatsApp number", "Place order"
  - receipt `<h1>` = reference, plus "Our staff will contact you shortly"
  - "Message us on WhatsApp"
  - product page `<h1>` = product title
  - product links whose name contains the title
- Per-size control names: `Add one piece, size ${size}`, `Remove one piece, size ${size}`,
  `Quantity, size ${size}`.
- Minimum order is 6 pieces per style in total. The per-size minimum is 0.
- Starter split for M–2XL: `{ M: 1, L: 2, XL: 2, "2XL": 1 }`.
- Images: `next/image` only. No `priority=` in `product-grid.tsx`. The home hero alone uses
  `preload={index === 0}` (the image-performance test reads that literal string from `src/app/page.tsx`).
  Tap targets are ≥ 44px. `prefers-reduced-motion` disables smooth scrolling and animations.
- `npm run check` and `npm test` stay green after every task.

## Review Focus

1. **A buyer types into a size field and clears it, or types 0 everywhere.** The cart quantity must never
   be written below 6. The field restores the last valid value on blur, and the sheet's Done stays
   disabled under 6. → test in Task 4.
2. **A cart saved before this release** (entries without sizes) opens on a sized style. The line must
   show the starter split, not crash or show 0. → test in Task 3.
3. **A vertical page scroll that starts on a card photo** must still scroll the page. The strip uses
   `touch-action: pan-x pan-y` and native scroll-snap, not JS gesture capture. → checked in the Task 10
   browser pass. A unit test can't simulate it, so Task 5's test asserts the class names.
4. **A style with 15–16 photos.** Markers are capped at 8 and a "1 / 16" counter is used instead.
   → test in Task 5.
5. **The cart quantity is changed elsewhere** (the old stepper, or another tab) so it no longer matches
   the size sum. `useOrderLine` rescales: when the sum ≠ quantity, it shows the stored sizes adjusted
   with `fitSplitToTotal`. → test in Task 3.

---

## File structure

| File | Responsibility |
|---|---|
| `src/lib/sizes.ts` (new) | Pure size helpers and flags |
| `src/components/order-sizes-provider.tsx` (new) | Size split storage plus the `useOrderLine` hook |
| `src/components/quantity-input.tsx` (new) | Unsized −/typed/+ control (replaces `order-quantity-control.tsx`) |
| `src/components/size-quantity-rows.tsx` (new) | Per-size rows with running total |
| `src/components/product-photo-strip.tsx` (new) | Swipe/scrub photo strip with markers (replaces `product-image-carousel.tsx`) |
| `src/components/order-sheet.tsx` (new) | Bottom sheet / dialog for editing one style |
| `src/components/product-tile.tsx` | Card rebuilt |
| `src/components/add-to-order-button.tsx` | Becomes the card quick-add (+ / "6 in order") |
| `src/components/product-order-panel.tsx` (new) | Product page quantity + main button |
| `src/components/site-header.tsx`, `site-footer.tsx`, `order-cart-bar.tsx`, `whatsapp-float.tsx` (new), `cookie-consent.tsx` (position only), `category-tabs.tsx` (new), `section-title.tsx` | Shell |
| `src/app/globals.css`, `src/app/layout.tsx` (font + visuals only) | Visual system |
| `src/app/page.tsx`, `src/app/category/[slug]/page.tsx`, `src/app/products/[slug]/page.tsx`, `src/components/order-page.tsx`, `src/components/product-browser.tsx`, `src/components/product-grid.tsx`, `src/app/not-found.tsx`, `src/app/privacy/page.tsx` | Pages |

Delete `order-quantity-control.tsx` and `product-image-carousel.tsx` once nothing imports them, and
replace their tests.

---

### Task 1: Visual system and site shell

**Files:**
- Modify: `src/app/globals.css`, `src/app/layout.tsx`, `src/components/site-header.tsx`,
  `src/components/site-footer.tsx`, `src/components/cookie-consent.tsx` (layout classes only),
  `src/components/section-title.tsx`
- Create: `src/components/whatsapp-float.tsx`, `src/components/category-tabs.tsx`
- Test: `tests/site-shell.test.tsx`

**Interfaces:**
- Produces:
  - `CategoryTabs({ activeSlug?: string })`: a horizontal chip row of `populatedCategories` plus "All"
    (`href="/#all-styles"`), with `aria-current="page"` on the active chip.
  - `WhatsAppFloat()`: a fixed round link with `aria-label="Chat on WhatsApp"` to
    `buildWhatsAppLink()`. It sits at `bottom: calc(1rem + var(--order-bar-h, 0px))`.
  - The CSS variable `--order-bar-h`, set on `<body>` by the order bar (Task 8). Default 0.
  - The utility classes `.label` (11px, uppercase, `tracking-[0.14em]`) and `.hairline`.
- Consumes: nothing.

- [ ] **Step 1: Write failing tests**
  - `renders the wordmark and an order link with the style count`: render `<OrderCartProvider><SiteHeader/></OrderCartProvider>`.
    Expect a link named /City Fashion home/ and a link to `/order` whose name contains "Order, 0 styles".
  - `category tabs mark the active category`: render `<CategoryTabs activeSlug="frocks"/>`. Expect
    `getByRole("link",{name:"Frocks"})` to have `aria-current="page"`, and a link "All".
  - `whatsapp float links to the shop number`: href contains `wa.me/94783232414`, name "Chat on WhatsApp".
- [ ] **Step 2:** Run `npx vitest run tests/site-shell.test.tsx`. Expect a FAIL (missing modules).
- [ ] **Step 3: Implement**
  - `globals.css`: replace the `:root` tokens with the Global Constraints colours (keep the token names
    `--text-strong`, `--text-soft`, `--line`, `--whatsapp`, `--danger`, so untouched admin pages still
    render). Remove the graph-paper `body` background (plain `#fff`), plus `.grain` and
    `.catalog-heading`. Add `.label`, `.hairline` and the `prefers-reduced-motion` rules.
  - `layout.tsx`: swap `Geist` for `Schibsted_Grotesk` (weights 400/500/600/700) and keep `Geist_Mono`.
    Render `<WhatsAppFloat/>` after `<OrderCartBar/>`. Nothing else changes.
  - Header: white and sticky, with a hairline. "CITY FASHION" wordmark (`tracking-[0.22em]`). Search icon
    link to `/#all-styles`. Bag icon link to `/order` with `aria-label={`Order, ${n} styles`}` and a
    count badge. Inline category links on `md+`.
  - Footer: address, `formattedWhatsAppNumber`, category links, privacy link. Small grey type.
  - Cookie consent: on screens under `md`, a compact strip pinned at the top under the header, so it
    never covers the order bar or the float.
  - `SectionTitle`: `.label` text plus an optional "See all" link. An `as` prop picks the heading level.
- [ ] **Step 4:** Run `npm test` and `npm run check`. Expect PASS.
- [ ] **Step 5:** Commit `feat: quiet gallery visual system and shell`.

### Task 2: Size helpers

**Files:**
- Create: `src/lib/sizes.ts`
- Test: `tests/sizes.test.ts`

**Interfaces — Produces:**
```ts
export const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"] as const;
export const SIZE_ORDERS_SENT = false; // flip on when shop-cloudflare accepts items[].sizes
export type SizeSplit = Record<string, number>;
export function parseSizeRange(range: string | undefined): string[];          // "M - 2XL" → ["M","L","XL","2XL"]; ""/unknown → []
export function starterSplit(sizes: string[], total?: number): SizeSplit;    // default total 6
export function fitSplitToTotal(split: SizeSplit, sizes: string[], total: number): SizeSplit;
export function sumSplit(split: SizeSplit): number;
export function formatSplit(split: SizeSplit, sizes: string[]): string;     // "M 1 · L 2 · XL 2 · 2XL 1", zeros omitted
```

- [ ] **Step 1: Write failing tests** (exact values):
  - `parseSizeRange("M - 2XL")` → `["M","L","XL","2XL"]`. `parseSizeRange("S-XL")` → `["S","M","L","XL"]`.
    `parseSizeRange("")`, `parseSizeRange(undefined)` and `parseSizeRange("Free size")` → `[]`.
  - `starterSplit(["M","L","XL","2XL"])` → `{M:1,L:2,XL:2,"2XL":1}`.
    `starterSplit(["S","M","L","XL","2XL"])` → `{S:1,M:1,L:2,XL:1,"2XL":1}`.
    `starterSplit(["M","L"])` → `{M:3,L:3}`. `starterSplit(["L"])` → `{L:6}`.
    `sumSplit(starterSplit(x))` is 6 for each of these.
  - `starterSplit(["XS","S","M","L","XL","2XL","3XL"])` → `{XS:0,S:1,M:1,L:1,XL:1,"2XL":1,"3XL":1}` (sums
    to 6; the size last in the middle-out order gets 0).
  - `fitSplitToTotal({M:1,L:2,XL:2,"2XL":1}, sizes, 8)` sums to 8, adding to the middle sizes first.
    `fitSplitToTotal(..., 6)` from a split summing 9 sums to 6 without going negative.
  - `formatSplit({M:0,L:3,XL:3}, ["M","L","XL"])` → `"L 3 · XL 3"`.
- [ ] **Step 2:** Run `npx vitest run tests/sizes.test.ts`. Expect FAIL.
- [ ] **Step 3: Implement.**
  - `parseSizeRange`: match `^\s*(\w+)\s*-\s*(\w+)\s*$` (case-insensitive) against `SIZE_ORDER`, then
    slice the range between the two ends.
  - `starterSplit(sizes, total)`: build the middle-out order of indices: start at `floor((n-1)/2)` and
    alternate right, left (for 4 sizes: L, XL, M, 2XL; for 5: L, XL, M, 2XL, S). If
    `total >= n`, give 1 to each size and then hand out the remaining `total - n` pieces one at a time
    along that order, wrapping round. If `total < n`, hand out one piece per size along the same order
    until the total runs out. Checks: 4 sizes → L, XL, M, 2XL get the 2 extras → `{M:1,L:2,XL:2,"2XL":1}`;
    5 sizes → one extra to L → `{S:1,M:1,L:2,XL:1,"2XL":1}`; 2 sizes `["M","L"]` → `{M:3,L:3}`.
  - `fitSplitToTotal`: add along the middle-out order, or remove from the outermost non-zero sizes.
- [ ] **Step 4:** Run the tests. Expect PASS.
- [ ] **Step 5:** Commit `feat: size range parsing and starter split`.

### Task 3: Size split storage and `useOrderLine`

**Files:**
- Create: `src/components/order-sizes-provider.tsx`
- Modify: `src/app/layout.tsx` (wrap children inside `OrderCartProvider` with `OrderSizesProvider`)
- Test: `tests/order-sizes-provider.test.tsx`

**Interfaces:**
- Consumes: `useOrderCart()` (`entries`, `add`, `setQuantity`, `remove`, `has`), plus everything in
  `src/lib/sizes.ts`.
- Produces:
```ts
export function OrderSizesProvider({ children }: { children: React.ReactNode }): JSX.Element; // localStorage key "city-fashion-order-sizes-v1"
export type OrderLine = {
  sizes: string[];                 // parseSizeRange(product.sizeRange)
  isSized: boolean;                // sizes.length > 0
  inOrder: boolean;
  quantity: number;                // cart quantity, or 6 when not in order
  split: SizeSplit;                // stored split fitted to quantity; starterSplit when none stored
  addWithDefaults(): void;         // cart.add + store starterSplit
  setSplit(next: SizeSplit): boolean;  // false (no write) when sumSplit(next) < 6; else stores + cart.setQuantity(sum)
  setQuantity(next: number): boolean;  // unsized only; false when < 6
  remove(): void;                  // cart.remove + drop stored split
};
export function useOrderLine(product: { slug: string; sizeRange?: string }): OrderLine;
export function useOrderSplits(): Record<string, SizeSplit>; // for the order page / payload
```
  - A product that is not yet in the order and is not being edited reports `inOrder: false`. `setSplit`
    on such a product adds it first (used by the product page "Add to order").

- [ ] **Step 1: Write failing tests** with a harness rendering `useOrderLine` for
  `{slug:"style-1390", sizeRange:"M - 2XL"}` and for `{slug:"style-1710", sizeRange:""}`:
  - `quick add stores the starter split and quantity 6`: after `addWithDefaults()`, cart quantity is 6,
    `split` is `{M:1,L:2,XL:2,"2XL":1}`, and localStorage `city-fashion-order-sizes-v1` contains
    `"style-1390"`.
  - `setSplit updates the cart quantity to the sum`: `setSplit({M:2,L:2,XL:2,"2XL":2})` → quantity 8.
  - `setSplit refuses totals under 6`: `setSplit({M:1,L:1,XL:1,"2XL":1})` returns `false` and the
    quantity stays 6.
  - `old cart entries get a starter split` (Review Focus 2): seed `city-fashion-order-cart-v1` with
    `[{"productSlug":"style-1390","quantity":6}]` and no sizes key. `split` is the starter split.
  - `split follows a changed cart quantity` (Review Focus 5): stored split sums to 6, then the cart is
    set to 9 directly. `split` sums to 9.
  - `remove clears both stores`.
  - `unsized setQuantity(5)` returns false, and `setQuantity(10)` sets 10.
- [ ] **Step 2:** Run `npx vitest run tests/order-sizes-provider.test.tsx`. Expect FAIL.
- [ ] **Step 3:** Implement the provider (load in `useEffect`, the same pattern as `OrderCartProvider`),
  the hook, and the layout wrap.
- [ ] **Step 4:** Run `npm test`. Expect PASS. The existing cart tests stay unchanged.
- [ ] **Step 5:** Commit `feat: per-size split storage for order lines`.

### Task 4: Quantity controls

**Files:**
- Create: `src/components/quantity-input.tsx`, `src/components/size-quantity-rows.tsx`
- Test: `tests/quantity-controls.test.tsx`

**Interfaces — Produces:**
```ts
QuantityInput(props: { value: number; min: number; onChange(next: number): boolean | void;
  label?: string /* default "Quantity" */; addLabel?: string /* "Add one piece" */; removeLabel?: string /* "Remove one piece" */ })
SizeQuantityRows(props: { sizes: string[]; split: SizeSplit; unitPriceLkr: number; onChange(next: SizeSplit): boolean | void })
```
  - `QuantityInput` renders `button[removeLabel]` (disabled at `value <= min`), `<input type="text"
    inputMode="numeric" aria-label={label}>` and `button[addLabel]`. Typing keeps a local draft and
    commits on blur or Enter when it's an integer ≥ min. Otherwise it restores `value`.
  - `SizeQuantityRows` renders one `QuantityInput` per size with `min={0}` and the per-size labels from
    Global Constraints. It also shows a total line `"{pcs} pcs · {formatLkr(total)}"` and, when the sum
    is < 6, the note "Minimum 6 pieces for this style" (`role="status"`). A change that would drop the
    sum below 6 is still shown as a draft, but `onChange` is called only with valid splits. The parent
    decides, and Task 6 / Task 7 disable Done / the main button.

- [ ] **Step 1: Write failing tests:**
  - `unsized control keeps the e2e names`: buttons "Add one piece" / "Remove one piece" and a textbox
    "Quantity" with value "6". "Remove one piece" is disabled at 6. Clicking "Add one piece" calls
    onChange(7).
  - `typing a number commits on blur`: type "12" → blur → onChange(12).
  - `invalid typing restores the value` (Review Focus 1): clear the field, blur → value "6", and onChange
    is not called. Type "3" (min 6) → blur → "6".
  - `size rows show the split and total`: sizes M–2XL, split `{M:1,L:2,XL:2,"2XL":1}`, price 1500 →
    textbox "Quantity, size L" has value "2", and the text "6 pcs · Rs. 9,000" is shown.
  - `size rows warn under minimum`: clicking "Remove one piece, size L" from the starter split shows
    "Minimum 6 pieces for this style".
- [ ] **Step 2:** Run the test. Expect FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm test`. Expect PASS.
- [ ] **Step 5:** Commit `feat: typed quantity and per-size rows`.

### Task 5: Product photo strip

**Files:**
- Create: `src/components/product-photo-strip.tsx`
- Delete: `src/components/product-image-carousel.tsx`, `tests/product-image-carousel.test.tsx`
- Test: `tests/product-photo-strip.test.tsx`

**Interfaces — Produces:**
```ts
ProductPhotoStrip(props: { images: string[]; title: string; imageSizes: string; href?: string;
  aspect?: "3/4" | "4/5"; showMarkers?: boolean /* default true */; eagerFirst?: boolean })
```
  - The strip is a `div.overflow-x-auto.snap-x.snap-mandatory` with `touch-action: pan-x pan-y` (Review
    Focus 3). One `next/image` per photo (`fill`, `object-cover`). The first photo has no `loading`
    override. Every other photo uses `loading="lazy"`.
  - The active index comes from `scrollLeft / clientWidth` on scroll (rounded).
  - Markers: up to 8 square buttons, `aria-label="Photo {i} of {n}"`, with `aria-current` on the active
    one. When there are more than 8 photos, render the text counter `"{i} / {n}"` instead.
  - Desktop (`pointerType === "mouse"`): `pointermove` maps x to an index and sets `scrollLeft`
    instantly. Prev/next buttons ("Previous photo" / "Next photo") are visible on hover and focus.
  - When `href` is set, each image sits inside a `next/link` to the product. Its accessible name is
    `${title}, photo ${i} of ${n}`, so link names contain the title.

- [ ] **Step 1: Write failing tests:**
  - `renders one image per photo and markers`: 4 images → 4 buttons "Photo 1 of 4"…, the first has
    `aria-current="true"`.
  - `marker click scrolls to that photo`: mock `scrollTo` on the strip element. Clicking "Photo 3 of 4"
    calls it with `left: 2 * clientWidth`.
  - `caps markers at eight` (Review Focus 4): 16 images → no "Photo" buttons and the text "1 / 16".
  - `mouse move picks the photo under the pointer`: mock `getBoundingClientRect` (width 200) and set
    `clientWidth` 200. A `pointerMove` with `pointerType:"mouse"` at clientX 150 on 4 photos → `scrollLeft`
    is 600.
  - `allows vertical page scroll`: the strip has the class `touch-pan-y` (or the inline `touchAction`
    includes "pan-y").
  - `links carry the product title`: with `href`, a link whose name contains the title exists.
- [ ] **Step 2:** Run the test. Expect FAIL.
- [ ] **Step 3:** Implement, update the imports in `product-tile.tsx`, and delete the old carousel and its
  test.
- [ ] **Step 4:** Run `npm test` and `npm run check`. Expect PASS.
- [ ] **Step 5:** Commit `feat: swipeable product photo strip`.

### Task 6: Product card, quick add and order sheet

**Files:**
- Modify: `src/components/product-tile.tsx`, `src/components/add-to-order-button.tsx`,
  `src/components/product-grid.tsx`
- Create: `src/components/order-sheet.tsx`
- Test: `tests/product-tile.test.tsx`

**Interfaces:**
- Consumes: `ProductPhotoStrip`, `useOrderLine`, `SizeQuantityRows`, `QuantityInput`.
- Produces:
  - `OrderSheet({ product, open, onClose })`: a native `<dialog>` opened with `showModal()`. It is a
    bottom sheet under `md` and a centred 420px dialog on `md+`. Inside: a thumbnail, name, price,
    `SizeQuantityRows` or `QuantityInput`, and the buttons "Done" (disabled while the draft sum is < 6)
    and "Remove from order". Escape and a backdrop click close it, and focus returns to the trigger.
  - `ProductTile({ product, imageSizes?, badge? })`: the photo strip with a "Deal" badge when
    `product.merchandisingLane` is `deal` or `new-and-deal`. Then the name (`line-clamp-2`), price,
    `Min 6 pcs · {fabric || "Fabric: ask us"}`, and `"{n} colours"` when there are colours.
  - `AddToOrderButton({ product })`:
    - Not orderable: the existing "Ask price on WhatsApp" link.
    - Not in the order: a 44px square "+" button with `aria-label="Add to order"` that calls
      `addWithDefaults()`.
    - In the order: a black chip "`{quantity} in order`" that opens `OrderSheet`, plus an
      `aria-live="polite"` "Added" message for 2s after adding.
- `product-grid.tsx`: 2 columns, then 3 at `sm`, then 4 at `lg`. 2px gutters on phones, wider on desktop.
  No `priority`.

- [ ] **Step 1: Write failing tests** (render inside both providers with the real `allProducts`
  entries for `style-1390` and `style-1710`):
  - `card shows price, minimum and fabric`: for style-4118 the texts "Rs. 1,250" and
    "Min 6 pcs · Cotton". For style-1390, "Min 6 pcs · Fabric: ask us" and "8 colours".
  - `plus adds six with the starter split`: click "Add to order" on style-1390 → the button "6 in order"
    is shown and localStorage sizes contain `{"M":1,"L":2,"XL":2,"2XL":1}`.
  - `unsized style adds a single quantity of six`: style-1710 → "6 in order", and the sizes store has no
    style-1710 key.
  - `chip opens the sheet and Done saves`: click "6 in order" → a dialog with "Quantity, size M" → click
    "Add one piece, size M" → click "Done" → the chip reads "7 in order".
  - `Done is disabled under six`: in the sheet, click "Remove one piece, size L" → "Done" is disabled.
  - `long names are clamped`: style-4117's name element has the class `line-clamp-2`.
  - (jsdom lacks `HTMLDialogElement.showModal`. Stub it in `tests/setup.ts` to set the `open` attribute.)
- [ ] **Step 2:** Run the test. Expect FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm test` and `npm run check`. Expect PASS.
- [ ] **Step 5:** Commit `feat: product card with one-tap add and order sheet`.

### Task 7: Product page

**Files:**
- Modify: `src/app/products/[slug]/page.tsx`
- Create: `src/components/product-order-panel.tsx`
- Test: `tests/product-order-panel.test.tsx`

**Interfaces:**
- Consumes: `useOrderLine`, `SizeQuantityRows`, `QuantityInput`, `ProductPhotoStrip`.
- Produces: `ProductOrderPanel({ product })` (client), holding a local draft split/quantity
  initialised from `useOrderLine` (`split`/`quantity`).
  - Main button name: `Add to order · ${pcs} pcs · ${formatLkr(total)}` when not in the order, or
    `Update order · …` when in the order (plus a "View order" link). The button is disabled when the draft
    is < 6. It is sticky at the bottom on phones (`sticky bottom-0`, white, hairline top).
  - Not orderable: the existing "Ask price on WhatsApp" link.

- [ ] **Step 1: Write failing tests:**
  - `starts with the starter split and adds it`: style-1390 → the button name starts with "Add to order",
    the text "6 pcs · Rs. 9,000" is shown, clicking it → the cart quantity is 6, the split is stored and
    the button now starts with "Update order".
  - `typed size changes update the button`: set "Quantity, size M" to 3 → blur → the button contains
    "8 pcs".
  - `unsized product uses the single control`: style-1710 has the textbox "Quantity" with value "6".
- [ ] **Step 2:** Run the test. Expect FAIL.
- [ ] **Step 3: Implement the panel and rebuild the page.**
  - Gallery: phones get `ProductPhotoStrip` (aspect 3/4, counter, `eagerFirst`). On `lg`, a two-column
    grid with the photos stacked on the left. Use `next/image` with `preload={index === 0}` on the first
    photo only.
  - Details on the right are sticky. They show the style number (`.label`), `<h1>{product.title}</h1>`
    and the price "/ piece". Then a facts table: "Minimum order · 6 pcs (any sizes)", Fabric (or
    "Ask us"), Sizes (or "Ask us").
  - Colours: plain chips plus the note "Our staff confirm colours with you on WhatsApp."
  - Then `ProductOrderPanel`, an "Ask on WhatsApp" text link, the description, the deal note (existing
    copy), and "More from {category}" using `ProductGrid`.
  - Keep `generateMetadata`, `generateStaticParams` and `ProductViewTracker` unchanged.
- [ ] **Step 4:** Run `npm test` and `npm run check`. Expect PASS.
- [ ] **Step 5:** Commit `feat: product page with size quantities`.

### Task 8: Order bar and order page

**Files:**
- Modify: `src/components/order-cart-bar.tsx`, `src/components/order-page.tsx`, `src/app/order/page.tsx`
  (layout wrapper only)
- Delete: `src/components/order-quantity-control.tsx`
- Test: `tests/order-page.test.tsx` (extend), `tests/order-cart-bar.test.tsx` (new)

**Interfaces:**
- Consumes: `useOrderLine`, `useOrderSplits`, `SizeQuantityRows`, `QuantityInput`, `formatSplit`,
  `SIZE_ORDERS_SENT`.
- Produces:
  - `OrderCartBar`: a black bar pinned to the bottom. The link text is exactly
    `` `View order · ${n} ${n === 1 ? "style" : "styles"} · ${formatLkr(total)}` ``, and `"{pcs} pcs"`
    sits outside the link. It sets `--order-bar-h` on `document.body` from its measured height (0 when
    hidden).
  - `OrderPage`: the payload stays `{ productSlug, quantity }` per item, and adds
    `sizes: [{size, quantity}]` (non-zero only) **only when** `SIZE_ORDERS_SENT` is true.

- [ ] **Step 1: Write failing tests:**
  - `cart bar keeps the e2e link text`: with one style-1390 entry → the link name is
    "View order · 1 style · Rs. 9,000".
  - `order page lists sizes inline`: with style-1390 in the cart and a stored split → the heading "Check
    your styles", the textbox "Quantity, size L" with value "2", and the text "M 1 · L 2 · XL 2 · 2XL 1".
  - `unsized line keeps the e2e controls`: style-1710 → "Add one piece" → the cart quantity is 7.
  - The existing test `submits only name, phone, idempotency key, and cart lines` keeps passing unchanged
    (the flag is off).
  - `sends sizes when the flag is on`: `vi.mock("@/lib/sizes", …)` with `SIZE_ORDERS_SENT: true` →
    `fetch` body item has `sizes: [{size:"M",quantity:1},{size:"L",quantity:2},{size:"XL",quantity:2},{size:"2XL",quantity:1}]`.
  - `empty order shows browse and new arrivals`: the text "Your order is empty", a link "Browse styles",
    and at least one product link.
- [ ] **Step 2:** Run the tests. Expect FAIL.
- [ ] **Step 3: Implement.**
  - Each line has a thumbnail, style number, name, line total and "Remove". Sized lines show
    `formatSplit`, a "Change sizes" toggle (expanded by default at `md+`) and `SizeQuantityRows`. Unsized
    lines show `QuantityInput`.
  - Summary: styles, pieces, product total, and "Delivery and payment are confirmed by our staff."
  - The form, error handling and receipt logic stay unchanged and are only restyled.
  - Empty state: the first 4 `newArrivals` in a `ProductGrid`.
- [ ] **Step 4:** Run `npm test` and `npm run check`. Expect PASS.
- [ ] **Step 5:** Commit `feat: order bar and order page with size lines`.

### Task 9: Home and category pages

**Files:**
- Modify: `src/app/page.tsx`, `src/app/category/[slug]/page.tsx`, `src/components/product-browser.tsx`,
  `src/app/not-found.tsx`, `src/app/privacy/page.tsx` (styling only)
- Test: `tests/home-sections.test.tsx`

**Interfaces — Consumes:** `CategoryTabs`, `ProductGrid`, `ProductTile`, `SectionTitle`, catalog exports
(`newArrivals`, `retailerDeals`, `allProducts`, `populatedCategories`).

- [ ] **Step 1: Write failing tests** (render `Home` inside both providers):
  - `shows new arrivals and all styles`: the headings "New arrivals" and "All styles", and the element
    `#all-styles` exists.
  - `hides deals when none exist`: no heading "Deals for shops" (today's data has no deal lane).
  - `shows deals when some exist`: `vi.mock("@/lib/catalog", …)` with one product in `retailerDeals` →
    the heading "Deals for shops" is shown.
- [ ] **Step 2:** Run the test. Expect FAIL.
- [ ] **Step 3: Implement the home page in the spec order.**
  1. Hero (one `next/image`, `preload={index === 0}`, the copy "Wholesale ladies wear · Colombo" /
     "Fresh styles for your shop" / "Shop new styles" → `#new-arrivals`).
  2. `CategoryTabs`.
  3. `#new-arrivals` (keep the pinned-slug ordering; 4 on phones, 8 on desktop).
  4. `#retailer-deals` black band rail, rendered only when `retailerDeals.length > 0`.
  5. `#all-styles` with `ProductBrowser`.
  6. A "How ordering works" strip of 3 one-line steps.
  7. `#visit-us`.

  Keep `metadata` unchanged. Category page: `CategoryTabs activeSlug`, `<h1>{category.name}</h1>`, the
  count, then `ProductBrowser`. Restyle `ProductBrowser`'s search box to hairline square, keeping its
  aria-label and empty-state copy.
- [ ] **Step 4:** Run `npm test`, `npm run check`, and `node --test tests/image-performance.test.mjs`.
  Expect PASS.
- [ ] **Step 5:** Commit `feat: home and category pages in quiet gallery look`.

### Task 10: Verification pass

- [ ] Run `npm run check`, `npm test` and `npm run build`. All must pass.
- [ ] Start `npm run dev` through `.claude/launch.json` and `preview_start`. At 375×812, check:
  - a vertical scroll starting on a card photo moves the page
  - a horizontal swipe changes photo
  - + → "6 in order" → sheet edit → Done
  - the product page add/update
  - `/order` inline edit, Remove, and the empty cart
  - style 3095 (2 photos) vs 3127 (16 photos)
  - style 4117's long name
  - the cookie strip not covering the order bar or WhatsApp float
- [ ] At desktop width, check mouse scrub, prev/next buttons, the 4-column grid, the sticky product
  details, and keyboard tab order through the card, sheet and order page.
- [ ] Turn on reduced motion and confirm there's no smooth scroll or animation.
- [ ] Fix anything found (with a test when it's logic), then commit `fix: …` per issue.
