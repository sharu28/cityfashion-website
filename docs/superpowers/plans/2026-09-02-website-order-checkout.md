# Website Order Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a wholesale customer build and submit an exact-price order with only a name and WhatsApp number, then let the City Fashion owner manage that order from a private dashboard and receive an email alert.

**Architecture:** A versioned browser-local cart stores product slugs and quantities only. A server route rehydrates current catalog products, recalculates all LKR totals, and calls a service-role-only Supabase transaction that creates the order, items, rate-limit record, and `CF-1001`-style reference atomically; Resend alerts the owner after persistence. Owner-only server pages and API routes verify a Supabase email/password session plus an email allowlist before using the service client to read or update orders.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, Tailwind CSS 4, Supabase Postgres/Auth, Resend 6.25, Vitest 4.1, Testing Library, Node 22

**Spec:** `docs/superpowers/specs/2026-09-02-website-order-checkout-design.md`

## Global Constraints

- Customer checkout asks for exactly `Name` and `WhatsApp number`.
- No customer account, phone OTP, delivery calculation, online payment, customer history, or stock-status UI.
- Every newly added style starts at 6 pieces; `-` and `+` change quantity by 1; the minimum is 6.
- Show an exact product total from authoritative integer `unitPriceLkr` values; delivery remains separate.
- Public references use `CF-<number>`, beginning at `CF-1001`.
- The customer-facing confirmation means the order was received, not stock- or payment-confirmed.
- Customer copy must use the short phrases approved in the spec.
- Keep the existing WhatsApp path available as fallback support.
- Never expose Supabase secret credentials, admin allowlist, Resend credentials, notification address, or payment instructions to browser code.
- Do not expose Odoo quantities, stock evidence, costs, or live Odoo access in the website path.
- Preserve unrelated dirty-worktree files and stage only paths named by each task.
- Run Windows commands through `npm.cmd` and launch local previews hidden with redirected logs.
- Do not push, deploy, apply production SQL, create the production admin user, or change production environment variables without the user's explicit approval at the release gate.

## File structure

### Catalog pricing

- `scripts/catalog-publication.mjs`: derives and validates public numeric unit prices.
- `tests/catalog-publication.test.mjs`: protects publication and price-leak rules.
- `data/product-overrides.json`: holds reviewed `unitPriceLkr` values.
- `data/product-overrides.template.json`: documents the new field.
- `data/generated/products.generated.json`: generated public catalog containing `unitPriceLkr`.
- `src/lib/catalog.ts`: exposes order eligibility and LKR formatting to UI/server code.

### Cart and customer order

- `src/lib/order-cart.ts`: pure cart normalization, quantity, and total functions.
- `src/components/order-cart-provider.tsx`: browser persistence and cart actions.
- `src/components/add-to-order-button.tsx`: add/quantity control for one product.
- `src/components/order-cart-bar.tsx`: global mobile-first cart summary.
- `src/components/order-page.tsx`: cart review, two-field checkout, submit, and confirmation states.
- `src/app/order/page.tsx`: order route shell and metadata.
- `src/app/shortlist/page.tsx`: permanent redirect from the old saved-items URL.

### Persistence and notifications

- `supabase/migrations/202609020001_create_website_orders.sql`: order tables, sequence, RLS, rate limiting, and atomic creation function.
- `supabase/schema.sql`: complete reproducible schema including the new migration.
- `src/lib/supabase/service.ts`: server-only service client.
- `src/lib/supabase/types.ts`: generated-shape TypeScript declarations for orders and RPCs.
- `src/lib/order-domain.ts`: request, receipt, status, validation, and WhatsApp helpers.
- `src/lib/order-service.ts`: server-side price hydration and order orchestration.
- `src/lib/order-email.ts`: Resend adapter and owner email content.
- `src/app/api/orders/route.ts`: public order submission endpoint.
- `src/lib/attribution.ts`: public-safe campaign cookie names retained after the retailer module is removed.

### Owner administration

- `src/lib/admin-auth.ts`: owner allowlist and session guard.
- `src/app/admin/login/page.tsx`: owner login route.
- `src/components/admin-login-form.tsx`: email/password login form.
- `src/app/api/admin/auth/route.ts`: owner sign-in/sign-out endpoint.
- `src/lib/order-admin.ts`: order reads, allowed transitions, updates, totals, and payment message.
- `src/app/admin/orders/page.tsx`: newest-first order list.
- `src/app/admin/orders/[id]/page.tsx`: private order detail shell.
- `src/components/admin-order-detail.tsx`: editable delivery, status, note, and contact controls.
- `src/app/api/admin/orders/[id]/route.ts`: authenticated order update endpoint.

### Tests and configuration

- `vitest.config.ts`: Node/jsdom unit-test configuration.
- `tests/setup.ts`: Testing Library matchers and cleanup.
- `tests/order-cart.test.ts`: pure cart rules.
- `tests/order-cart-provider.test.tsx`: persistence and action behavior.
- `tests/order-service.test.ts`: server validation, pricing, idempotency, and email-failure behavior.
- `tests/order-page.test.tsx`: checkout success and recovery behavior.
- `tests/admin-auth.test.ts`: owner allowlist rules.
- `tests/order-admin.test.ts`: transitions, totals, and WhatsApp message generation.
- `tests/orders-schema.test.mjs`: static safety assertions for the committed SQL.
- `.env.example`: names every required non-secret setting.
- `README.md`: local setup, migration, admin, email, verification, and fallback instructions.
- `src/app/privacy/page.tsx`: describes submitted-order data without claiming OTP use.

---

### Task 1: Add authoritative numeric prices to the catalog

**Files:**
- Modify: `scripts/catalog-publication.mjs`
- Modify: `tests/catalog-publication.test.mjs`
- Modify: `data/product-overrides.json`
- Modify: `data/product-overrides.template.json`
- Regenerate: `data/generated/products.generated.json`
- Modify: `src/lib/catalog.ts`

**Interfaces:**
- Consumes: current product overrides, optional reviewed Odoo list-price facts, and existing public catalog fallback data.
- Produces: `CatalogProduct.unitPriceLkr: number | null`, `CatalogProductView.orderable: boolean`, and `formatLkr(amount: number): string`.

- [ ] **Step 1: Write failing publication tests**

