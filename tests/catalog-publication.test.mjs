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
  assert.equal(
    resolveMapping({ odooSyncMode: "mapped", odooProductId: 155 }, [fact]).status,
    "mapped",
  );
});

test("inactive and design-mismatched mappings are warnings", () => {
  assert.equal(
    resolveMapping({ odooSyncMode: "mapped", odooProductId: 155 }, [{ ...fact, active: false }]).status,
    "inactive",
  );
  assert.equal(
    resolveMapping(
      { odooSyncMode: "mapped", odooProductId: 155, odooDesignKey: "D9999" },
      [fact],
    ).status,
    "design-mismatch",
  );
});

test("website-only products do not require an Odoo fact", () => {
  assert.equal(resolveMapping({ odooSyncMode: "website-only" }, []).status, "website-only");
});

test("auto new arrival follows the internal candidate", () => {
  assert.equal(
    resolveMerchandisingLane(
      { newArrivalApproval: "auto", retailerDealApproval: "no" },
      fact,
    ),
    "new",
  );
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
  assert.equal("notes" in product, false);
  assert.doesNotThrow(() => validatePublicProduct(product));
});

test("Odoo list price can be published but Odoo cost cannot leak", () => {
  const product = buildPublicProduct({
    folderName: "1210",
    images: ["/cover.jpg"],
    override: {
      title: "Style 1210",
      category: "printed-tops",
      startingPrice: "Call for price",
      moq: "6 pcs",
      description: "Wholesale style.",
      priceSource: "odoo-list-price",
    },
    fact: { ...fact, standardPrice: 900 },
    previousProduct: null,
  });
  assert.equal(product.startingPrice, "Rs. 2,200");
  assert.equal("standardPrice" in product, false);
  assert.doesNotThrow(() => validatePublicProduct(product));
});

test("legacy existing products retain their lane during migration", () => {
  const product = buildPublicProduct({
    folderName: "1210",
    images: ["/cover.jpg"],
    override: { isNewArrival: true, isSaleItem: false },
    fact: null,
    previousProduct: {
      id: "1210",
      slug: "style-1210",
      title: "Style 1210",
      category: "printed-tops",
      startingPrice: "Call for price",
      moq: "6 pcs",
      description: "Wholesale style.",
      colors: [],
      isNewArrival: true,
      isSaleItem: false,
      images: ["/old-cover.jpg"],
      sourceFolder: "1210",
    },
  });
  assert.equal(product.merchandisingLane, "new");
});
