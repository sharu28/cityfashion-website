# Odoo Catalog Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a review-controlled, read-only Odoo catalog snapshot that powers approved New Arrival and Retailer Deal merchandising without exposing private inventory data.

**Architecture:** A Python XML-RPC reader writes an atomic local-only snapshot and review report. Pure policy and publication modules classify products and merge only approved, allowlisted values into the existing generated catalog; the Next.js app continues to build entirely from committed public JSON and images.

**Tech Stack:** Python 3 standard library (`xmlrpc.client`, `unittest`), Node.js ESM and `node:test`, Next.js 16, TypeScript 5.9, React 19, Cloudinary, Supabase activity events.

**Spec:** `docs/superpowers/specs/2026-08-28-odoo-website-catalog-integration-design.md`

## Global Constraints

- Odoo access is read-only; this feature must never call `create`, `write`, `unlink`, workflow actions, or inventory/accounting methods.
- Odoo credentials stay in environment variables and never enter JSON output, logs, Git, the browser, or Vercel build output.
- `data/odoo/odoo-catalog.snapshot.json` and `data/odoo/catalog-review.json` are local-only and gitignored.
- The public generated catalog never includes exact quantity, cost, valuation, supplier, customer, accounting, movement, or internal scoring data.
- The public site never shows stock status or units remaining.
- Exact Retailer Deal price, lot quantity, color availability, and final availability remain behind retailer login and WhatsApp.
- Odoo list price is review evidence unless `priceSource` is explicitly `odoo-list-price`.
- Supported category slugs remain exactly those already listed in `AGENTS.md`.
- The build must pass without Odoo credentials or live Odoo access.
- Preserve the canonical/redirect behavior for `https://cityfashion.shop`.
- Do not modify the sibling Odoo repository in this delivery.
- Do not stage the existing `.memory/*`, deleted Cloudinary spec, or `screenshots/` worktree changes.

## File Structure

### Create

- `scripts/catalog_sync/__init__.py` — package marker.
- `scripts/catalog_sync/models.py` — typed snapshot and policy records.
- `scripts/catalog_sync/policy.py` — pure matching and New/Deal classification rules.
- `scripts/catalog_sync/odoo_reader.py` — read-only XML-RPC authentication, field discovery, pagination, and fact collection.
- `scripts/catalog_sync/snapshot.py` — schema validation, review-report building, redaction, and atomic writes.
- `scripts/sync-odoo-catalog.py` — command-line orchestration only.
- `scripts/catalog-publication.mjs` — pure override validation and public-catalog merge rules.
- `tests/catalog_sync/test_policy.py` — policy boundary and mapping tests.
- `tests/catalog_sync/test_odoo_reader.py` — read-only reader, field, location, and pagination tests.
- `tests/catalog_sync/test_snapshot.py` — redaction and atomic-failure-retention tests.
- `tests/catalog-publication.test.mjs` — public allowlist and lane tests.
- `tests/fixtures/odoo-catalog.snapshot.json` — non-sensitive synthetic snapshot for importer tests.
- `data/odoo/.gitkeep` — keeps the ignored local output directory present.

### Modify

- `.gitignore` — ignore local Odoo snapshot/review files.
- `.env.example` — document sync-only Odoo variables without values.
- `package.json` — expose sync and test commands.
- `scripts/import-products.mjs` — load the last valid snapshot and use the publication module.
- `data/product-overrides.json` — migrate manual flags and add reviewed Odoo mappings.
- `data/product-overrides.template.json` — document the new override contract.
- `data/generated/products.generated.json` — regenerate allowlisted public products.
- `src/lib/catalog.ts` — make `merchandisingLane` canonical and expose Retailer Deals.
- `src/app/page.tsx` — keep New Arrivals first and rename the current sale section.
- `src/app/products/[slug]/page.tsx` — pass lane metadata and explain deal terms without stock status.
- `src/components/product-view-tracker.tsx` — track lane on product views.
- `src/components/retailer-provider.tsx` — preserve lane in shortlist and client analytics.
- `src/lib/retailer.ts` — include lane in shortlist items and WhatsApp copy.
- `src/lib/retailer-server.ts` — map lane into server-side shortlist items.
- `src/app/api/retailer/shortlist/route.ts` — log lane metadata.
- `src/app/api/retailer/whatsapp-intent/route.ts` — log lane metadata.
- `README.md` — operator commands and safety boundary.
- `PRODUCT_IMPORT_GUIDE.md` — mapping and approval workflow.
- `AGENTS.md` — supported integration fields and required verification.

---

### Task 1: Pure Catalog Policy and Mapping Rules

**Files:**
- Create: `scripts/catalog_sync/__init__.py`
- Create: `scripts/catalog_sync/models.py`
- Create: `scripts/catalog_sync/policy.py`
- Create: `tests/catalog_sync/test_policy.py`