Add tests proving an approved override publishes a numeric price, an approved Odoo list price becomes numeric, and display strings alone do not make a product orderable:

```js
test("publishes an authoritative override unit price", () => {
  const product = buildPublicProduct({
    folderName: "1390",
    images: ["/cover.jpg"],
    override: {
      title: "Style 1390",
      category: "frocks",
      startingPrice: "Rs. 1,500",
      unitPriceLkr: 1500,
      moq: "6 pcs",
      description: "Wholesale style.",
    },
    fact: null,
    previousProduct: null,
  });

  assert.equal(product.unitPriceLkr, 1500);
  assert.equal(product.startingPrice, "Rs. 1,500");
});

test("does not parse a display price into an order price", () => {
  const product = buildPublicProduct({
    folderName: "1390",
    images: ["/cover.jpg"],
    override: {
      title: "Style 1390",
      category: "frocks",
      startingPrice: "From Rs. 1,500",
      moq: "6 pcs",
      description: "Wholesale style.",
    },
    fact: null,
    previousProduct: null,
  });

  assert.equal(product.unitPriceLkr, null);
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm.cmd run test:catalog-publication`

Expected: FAIL because `unitPriceLkr` is not published.

- [ ] **Step 3: Extend the publication contract**

Add `unitPriceLkr` to `PUBLIC_PRODUCT_KEYS`. Derive it only from a positive integer override, an explicitly approved Odoo list price, or an existing numeric fallback:

```js
const overrideUnitPrice = Number.isInteger(override.unitPriceLkr) && override.unitPriceLkr > 0
  ? override.unitPriceLkr
  : null;
const unitPriceLkr =
  override.priceSource === "odoo-list-price" && Number.isInteger(listPrice) && listPrice > 0
    ? listPrice
    : (overrideUnitPrice ?? fallback.unitPriceLkr ?? null);
```

Make `validatePublicProduct` accept only `null` or a positive integer. Do not derive the number from `startingPrice`.

- [ ] **Step 4: Add reviewed prices to the current 19 published products**

Add these explicit integer values to `data/product-overrides.json`:

```text
1390=1500, 1490=1700, 1570 KY Bamboo=1600, 1710=2050, 1780=1700,
1900=1700, 3003 V-3=2450, 3003 V-6=2450, 3017=3450, 3023=2700,
3042=3450, 3095=3250, 3105=3250, 3127=2900, 3143=2700, 3151=2900,
4080=1950, 4110=1900, 4118=1250
```

Add `"unitPriceLkr": 2250` to the override template next to `startingPrice`.

- [ ] **Step 5: Expose catalog orderability**

Extend the catalog types and normalizer:

```ts
export type CatalogProduct = {
  id: string;
  slug: string;
  title: string;
  category: string;
  startingPrice: string;
  unitPriceLkr: number | null;
  moq: string;
  fabric?: string;
  sizeRange?: string;
  description: string;
  colors: string[];
  merchandisingLane: MerchandisingLane;
  images: string[];
  cloudinaryImages?: string[];
  sourceFolder?: string;
  notes?: string;
};

export type CatalogProductView = CatalogProduct & {
  categoryMeta: Category;
  coverImage: string | null;
  badges: string[];
  orderable: boolean;
};

export function formatLkr(amount: number) {
  return `Rs. ${amount.toLocaleString("en-LK")}`;
}
```

Set `orderable: Number.isInteger(product.unitPriceLkr) && product.unitPriceLkr > 0 && product.moq === "6 pcs"` in `normalizeProduct`.

- [ ] **Step 6: Regenerate and verify**

Run:

```powershell
npm.cmd run import-products
npm.cmd run test:catalog-publication
npm.cmd run check
```

Expected: 19 current products remain published, every published orderable product has a positive integer `unitPriceLkr`, tests pass, and TypeScript/ESLint pass.

- [ ] **Step 7: Commit only catalog price paths**

```powershell
git add scripts/catalog-publication.mjs tests/catalog-publication.test.mjs data/product-overrides.json data/product-overrides.template.json data/generated/products.generated.json src/lib/catalog.ts
git commit -m "Add authoritative catalog order prices"
```

---

### Task 2: Establish the test harness and pure cart model

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `src/lib/order-cart.ts`
- Create: `tests/order-cart.test.ts`

**Interfaces:**
- Consumes: `CatalogProductView` and its authoritative `unitPriceLkr`.
- Produces: `CartEntry`, `MIN_ORDER_QUANTITY`, `sanitizeCart`, `addCartItem`, `setCartQuantity`, `removeCartItem`, and `summarizeCart`.

- [ ] **Step 1: Install the fixed test dependencies**

Run:

```powershell
npm.cmd install --save-dev vitest@4.1.11 jsdom@30.0.1 @testing-library/react@16.3.3 @testing-library/user-event@14.6.7 @testing-library/jest-dom@7.0.1
```

Add scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 2: Configure Vitest**

Create `vitest.config.ts`:

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
  },
});
```

Create `tests/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());
```

- [ ] **Step 3: Write failing cart tests**

Cover add-at-six, one-piece changes, minimum enforcement, invalid-storage cleanup, product removal, stale product removal from summaries, and exact totals:

```ts
import { describe, expect, it } from "vitest";
import {
  addCartItem,
  sanitizeCart,
  setCartQuantity,
  summarizeCart,
} from "@/lib/order-cart";

describe("order cart", () => {
  it("adds a style at six and increments one piece at a time", () => {
    const added = addCartItem([], "style-1390");
    expect(added).toEqual([{ productSlug: "style-1390", quantity: 6 }]);
    expect(setCartQuantity(added, "style-1390", 7)).toEqual([
      { productSlug: "style-1390", quantity: 7 },
    ]);
    expect(setCartQuantity(added, "style-1390", 5)).toEqual(added);
  });

  it("calculates totals from current catalog prices", () => {
    const summary = summarizeCart(
      [{ productSlug: "style-1390", quantity: 6 }],
      [{ slug: "style-1390", unitPriceLkr: 1500 }],
    );
    expect(summary.productTotalLkr).toBe(9000);
    expect(summary.lines[0].lineTotalLkr).toBe(9000);
  });

  it("drops malformed browser data", () => {
    expect(sanitizeCart([{ productSlug: "style-1390", quantity: "six" }])).toEqual([]);
  });
});
```

- [ ] **Step 4: Run the focused test and verify failure**

Run: `npm.cmd test -- tests/order-cart.test.ts`

Expected: FAIL because `src/lib/order-cart.ts` does not exist.

- [ ] **Step 5: Implement the pure cart model**

Use these exact public types and signatures:

```ts
export const MIN_ORDER_QUANTITY = 6;

