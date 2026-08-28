import os
import xmlrpc.client
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from .models import OdooProductFact, PolicyConfig
from .policy import normalize_design_key


class XmlRpcGateway:
    """Small, deliberately read-only wrapper around Odoo XML-RPC."""

    ALLOWED_METHODS = frozenset({"fields_get", "search_read"})

    def __init__(self, url: str, database: str, uid: int, password: str):
        self.database = database
        self.uid = uid
        self.password = password
        self.models = xmlrpc.client.ServerProxy(
            f"{url.rstrip('/')}/xmlrpc/2/object",
            allow_none=True,
        )

    @classmethod
    def from_environment(cls) -> "XmlRpcGateway":
        names = ("ODOO_URL", "ODOO_DB", "ODOO_USERNAME", "ODOO_PASSWORD")
        values = {name: os.environ.get(name, "").strip() for name in names}
        missing = [name for name, value in values.items() if not value]
        if missing:
            raise RuntimeError(f"Missing required Odoo environment variables: {', '.join(missing)}")

        common = xmlrpc.client.ServerProxy(
            f"{values['ODOO_URL'].rstrip('/')}/xmlrpc/2/common",
            allow_none=True,
        )
        uid = common.authenticate(
            values["ODOO_DB"],
            values["ODOO_USERNAME"],
            values["ODOO_PASSWORD"],
            {},
        )
        if not uid:
            raise RuntimeError("Odoo authentication failed")
        return cls(values["ODOO_URL"], values["ODOO_DB"], uid, values["ODOO_PASSWORD"])

    def execute(
        self,
        model: str,
        method: str,
        args: Optional[list[Any]] = None,
        kwargs: Optional[dict[str, Any]] = None,
    ) -> Any:
        if method not in self.ALLOWED_METHODS:
            raise RuntimeError(f"Blocked non-read Odoo method: {model}.{method}")
        return self.models.execute_kw(
            self.database,
            self.uid,
            self.password,
            model,
            method,
            args or [],
            kwargs or {},
        )


