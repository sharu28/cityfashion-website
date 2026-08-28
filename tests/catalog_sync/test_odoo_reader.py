import unittest
from datetime import datetime, timezone

from scripts.catalog_sync.models import PolicyConfig
from scripts.catalog_sync.odoo_reader import OdooReader


class CatalogGateway:
    def __init__(self):
        self.calls = []

    def execute(self, model, method, args=None, kwargs=None):
        args = args or []
        kwargs = kwargs or {}
        self.calls.append((model, method, args, kwargs))

        if method == "fields_get":
            fields = {
                "stock.location": ("id", "name", "complete_name", "usage"),
                "stock.picking.type": ("id", "code"),
                "product.product": (
                    "id",
                    "name",
                    "default_code",
                    "active",
                    "sale_ok",
                    "lst_price",
                ),
                "stock.quant": (
                    "id",
                    "product_id",
                    "location_id",
                    "quantity",
                    "reserved_quantity",
                    "available_quantity",
                ),
                "stock.move": (
                    "id",
                    "product_id",
                    "location_id",
                    "location_dest_id",
                    "picking_type_id",
                    "quantity",
                    "date",
                    "state",
                ),
            }
            return {name: {} for name in fields[model]}

        if method != "search_read":
            raise AssertionError(f"Mutation attempted: {model}.{method}")

        offset = kwargs.get("offset", 0)
        if offset:
            return []

        if model == "stock.location":
            return [
                {"id": 5, "name": "Stock", "complete_name": "WH/Stock", "usage": "internal"},
                {"id": 8, "name": "Vendors", "complete_name": "Partners/Vendors", "usage": "supplier"},
                {"id": 9, "name": "Customers", "complete_name": "Partners/Customers", "usage": "customer"},
                {"id": 10, "name": "Transit", "complete_name": "WH/Transit", "usage": "internal"},
            ]
        if model == "stock.picking.type":
            return [{"id": 1, "code": "incoming"}, {"id": 2, "code": "outgoing"}]
        if model == "product.product":
            return [
                {
                    "id": 155,
                    "name": "D 1210 GLITTER LONG TOP",
                    "default_code": "425795",
                    "active": True,
                    "sale_ok": True,
                    "lst_price": 2200.0,
                }
            ]
        if model == "stock.quant":
            return [
                {
                    "id": 1,
                    "product_id": [155, "D 1210 GLITTER LONG TOP"],
                    "location_id": [5, "WH/Stock"],
                    "quantity": 20.0,
                    "reserved_quantity": 3.0,
                    "available_quantity": 17.0,
                }
            ]
        if model == "stock.move":
            domain = args[0]
            is_incoming = ["location_dest_id", "=", 5] in domain
            if is_incoming:
                return [
                    {
                        "id": 11,
                        "product_id": [155, "D 1210 GLITTER LONG TOP"],
                        "location_id": [8, "Partners/Vendors"],
                        "location_dest_id": [5, "WH/Stock"],
                        "picking_type_id": [1, "Receipts"],
                        "quantity": 20.0,
                        "date": "2026-08-20 10:00:00",
                        "state": "done",
                    },
                    {
                        "id": 12,
                        "product_id": [155, "D 1210 GLITTER LONG TOP"],
                        "location_id": [10, "WH/Transit"],
                        "location_dest_id": [5, "WH/Stock"],
                        "picking_type_id": False,
                        "quantity": 4.0,
                        "date": "2026-08-25 10:00:00",
                        "state": "done",
                    },
                ]
            return [
                {
                    "id": 13,
                    "product_id": [155, "D 1210 GLITTER LONG TOP"],
                    "location_id": [5, "WH/Stock"],
                    "location_dest_id": [9, "Partners/Customers"],
                    "picking_type_id": [2, "Delivery Orders"],
                    "quantity": 2.0,
                    "date": "2026-08-10 10:00:00",
                    "state": "done",
                },
                {
                    "id": 14,
                    "product_id": [155, "D 1210 GLITTER LONG TOP"],
                    "location_id": [5, "WH/Stock"],
                    "location_dest_id": [10, "WH/Transit"],
                    "picking_type_id": False,
                    "quantity": 50.0,
                    "date": "2026-08-12 10:00:00",
                    "state": "done",
                },
            ]
        return []


class ReaderTests(unittest.TestCase):
    def test_resolves_internal_location_by_complete_name(self):
        reader = OdooReader(CatalogGateway(), "WH/Stock")
        self.assertEqual(reader.resolve_location()["id"], 5)

    def test_reads_only_customer_demand_and_supplier_receipts(self):
        gateway = CatalogGateway()
        reader = OdooReader(gateway, "WH/Stock")
        location, products = reader.read_product_facts(
            datetime(2026, 8, 28, tzinfo=timezone.utc),
            PolicyConfig(),
        )

        self.assertEqual(location["complete_name"], "WH/Stock")
        self.assertEqual(len(products), 1)
        self.assertEqual(products[0].available_quantity, 17.0)
        self.assertEqual(products[0].last_incoming_at, "2026-08-20T10:00:00+00:00")
        self.assertEqual(products[0].last_outgoing_at, "2026-08-10T10:00:00+00:00")
        self.assertEqual(products[0].outgoing_units_45d, 2.0)
        self.assertEqual(products[0].outgoing_units_90d, 2.0)
        self.assertTrue(all(method in {"fields_get", "search_read"} for _, method, _, _ in gateway.calls))

    def test_search_read_all_paginates_until_short_page(self):
        gateway = CatalogGateway()
        reader = OdooReader(gateway, "WH/Stock", page_size=1)
        rows = reader.search_read_all("product.product", [], ["id", "name"])

        self.assertEqual([row["id"] for row in rows], [155])
        product_calls = [
            call
            for call in gateway.calls
            if call[0] == "product.product" and call[1] == "search_read"
        ]
        self.assertEqual([call[3]["offset"] for call in product_calls], [0, 1])

    def test_missing_or_duplicate_location_is_rejected(self):
        class DuplicateLocationGateway(CatalogGateway):
            def execute(self, model, method, args=None, kwargs=None):
                rows = super().execute(model, method, args, kwargs)
                if model == "stock.location" and method == "search_read":
                    return [rows[0], {**rows[0], "id": 6}]
                return rows

        with self.assertRaisesRegex(RuntimeError, "exactly one internal location"):
            OdooReader(DuplicateLocationGateway(), "WH/Stock").resolve_location()


if __name__ == "__main__":
    unittest.main()