export type CartEntry = {
  productSlug: string;
  quantity: number;
};

export type PricedProduct = {
  slug: string;
  unitPriceLkr: number | null;
};

export function sanitizeCart(value: unknown): CartEntry[];
export function addCartItem(entries: CartEntry[], productSlug: string): CartEntry[];
export function setCartQuantity(entries: CartEntry[], productSlug: string, quantity: number): CartEntry[];
export function removeCartItem(entries: CartEntry[], productSlug: string): CartEntry[];
export function summarizeCart(entries: CartEntry[], products: PricedProduct[]): {
  lines: Array<CartEntry & { unitPriceLkr: number; lineTotalLkr: number }>;
  itemCount: number;
  styleCount: number;
  productTotalLkr: number;
};
```

`setCartQuantity` returns the unchanged list for non-integers or values below six. `summarizeCart` omits missing or non-orderable products and computes `itemCount` as the total number of pieces.

- [ ] **Step 6: Run tests and checks**

Run:

```powershell
npm.cmd test -- tests/order-cart.test.ts
npm.cmd run check
```

Expected: all focused tests and static checks pass.

- [ ] **Step 7: Commit the harness and model**

```powershell
git add package.json package-lock.json vitest.config.ts tests/setup.ts src/lib/order-cart.ts tests/order-cart.test.ts
git commit -m "Add tested order cart model"
```

---

### Task 3: Replace shortlist controls with the persistent order cart

**Files:**
- Create: `src/components/order-cart-provider.tsx`
- Create: `src/components/add-to-order-button.tsx`
- Create: `src/components/order-quantity-control.tsx`
- Create: `src/components/order-cart-bar.tsx`
- Create: `tests/order-cart-provider.test.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/site-header.tsx`
- Modify: `src/components/product-tile.tsx`
- Modify: `src/app/products/[slug]/page.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/category/[slug]/page.tsx`

**Interfaces:**
- Consumes: Task 2 cart functions and `allProducts` from `src/lib/catalog.ts`.
- Produces: `useOrderCart(): OrderCartContextValue` with `entries`, `summary`, `add`, `setQuantity`, `remove`, `clear`, `isLoaded`, and `has`.

- [ ] **Step 1: Write failing provider tests**

Use a test harness inside `OrderCartProvider` to prove loading, persistence, and clearing:

```tsx
function Harness() {
  const cart = useOrderCart();
  return (
    <div>
      <output data-testid="quantity">{cart.entries[0]?.quantity ?? 0}</output>
      <button onClick={() => cart.add("style-1390")}>Add</button>
      <button onClick={() => cart.setQuantity("style-1390", 7)}>Seven</button>
      <button onClick={cart.clear}>Clear</button>
    </div>
  );
}

