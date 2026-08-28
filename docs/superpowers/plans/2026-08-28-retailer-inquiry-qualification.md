# Retailer Inquiry Qualification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collect a small optional retailer profile after login so City Fashion staff can match suitable New Arrivals and Retailer Deals to each wholesale inquiry.

**Architecture:** Extend the existing Supabase retailer profile with optional, constrained fields and a self-service authenticated API. An optional mobile-first form on the shortlist page updates the existing retailer session; analytics records only completeness, while the private values remain in Supabase for staff review.

**Tech Stack:** Next.js 16 route handlers, TypeScript 5.9, React 19, Supabase Postgres/Auth/RLS, Node 22 built-in test runner with TypeScript stripping.

**Spec:** `docs/superpowers/specs/2026-08-28-odoo-website-catalog-integration-design.md`

## Global Constraints

- This plan starts only after the core Odoo catalog integration plan passes locally.
- Profile fields are optional and never block browsing, saving, login, or WhatsApp ordering.
- Do not add fields to the phone/OTP modal.
- Keep UI copy short and simple.
- Do not send store name, location, phone, category interests, or order size to GA4 or Vercel Analytics.
- Retailer values stay in Supabase and remain protected by the existing authenticated-owner RLS policy.
- Do not apply the live Supabase migration until the user explicitly authorizes the database change.
- Do not make Odoo or Google Sheets a dependency of profile saving.
- Preserve the current guest fallback when Supabase is disabled.
- Do not stage unrelated `.memory/*`, deleted-spec, or screenshot changes.

## File Structure

### Create

- `supabase/migrations/202608280001_retailer_qualification.sql` — idempotent profile-column migration.
- `src/lib/retailer-profile.ts` — input types, allowlists, normalization, and validation.
- `src/app/api/retailer/profile/route.ts` — authenticated self-update endpoint.
- `src/components/retailer-profile-form.tsx` — optional shortlist-page form.
- `tests/retailer-profile.test.ts` — validation and normalization tests.

### Modify

- `supabase/schema.sql` — canonical fresh-install schema.
- `src/lib/supabase/types.ts` — database row/insert/update types.
- `src/lib/retailer.ts` — retailer session fields and profile input type.
- `src/lib/retailer-server.ts` — map the new private fields into the authenticated session.
- `src/components/retailer-provider.tsx` — expose `updateProfile()` and update session state.
- `src/components/shortlist-page.tsx` — render the optional form for authenticated retailers.
- `src/lib/analytics.ts` — register the non-PII profile-completeness event.
- `src/app/api/retailer/whatsapp-intent/route.ts` — log profile completeness only.
- `package.json` — add the profile test command.
- `README.md` — migration and privacy notes.

---

### Task 1: Profile Schema and Pure Validation

**Files:**
- Create: `supabase/migrations/202608280001_retailer_qualification.sql`
- Create: `src/lib/retailer-profile.ts`
- Create: `tests/retailer-profile.test.ts`
- Modify: `supabase/schema.sql`
- Modify: `src/lib/supabase/types.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: unknown JSON from an authenticated retailer.
- Produces: `RetailerProfileInput`, `RetailerProfileUpdate`, `normalizeRetailerProfileInput()`, and `profileCompleteness()`.

- [ ] **Step 1: Write validation tests**

```typescript
// tests/retailer-profile.test.ts
import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeRetailerProfileInput,
  profileCompleteness,
} from "../src/lib/retailer-profile.ts";

test("normalizes an optional retailer profile", () => {
  const value = normalizeRetailerProfileInput({
    interestedCategories: ["frocks", "frocks", "leggings"],
    location: "  Kandy ",
    shopType: "boutique",
    storeName: "  Nila Fashion ",
    usualOrderSize: "24-60",
  });
  assert.deepEqual(value, {
    interestedCategories: ["frocks", "leggings"],
    location: "Kandy",
    shopType: "boutique",
    storeName: "Nila Fashion",
    usualOrderSize: "24-60",
  });
  assert.equal(profileCompleteness(value), 5);
});

test("rejects unknown categories", () => {
  assert.throws(() => normalizeRetailerProfileInput({ interestedCategories: ["shoes"] }), /category/i);
});

test("rejects oversized public text", () => {
  assert.throws(() => normalizeRetailerProfileInput({ storeName: "x".repeat(81) }), /80/);
});
```

- [ ] **Step 2: Add the test command and verify failure**

Add:

```json
"test:retailer-profile": "node --experimental-strip-types --test tests/retailer-profile.test.ts"
```

Run: `npm run test:retailer-profile`

Expected: FAIL because `src/lib/retailer-profile.ts` does not exist.

- [ ] **Step 3: Implement constrained validation**

```typescript
// src/lib/retailer-profile.ts
export const retailerCategories = [
  "frocks", "embroidered-tops", "top-and-pant-sets", "side-open-tops",
  "lungi-sets", "leggings", "plaza-pants", "printed-tops",
] as const;

