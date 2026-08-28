export const PUBLIC_PRODUCT_KEYS = new Set([
  "id",
  "slug",
  "title",
  "category",
  "startingPrice",
  "moq",
  "fabric",
  "sizeRange",
  "description",
  "colors",
  "merchandisingLane",
  "images",
  "cloudinaryImages",
  "sourceFolder",
]);

const LANES = new Set(["new", "deal", "standard", "new-and-deal"]);
const REQUIRED_TEXT_KEYS = [
  "id",
  "slug",
  "title",
  "category",
  "startingPrice",
  "moq",
  "description",
  "sourceFolder",
];

const toSlug = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function validateOverride(override, { existingProduct = false } = {}) {
  const errors = [];
  const warnings = [];
  const mode = override.odooSyncMode;

  if (mode !== undefined && !["mapped", "website-only"].includes(mode)) {
    errors.push(`Unknown odooSyncMode: ${mode}`);
  }
  if (
    override.publicationStatus !== undefined &&
    !["draft", "published"].includes(override.publicationStatus)
  ) {
    errors.push(`Unknown publicationStatus: ${override.publicationStatus}`);
  }
  for (const key of ["newArrivalApproval", "retailerDealApproval"]) {
    if (override[key] !== undefined && !["auto", "yes", "no"].includes(override[key])) {
      errors.push(`Unknown ${key}: ${override[key]}`);
    }
  }
  if (existingProduct && ("isNewArrival" in override || "isSaleItem" in override)) {
    warnings.push("Legacy isNewArrival/isSaleItem approvals are deprecated");
  }
  return { valid: errors.length === 0, errors, warnings };
}

export function resolveMapping(override, facts) {
  if (override.odooSyncMode === "website-only") {
    return { status: "website-only", fact: null, warning: null };
  }
  if (override.odooSyncMode !== "mapped") {
    return { status: "missing-mode", fact: null, warning: "Choose mapped or website-only" };
  }
  if (!Number.isInteger(override.odooProductId)) {
    return { status: "missing-id", fact: null, warning: "Mapped products need an integer odooProductId" };
  }

  const fact = facts.find((item) => item.odooProductId === override.odooProductId);
  if (!fact) {
    return { status: "missing", fact: null, warning: "Mapped Odoo product was not found" };
  }
  if (!fact.active || fact.saleOk === false) {
    return { status: "inactive", fact, warning: "Mapped Odoo product is inactive or not saleable" };
  }
  if (override.odooDesignKey && fact.designKey !== override.odooDesignKey) {
    return { status: "design-mismatch", fact, warning: "Mapped Odoo design key changed" };
  }
  return { status: "mapped", fact, warning: null };
}

const approved = (approval, candidate) => {
  if (approval === "yes") return true;
  if (approval === "auto") return candidate === true;
  return false;
};

const laneFromFlags = (isNew, isDeal) => {
  if (isNew && isDeal) return "new-and-deal";
  if (isNew) return "new";
  if (isDeal) return "deal";
  return "standard";
};

const previousLane = (previousProduct) => {
  if (!previousProduct) return "standard";
  if (LANES.has(previousProduct.merchandisingLane)) return previousProduct.merchandisingLane;
  return laneFromFlags(previousProduct.isNewArrival === true, previousProduct.isSaleItem === true);
};

export function resolveMerchandisingLane(
  override,
  fact,
  { previousProduct = null, onWarning = () => {} } = {},
) {
  let newApproval = override.newArrivalApproval;
  let dealApproval = override.retailerDealApproval;

  if (previousProduct && newApproval === undefined && "isNewArrival" in override) {
    newApproval = override.isNewArrival ? "yes" : "no";
    onWarning("Legacy isNewArrival approval is deprecated");
  }
  if (previousProduct && dealApproval === undefined && "isSaleItem" in override) {
    dealApproval = override.isSaleItem ? "yes" : "no";
    onWarning("Legacy isSaleItem approval is deprecated");
  }

  if (newApproval === undefined && dealApproval === undefined) {
    return previousLane(previousProduct);
  }
  return laneFromFlags(
    approved(newApproval, fact?.newArrivalCandidate),
    approved(dealApproval, fact?.retailerDealCandidate),
  );
}

export function buildPublicProduct({
  folderName,
  images,
  cloudinaryImages = [],
  override,
  fact,
  previousProduct,
  onWarning = () => {},
}) {
  const fallback = previousProduct ?? {};
  const title = override.title ?? fallback.title ?? `Style ${folderName}`;
  const listPrice = Number(fact?.listPrice ?? 0);
  const startingPrice =
    override.priceSource === "odoo-list-price" && listPrice > 0
      ? `Rs. ${listPrice.toLocaleString("en-LK")}`
      : (override.startingPrice ?? fallback.startingPrice ?? "Call for price");

  return {
    id: String(folderName),
    slug: override.slug ?? fallback.slug ?? toSlug(title),
    title,
    category: override.category ?? fallback.category ?? "printed-tops",
    startingPrice,
    moq: override.moq ?? fallback.moq ?? "6 pcs",
    fabric: override.fabric ?? fallback.fabric ?? "",
    sizeRange: override.sizeRange ?? fallback.sizeRange ?? "",
    description:
      override.description ?? fallback.description ?? "Wholesale style for Sri Lanka retailers.",
    colors: override.colors ?? fallback.colors ?? [],
    merchandisingLane: resolveMerchandisingLane(override, fact, {
      previousProduct,
      onWarning,
    }),
    images,
    cloudinaryImages,
    sourceFolder: String(folderName),
  };
}

export function validatePublicProduct(product) {
  if (!product || typeof product !== "object" || Array.isArray(product)) {
    throw new TypeError("Public product must be an object");
  }
  for (const key of Object.keys(product)) {
    if (!PUBLIC_PRODUCT_KEYS.has(key)) {
      throw new Error(`Private or unknown public product key: ${key}`);
    }
  }
  for (const key of REQUIRED_TEXT_KEYS) {
    if (typeof product[key] !== "string" || product[key].trim() === "") {
      throw new Error(`Public product needs ${key}`);
    }
  }
  if (!LANES.has(product.merchandisingLane)) {
    throw new Error(`Invalid merchandisingLane: ${product.merchandisingLane}`);
  }
  if (!Array.isArray(product.colors)) {
    throw new Error("Public product colors must be an array");
  }
  if (!Array.isArray(product.images) || product.images.length === 0) {
    throw new Error("Public product needs at least one image");
  }
  if (!Array.isArray(product.cloudinaryImages)) {
    throw new Error("Public product cloudinaryImages must be an array");
  }
}

export function isPublishedOverride(override, previousProduct) {
  if (override.publicationStatus === "published") return true;
  if (override.publicationStatus === "draft") return false;
  return Boolean(previousProduct);
}

export function hasRequiredNewProductFields(override) {
  return ["title", "category", "startingPrice", "moq", "description"].every(
    (key) => typeof override[key] === "string" && override[key].trim() !== "",
  );
}
