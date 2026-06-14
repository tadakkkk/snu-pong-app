import os, json, psycopg
from psycopg.rows import dict_row

OUT = os.path.join(os.path.dirname(__file__), "..", "data", "enriched-items.json")

def main():
    url = os.environ["DATABASE_URL"]
    with psycopg.connect(url, row_factory=dict_row) as conn:
        rows = conn.execute("""
            SELECT id, name, category, source_url, provider,
                   estimated_value, estimated_value_min, estimated_value_max,
                   expected_value, guaranteed_value,
                   conditional_reward_min, conditional_reward_max,
                   valuation_status, eligibility_scope, confidence,
                   requires_source_review, deadline_date, tags,
                   value_status, enrichment_status, is_benefit,
                   eligibility, apply_url, how_to_apply, subtitle, unit,
                   to_char(first_seen AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD"T"HH24:MI:SS') AS first_seen
            FROM benefit_items
            ORDER BY is_benefit DESC, estimated_value DESC NULLS LAST
        """).fetchall()

    out = []
    for r in rows:
        out.append({
            "id": r["id"],
            "name": r["name"],
            "category": r["category"],
            "source_url": r["source_url"] or "",
            "provider": r["provider"] or "",
            "estimated_value": r["estimated_value"],
            "estimated_value_min": r["estimated_value_min"],
            "estimated_value_max": r["estimated_value_max"],
            "expected_value": r["expected_value"],
            "guaranteed_value": r["guaranteed_value"],
            "conditional_reward_min": r["conditional_reward_min"],
            "conditional_reward_max": r["conditional_reward_max"],
            "valuation_status": r["valuation_status"],
            "eligibility_scope": r["eligibility_scope"],
            "confidence": r["confidence"],
            "requires_source_review": bool(r["requires_source_review"]),
            "deadline_date": r["deadline_date"],
            "tags": r["tags"] or [],
            "value_status": r["value_status"] or "needs_estimation",
            "enrichment_status": r["enrichment_status"],
            "review_priority": "medium",
            "deadline_hints": [],
            "is_benefit": bool(r["is_benefit"]),
            "first_seen": r["first_seen"] if r["first_seen"] else None,
            "eligibility": r["eligibility"],
            "apply_url": r["apply_url"],
            "how_to_apply": r["how_to_apply"] or [],   # DB에서 JSONB라 이미 list로 옴
            "subtitle": r["subtitle"],
            "unit": r["unit"],
            "source": "crawled_enriched",
        })

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    total = len(out)
    benefit = sum(1 for x in out if x["is_benefit"])
    print(f"export 완료: {total}개 → {OUT}")
    print(f"  혜택 {benefit}개 / 비혜택 {total-benefit}개")

main()
