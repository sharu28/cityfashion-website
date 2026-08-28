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

    def to_dict(self) -> dict:
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