class OdooReader:
    def __init__(self, gateway: Any, location_complete_name: str, page_size: int = 500):
        self.gateway = gateway
        self.location_complete_name = location_complete_name
        self.page_size = page_size
        self._fields: dict[str, set[str]] = {}

    def _available_fields(self, model: str, requested: list[str]) -> list[str]:
        if model not in self._fields:
            result = self.gateway.execute(
                model,
                "fields_get",
                [],
                {"attributes": ["string", "type"]},
            )
            if not isinstance(result, dict):
                raise RuntimeError(f"Unexpected fields_get response for {model}")
            self._fields[model] = set(result)
        return [field for field in requested if field in self._fields[model]]

    def search_read_all(
        self,
        model: str,
        domain: list[Any],
        fields: list[str],
        order: str = "id asc",
        context: Optional[dict[str, Any]] = None,
    ) -> list[dict[str, Any]]:
        supported_fields = self._available_fields(model, fields)
        rows: list[dict[str, Any]] = []
        offset = 0
        while True:
            kwargs: dict[str, Any] = {
                "fields": supported_fields,
                "order": order,
                "limit": self.page_size,
                "offset": offset,
            }
            if context is not None:
                kwargs["context"] = context
            page = self.gateway.execute(model, "search_read", [domain], kwargs)
            if not isinstance(page, list):
                raise RuntimeError(f"Unexpected search_read response for {model}")
            rows.extend(page)
            if len(page) < self.page_size:
                break
            offset += self.page_size
        return rows

    def resolve_location(self) -> dict[str, Any]:
        rows = self.search_read_all(
            "stock.location",
            [
                ["complete_name", "=", self.location_complete_name],
                ["usage", "=", "internal"],
            ],
            ["id", "name", "complete_name", "usage"],
            context={"active_test": False},
        )
        matches = [
            row
            for row in rows
            if row.get("complete_name") == self.location_complete_name
            and row.get("usage") == "internal"
        ]
        if len(matches) != 1:
            raise RuntimeError(
                f"Expected exactly one internal location named {self.location_complete_name!r}; "
                f"found {len(matches)}"
            )
        return matches[0]

    def read_product_facts(
        self,
        as_of: datetime,
        policy: PolicyConfig,
    ) -> tuple[dict[str, Any], list[OdooProductFact]]:
        as_of = _as_utc(as_of)
        location = self.resolve_location()
        location_id = int(location["id"])

        products = self.search_read_all(
            "product.product",
            [],
            ["id", "name", "default_code", "active", "sale_ok", "lst_price", "list_price"],
            context={"active_test": False},
        )
        quants = self.search_read_all(
            "stock.quant",
            [["location_id", "=", location_id]],
            [
                "id",
                "product_id",
                "location_id",
                "quantity",
                "reserved_quantity",
                "available_quantity",
            ],
        )
        incoming_moves = self.search_read_all(
            "stock.move",
            [["state", "=", "done"], ["location_dest_id", "=", location_id]],
            [
                "id",
                "product_id",
                "location_id",
                "location_dest_id",
                "picking_type_id",
                "quantity",
                "product_uom_qty",
                "date",
                "state",
            ],
        )
        velocity_cutoff = as_of - timedelta(days=policy.deal_velocity_days)
        outgoing_moves = self.search_read_all(
            "stock.move",
            [
                ["state", "=", "done"],
                ["location_id", "=", location_id],
                ["date", ">=", velocity_cutoff.strftime("%Y-%m-%d %H:%M:%S")],
            ],
            [
                "id",
                "product_id",
                "location_id",
                "location_dest_id",
                "picking_type_id",
                "quantity",
                "product_uom_qty",
                "date",
                "state",
            ],
        )

        related_location_ids = {
            related_id
            for move in incoming_moves + outgoing_moves
            for related_id in (
                _many2one_id(move.get("location_id")),
                _many2one_id(move.get("location_dest_id")),
            )
            if related_id is not None
        }
        location_rows = self.search_read_all(
            "stock.location",
            [["id", "in", sorted(related_location_ids)]],
            ["id", "name", "complete_name", "usage"],
            context={"active_test": False},
        )
        location_usage = {int(row["id"]): row.get("usage") for row in location_rows}

        picking_type_ids = {
            picking_id
            for move in incoming_moves + outgoing_moves
            if (picking_id := _many2one_id(move.get("picking_type_id"))) is not None
        }
        picking_rows = self.search_read_all(
            "stock.picking.type",
            [["id", "in", sorted(picking_type_ids)]],
            ["id", "code"],
        )
        picking_codes = {int(row["id"]): row.get("code") for row in picking_rows}

        quantity_by_product: dict[int, float] = {}
        for quant in quants:
            product_id = _many2one_id(quant.get("product_id"))
            if product_id is None:
                continue
            available = quant.get("available_quantity")
            if available is None:
                available = _number(quant.get("quantity")) - _number(
                    quant.get("reserved_quantity")
                )
            quantity_by_product[product_id] = quantity_by_product.get(product_id, 0.0) + _number(available)

        valid_incoming = [
            move
            for move in incoming_moves
            if location_usage.get(_many2one_id(move.get("location_id"))) == "supplier"
            and _picking_matches(move, picking_codes, "incoming")
        ]
        valid_outgoing = [
            move
            for move in outgoing_moves
            if location_usage.get(_many2one_id(move.get("location_dest_id"))) == "customer"
            and _picking_matches(move, picking_codes, "outgoing")
        ]

        incoming_by_product = _moves_by_product(valid_incoming)
        outgoing_by_product = _moves_by_product(valid_outgoing)
        quiet_cutoff = as_of - timedelta(days=policy.deal_quiet_days)

        facts: list[OdooProductFact] = []
        for product in products:
            product_id = int(product["id"])
            name = str(product.get("name") or "")
            default_code = str(product.get("default_code") or "")
            incoming = incoming_by_product.get(product_id, [])
            outgoing = outgoing_by_product.get(product_id, [])
            incoming_dates = [_parse_odoo_datetime(move.get("date")) for move in incoming]
            outgoing_dates = [_parse_odoo_datetime(move.get("date")) for move in outgoing]
            incoming_dates = [value for value in incoming_dates if value is not None]
            outgoing_dates = [value for value in outgoing_dates if value is not None]

            facts.append(
                OdooProductFact(
                    odoo_product_id=product_id,
                    design_key=normalize_design_key(name or default_code),
                    default_code=default_code,
                    name=name,
                    active=bool(product.get("active", True)),
                    sale_ok=bool(product.get("sale_ok", True)),
                    list_price=_number(product.get("lst_price", product.get("list_price"))),
                    available_quantity=quantity_by_product.get(product_id, 0.0),
                    last_incoming_at=_to_iso(max(incoming_dates)) if incoming_dates else None,
                    last_outgoing_at=_to_iso(max(outgoing_dates)) if outgoing_dates else None,
                    outgoing_units_45d=sum(
                        _move_quantity(move)
                        for move in outgoing
                        if (move_date := _parse_odoo_datetime(move.get("date"))) is not None
                        and quiet_cutoff <= move_date <= as_of
                    ),
                    outgoing_units_90d=sum(
                        _move_quantity(move)
                        for move in outgoing
                        if (move_date := _parse_odoo_datetime(move.get("date"))) is not None
                        and velocity_cutoff <= move_date <= as_of
                    ),
                )
            )
        return location, facts


def _many2one_id(value: Any) -> Optional[int]:
    if value is False or value is None:
        return None
    if isinstance(value, (list, tuple)) and value:
        return int(value[0])
    return int(value)


def _number(value: Any) -> float:
    if value is False or value is None:
        return 0.0
    return float(value)


def _parse_odoo_datetime(value: Any) -> Optional[datetime]:
    if not value:
        return None
    parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    return _as_utc(parsed)


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _to_iso(value: datetime) -> str:
    return _as_utc(value).isoformat()


def _picking_matches(
    move: dict[str, Any],
    picking_codes: dict[int, Any],
    expected: str,
) -> bool:
    picking_id = _many2one_id(move.get("picking_type_id"))
    return picking_id is None or picking_codes.get(picking_id) == expected


def _moves_by_product(moves: list[dict[str, Any]]) -> dict[int, list[dict[str, Any]]]:
    grouped: dict[int, list[dict[str, Any]]] = {}
    for move in moves:
        product_id = _many2one_id(move.get("product_id"))
        if product_id is not None:
            grouped.setdefault(product_id, []).append(move)
    return grouped


def _move_quantity(move: dict[str, Any]) -> float:
    if "quantity" in move:
        return _number(move.get("quantity"))
    return _number(move.get("product_uom_qty"))
