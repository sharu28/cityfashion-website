import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Iterable, Mapping, Optional

from .models import OdooProductFact
from .policy import suggest_mapping


PRIVATE_PUBLIC_KEYS = {
    "availablequantity",
    "quantity",
    "qtyavailable",
    "freeqty",
    "standardprice",
    "cost",
    "valuation",
    "supplier",
    "supplierid",
    "stockage",
    "internalscore",
    "lastincomingat",
    "lastoutgoingat",
    "outgoingunits45d",
    "outgoingunits90d",
}


def assert_public_safe(value: Any, path: str = "root") -> None:
    if isinstance(value, dict):
        for key, child in value.items():
            if str(key).casefold() in PRIVATE_PUBLIC_KEYS:
                raise ValueError(f"Private Odoo field at {path}.{key}")
            assert_public_safe(child, f"{path}.{key}")
    elif isinstance(value, (list, tuple)):
        for index, child in enumerate(value):
            assert_public_safe(child, f"{path}[{index}]")


def atomic_write_json(
    target: Path,
    value: Any,
    validator: Callable[[Any], None],
) -> None:
    target = Path(target)
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary_name: Optional[str] = None
    replaced = False
    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            newline="\n",
            delete=False,
            dir=target.parent,
            prefix=f".{target.name}.",
            suffix=".tmp",
        ) as temporary:
            temporary_name = temporary.name
            json.dump(value, temporary, ensure_ascii=False, indent=2)
            temporary.write("\n")
            temporary.flush()
            os.fsync(temporary.fileno())
        validator(value)
        os.replace(temporary_name, target)
        replaced = True
    finally:
        if temporary_name and not replaced:
            try:
                os.unlink(temporary_name)
            except FileNotFoundError:
                pass


def validate_snapshot(value: Any) -> None:
    if not isinstance(value, dict) or value.get("schemaVersion") != 1:
        raise ValueError("Odoo snapshot must use schemaVersion 1")
    if not isinstance(value.get("products"), list):
        raise ValueError("Odoo snapshot products must be a list")
    ids = [item.get("odooProductId") for item in value["products"] if isinstance(item, dict)]
    if len(ids) != len(value["products"]) or any(not isinstance(item, int) for item in ids):
        raise ValueError("Every Odoo snapshot product needs an integer odooProductId")
    if len(ids) != len(set(ids)):
        raise ValueError("Odoo snapshot product IDs must be unique")


def validate_review_report(value: Any) -> None:
    required = {
        "schemaVersion",
        "generatedAt",
        "summary",
        "mappings",
        "newArrivalCandidates",
        "retailerDealCandidates",
        "unmappedOdooProducts",
        "warnings",
    }
    if not isinstance(value, dict) or value.get("schemaVersion") != 1:
        raise ValueError("Odoo review report must use schemaVersion 1")
    if not required.issubset(value):
        raise ValueError("Odoo review report is missing required fields")


def build_review_report(
    products: Iterable[OdooProductFact | Mapping[str, Any]],
    overrides: Mapping[str, Mapping[str, Any]],
    folder_names: Iterable[str] | Mapping[str, Any],
) -> dict[str, Any]:
    product_items = list(products)
    facts = [_as_fact(item) for item in product_items]
    payloads = [_as_payload(item) for item in product_items]
    payload_by_id = {int(item["odooProductId"]): item for item in payloads}
    website_folders = sorted(str(name) for name in folder_names)

    mappings: list[dict[str, Any]] = []
    warnings: list[str] = []
    explicitly_mapped_ids: set[int] = set()
    for folder_name in website_folders:
        override = overrides.get(folder_name, {})
        raw_explicit_id = override.get("odooProductId")
        explicit_id = _optional_int(raw_explicit_id)
        suggested_id = suggest_mapping(folder_name, facts)
        status = "unmapped"
        if raw_explicit_id is not None and explicit_id is None:
            status = "invalid"
            warnings.append(f"{folder_name}: odooProductId must be an integer")
        elif explicit_id is not None and explicit_id not in payload_by_id:
            status = "missing-odoo-product"
            warnings.append(f"{folder_name}: mapped Odoo product {explicit_id} was not found")
        elif explicit_id is not None:
            status = "mapped"
            explicitly_mapped_ids.add(explicit_id)
        elif suggested_id is not None:
            status = "suggested"
        else:
            warnings.append(f"{folder_name}: no unique active Odoo match")

        mappings.append(
            {
                "websiteFolder": folder_name,
                "status": status,
                "odooProductId": explicit_id,
                "suggestedOdooProductId": suggested_id,
            }
        )

    new_candidates = [item for item in payloads if item.get("newArrivalCandidate") is True]
    deal_candidates = [item for item in payloads if item.get("retailerDealCandidate") is True]
    unmapped = [
        item
        for item in payloads
        if item.get("active", True) and int(item["odooProductId"]) not in explicitly_mapped_ids
    ]
    summary = {
        "odooProducts": len(payloads),
        "websiteFolders": len(website_folders),
        "explicitMappings": len(explicitly_mapped_ids),
        "suggestedMappings": sum(item["status"] == "suggested" for item in mappings),
        "newArrivalCandidates": len(new_candidates),
        "retailerDealCandidates": len(deal_candidates),
        "warnings": len(warnings),
    }
    return {
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "summary": summary,
        "mappings": mappings,
        "newArrivalCandidates": new_candidates,
        "retailerDealCandidates": deal_candidates,
        "unmappedOdooProducts": unmapped,
        "warnings": warnings,
    }


def _as_payload(item: OdooProductFact | Mapping[str, Any]) -> dict[str, Any]:
    if isinstance(item, OdooProductFact):
        return item.to_dict()
    return dict(item)


def _as_fact(item: OdooProductFact | Mapping[str, Any]) -> OdooProductFact:
    if isinstance(item, OdooProductFact):
        return item
    return OdooProductFact(
        odoo_product_id=int(item["odooProductId"]),
        design_key=item.get("designKey"),
        default_code=str(item.get("defaultCode") or ""),
        name=str(item.get("name") or ""),
        active=bool(item.get("active", True)),
        sale_ok=bool(item.get("saleOk", True)),
        list_price=float(item.get("listPrice") or 0),
        available_quantity=float(item.get("availableQuantity") or 0),
        last_incoming_at=item.get("lastIncomingAt"),
        last_outgoing_at=item.get("lastOutgoingAt"),
        outgoing_units_45d=float(item.get("outgoingUnits45d") or 0),
        outgoing_units_90d=float(item.get("outgoingUnits90d") or 0),
    )


def _optional_int(value: Any) -> Optional[int]:
    if isinstance(value, bool) or value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None
