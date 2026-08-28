import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.catalog_sync.models import PolicyConfig  # noqa: E402
from scripts.catalog_sync.odoo_reader import OdooReader, XmlRpcGateway  # noqa: E402
from scripts.catalog_sync.policy import classify_product  # noqa: E402
from scripts.catalog_sync.snapshot import (  # noqa: E402
    atomic_write_json,
    build_review_report,
    validate_review_report,
    validate_snapshot,
)


def main() -> None:
    as_of = datetime.now(timezone.utc)
    policy = PolicyConfig()
    overrides_path = ROOT / "data" / "product-overrides.json"
    products_root = ROOT.parent / "products"
    output_root = ROOT / "data" / "odoo"
    snapshot_path = output_root / "catalog.snapshot.json"
    review_path = output_root / "catalog.review.json"

    overrides = json.loads(overrides_path.read_text(encoding="utf-8"))
    folder_names = [item.name for item in products_root.iterdir() if item.is_dir()]
    gateway = XmlRpcGateway.from_environment()
    reader = OdooReader(
        gateway,
        os.environ.get("ODOO_INTERNAL_LOCATION", "WH/Stock"),
    )
    location, facts = reader.read_product_facts(as_of, policy)

    products = []
    for fact in facts:
        decision = classify_product(fact, policy, as_of)
        products.append(
            {
                **fact.to_dict(),
                "newArrivalCandidate": decision.new_arrival,
                "retailerDealCandidate": decision.retailer_deal,
                "candidateReasons": list(decision.reasons),
            }
        )

    snapshot = {
        "schemaVersion": 1,
        "generatedAt": as_of.isoformat(),
        "asOf": as_of.isoformat(),
        "location": {
            "id": int(location["id"]),
            "completeName": location["complete_name"],
        },
        "policy": {
            "newArrivalDays": policy.new_arrival_days,
            "dealMinAgeDays": policy.deal_min_age_days,
            "dealQuietDays": policy.deal_quiet_days,
            "dealVelocityDays": policy.deal_velocity_days,
            "dealVelocityRatio": policy.deal_velocity_ratio,
        },
        "products": products,
    }
    report = build_review_report(products, overrides, folder_names)

    validate_snapshot(snapshot)
    validate_review_report(report)
    atomic_write_json(snapshot_path, snapshot, validate_snapshot)
    atomic_write_json(review_path, report, validate_review_report)

    print(f"Odoo products: {len(products)}")
    print(f"New-arrival candidates: {report['summary']['newArrivalCandidates']}")
    print(f"Retailer-deal candidates: {report['summary']['retailerDealCandidates']}")
    print(f"Snapshot: {snapshot_path}")
    print(f"Review: {review_path}")


if __name__ == "__main__":
    main()