**Interfaces:**
- Consumes: ISO-8601 timestamps, Odoo product facts, website mapping inputs, and one UTC `as_of` time.
- Produces: `PolicyConfig`, `OdooProductFact`, `CandidateDecision`, `normalize_design_key()`, `suggest_mapping()`, and `classify_product()`.

- [ ] **Step 1: Write mapping and date-boundary tests**

```python
# tests/catalog_sync/test_policy.py
import unittest
from datetime import datetime, timedelta, timezone

from scripts.catalog_sync.models import OdooProductFact, PolicyConfig
from scripts.catalog_sync.policy import classify_product, normalize_design_key, suggest_mapping

AS_OF = datetime(2026, 8, 28, tzinfo=timezone.utc)


def fact(**changes):
    values = {
        "odoo_product_id": 155,
        "design_key": "D1210",
        "default_code": "425795",
        "name": "D 1210 GLITTER LONG TOP",
        "active": True,
        "sale_ok": True,
        "list_price": 2200.0,
        "available_quantity": 20.0,
        "last_incoming_at": "2026-05-01T00:00:00+00:00",
        "last_outgoing_at": None,
        "outgoing_units_45d": 0.0,
        "outgoing_units_90d": 2.0,
    }
    values.update(changes)
    return OdooProductFact(**values)


class PolicyTests(unittest.TestCase):
    def test_design_key_normalizes_folder_suffix(self):
        self.assertEqual(normalize_design_key("3003 V-6"), "D3003")

    def test_suggestion_requires_one_active_match(self):
        self.assertEqual(suggest_mapping("1210", [fact()]), 155)
        self.assertIsNone(suggest_mapping("1210", [fact(), fact(odoo_product_id=156)]))

    def test_new_arrival_boundaries(self):
        policy = PolicyConfig()
        self.assertTrue(classify_product(fact(last_incoming_at="2026-07-30T00:00:00+00:00"), policy, AS_OF).new_arrival)
        self.assertTrue(classify_product(fact(last_incoming_at="2026-07-29T00:00:00+00:00"), policy, AS_OF).new_arrival)
        self.assertFalse(classify_product(fact(last_incoming_at="2026-07-28T00:00:00+00:00"), policy, AS_OF).new_arrival)

    def test_deal_requires_age_quantity_and_low_velocity(self):
        decision = classify_product(fact(), PolicyConfig(), AS_OF)
        self.assertTrue(decision.retailer_deal)
        self.assertFalse(classify_product(fact(available_quantity=0), PolicyConfig(), AS_OF).retailer_deal)
        self.assertFalse(classify_product(fact(outgoing_units_45d=5, outgoing_units_90d=5), PolicyConfig(), AS_OF).retailer_deal)

    def test_deal_age_boundaries(self):
        policy = PolicyConfig()
        at_89 = (AS_OF - timedelta(days=89)).isoformat()
        at_90 = (AS_OF - timedelta(days=90)).isoformat()
        at_91 = (AS_OF - timedelta(days=91)).isoformat()
        self.assertFalse(classify_product(fact(last_incoming_at=at_89), policy, AS_OF).retailer_deal)
        self.assertTrue(classify_product(fact(last_incoming_at=at_90), policy, AS_OF).retailer_deal)
        self.assertTrue(classify_product(fact(last_incoming_at=at_91), policy, AS_OF).retailer_deal)

    def test_missing_age_is_manual_review(self):
        decision = classify_product(fact(last_incoming_at=None), PolicyConfig(), AS_OF)
        self.assertFalse(decision.retailer_deal)
        self.assertIn("missing-stock-age", decision.reasons)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the policy tests and verify they fail**

Run: `python -m unittest discover -s tests/catalog_sync -p "test_policy.py" -v`

Expected: FAIL with `ModuleNotFoundError: No module named 'scripts.catalog_sync'`.

- [ ] **Step 3: Add immutable policy records**

```python
# scripts/catalog_sync/models.py
from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class PolicyConfig:
    new_arrival_days: int = 30
    deal_min_age_days: int = 90
    deal_quiet_days: int = 45
    deal_velocity_days: int = 90
    deal_velocity_ratio: float = 0.20


@dataclass(frozen=True)
class OdooProductFact:
    odoo_product_id: int
    design_key: Optional[str]
    default_code: str
    name: str
    active: bool
    sale_ok: bool
    list_price: float
    available_quantity: float
    last_incoming_at: Optional[str]
    last_outgoing_at: Optional[str]
    outgoing_units_45d: float
    outgoing_units_90d: float

    def to_dict(self):
        return {
            "odooProductId": self.odoo_product_id,
            "designKey": self.design_key,
            "defaultCode": self.default_code,
            "name": self.name,
            "active": self.active,
            "saleOk": self.sale_ok,
            "listPrice": self.list_price,
            "availableQuantity": self.available_quantity,
            "lastIncomingAt": self.last_incoming_at,
            "lastOutgoingAt": self.last_outgoing_at,
            "outgoingUnits45d": self.outgoing_units_45d,
            "outgoingUnits90d": self.outgoing_units_90d,
        }


