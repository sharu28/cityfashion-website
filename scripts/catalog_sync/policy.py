import re
from datetime import datetime, timezone
from typing import Iterable, Optional

from .models import CandidateDecision, OdooProductFact, PolicyConfig


def normalize_design_key(value: str) -> Optional[str]:
    match = re.match(r"\s*(?:D\s*)?(\d+)", value, flags=re.IGNORECASE)
    return f"D{match.group(1)}" if match else None


def suggest_mapping(
    folder_name: str,
    products: Iterable[OdooProductFact],
) -> Optional[int]:
    design_key = normalize_design_key(folder_name)
    matches = [
        item for item in products if item.active and item.design_key == design_key
    ]
    return matches[0].odoo_product_id if len(matches) == 1 else None


def _parse(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def classify_product(
    product: OdooProductFact,
    policy: PolicyConfig,
    as_of: datetime,
) -> CandidateDecision:
    reasons: list[str] = []
    incoming = _parse(product.last_incoming_at)
    if incoming is None:
        reasons.append("missing-stock-age")

    age_days = (as_of - incoming).days if incoming else None
    new_arrival = bool(
        product.active
        and product.sale_ok
        and age_days is not None
        and 0 <= age_days <= policy.new_arrival_days
    )
    quiet = product.outgoing_units_45d <= 0
    low_velocity = (
        product.available_quantity > 0
        and product.outgoing_units_90d / product.available_quantity
        < policy.deal_velocity_ratio
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
