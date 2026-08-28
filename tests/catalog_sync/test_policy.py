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

    def test_suggestion_ignores_inactive_historical_duplicates(self):
        active = fact()
        inactive = fact(odoo_product_id=99, active=False)
        self.assertEqual(suggest_mapping("1210", [inactive, active]), 155)

    def test_new_arrival_boundaries(self):
        policy = PolicyConfig()
        self.assertTrue(classify_product(fact(last_incoming_at="2026-07-30T00:00:00+00:00"), policy, AS_OF).new_arrival)
        self.assertTrue(classify_product(fact(last_incoming_at="2026-07-29T00:00:00+00:00"), policy, AS_OF).new_arrival)
        self.assertFalse(classify_product(fact(last_incoming_at="2026-07-28T00:00:00+00:00"), policy, AS_OF).new_arrival)

    def test_odoo_naive_timestamp_is_treated_as_utc(self):
        decision = classify_product(
            fact(last_incoming_at="2026-07-30 00:00:00"),
            PolicyConfig(),
            AS_OF,
        )
        self.assertTrue(decision.new_arrival)

    def test_deal_requires_age_quantity_and_low_velocity(self):
        decision = classify_product(fact(), PolicyConfig(), AS_OF)
        self.assertTrue(decision.retailer_deal)
        self.assertFalse(classify_product(fact(available_quantity=0), PolicyConfig(), AS_OF).retailer_deal)
        self.assertFalse(
            classify_product(
                fact(outgoing_units_45d=5, outgoing_units_90d=5),
                PolicyConfig(),
                AS_OF,
            ).retailer_deal
        )

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