@dataclass(frozen=True)
class CandidateDecision:
    new_arrival: bool
    retailer_deal: bool
    reasons: tuple[str, ...]
```

- [ ] **Step 4: Implement the pure policy functions**

```python
# scripts/catalog_sync/policy.py
import re
from datetime import datetime
from typing import Iterable, Optional

from .models import CandidateDecision, OdooProductFact, PolicyConfig


def normalize_design_key(value: str) -> Optional[str]:
    match = re.match(r"\s*(?:D\s*)?(\d+)", value, flags=re.IGNORECASE)
    return f"D{match.group(1)}" if match else None


def suggest_mapping(folder_name: str, products: Iterable[OdooProductFact]) -> Optional[int]:
    design_key = normalize_design_key(folder_name)
    matches = [item for item in products if item.active and item.design_key == design_key]
    return matches[0].odoo_product_id if len(matches) == 1 else None


def _parse(value: Optional[str]) -> Optional[datetime]:
    return datetime.fromisoformat(value.replace("Z", "+00:00")) if value else None


def classify_product(product: OdooProductFact, policy: PolicyConfig, as_of: datetime) -> CandidateDecision:
    reasons = []
    incoming = _parse(product.last_incoming_at)
    if incoming is None:
        reasons.append("missing-stock-age")
    age_days = (as_of - incoming).days if incoming else None
    new_arrival = bool(product.active and product.sale_ok and age_days is not None and age_days <= policy.new_arrival_days)
    quiet = product.outgoing_units_45d <= 0
    low_velocity = (
        product.available_quantity > 0
        and product.outgoing_units_90d / product.available_quantity < policy.deal_velocity_ratio
    )
    retailer_deal = bool(
        product.active
        and product.sale_ok
        and product.available_quantity > 0
        and age_days is not None
        and age_days >= policy.deal_min_age_days
        and (quiet or low_velocity)
    )
    if new_arrival:
        reasons.append("recent-receipt")
    if retailer_deal:
        reasons.append("aged-low-velocity")
    return CandidateDecision(new_arrival, retailer_deal, tuple(reasons))
```

- [ ] **Step 5: Run the policy tests**

Run: `python -m unittest discover -s tests/catalog_sync -p "test_policy.py" -v`

Expected: 6 tests PASS.

- [ ] **Step 6: Commit the policy unit**

```powershell
git add scripts/catalog_sync/__init__.py scripts/catalog_sync/models.py scripts/catalog_sync/policy.py tests/catalog_sync/test_policy.py
git commit -m "Add Odoo catalog policy rules"
```

### Task 2: Read-Only Odoo Reader

**Files:**
- Create: `scripts/catalog_sync/odoo_reader.py`
- Create: `tests/catalog_sync/test_odoo_reader.py`

**Interfaces:**
- Consumes: `ODOO_URL`, `ODOO_DB`, `ODOO_USERNAME`, `ODOO_PASSWORD`, and configured warehouse/location names.
- Produces: `OdooReader.search_read_all()`, `OdooReader.resolve_location()`, and `OdooReader.read_product_facts(as_of, policy)` returning `(location, list[OdooProductFact])`.

- [ ] **Step 1: Write reader contract tests with a fake gateway**

```python
# tests/catalog_sync/test_odoo_reader.py
import unittest
from datetime import datetime, timezone

from scripts.catalog_sync.models import PolicyConfig
from scripts.catalog_sync.odoo_reader import OdooReader


class FakeGateway:
    def __init__(self):
        self.calls = []

    def execute(self, model, method, args=None, kwargs=None):
        self.calls.append((model, method, args or [], kwargs or {}))
        if method == "fields_get":
            return {name: {} for name in ("id", "name", "complete_name", "usage", "location_id", "location_dest_id", "product_id", "quantity", "date", "state", "picking_type_id", "active", "sale_ok", "default_code", "lst_price")}
        if model == "stock.location":
            return [{"id": 5, "name": "Stock", "complete_name": "WH/Stock", "usage": "internal"}]
        if model == "product.product":
            if (kwargs or {}).get("offset", 0) > 0:
                return []
            return [{"id": 155, "name": "D 1210 GLITTER LONG TOP", "default_code": "425795", "active": True, "sale_ok": True, "lst_price": 2200}]
        return []


class ReaderTests(unittest.TestCase):
    def test_resolves_internal_location_by_identity(self):
        reader = OdooReader(FakeGateway(), "WH/Stock")
        self.assertEqual(reader.resolve_location()["id"], 5)

    def test_reader_never_calls_write_methods(self):
        gateway = FakeGateway()
        OdooReader(gateway, "WH/Stock").read_product_facts(datetime(2026, 8, 28, tzinfo=timezone.utc), PolicyConfig())
        self.assertTrue(gateway.calls)
        self.assertTrue(all(method in {"fields_get", "search_read"} for _, method, _, _ in gateway.calls))

    def test_search_read_all_paginates(self):
        gateway = FakeGateway()
        reader = OdooReader(gateway, "WH/Stock", page_size=1)
        rows = reader.search_read_all("product.product", [], ["id", "name"])
        self.assertEqual(rows[0]["id"], 155)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run reader tests and verify they fail**