export const retailerShopTypes = ["boutique", "market-shop", "online-seller", "other"] as const;
export const retailerOrderSizes = ["under-24", "24-60", "61-120", "over-120"] as const;

export type RetailerProfileInput = {
  interestedCategories?: string[];
  location?: string;
  shopType?: string;
  storeName?: string;
  usualOrderSize?: string;
};

export type RetailerProfileUpdate = {
  interestedCategories: string[];
  location: string | null;
  shopType: string | null;
  storeName: string | null;
  usualOrderSize: string | null;
};

function optionalText(value: unknown, label: string) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") throw new Error(`${label} must be text.`);
  const normalized = value.trim();
  if (normalized.length > 80) throw new Error(`${label} must be 80 characters or less.`);
  return normalized || null;
}

export function normalizeRetailerProfileInput(value: unknown): RetailerProfileUpdate {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Profile details must be an object.");
  }
  const input = (value ?? {}) as RetailerProfileInput;
  if (input.interestedCategories != null && !Array.isArray(input.interestedCategories)) {
    throw new Error("Interested categories must be a list.");
  }
  const interestedCategories = [...new Set(input.interestedCategories ?? [])];
  if (interestedCategories.some((item) => !retailerCategories.includes(item as never))) {
    throw new Error("Choose a supported product category.");
  }
  if (input.shopType && !retailerShopTypes.includes(input.shopType as never)) throw new Error("Choose a valid shop type.");
  if (input.usualOrderSize && !retailerOrderSizes.includes(input.usualOrderSize as never)) throw new Error("Choose a valid order size.");
  return {
    interestedCategories,
    location: optionalText(input.location, "Location"),
    shopType: input.shopType || null,
    storeName: optionalText(input.storeName, "Store name"),
    usualOrderSize: input.usualOrderSize || null,
  };
}

export function profileCompleteness(value: RetailerProfileUpdate) {
  return [value.storeName, value.location, value.shopType, value.usualOrderSize, value.interestedCategories.length > 0]
    .filter(Boolean).length;
}
```

- [ ] **Step 4: Add the idempotent migration**

```sql
-- supabase/migrations/202608280001_retailer_qualification.sql
alter table public.retailer_profiles
  add column if not exists shop_type text,
  add column if not exists interested_categories text[] not null default '{}',
  add column if not exists usual_order_size text;

alter table public.retailer_profiles
  drop constraint if exists retailer_profiles_shop_type_check,
  add constraint retailer_profiles_shop_type_check
    check (shop_type is null or shop_type in ('boutique', 'market-shop', 'online-seller', 'other')),
  drop constraint if exists retailer_profiles_usual_order_size_check,
  add constraint retailer_profiles_usual_order_size_check
    check (usual_order_size is null or usual_order_size in ('under-24', '24-60', '61-120', 'over-120'));
```

Mirror those columns and constraints in `supabase/schema.sql`. Add `shop_type`, `interested_categories`, and `usual_order_size` to all three retailer profile TypeScript shapes in `src/lib/supabase/types.ts`.

- [ ] **Step 5: Run validation and compile checks**

Run:

```powershell
npm run test:retailer-profile
npm run check
```

Expected: 3 tests PASS and TypeScript/ESLint PASS.

- [ ] **Step 6: Commit schema and validation**

```powershell
git add package.json supabase/schema.sql supabase/migrations/202608280001_retailer_qualification.sql src/lib/supabase/types.ts src/lib/retailer-profile.ts tests/retailer-profile.test.ts
git commit -m "Add retailer qualification schema"
```

### Task 2: Authenticated Profile API and Session Mapping

**Files:**
- Create: `src/app/api/retailer/profile/route.ts`
- Modify: `src/lib/retailer.ts`
- Modify: `src/lib/retailer-server.ts`

**Interfaces:**
- Consumes: authenticated `PATCH /api/retailer/profile` JSON.
- Produces: the updated `RetailerSessionPayload` using the same cookie handling as the shortlist route.

- [ ] **Step 1: Extend the authenticated session type**

Add these nullable fields inside `RetailerSessionPayload["retailer"]`:

```typescript
interestedCategories: string[];
location: string | null;
shopType: string | null;
storeName: string | null;
usualOrderSize: string | null;
```

Map the corresponding snake-case Supabase columns in `buildRetailerSessionPayload()`. The fallback user shape uses `[]` and `null` values.

- [ ] **Step 2: Implement the authenticated PATCH route**

Follow the existing shortlist route's Supabase configuration, cookie collection, and `auth.getUser()` pattern. Return 503 when Supabase is disabled, 401 without a user, and 400 for validation/database errors.

The update must be:

```typescript
const input = normalizeRetailerProfileInput(await request.json().catch(() => ({})));
const { error } = await supabase
  .from("retailer_profiles")
  .update({
    interested_categories: input.interestedCategories,
    last_active_at: new Date().toISOString(),
    location: input.location,
    shop_type: input.shopType,
    store_name: input.storeName,
    usual_order_size: input.usualOrderSize,
  })
  .eq("id", user.id);
