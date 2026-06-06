import os, json, psycopg
from psycopg.rows import dict_row

OUT = r"C:\Users\gram\snu-pong-app\src\data\enriched-items.json"

def main():
    url = os.environ["DATABASE_URL"]
    with psycopg.connect(url, row_factory=dict_row) as conn:
        rows = conn.execute("""
            SELECT id, name, category, source_url, provider,
                   estimated_value, deadline_date, tags,
                   value_status, is_benefit,
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
            "deadline_date": r["deadline_date"],
            "tags": r["tags"] or [],
            "value_status": r["value_status"] or "needs_estimation",
            "review_priority": "medium",
            "deadline_hints": [],
            "is_benefit": bool(r["is_benefit"]),
            "first_seen": r["first_seen"] if r["first_seen"] else None,
            "source": "crawled_enriched",
        })

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    total = len(out)
    benefit = sum(1 for x in out if x["is_benefit"])
    print(f"export 완료: {total}개 → {OUT}")
    print(f"  혜택 {benefit}개 / 비혜택 {total-benefit}개")

main()