Run: `python -m unittest discover -s tests/catalog_sync -p "test_odoo_reader.py" -v`

Expected: FAIL because `scripts.catalog_sync.odoo_reader` does not exist.

- [ ] **Step 3: Implement the gateway and allowlisted reader**

Implement `XmlRpcGateway.from_environment()` with `allow_none=True`, `fields_get`, and `search_read` only. Implement pagination with `limit` and `offset`; stop when a page contains fewer than `page_size` rows. Before each query, intersect requested fields with `fields_get` results.

Use these exact reader domains:

```python
product_domain = [["active", "in", [True, False]]]
incoming_domain = [
    ["state", "=", "done"],
    ["location_dest_id", "=", location_id],
    ["date", ">=", history_start],
]
outgoing_domain = [
    ["state", "=", "done"],
    ["location_id", "=", location_id],
    ["date", ">=", velocity_start],
]
```

Filter incoming rows in Python to supplier/non-internal source usage and incoming picking type. Filter outgoing rows to customer destination usage and outgoing picking type. Exclude returns, internal transfers, manufacturing moves, and inventory adjustments when their picking/location evidence is not customer demand.

Use these exact method signatures on `OdooReader`: `__init__(self, gateway, location_complete_name: str, page_size: int = 500)`, `search_read_all(self, model: str, domain: list, fields: list[str], order: str = "id asc", context: dict | None = None) -> list[dict]`, `resolve_location(self) -> dict`, and `read_product_facts(self, as_of: datetime, policy: PolicyConfig) -> tuple[dict, list[OdooProductFact]]`.

Raise `RuntimeError` if the location match is missing or not unique, authentication fails, required product identity fields are unavailable, or a query returns an `_error` shape.

Read products with `context={"active_test": False}` so inactive historical duplicates remain visible for validation. Query `stock.quant` for the resolved internal location and aggregate `available_quantity` when that field exists, otherwise `quantity - reserved_quantity`. Read the source/destination `stock.location.usage` values and `stock.picking.type.code` values needed to exclude internal, manufacturing, adjustment, and return movements.

- [ ] **Step 4: Run reader tests**

Run: `python -m unittest discover -s tests/catalog_sync -p "test_odoo_reader.py" -v`

Expected: 3 tests PASS and the fake gateway records no mutating methods.

- [ ] **Step 5: Commit the reader unit**

```powershell
git add scripts/catalog_sync/odoo_reader.py tests/catalog_sync/test_odoo_reader.py
git commit -m "Add read-only Odoo catalog reader"
```

### Task 3: Atomic Snapshot and Review Command

**Files:**
- Create: `scripts/catalog_sync/snapshot.py`
- Create: `scripts/sync-odoo-catalog.py`
- Create: `tests/catalog_sync/test_snapshot.py`
- Create: `data/odoo/.gitkeep`
- Modify: `.gitignore`
- Modify: `.env.example`
- Modify: `package.json`

**Interfaces:**
- Consumes: `list[OdooProductFact]`, `PolicyConfig`, current website folder names and overrides.
- Produces: schema-versioned internal snapshot and mapping/candidate review report using atomic replacement.

- [ ] **Step 1: Write redaction and failure-retention tests**

