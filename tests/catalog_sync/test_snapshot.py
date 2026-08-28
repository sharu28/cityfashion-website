import tempfile
import unittest
from pathlib import Path

from scripts.catalog_sync.snapshot import (
    assert_public_safe,
    atomic_write_json,
    build_review_report,
)


class SnapshotTests(unittest.TestCase):
    def test_public_safe_rejects_private_keys(self):
        with self.assertRaises(ValueError):
            assert_public_safe({"id": "1210", "availableQuantity": 12})

    def test_public_safe_checks_nested_values_case_insensitively(self):
        with self.assertRaises(ValueError):
            assert_public_safe({"products": [{"StandardPrice": 900}]})

    def test_failed_validation_preserves_existing_file(self):
        with tempfile.TemporaryDirectory() as folder:
            target = Path(folder) / "snapshot.json"
            target.write_text('{"stable":true}\n', encoding="utf-8")
            with self.assertRaises(ValueError):
                atomic_write_json(
                    target,
                    {"schemaVersion": 0},
                    lambda value: (_ for _ in ()).throw(ValueError("bad")),
                )
            self.assertEqual(target.read_text(encoding="utf-8"), '{"stable":true}\n')

    def test_review_report_keeps_candidates_internal(self):
        report = build_review_report([], {}, {})
        self.assertEqual(report["schemaVersion"], 1)
        self.assertIn("summary", report)
        self.assertIn("newArrivalCandidates", report)
        self.assertIn("retailerDealCandidates", report)


if __name__ == "__main__":
    unittest.main()
