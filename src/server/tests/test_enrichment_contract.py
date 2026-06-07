from __future__ import annotations

import sys
import unittest
from pathlib import Path


SERVER_DIR = Path(__file__).resolve().parents[1]
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

from main import _merge_enrichment, _validate_enrichment_response


def _base_enrichment(**overrides):
    item = {
        "id": "item-1",
        "estimated_value": 30_000,
        "estimated_value_min": 30_000,
        "estimated_value_max": 30_000,
        "expected_value": None,
        "guaranteed_value": 30_000,
        "conditional_reward_min": None,
        "conditional_reward_max": None,
        "value_basis": "유사 유료 강연 1회 기준",
        "valuation_status": "estimated",
        "eligibility_scope": "all_students",
        "confidence": "medium",
        "requires_source_review": False,
        "subtitle": "무료 강연",
        "unit": "1회",
        "eligibility": "서울대 학생",
        "deadline_date": None,
        "apply_url": None,
        "how_to_apply": [],
        "site_id": None,
        "category": "learning",
        "is_benefit": True,
        "tags": ["#특강수강", "#자기계발", "#교육서비스"],
    }
    item.update(overrides)
    return item


class EnrichmentContractTests(unittest.TestCase):
    def setUp(self):
        self.records = [{"id": "item-1", "name": "테스트 강연"}]

    def test_accepts_conditional_reward_range(self):
        item = _base_enrichment(
            estimated_value=None,
            estimated_value_min=0,
            estimated_value_max=3_000_000,
            guaranteed_value=0,
            conditional_reward_min=500_000,
            conditional_reward_max=3_000_000,
            valuation_status="conditional_reward",
            value_basis="참가 확정 혜택 없음, 최고 상금 300만원",
        )

        _validate_enrichment_response(self.records, [item])

    def test_rejects_null_without_reason(self):
        item = _base_enrichment(
            estimated_value=None,
            valuation_status="missing_source_data",
            value_basis="",
            requires_source_review=True,
        )

        with self.assertRaisesRegex(ValueError, "null estimate requires value_basis"):
            _validate_enrichment_response(self.records, [item])

    def test_rejects_non_benefit_with_money(self):
        item = _base_enrichment(
            is_benefit=False,
            valuation_status="not_a_benefit",
        )

        with self.assertRaisesRegex(ValueError, "non-benefit cannot contain monetary values"):
            _validate_enrichment_response(self.records, [item])

    def test_rejects_benefit_flag_that_contradicts_rationale(self):
        item = _base_enrichment(
            estimated_value=None,
            estimated_value_min=None,
            estimated_value_max=None,
            guaranteed_value=None,
            valuation_status="needs_market_reference",
            value_basis="단순 행정 절차로 학생 혜택 없음",
        )

        with self.assertRaisesRegex(ValueError, "contradicts is_benefit"):
            _validate_enrichment_response(self.records, [item])

    def test_rejects_missing_record(self):
        with self.assertRaisesRegex(ValueError, "Expected 1 enrichment items"):
            _validate_enrichment_response(self.records, [])

    def test_merge_clears_previous_value_for_unvalued_retry(self):
        record = {
            "id": "item-1",
            "name": "인턴십",
            "estimated_value": 1_000_000,
            "estimated_value_min": 1_000_000,
            "estimated_value_max": 1_000_000,
        }
        enrichment = _base_enrichment(
            estimated_value=None,
            estimated_value_min=None,
            estimated_value_max=None,
            guaranteed_value=None,
            valuation_status="undisclosed_compensation",
            value_basis="급여 미공개",
        )

        merged = _merge_enrichment([record], [enrichment])[0]

        self.assertIsNone(merged["estimated_value"])
        self.assertIsNone(merged["estimated_value_min"])
        self.assertEqual(merged["valuation_status"], "undisclosed_compensation")
        self.assertEqual(merged["enrichment_status"], "success_unvalued")


if __name__ == "__main__":
    unittest.main()