```

Return `buildRetailerSessionPayload(supabase, user)` and apply collected cookies to the response.

- [ ] **Step 3: Verify types and build**

Run:

```powershell
npm run test:retailer-profile
npm run check
npm run build
```

Expected: PASS; unauthenticated public browsing still builds without Supabase env vars.

- [ ] **Step 4: Commit the API unit**

```powershell
git add src/app/api/retailer/profile/route.ts src/lib/retailer.ts src/lib/retailer-server.ts
git commit -m "Add retailer profile update API"
```

### Task 3: Optional Shortlist Qualification Form

**Files:**
- Create: `src/components/retailer-profile-form.tsx`
- Modify: `src/components/retailer-provider.tsx`
- Modify: `src/components/shortlist-page.tsx`

**Interfaces:**
- Consumes: current authenticated retailer session and `RetailerProfileInput`.
- Produces: `updateProfile(input): Promise<boolean>` and an optional form that never gates ordering.

- [ ] **Step 1: Add provider update behavior**

Expose this function in `RetailerContextValue`:

```typescript
updateProfile: (input: RetailerProfileInput) => Promise<boolean>;
```

Implement it by PATCHing `/api/retailer/profile`, replacing `session` with the returned `RetailerSessionPayload`, and setting the existing `errorMessage` on failure. Track only:

```typescript
trackAnalyticsEvent("retailer_profile_updated", {
  profile_fields_completed: [
    nextSession.retailer?.storeName,
    nextSession.retailer?.location,
    nextSession.retailer?.shopType,
    nextSession.retailer?.usualOrderSize,
    Boolean(nextSession.retailer?.interestedCategories.length),
  ].filter(Boolean).length,
});
```

Add `retailer_profile_updated: "Retailer Profile Updated"` to `src/lib/analytics.ts`. Do not include actual field values.

- [ ] **Step 2: Build the optional mobile-first form**

`RetailerProfileForm` renders only for an authenticated retailer. Use simple labels:

- `Shop name`
- `Town`
- `How you sell` with Boutique, Market shop, Online seller, Other
- `Usual order` with Under 24 pcs, 24–60 pcs, 61–120 pcs, Over 120 pcs
- `Interested categories` as multi-select checkboxes using the existing eight categories
- submit button `Save shop details`
- helper text `Optional. This helps us suggest suitable wholesale styles and retailer deals.`

Initialize state from the retailer session and allow every field to remain blank.

- [ ] **Step 3: Place the form after the shortlist status card**

In `ShortlistPage`, render the profile form only when `enabled && retailer`. Keep it below the current status card and above saved products. Do not move or weaken the `Start WhatsApp order` button.

- [ ] **Step 4: Run local UI verification**

Run:

```powershell
npm run check
npm run build
npm run dev
```

At 390px verify the form is optional, labels are readable, category controls wrap, saving updates the session, and ordering still works without completing any field.

- [ ] **Step 5: Commit the form unit**

```powershell
git add src/components/retailer-profile-form.tsx src/components/retailer-provider.tsx src/components/shortlist-page.tsx src/lib/analytics.ts
git commit -m "Add optional retailer shop details"
```

### Task 4: Intent Completeness, Documentation, and Migration Gate

**Files:**
- Modify: `src/app/api/retailer/whatsapp-intent/route.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes: authenticated session profile.
- Produces: private activity metadata containing only a 0–5 completeness count and documented migration steps.

- [ ] **Step 1: Add completeness to WhatsApp intent metadata**

Compute the count server-side and add:

```typescript
profileFieldsCompleted: [
  session.retailer?.storeName,
  session.retailer?.location,
  session.retailer?.shopType,
  session.retailer?.usualOrderSize,
  Boolean(session.retailer?.interestedCategories.length),
].filter(Boolean).length,
```

Do not add profile values to event metadata or public analytics.

- [ ] **Step 2: Document the migration and privacy boundary**

Add the migration path, the exact optional fields, and the rule that the form never blocks WhatsApp. State that the values remain in Supabase and are not sent to GA4/Vercel Analytics.

- [ ] **Step 3: Run full local verification**

Run:

```powershell
npm run test:retailer-profile
npm run check
npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit documentation and intent metadata**

```powershell
git add src/app/api/retailer/whatsapp-intent/route.ts README.md
git commit -m "Track retailer profile completeness"
```

- [ ] **Step 5: Stop for live Supabase approval**

Report the SQL migration, local test results, and the fields being added. Do not execute the migration against the live Supabase project until the user explicitly authorizes the database write. After approval, apply the migration, read back the three columns and two constraints, then QA one authenticated save and one WhatsApp intent without exposing the retailer's private values.