it("starts at six and persists cart changes", async () => {
  render(<OrderCartProvider><Harness /></OrderCartProvider>);
  await userEvent.click(screen.getByRole("button", { name: "Add" }));
  expect(screen.getByTestId("quantity")).toHaveTextContent("6");
  expect(localStorage.getItem("city-fashion-order-cart-v1")).toContain('"quantity":6');
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm.cmd test -- tests/order-cart-provider.test.tsx`

Expected: FAIL because `OrderCartProvider` does not exist.

- [ ] **Step 3: Implement the provider**

Persist only `CartEntry[]` under `city-fashion-order-cart-v1`. Load after mount, sanitize every read, and write after each user mutation. Build `summary` from `allProducts` on every entry change. Do not persist prices or product titles.

Export this context:

```ts
export type OrderCartContextValue = {
  entries: CartEntry[];
  summary: ReturnType<typeof summarizeCart>;
  isLoaded: boolean;
  add(productSlug: string): void;
  setQuantity(productSlug: string, quantity: number): void;
  remove(productSlug: string): void;
  clear(): void;
  has(productSlug: string): boolean;
};
```

- [ ] **Step 4: Implement shared cart controls**

`AddToOrderButton` accepts `product: CatalogProductView`. When orderable and absent, it shows **Add to order**. When present, it renders `OrderQuantityControl`. When not orderable, it renders a normal WhatsApp anchor labeled **Ask price on WhatsApp**.

`OrderQuantityControl` uses three separate accessible controls with labels **Remove one piece**, the current quantity, and **Add one piece**. Disable minus at six; removal is a separate **Remove** action in the cart page.

`OrderCartBar` is hidden when empty and otherwise links to `/order` with:

```text
View order · <styleCount> styles · <formatted product total>
```

- [ ] **Step 5: Replace product and navigation controls**

- Wrap the app in `OrderCartProvider` instead of `RetailerProvider`.
- Put `OrderCartBar` once in the root layout, not once per page.
- Change the desktop header link from **Shortlist** to **Order (<styleCount>)**.
- Refactor `ProductTile` to an `<article>` with separate product links so the add button is not nested inside a link.
- Replace `SaveProductButton` and primary WhatsApp-order controls with `AddToOrderButton` on product tiles and product pages.
- Remove page-specific fixed mobile order bars that would overlap the global cart bar.
- Keep a plain WhatsApp help link for non-orderable products and general support.

- [ ] **Step 6: Run focused tests and checks**

Run:

```powershell
npm.cmd test -- tests/order-cart.test.ts tests/order-cart-provider.test.tsx
npm.cmd run check
```

Expected: tests and checks pass; no interactive button is nested inside a product link.

- [ ] **Step 7: Commit the cart UI**

```powershell
git add src/components/order-cart-provider.tsx src/components/add-to-order-button.tsx src/components/order-quantity-control.tsx src/components/order-cart-bar.tsx tests/order-cart-provider.test.tsx src/app/layout.tsx src/components/site-header.tsx src/components/product-tile.tsx src/app/products/[slug]/page.tsx src/app/page.tsx src/app/category/[slug]/page.tsx
git commit -m "Replace shortlist with order cart"
```

---

### Task 4: Create the secure order database contract

**Files:**
- Create: `supabase/migrations/202609020001_create_website_orders.sql`
- Modify: `supabase/schema.sql`
- Create: `tests/orders-schema.test.mjs`
- Modify: `package.json`
- Create: `src/lib/supabase/service.ts`
- Modify: `src/lib/supabase/env.ts`
- Modify: `src/lib/supabase/types.ts`
- Modify: `.env.example`

**Interfaces:**
- Consumes: normalized order snapshots from the future order service.
- Produces: `create_website_order` RPC, protected `orders`/`order_items`, `createSupabaseServiceClient()`, and typed row/RPC contracts.

- [ ] **Step 1: Write the failing schema safety test**

Create a Node test that reads the migration and asserts the non-negotiable controls:

```js
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const sql = fs.readFileSync("supabase/migrations/202609020001_create_website_orders.sql", "utf8");

test("orders schema is private and atomic", () => {
  assert.match(sql, /create sequence public\.website_order_number_seq start with 1001/i);
  assert.match(sql, /alter table public\.orders enable row level security/i);
  assert.match(sql, /alter table public\.order_items enable row level security/i);
  assert.match(sql, /alter table public\.order_submission_attempts enable row level security/i);
  assert.match(sql, /revoke all on public\.orders from anon, authenticated/i);
  assert.match(sql, /create or replace function public\.create_website_order/i);
  assert.match(sql, /revoke execute on function public\.create_website_order/i);
  assert.match(sql, /grant execute on function public\.create_website_order/i);
});
```

Add `"test:orders-schema": "node --test tests/orders-schema.test.mjs"` to `package.json`.

- [ ] **Step 2: Run the schema test and verify failure**

Run: `npm.cmd run test:orders-schema`

Expected: FAIL because the migration does not exist.

- [ ] **Step 3: Write the migration**

The migration must create:

```sql
create sequence public.website_order_number_seq start with 1001;

create type public.website_order_status as enum (
  'new', 'confirmed', 'paid', 'completed', 'cancelled'
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  public_number bigint not null unique default nextval('public.website_order_number_seq'),
  idempotency_key uuid not null unique,
  customer_name text not null check (char_length(customer_name) between 1 and 100),
  whatsapp_phone text not null check (whatsapp_phone ~ '^\\+947[0-9]{8}$'),
  product_total_lkr integer not null check (product_total_lkr > 0),
  delivery_charge_lkr integer check (delivery_charge_lkr >= 0),
  final_total_lkr integer generated always as (
    case when delivery_charge_lkr is null then null
      else product_total_lkr + delivery_charge_lkr end
  ) stored,
  status public.website_order_status not null default 'new',
  private_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  product_slug text not null,
  product_title text not null,
  unit_price_lkr integer not null check (unit_price_lkr > 0),
  quantity integer not null check (quantity >= 6),
  line_total_lkr integer not null check (line_total_lkr = unit_price_lkr * quantity),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.order_submission_attempts (
  id bigint generated by default as identity primary key,
  identity_hash text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index order_submission_attempts_recent_idx
  on public.order_submission_attempts(identity_hash, created_at desc);
```

Enable RLS and revoke all table/sequence access from `anon` and `authenticated`. Do not add customer-facing select policies.

Add a `set_website_order_updated_at` trigger that sets `new.updated_at = timezone('utc', now())` before every update to `orders`.

Create `public.create_website_order(p_idempotency_key uuid, p_customer_name text, p_whatsapp_phone text, p_identity_hash text, p_items jsonb)` as `security definer set search_path = public`. It must:

1. Return the existing order for a duplicate idempotency key before consuming rate limit.
2. Take `pg_advisory_xact_lock(hashtextextended(p_identity_hash, 0))`.
3. Reject the sixth new submission for the same hash within 15 minutes.
4. Record only the salted SHA-256 identity hash, never raw IP data.
5. Validate that `p_items` is a non-empty JSON array.
6. Validate every quantity and price.
7. Calculate `product_total_lkr` from item values inside SQL.
8. Insert the order and all item snapshots in the same transaction.
9. Return `id`, `public_number`, `product_total_lkr`, `created_at`, and `duplicate`.

Return `duplicate = true` from the existing-idempotency branch and `duplicate = false` from the newly inserted branch.

Before counting attempts, delete attempts for the same identity hash older than seven days. When the 15-minute limit is reached, raise `order_rate_limited` with SQLSTATE `P0001`; the repository maps only that exact message/code pair to the public rate-limit response.

Revoke function execution from `public`, `anon`, and `authenticated`; grant it only to `service_role`.

- [ ] **Step 4: Make the schema reproducible**

Append the migration's order-specific definitions to `supabase/schema.sql` without removing the existing retailer tables. This avoids destructive changes to any existing Supabase data while making a fresh setup complete.

- [ ] **Step 5: Add server-only Supabase configuration**

Extend `getSupabaseEnv` only for public URL/anon use and add:

```ts
export function getSupabaseServiceEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) return null;
  return { url, secretKey };
}
```

Create `src/lib/supabase/service.ts` with `import "server-only"` and `createClient<Database>(url, secretKey, { auth: { autoRefreshToken: false, persistSession: false } })`. Throw a clear server configuration error when missing.

Add these keys to `.env.example`:

```text
SUPABASE_SECRET_KEY=
ADMIN_EMAIL=
RESEND_API_KEY=
ORDER_NOTIFICATION_EMAIL=
ORDER_EMAIL_FROM=
ORDER_RATE_LIMIT_SALT=
PAYMENT_INSTRUCTIONS=
```

- [ ] **Step 6: Extend TypeScript database types**

Add `orders`, `order_items`, and `order_submission_attempts` table shapes, the `website_order_status` enum, and the `create_website_order` RPC arguments/return type to `src/lib/supabase/types.ts`. Use snake_case for database fields and the five exact status literals.

- [ ] **Step 7: Verify and commit**

Run:

```powershell
npm.cmd run test:orders-schema
npm.cmd run check
```

Then commit only the schema contract paths:

```powershell
git add supabase/migrations/202609020001_create_website_orders.sql supabase/schema.sql tests/orders-schema.test.mjs package.json src/lib/supabase/service.ts src/lib/supabase/env.ts src/lib/supabase/types.ts .env.example
git commit -m "Add secure website order schema"
```

---

### Task 5: Implement server-validated order submission and owner email

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/lib/order-domain.ts`
- Create: `src/lib/order-service.ts`
- Create: `src/lib/order-email.ts`
- Create: `src/app/api/orders/route.ts`
- Create: `tests/order-service.test.ts`

**Interfaces:**
- Consumes: `{ customerName, whatsappNumber, idempotencyKey, items: { productSlug, quantity }[] }` and current catalog products.
- Produces: `OrderReceipt`, HTTP `201` for a new/duplicate-safe order, typed validation errors, and a best-effort `OrderNotifier`.

- [ ] **Step 1: Install Resend**

Run: `npm.cmd install resend@6.25.0`

- [ ] **Step 2: Write failing order-service tests**

Test exact server pricing, invalid phone/name/quantity, missing product, non-orderable product, duplicate repository results, rate-limit mapping, and email failure after persistence:

```ts
it("uses catalog prices and keeps a saved order when email fails", async () => {
  const repository = {
    create: vi.fn().mockResolvedValue({
      id: "4bb7dcf4-6e9f-4ad1-a284-028d99751818",
      publicNumber: 1001,
      reference: "CF-1001",
      productTotalLkr: 9000,
      createdAt: "2026-09-02T10:00:00.000Z",
      duplicate: false,
    }),
  };
  const notifier = { sendNewOrder: vi.fn().mockRejectedValue(new Error("email unavailable")) };

  const result = await submitOrder(
    {
      customerName: "Nimali",
      whatsappNumber: "0742216040",
      idempotencyKey: "9b0c79fd-cf5c-4eef-b44f-6dbf8353e75e",
      items: [{ productSlug: "style-1390", quantity: 6 }],
    },
    {
      catalog: [{ id: "1390", slug: "style-1390", title: "Style 1390", unitPriceLkr: 1500 }],
      identityHash: "salted-hash",
      notifier,
      repository,
    },
  );

  expect(result.reference).toBe("CF-1001");
  expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ productTotalLkr: 9000 }));
});
```

- [ ] **Step 3: Run the focused test and verify failure**

Run: `npm.cmd test -- tests/order-service.test.ts`

Expected: FAIL because the order domain and service do not exist.

- [ ] **Step 4: Implement domain validation**

Export these contracts from `src/lib/order-domain.ts`:

```ts
export type PlaceOrderPayload = {
  customerName: string;
  whatsappNumber: string;
  idempotencyKey: string;
  items: Array<{ productSlug: string; quantity: number }>;
};

export type OrderReceipt = {
  id: string;
  publicNumber: number;
  reference: string;
  productTotalLkr: number;
  createdAt: string;
  duplicate: boolean;
};

export class OrderValidationError extends Error {
  constructor(public code: "invalid_name" | "invalid_phone" | "invalid_items" | "style_unavailable") {
    super(code);
  }
}

export function normalizeSriLankaMobile(value: string): string;
export function buildOrderSupportWhatsAppLink(reference: string): string;
```

Normalize `0742216040`, `742216040`, and `94742216040` to `+94742216040`; reject all other shapes. Trim names, require 1-100 characters, require a valid UUID idempotency key, require at least one item, and reject duplicate slugs.

- [ ] **Step 5: Implement service orchestration**

Use explicit dependency interfaces:

```ts
export type OrderRepository = {
  create(input: {
    customerName: string;
    whatsappPhone: string;
    idempotencyKey: string;
    identityHash: string;
    productTotalLkr: number;
    items: Array<{
      productId: string;
      productSlug: string;
      productTitle: string;
      unitPriceLkr: number;
      quantity: number;
      lineTotalLkr: number;
    }>;
  }): Promise<OrderReceipt>;
};

export type OrderNotifier = {
  sendNewOrder(order: OrderReceipt & {
    customerName: string;
    whatsappPhone: string;
    items: Array<{
      productId: string;
      productTitle: string;
      unitPriceLkr: number;
      quantity: number;
      lineTotalLkr: number;
    }>;
  }): Promise<void>;
};
```

`submitOrder` must find products by slug, reject `unitPriceLkr === null`, enforce quantity >= 6, calculate all totals from catalog data, and await the repository. Call the notifier only when `receipt.duplicate === false`; catch/log notifier failure without changing the successful receipt.

- [ ] **Step 6: Implement Supabase and Resend adapters**

The repository calls `create_website_order` through `createSupabaseServiceClient()`. It passes item snapshots as JSON and formats `reference` from `public_number`.

`src/lib/order-email.ts` uses `new Resend(process.env.RESEND_API_KEY)` and sends one escaped HTML/text email from `ORDER_EMAIL_FROM` to `ORDER_NOTIFICATION_EMAIL`. Include reference, customer, phone, each line, product total, creation time, and `${siteUrl}/admin/orders/<internal-id>`.

- [ ] **Step 7: Implement `POST /api/orders`**

The route must:

- Parse JSON with a 20 KB body limit.
- Obtain the first trusted Vercel forwarding IP value or `unknown`.
- Build `identityHash = sha256(ORDER_RATE_LIMIT_SALT + "|" + ip + "|" + normalizedPhone)` on the server.
- Return `400` with approved simple copy for validation failures.
- Return `409` with **This style is no longer available to order** for stale catalog items.
- Return `429` with **Please wait before placing another order** for the SQL rate-limit error.
- Return `503` with the approved recovery copy when server order configuration is missing.
- Return the `OrderReceipt` with `201` after persistence, including duplicate-safe retries.

- [ ] **Step 8: Run tests and checks**

Run:

```powershell
npm.cmd test -- tests/order-service.test.ts
npm.cmd run check
```

Expected: all service tests and checks pass; no secret environment name appears in client components.

- [ ] **Step 9: Commit the order endpoint**

```powershell
git add package.json package-lock.json src/lib/order-domain.ts src/lib/order-service.ts src/lib/order-email.ts src/app/api/orders/route.ts tests/order-service.test.ts
git commit -m "Add validated website order submission"
```

---

### Task 6: Build the two-field customer order page and confirmation

**Files:**
- Create: `src/components/order-page.tsx`
- Create: `src/app/order/page.tsx`
- Modify: `src/app/shortlist/page.tsx`
- Modify: `src/components/order-cart-bar.tsx`
- Create: `tests/order-page.test.tsx`

**Interfaces:**
- Consumes: `useOrderCart`, `formatLkr`, `PlaceOrderPayload`, `OrderReceipt`, and `buildOrderSupportWhatsAppLink`.
- Produces: editable `/order`, minimal checkout, durable-error recovery, and in-place confirmation.

- [ ] **Step 1: Write failing UI tests**

Mock `fetch` and test the complete approved behavior:

```tsx
it("submits only name, phone, idempotency key, and cart lines", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      id: "4bb7dcf4-6e9f-4ad1-a284-028d99751818",
      publicNumber: 1001,
      reference: "CF-1001",
      productTotalLkr: 9000,
      createdAt: "2026-09-02T10:00:00.000Z",
      duplicate: false,
    }),
  }));

  render(<OrderPage />);
  await userEvent.type(screen.getByLabelText("Name"), "Nimali");
  await userEvent.type(screen.getByLabelText("WhatsApp number"), "0742216040");
  await userEvent.click(screen.getByRole("button", { name: "Place order" }));

  expect(await screen.findByText("Order received")).toBeVisible();
  expect(screen.getByText("CF-1001")).toBeVisible();
  expect(screen.getByRole("link", { name: "Message us on WhatsApp" })).toHaveAttribute("href", expect.stringContaining("CF-1001"));
});
```

Add a failure test proving the approved recovery message appears and cart entries remain.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm.cmd test -- tests/order-page.test.tsx`

Expected: FAIL because the order page component does not exist.

- [ ] **Step 3: Build the cart review**

Render each cart line with image, style code, title, unit price, `OrderQuantityControl`, line total, and **Remove**. Render **Continue shopping** to `/#new-arrivals`. Show **Product total** and **Delivery will be confirmed by our staff.**

When the cart is empty, show **Your order is empty** and a single **Browse styles** link.

- [ ] **Step 4: Build the minimal checkout form**

Use exactly two labeled inputs. On the first submission attempt, create and retain `crypto.randomUUID()` until either the order succeeds or the cart changes. Disable **Place order** while the request is pending. Send only:

```ts
{
  customerName,
  whatsappNumber,
  idempotencyKey,
  items: entries.map(({ productSlug, quantity }) => ({ productSlug, quantity })),
}
```

Use server-returned error copy. Never clear the cart on a failed response.

- [ ] **Step 5: Build the confirmation state**

After success, call `clear()` once and render **Order received**, the reference, formatted product total, **Our staff will contact you shortly to confirm delivery and payment**, and the optional WhatsApp link. Keep the result in component state rather than putting customer data in the URL.

- [ ] **Step 6: Wire routes**

- Add metadata and the `CatalogShell` wrapper in `src/app/order/page.tsx`.
- Change `/shortlist` to `redirect("/order")` so saved old links have a safe destination.
- Point `OrderCartBar` and header order links to `/order`.

- [ ] **Step 7: Run tests and checks**

Run:

```powershell
npm.cmd test -- tests/order-page.test.tsx tests/order-cart-provider.test.tsx
npm.cmd run check
```

Expected: checkout tests and static checks pass.

- [ ] **Step 8: Commit the customer order page**

```powershell
git add src/components/order-page.tsx src/app/order/page.tsx src/app/shortlist/page.tsx src/components/order-cart-bar.tsx tests/order-page.test.tsx
git commit -m "Add minimal website order checkout"
```

---

### Task 7: Add owner-only admin authentication

**Files:**
- Create: `src/lib/admin-auth.ts`
- Create: `src/components/admin-login-form.tsx`
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/api/admin/auth/route.ts`
- Create: `tests/admin-auth.test.ts`

**Interfaces:**
- Consumes: Supabase cookie session and `ADMIN_EMAIL`.
- Produces: `isAllowedAdminEmail(email)`, `getAdminAccess()`, `requireAdmin()`, authenticated sign-in, and sign-out.

- [ ] **Step 1: Write failing allowlist tests**

```ts
import { describe, expect, it } from "vitest";
import { isAllowedAdminEmail } from "@/lib/admin-auth";

describe("admin allowlist", () => {
  it("allows only the configured owner email, case-insensitively", () => {
    expect(isAllowedAdminEmail("Owner@CityFashion.Shop", "owner@cityfashion.shop")).toBe(true);
    expect(isAllowedAdminEmail("staff@cityfashion.shop", "owner@cityfashion.shop")).toBe(false);
    expect(isAllowedAdminEmail(null, "owner@cityfashion.shop")).toBe(false);
  });
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm.cmd test -- tests/admin-auth.test.ts`

Expected: FAIL because `admin-auth.ts` does not exist.

- [ ] **Step 3: Implement the guard**

`isAllowedAdminEmail` trims and lowercases both values. Export:

```ts
export type AdminAccess =
  | { status: "allowed"; user: User }
  | { status: "signed_out" }
  | { status: "forbidden" }
  | { status: "unconfigured" };

export async function getAdminAccess(): Promise<AdminAccess>;
export async function requireAdmin(): Promise<User>;
```

`getAdminAccess()` gets the current user from `createSupabaseServerComponentClient()` and distinguishes no session, wrong email, missing configuration, and the allowed owner. `requireAdmin()` calls it and redirects every non-allowed page request to `/admin/login`. API routes call `getAdminAccess()` directly so they can return `401`, `403`, or `503` without redirecting.

- [ ] **Step 4: Implement sign-in and sign-out**

`POST /api/admin/auth` accepts email/password, rejects an email that is not the configured owner before calling Supabase, signs in with `signInWithPassword`, persists returned cookies, and returns `{ ok: true }`. `DELETE` signs out and clears session cookies.

The login page asks for **Email** and **Password** and shows **Sign in**. On success, use `router.replace("/admin/orders")` and `router.refresh()`.

- [ ] **Step 5: Run tests and checks**

Run:

```powershell
npm.cmd test -- tests/admin-auth.test.ts
npm.cmd run check
```

Expected: tests and checks pass; an arbitrary authenticated Supabase user remains unauthorized.

- [ ] **Step 6: Commit admin authentication**

```powershell
git add src/lib/admin-auth.ts src/components/admin-login-form.tsx src/app/admin/login/page.tsx src/app/api/admin/auth/route.ts tests/admin-auth.test.ts
git commit -m "Add owner-only order admin login"
```

---

### Task 8: Build the private order dashboard and payment handoff

**Files:**
- Create: `src/lib/order-admin.ts`
- Create: `src/app/admin/orders/page.tsx`
- Create: `src/app/admin/orders/[id]/page.tsx`
- Create: `src/components/admin-order-detail.tsx`
- Create: `src/app/api/admin/orders/[id]/route.ts`
- Create: `tests/order-admin.test.ts`

**Interfaces:**
- Consumes: `requireAdmin`, service Supabase client, order rows/items, `PAYMENT_INSTRUCTIONS`, and the City Fashion WhatsApp number.
- Produces: newest-first list, detail view, `canTransitionOrder`, `calculateFinalTotal`, `updateOrder`, and `buildPaymentWhatsAppLink`.

- [ ] **Step 1: Write failing admin-domain tests**

```ts
describe("admin order rules", () => {
  it("allows only the approved status graph", () => {
    expect(canTransitionOrder("new", "confirmed")).toBe(true);
    expect(canTransitionOrder("confirmed", "paid")).toBe(true);
    expect(canTransitionOrder("paid", "completed")).toBe(true);
    expect(canTransitionOrder("new", "paid")).toBe(false);
    expect(canTransitionOrder("paid", "cancelled")).toBe(false);
  });

  it("adds delivery to the product total", () => {
    expect(calculateFinalTotal(18000, 600)).toBe(18600);
    expect(calculateFinalTotal(18000, null)).toBe(null);
  });

  it("builds a payment message with the reference and final amount", () => {
    const url = buildPaymentWhatsAppLink({
      reference: "CF-1001",
      whatsappPhone: "+94771234567",
      productTotalLkr: 18000,
      deliveryChargeLkr: 600,
      paymentInstructions: "Bank transfer: City Fashion account",
    });
    expect(decodeURIComponent(url)).toContain("CF-1001");
    expect(decodeURIComponent(url)).toContain("Rs. 18,600");
  });
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm.cmd test -- tests/order-admin.test.ts`

Expected: FAIL because `order-admin.ts` does not exist.

- [ ] **Step 3: Implement admin rules and repository operations**

Use this transition map:

```ts
const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  new: ["confirmed", "cancelled"],
  confirmed: ["new", "paid", "cancelled"],
  paid: ["confirmed", "completed"],
  completed: ["paid"],
  cancelled: [],
};
```

`listOrders()` selects the approved list fields ordered by `created_at desc`. `getOrder(id)` selects the order and `order_items(*)`. `updateOrder(id, patch)` validates transition, non-negative integer delivery charge, private-note length <= 2000, and then updates through the service client. It never accepts edits to product or customer snapshots.

- [ ] **Step 4: Build the order list**

Guard the page with `requireAdmin()`. Render reference, localized Sri Lankan date/time, customer name, click-to-call WhatsApp number, style count, product total, and a plain status label. Each row links to `/admin/orders/<internal-id>`. Include a sign-out button.

- [ ] **Step 5: Build the detail editor**

Render line items, product total, delivery input, calculated final payable amount, private note, status select, **Save changes**, **Call customer**, **Open WhatsApp**, and **Message payment details**.

Disable **Message payment details** until status is `confirmed` and delivery charge is present, including `0` for pickup. The link must use the customer's normalized WhatsApp number and `PAYMENT_INSTRUCTIONS` from the server response; never return other secret environment values.

- [ ] **Step 6: Build the protected update route**

`PATCH /api/admin/orders/[id]` calls `getAdminAccess()`, accepts only `status`, `deliveryChargeLkr`, and `privateNote`, calls `updateOrder`, and returns the updated order. Return `401` for no session, `403` for a non-owner account, `503` for missing admin configuration, `400` for invalid transitions/amounts, and `404` for a missing order.

- [ ] **Step 7: Run tests and checks**

Run:

```powershell
npm.cmd test -- tests/order-admin.test.ts tests/admin-auth.test.ts
npm.cmd run check
```

Expected: tests and checks pass; admin pages never query protected tables through a browser client.

- [ ] **Step 8: Commit the dashboard**

```powershell
git add src/lib/order-admin.ts src/app/admin/orders/page.tsx src/app/admin/orders/[id]/page.tsx src/components/admin-order-detail.tsx src/app/api/admin/orders/[id]/route.ts tests/order-admin.test.ts
git commit -m "Add private order dashboard"
```

---

### Task 9: Remove the legacy customer-auth journey and align all copy/docs

**Files:**
- Delete: `src/components/retailer-provider.tsx`
- Delete: `src/components/retailer-account-controls.tsx`
- Delete: `src/components/retailer-order-button.tsx`
- Delete: `src/components/save-product-button.tsx`
- Delete: `src/components/shortlist-page.tsx`
- Delete: `src/app/api/auth/send-otp/route.ts`
- Delete: `src/app/api/auth/verify-otp/route.ts`
- Delete: `src/app/api/auth/sign-out/route.ts`
- Delete: `src/app/api/retailer/me/route.ts`
- Delete: `src/app/api/retailer/shortlist/route.ts`
- Delete: `src/app/api/retailer/whatsapp-intent/route.ts`
- Delete: `src/lib/retailer-server.ts`
- Delete: `src/lib/retailer.ts`
- Create: `src/lib/attribution.ts`
- Modify: `src/components/attribution-tracker.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/category/[slug]/page.tsx`
- Modify: `src/app/products/[slug]/page.tsx`
- Modify: `src/app/privacy/page.tsx`
- Modify: `src/lib/site.ts`
- Modify: `src/lib/analytics.ts`
- Modify: `README.md`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: the completed cart, order, and admin flows.
- Produces: one coherent customer concept, accurate privacy/setup docs, and no reachable phone-OTP or shortlist UI.

- [ ] **Step 1: Replace site-wide journey copy**

Use only the approved short labels in the order path. Update the homepage process to:

```text
01 Browse styles — Open a style and check the photos and price.
02 Add to order — Each style starts at 6 pieces.
03 Check your order — Change quantities and see the product total.
04 Place order — Enter your name and WhatsApp number.
```

Change metadata/site descriptions from “order on WhatsApp” to “build your wholesale order online,” while leaving a WhatsApp support statement where relevant.

- [ ] **Step 2: Remove unreachable customer auth and shortlist code**

Run `rg -n "RetailerProvider|RetailerAccountControls|RetailerOrderButton|SaveProductButton|useRetailer|shortlist|OTP|@/lib/retailer" src` first. Move `sourceCookieName` and `landingCookieName` unchanged into `src/lib/attribution.ts`, then point `src/components/attribution-tracker.tsx` at that focused module. Delete the listed legacy files only after every other live import has been replaced. Keep the old Supabase retailer tables in `supabase/schema.sql`; do not issue destructive drops against existing data.

- [ ] **Step 3: Align privacy and analytics**

Update privacy copy to state that order name, WhatsApp number, selected products, quantities, totals, status, and timestamps are stored to process the order. Remove claims that customer OTP is part of the live journey.

Remove obsolete `login`, `otp_requested`, and `shortlist_updated` event-name mappings. Do not add order-form analytics in this version. Existing product-view and WhatsApp-support measurement must never receive a name, phone number, order reference, or internal order ID.

- [ ] **Step 4: Update operating documentation**

README setup must list the SQL migration, Supabase URL/anon/secret keys, owner email/password account, owner allowlist, Resend sender/recipient, rate-limit salt, payment instructions, local checks, and the WhatsApp fallback. Update AGENTS.md's main flow and file map to match `/order`, `/api/orders`, and `/admin/orders`.

- [ ] **Step 5: Verify no stale journey remains**

Run:

```powershell
rg -n "Sign up with phone|Send OTP|Verify and continue|Saved styles|Start WhatsApp order|Browse\. Save\. WhatsApp" src README.md AGENTS.md
npm.cmd test
npm.cmd run test:catalog-publication
npm.cmd run test:orders-schema
npm.cmd run check
npm.cmd run build
```

Expected: the search returns no stale customer-flow copy, all tests pass, and the production build succeeds.

- [ ] **Step 6: Commit the completed journey cleanup**

Stage exactly the listed legacy, attribution, copy, analytics, README, and AGENTS paths. Confirm with `git diff --cached --name-status` that unrelated `.memory`, screenshots, and the previously deleted Cloudinary spec are not staged.

```powershell
git commit -m "Align site around website ordering"
```

---

### Task 10: Verify locally and prepare the explicit production release gate

**Files:**
- No source changes expected unless verification finds an in-scope defect.
- Review: all files changed by Tasks 1-9.

**Interfaces:**
- Consumes: the complete local feature and configured non-production services.
- Produces: evidence that the exact customer/admin journeys work and a clear approval request before production mutation.

- [ ] **Step 1: Run the complete automated gate**

Run:

```powershell
npm.cmd run import-products
npm.cmd run test:catalog-sync
npm.cmd run test:catalog-publication
npm.cmd run test:orders-schema
npm.cmd test
npm.cmd run check
npm.cmd run build
git diff --check
```

Expected: every command passes and the importer retains the approved public product count and numeric prices.

- [ ] **Step 2: Configure a non-production Supabase project**

Apply `supabase/migrations/202609020001_create_website_orders.sql` in the project's SQL editor. Verify:

```sql
select relname, relrowsecurity
from pg_class
where relname in ('orders', 'order_items', 'order_submission_attempts');

select grantee, privilege_type
from information_schema.role_table_grants
where table_name in ('orders', 'order_items', 'order_submission_attempts')
  and grantee in ('anon', 'authenticated');
```

Expected: RLS is true for all three tables and no customer roles have table privileges.

- [ ] **Step 3: Configure non-production environment and owner**

Set the exact variables from `.env.example`, verify the Resend sender domain, and create one Supabase email/password user whose email exactly matches `ADMIN_EMAIL`. Use non-production payment instruction text that contains no real bank account during testing.

- [ ] **Step 4: Start the local app without a visible shell window**

```powershell
$taskLog = Join-Path $env:TEMP 'cityfashion-order-checkout.log'
$taskErr = Join-Path $env:TEMP 'cityfashion-order-checkout.err.log'
$taskProcess = Start-Process npm.cmd -ArgumentList 'run','dev' -WorkingDirectory (Get-Location) -WindowStyle Hidden -RedirectStandardOutput $taskLog -RedirectStandardError $taskErr -PassThru
Invoke-WebRequest 'http://127.0.0.1:3000' -UseBasicParsing | Select-Object StatusCode
```

Expected: HTTP 200 from localhost.

- [ ] **Step 5: Prove the customer journey in a real browser**

At mobile width and desktop width:

1. Add a product and confirm quantity starts at 6.
2. Increase to 7 and decrease to 6; confirm minus disables at 6.
3. Add a second product and confirm the global cart total.
4. Navigate and refresh; confirm the cart persists.
5. Open `/order`, edit and remove items, then continue shopping.
6. Submit with only name and WhatsApp number.
7. Confirm `CF-1001`-style receipt, exact product total, and optional WhatsApp message.
8. Simulate a request failure and confirm cart preservation and approved recovery copy.
9. Double-submit once and confirm exactly one database order.

- [ ] **Step 6: Prove the owner journey**

1. Confirm the new-order email matches the database record.
2. Confirm a signed-out visitor is redirected to `/admin/login`.
3. Confirm a non-owner Supabase account is denied.
4. Sign in as the owner and open the order.
5. Enter delivery `600`, confirm final total, set status to `confirmed`, and inspect the generated WhatsApp payment message.
6. Move the order through `paid` and `completed`.
7. Verify invalid status jumps and negative delivery charges are rejected.

- [ ] **Step 7: Review the branch before asking for release approval**

Run:

```powershell
git status --short
git log --oneline --decorate --max-count=12
git diff origin/main...HEAD --stat
git diff origin/main...HEAD --check
```

Confirm only intended feature commits and paths are present. Present local test/build results, browser screenshots, migration readback, email proof, and the commit range to the user. Ask explicitly before applying production SQL, adding production environment variables/admin, pushing, or deploying.

- [ ] **Step 8: After explicit release approval, configure and verify production**

Apply the same reviewed migration and environment variables to production, create the single owner account, push the approved branch, and verify Vercel deployment, `https://cityfashion.shop`, one representative order, owner email, dashboard visibility, mobile layout, and WhatsApp fallback. Use the `public-deploy-verification` skill for this final release proof.