```python
# tests/catalog_sync/test_snapshot.py
import json
import tempfile
import unittest
from pathlib import Path

from scripts.catalog_sync.snapshot import atomic_write_json, assert_public_safe, build_review_report


class SnapshotTests(unittest.TestCase):
    def test_public_safe_rejects_private_keys(self):
        with self.assertRaises(ValueError):
            assert_public_safe({"id": "1210", "availableQuantity": 12})

    def test_failed_validation_preserves_existing_file(self):
        with tempfile.TemporaryDirectory() as folder:
            target = Path(folder) / "snapshot.json"
            target.write_text('{"stable":true}\n', encoding="utf-8")
            with self.assertRaises(ValueError):
                atomic_write_json(target, {"schemaVersion": 0}, lambda value: (_ for _ in ()).throw(ValueError("bad")))
            self.assertEqual(target.read_text(encoding="utf-8"), '{"stable":true}\n')

    def test_review_report_keeps_candidates_internal(self):
        report = build_review_report([], {}, {})
        self.assertEqual(report["schemaVersion"], 1)
        self.assertIn("summary", report)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run snapshot tests and verify they fail**

Run: `python -m unittest discover -s tests/catalog_sync -p "test_snapshot.py" -v`

Expected: FAIL because `scripts.catalog_sync.snapshot` does not exist.

- [ ] **Step 3: Implement schema validation and atomic writes**

Use `tempfile.NamedTemporaryFile(delete=False, dir=target.parent)`, flush, `os.fsync()`, validate the temporary payload, and only then `os.replace(temp_name, target)`. Delete the temporary file in `finally` when replacement did not occur.

`assert_public_safe()` must recursively reject these exact case-insensitive keys:

```python
PRIVATE_PUBLIC_KEYS = {
    "availablequantity", "quantity", "qtyavailable", "freeqty", "standardprice",
    "cost", "valuation", "supplier", "supplierid", "stockage", "internalscore",
    "lastincomingat", "lastoutgoingat", "outgoingunits45d", "outgoingunits90d",
}
```

`build_review_report(products, overrides, folder_names)` must return `schemaVersion`, `generatedAt`, `summary`, `mappings`, `newArrivalCandidates`, `retailerDealCandidates`, `unmappedOdooProducts`, and `warnings`.

- [ ] **Step 4: Add the CLI and local-only configuration**

`scripts/sync-odoo-catalog.py` must:

1. load `PolicyConfig` and the current overrides;
2. create `XmlRpcGateway.from_environment()`;
3. construct `reader = OdooReader(gateway, os.environ.get("ODOO_INTERNAL_LOCATION", "WH/Stock"))` and call `reader.read_product_facts(as_of, policy)`;
4. classify each fact;
5. serialize facts with `to_dict()` and add `newArrivalCandidate`, `retailerDealCandidate`, and `candidateReasons` from each decision;
6. build both payloads in memory;
7. validate both payloads;
8. atomically replace the snapshot and review files;
9. print only counts and output paths.

Add:

```gitignore
/data/odoo/*.json
!/data/odoo/.gitkeep
```

Add empty sync-only keys to `.env.example`:

```dotenv
ODOO_URL=
ODOO_DB=
ODOO_USERNAME=
ODOO_PASSWORD=
ODOO_INTERNAL_LOCATION=WH/Stock
```

Add package scripts:

```json
"sync-odoo-catalog": "python scripts/sync-odoo-catalog.py",
"test:catalog-sync": "python -m unittest discover -s tests/catalog_sync -p \"test_*.py\" -v",
"test:catalog-publication": "node --test tests/catalog-publication.test.mjs"
```

- [ ] **Step 5: Run all Python sync tests**

Run: `npm run test:catalog-sync`

Expected: all policy, reader, and snapshot tests PASS.

- [ ] **Step 6: Verify the build remains Odoo-independent**

In a shell with the five Odoo variables unset, run: `npm run build`

Expected: PASS; the build does not invoke `sync-odoo-catalog`.

- [ ] **Step 7: Commit the snapshot unit**

```powershell
git add .gitignore .env.example package.json scripts/catalog_sync/snapshot.py scripts/sync-odoo-catalog.py tests/catalog_sync/test_snapshot.py data/odoo/.gitkeep
git commit -m "Add atomic Odoo catalog snapshots"
```

### Task 4: Public Catalog Publication Merger

**Files:**
- Create: `scripts/catalog-publication.mjs`
- Create: `tests/catalog-publication.test.mjs`
- Create: `tests/fixtures/odoo-catalog.snapshot.json`
- Modify: `scripts/import-products.mjs`
- Modify: `data/product-overrides.template.json`

**Interfaces:**
- Consumes: one override, optional mapped snapshot fact, previous public product, image URLs, and current date.
- Produces: `validateOverride()`, `resolveMapping()`, `resolveMerchandisingLane()`, and `buildPublicProduct()` with an explicit public allowlist.

- [ ] **Step 1: Write public merger tests**

```javascript
// tests/catalog-publication.test.mjs
import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPublicProduct,
  resolveMapping,
  resolveMerchandisingLane,
  validatePublicProduct,
} from "../scripts/catalog-publication.mjs";

const fact = {
  odooProductId: 155,
  designKey: "D1210",
  active: true,
  saleOk: true,
  listPrice: 2200,
  availableQuantity: 99,
  newArrivalCandidate: true,
  retailerDealCandidate: false,
};

test("explicit mapping is required", () => {
  assert.equal(resolveMapping({ odooSyncMode: "mapped" }, [fact]).status, "missing-id");
  assert.equal(resolveMapping({ odooSyncMode: "mapped", odooProductId: 155 }, [fact]).status, "mapped");
});

test("auto new arrival follows the internal candidate", () => {
  assert.equal(resolveMerchandisingLane({ newArrivalApproval: "auto", retailerDealApproval: "no" }, fact), "new");
});

test("deal approval creates a public deal without quantity", () => {
  const product = buildPublicProduct({
    folderName: "1210",
    images: ["/products/style-1210/cover.jpg"],
    override: {
      title: "Style 1210",
      category: "printed-tops",
      startingPrice: "Ask for lot price",
      moq: "6 pcs",
      description: "Wholesale style for Sri Lanka retailers.",
      publicationStatus: "published",
      retailerDealApproval: "yes",
      newArrivalApproval: "no",
    },
    fact,
    previousProduct: null,
  });
  assert.equal(product.merchandisingLane, "deal");
  assert.equal("availableQuantity" in product, false);
  assert.doesNotThrow(() => validatePublicProduct(product));
});
```

- [ ] **Step 2: Run publication tests and verify they fail**

Run: `npm run test:catalog-publication`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `scripts/catalog-publication.mjs`.

- [ ] **Step 3: Implement the allowlisted merger**

Use this exact public key set:

```javascript
export const PUBLIC_PRODUCT_KEYS = new Set([
  "id", "slug", "title", "category", "startingPrice", "moq", "fabric",
  "sizeRange", "description", "colors", "merchandisingLane", "images",
  "cloudinaryImages", "sourceFolder",
]);
```

Keep `notes` in the committed operator override file only; do not copy it into generated public JSON.

`resolveMapping()` must accept `website-only` without a fact, require an exact active fact ID for `mapped`, and return warning statuses for missing, inactive, or design-mismatched mappings. `resolveMerchandisingLane()` must return one of `new`, `deal`, `standard`, or `new-and-deal`. `buildPublicProduct()` must construct a fresh allowlisted object rather than spreading snapshot data.

For `priceSource: "odoo-list-price"`, format a positive mapped list price as `Rs. ${value.toLocaleString("en-LK")}`. Otherwise retain the explicit website `startingPrice`. Never use Odoo standard cost.

Include one migration-only compatibility path so Task 4 can run before Task 5 updates all 29 overrides:

- an existing generated product without `merchandisingLane` derives its previous lane from legacy `isNewArrival` / `isSaleItem` booleans;
- an override without `publicationStatus` is treated as published only when that folder already exists in the previous generated catalog;
- legacy `isNewArrival` and `isSaleItem` may supply approvals only for an existing product and must emit a deprecation warning;
- a brand-new folder without `publicationStatus`, explicit sync mode, mapping, and required fields remains draft and is skipped.

- [ ] **Step 4: Refactor the importer to call the merger**

Load `data/odoo/odoo-catalog.snapshot.json` only when present. If absent, preserve the last generated product's `merchandisingLane` and public values; do not fail the build. If a newly added product has no valid snapshot mapping, no explicit `website-only` mode, or missing required public fields/images, warn and skip its first publication.

Keep the existing Cloudinary reuse/upload and local-image fallback logic unchanged.

- [ ] **Step 5: Update the override template**

Replace `isNewArrival` and `isSaleItem` with:

```json
"odooProductId": 155,
"odooDesignKey": "D1210",
"odooSyncMode": "mapped",
"publicationStatus": "published",
"newArrivalApproval": "auto",
"retailerDealApproval": "no",
"priceSource": "override"
```

- [ ] **Step 6: Run publication and import verification**

Run:

```powershell
npm run test:catalog-publication
npm run import-products
npm run check
```

Expected: tests PASS, 29 current folders import, and TypeScript/ESLint PASS.

- [ ] **Step 7: Commit the publication unit**

```powershell
git add scripts/catalog-publication.mjs scripts/import-products.mjs tests/catalog-publication.test.mjs tests/fixtures/odoo-catalog.snapshot.json data/product-overrides.template.json
git commit -m "Merge approved Odoo facts into catalog"
```

### Task 5: Review and Onboard the Current 29 Product Mappings

**Files:**
- Modify: `data/product-overrides.json`
- Modify: `data/generated/products.generated.json`

**Interfaces:**
- Consumes: a freshly generated live `data/odoo/catalog-review.json`.
- Produces: explicit reviewed mappings/website-only exceptions for all published products.

- [ ] **Step 1: Load Odoo credentials without exposing them**

Use the established City Fashion Odoo environment/DPAPI workflow. Run the following in the active PowerShell process; do not print the password:

```powershell
$odooRoot = Resolve-Path '..\odoo'
$odooEnv = Join-Path $odooRoot '.env'
Get-Content -LiteralPath $odooEnv | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
        $parts = $line.Split('=', 2)
        $name = $parts[0].Trim()
        $value = $parts[1].Trim().Trim('"').Trim("'")
        if (-not [Environment]::GetEnvironmentVariable($name, 'Process')) {
            [Environment]::SetEnvironmentVariable($name, $value, 'Process')
        }
    }
}
$odooSecret = Join-Path $odooRoot '.secrets\odoo_password.dpapi'
$secure = Get-Content -LiteralPath $odooSecret | ConvertTo-SecureString
$credential = [pscredential]::new('odoo', $secure)
$env:ODOO_PASSWORD = $credential.GetNetworkCredential().Password
try {
    npm run sync-odoo-catalog
} finally {
    Remove-Item Env:ODOO_PASSWORD -ErrorAction SilentlyContinue
}
```

- [ ] **Step 2: Confirm the live read-only sync result**

The command in Step 1 must exit 0 and create one snapshot plus one review report. Confirm the console contains counts and paths only and that no Odoo write method appears in the run log or implementation.

- [ ] **Step 3: Review the exact mapping report**

Confirm each mapping against live active `product.product` ID, design evidence, name, and active state. Specifically verify:

- `3003 V-3` and `3003 V-6` intentionally share one Odoo product;
- historical inactive duplicates are not selected;
- whether `3145` and `3168` now have unique active matches.

If `3145` or `3168` still lacks a unique active match, keep its current public catalog entry unchanged and pause before marking it `website-only`; that exception requires business confirmation. Do not invent a product ID.

- [ ] **Step 4: Migrate approved override fields**

For every reviewed mapped product add:

```json
"odooProductId": 155,
"odooDesignKey": "D1210",
"odooSyncMode": "mapped",
"publicationStatus": "published",
"newArrivalApproval": "yes",
"retailerDealApproval": "no",
"priceSource": "override"
```

Use each product's real reviewed ID/design key; the `155`/`D1210` pair above is the concrete `1210` example, not a value to copy to other products. Convert current `isNewArrival: true` to `newArrivalApproval: "yes"` to preserve the current public catalog during onboarding; remove `isNewArrival` and `isSaleItem` after each record is migrated.

- [ ] **Step 5: Re-import and inspect the public diff for leakage**

Run:

```powershell
npm run import-products
rg -n -i 'availableQuantity|qtyAvailable|standardPrice|standard_price|supplier|valuation|lastIncoming|lastOutgoing|outgoingUnits|internalScore' data/generated/products.generated.json
```

Expected: importer succeeds and `rg` returns no matches.

- [ ] **Step 6: Commit only reviewed public mappings and generated output**

```powershell
git add data/product-overrides.json data/generated/products.generated.json
git commit -m "Map website products to Odoo catalog"
```

### Task 6: Public New Arrival and Retailer Deal Experience

**Files:**
- Modify: `src/lib/catalog.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/app/products/[slug]/page.tsx`

**Interfaces:**
- Consumes: public `merchandisingLane` from generated catalog.
- Produces: `MerchandisingLane`, `newArrivals`, `retailerDeals`, and badges `New` / `Retailer Deal`.

- [ ] **Step 1: Make the lane type canonical**

In `src/lib/catalog.ts`, replace `isNewArrival` and `isSaleItem` with:

```typescript
export type MerchandisingLane = "deal" | "new" | "new-and-deal" | "standard";

const laneBadges: Record<MerchandisingLane, string[]> = {
  deal: ["Retailer Deal"],
  new: ["New"],
  "new-and-deal": ["New", "Retailer Deal"],
  standard: [],
};

const laneScore: Record<MerchandisingLane, number> = {
  "new-and-deal": 3,
  new: 2,
  deal: 1,
  standard: 0,
};
```

In the existing `CatalogProduct` type, remove `isNewArrival`, `isSaleItem`, and public `notes`; add `merchandisingLane: MerchandisingLane` without changing its other public fields. Replace `badgeScore()` boolean branches with `laneScore[product.merchandisingLane]`.

Export:

```typescript
export const newArrivals = allProducts.filter((product) => ["new", "new-and-deal"].includes(product.merchandisingLane));
export const retailerDeals = allProducts.filter((product) => ["deal", "new-and-deal"].includes(product.merchandisingLane));
```

- [ ] **Step 2: Update homepage merchandising copy**

Keep New Arrivals before categories. Replace the sale fallback section with a Retailer Deals section that renders only when `retailerDeals.length > 0`; do not label standard products as deals.

Use this copy:

- eyebrow: `Retailer deals`
- title: `Special wholesale lots for retailers`
- body: `Selected styles have special wholesale terms. Open a style and ask on WhatsApp for the lot price and details.`
- action: `Ask for deal details`

- [ ] **Step 3: Update product-page deal explanation**

When the lane is `deal` or `new-and-deal`, render a short note above the order button:

`This style has special retailer terms. Ask on WhatsApp for the lot price, colors, and order details.`

Do not render quantity, availability, discount percentage, or “low stock” copy.

- [ ] **Step 4: Run static verification**

Run:

```powershell
npm run check
npm run build
rg -n -i 'in stock|out of stock|low stock|units left|clearance|old stock' src data/generated/products.generated.json
```

Expected: check/build PASS; `rg` finds no new public stock-status or disallowed clearance copy.

- [ ] **Step 5: Commit the merchandising UI**

```powershell
git add src/lib/catalog.ts src/app/page.tsx 'src/app/products/[slug]/page.tsx'
git commit -m "Add New Arrival and Retailer Deal lanes"
```

### Task 7: Propagate Merchandising Lane Through Shortlist, WhatsApp, and Analytics

**Files:**
- Modify: `src/components/product-view-tracker.tsx`
- Modify: `src/components/retailer-provider.tsx`
- Modify: `src/lib/retailer.ts`
- Modify: `src/lib/retailer-server.ts`
- Modify: `src/app/api/retailer/shortlist/route.ts`
- Modify: `src/app/api/retailer/whatsapp-intent/route.ts`
- Modify: `src/app/products/[slug]/page.tsx`

**Interfaces:**
- Consumes: `CatalogProduct.merchandisingLane`.
- Produces: `ShortlistItem.merchandisingLane`, GA/Vercel `merchandising_lane`, and Supabase activity metadata with the same value.

- [ ] **Step 1: Extend shortlist item mapping**

Add:

```typescript
merchandisingLane: MerchandisingLane;
```

to `ShortlistItem`, and include `product.merchandisingLane` in both `mapShortlistItem()` and `mapProductToShortlistItem()`.

- [ ] **Step 2: Add deal context to WhatsApp copy**

Change each product line to:

```typescript
const dealLabel = item.merchandisingLane === "deal" || item.merchandisingLane === "new-and-deal"
  ? " | Retailer Deal"
  : "";
return `- ${item.id} | ${item.title} | MOQ ${item.moq}${dealLabel}`;
```

If any product is a deal, append `Please also share the retailer lot terms.`. Do not include internal quantity or price evidence.

- [ ] **Step 3: Add lane to product-view and client intent analytics**

Add `merchandisingLane` to `ProductViewTrackerProps`, its effect dependency list, and event payload as `merchandising_lane`. Pass the value from the product page. Add the same flat property to guest/authenticated shortlist and WhatsApp analytics payloads in `retailer-provider.tsx`.

- [ ] **Step 4: Add lane to server activity metadata**

For shortlist events:

```typescript
metadata: { merchandisingLane: product.merchandisingLane },
```

For WhatsApp intent:

```typescript
metadata: {
  merchandisingLane: product?.merchandisingLane ?? "mixed-shortlist",
  shortlistCount: session.shortlist.length,
},
```

- [ ] **Step 5: Run flow verification**

Run:

```powershell
npm run check
npm run build
```

Expected: PASS with all ShortlistItem constructors supplying the lane.

- [ ] **Step 6: Commit buyer-intent propagation**

```powershell
git add src/components/product-view-tracker.tsx src/components/retailer-provider.tsx src/lib/retailer.ts src/lib/retailer-server.ts src/app/api/retailer/shortlist/route.ts src/app/api/retailer/whatsapp-intent/route.ts 'src/app/products/[slug]/page.tsx'
git commit -m "Track catalog merchandising lanes"
```

### Task 8: Operator Documentation and End-to-End Verification

**Files:**
- Modify: `README.md`
- Modify: `PRODUCT_IMPORT_GUIDE.md`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: completed sync/import commands and approval contract.
- Produces: a repeatable operator workflow and verified release candidate.

- [ ] **Step 1: Document the exact operator sequence**

Add this workflow to README and the import guide:

```powershell
npm run sync-odoo-catalog
# Review data/odoo/catalog-review.json locally.
# Update only explicit mappings and approvals in data/product-overrides.json.
npm run import-products
npm run test:catalog-sync
npm run test:catalog-publication
npm run check
npm run build
```

Document that sync failure preserves the last snapshot, builds never contact Odoo, internal files are ignored, and Odoo prices/candidates do not publish without approval.

- [ ] **Step 2: Update AGENTS.md supported fields**

Add the seven fields from the spec exactly: `odooProductId`, `odooDesignKey`, `odooSyncMode`, `publicationStatus`, `newArrivalApproval`, `retailerDealApproval`, and `priceSource`.

- [ ] **Step 3: Run the full automated suite**

Run:

```powershell
npm run test:catalog-sync
npm run test:catalog-publication
npm run import-products
npm run check
npm run build
```

Expected: every command PASS.

- [ ] **Step 4: Run a mobile visual review**

Start `npm run dev`, then inspect the homepage, one New product, one Deal product, a category page, shortlist, login gate, and WhatsApp message at 390px width. Confirm New Arrivals lead, Retailer Deals are public, CTA remains obvious, and no stock status appears.

- [ ] **Step 5: Verify repository boundaries**

Run:

```powershell
git status --short
git diff --name-only origin/main...HEAD
git diff origin/main...HEAD -- data/generated/products.generated.json | Select-String -Pattern 'availableQuantity|standardPrice|supplier|valuation|internalScore'
```

Expected: no local snapshot/review JSON is tracked, no sibling Odoo files changed, and no private-field match appears in the public generated diff.

- [ ] **Step 6: Commit the operator documentation**

```powershell
git add README.md PRODUCT_IMPORT_GUIDE.md AGENTS.md
git commit -m "Document Odoo catalog operations"
```

- [ ] **Step 7: Stop for publication approval**

Report local verification results, exact mapping blockers, and the commit range. Do not push or deploy until the user explicitly approves publication. After approval, push the reviewed branch, wait for Vercel, and directly verify `https://cityfashion.shop` on desktop and mobile before calling the integration live.
