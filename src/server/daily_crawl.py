import os, sys, asyncio, json
from collections import Counter
import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb
import anthropic
import db as _db
from main import (
    ScheduledActionContext, SCHEDULED_CRAWLERS,
    _run_scheduled_crawler, enrich_records, _store_enriched_records,
)
from crawling_rules.departments.Departments import crawl as crawl_departments

INCLUDE_DEPT = os.environ.get("INCLUDE_DEPARTMENTS", "false").lower() == "true"
MAX_PER_DEPT = int(os.environ.get("MAX_PER_DEPT", "3"))
OUT_JSON = os.environ.get(
    "OUT_JSON",
    os.path.join(os.path.dirname(__file__), "..", "data", "enriched-items.json"),
)

def _rec_id(r):
    return r.get("id") or r.get("draft_id") or str(r.get("source_url") or "")

async def crawl_all():
    ctx = ScheduledActionContext(trigger="manual")
    records = []
    for entry in SCHEDULED_CRAWLERS:
        if entry.crawler_id == "departments":
            if not INCLUDE_DEPT:
                print(f"  {entry.crawler_id}: 건너뜀 (이번 실행 제외)")
                continue
            print(f"  {entry.crawler_id}: 단과대당 {MAX_PER_DEPT}개...")
            dept = await asyncio.to_thread(crawl_departments, max_records_per_department=MAX_PER_DEPT)
            print(f"  {entry.crawler_id}: success ({len(dept)}개)")
            records.extend(dept)
        else:
            outcome = await _run_scheduled_crawler(entry, ctx)
            r = outcome.result
            print(f"  {r.crawler_id}: {r.status} ({r.records_count}개)")
            records.extend(outcome.records)
    return records

def export_json():
    from psycopg.rows import dict_row
    import psycopg
    url = os.environ["DATABASE_URL"]
    with psycopg.connect(url, row_factory=dict_row) as conn:
        rows = conn.execute("""
            SELECT id, name, category, source_url, provider,
                   estimated_value, deadline_date, tags, value_status, is_benefit, first_seen
            FROM benefit_items
            ORDER BY is_benefit DESC, estimated_value DESC NULLS LAST
        """).fetchall()
    out = [{
        "id": r["id"], "name": r["name"], "category": r["category"],
        "source_url": r["source_url"] or "", "provider": r["provider"] or "",
        "estimated_value": r["estimated_value"], "deadline_date": r["deadline_date"],
        "tags": r["tags"] or [], "value_status": r["value_status"] or "needs_estimation",
        "review_priority": "medium", "deadline_hints": [],
        "is_benefit": bool(r["is_benefit"]),
        "first_seen": r["first_seen"].isoformat() if r["first_seen"] else None,
        "source": "crawled_enriched",
    } for r in rows]
    path = os.path.abspath(OUT_JSON)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    b = sum(1 for x in out if x["is_benefit"])
    print(f"JSON export: {len(out)}개 (혜택 {b} / 비혜택 {len(out)-b}) -> {path}")
    from datetime import datetime, timezone, timedelta
    kst_today = (datetime.now(timezone.utc) + timedelta(hours=9)).strftime("%Y-%m-%d")
    expired = sum(1 for x in out if x["deadline_date"] and x["deadline_date"] < kst_today)
    return len(out), b, expired

_WEAK_TAGS = {"#학습","#진로","#복지","#문화","#경험","#시설","#운동","#기타","#모집","#프로그램"}

def _build_tag_pool(conn):
    rows = conn.execute("SELECT tags FROM benefit_items WHERE is_benefit = true").fetchall()
    c = Counter()
    for r in rows:
        for t in (r["tags"] or []):
            c[t] += 1
    return sorted([t for t, n in c.items() if n >= 2 and len(t) <= 12 and t not in _WEAK_TAGS])

def _retag_batch(client, tag_pool, batch):
    items_desc = "\n".join(f"{i+1}. {name}" for i, (_, name) in enumerate(batch))
    prompt = f"""다음은 서울대 학생 혜택/공지 제목 목록이야. 각 항목에 어울리는 태그를 아래 '태그 목록'에서만 골라줘.

규칙:
- 반드시 아래 태그 목록에 있는 것만 사용 (새로 만들지 마)
- 각 항목당 2~4개
- 제목 내용에 가장 잘 맞는 구체적인 걸로

태그 목록:
{', '.join(tag_pool)}

항목:
{items_desc}

출력: JSON 배열만. 각 원소는 태그 문자열 배열. 항목 순서대로. 설명 없이 JSON만."""
    resp = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}],
    )
    text = resp.content[0].text.strip().replace("```json", "").replace("```", "").strip()
    return json.loads(text)

def retag_new_items(new_ids):
    if not new_ids:
        return 0
    url = os.environ["DATABASE_URL"]
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    with psycopg.connect(url, row_factory=dict_row) as conn:
        tag_pool = _build_tag_pool(conn)
        rows = conn.execute(
            "SELECT id, name, tags FROM benefit_items WHERE id = ANY(%s) AND is_benefit = true",
            (list(new_ids),),
        ).fetchall()
        targets = [
            (r["id"], r["name"])
            for r in rows
            if len(r["tags"] or []) <= 1 or all(t in _WEAK_TAGS for t in (r["tags"] or []))
        ]
        if not targets:
            print("재태깅 대상 없음 (신규 태그 양호)")
            return 0
        print(f"신규 재태깅 대상: {len(targets)}개")
        fixed = 0
        for i in range(0, len(targets), 10):
            batch = targets[i:i+10]
            try:
                result = _retag_batch(client, tag_pool, batch)
                for (item_id, _), new_tags in zip(batch, result):
                    valid = [t for t in new_tags if t in tag_pool]
                    if valid:
                        conn.execute("UPDATE benefit_items SET tags = %s WHERE id = %s", (Jsonb(valid), item_id))
                        fixed += 1
                conn.commit()
            except Exception as e:
                print(f"  재태깅 배치 실패: {e}")
        print(f"신규 재태깅 완료: {fixed}개")
        return fixed


async def main():
    print(f"=== daily crawl 시작 (departments={INCLUDE_DEPT}) ===")
    records = await crawl_all()
    print(f"\n크롤 {len(records)}개 수집")

    existing = await asyncio.to_thread(_db.get_existing_ids)
    new_records = [r for r in records if _rec_id(r) not in existing]
    print(f"증분 필터: 신규 {len(new_records)}개 / 기존 {len(records)-len(new_records)}개 스킵")

    new_count = len(new_records)
    if new_records:
        print("신규 정제 중...")
        enriched = await asyncio.to_thread(enrich_records, new_records)
        b = sum(1 for e in enriched if e.get("is_benefit"))
        print(f"정제 완료: {len(enriched)}개 (혜택 {b} / 비혜택 {len(enriched)-b})")
        await _store_enriched_records(enriched)
        print("DB 저장 완료")
        new_ids = [_rec_id(r) for r in new_records]
        await asyncio.to_thread(retag_new_items, new_ids)
    else:
        print("신규 항목 없음 - 정제 스킵")

    total, benefit, expired = export_json()
    summary = f"new {new_count}, total {total}, expired {expired}"
    with open("crawl_summary.txt", "w", encoding="utf-8") as f:
        f.write(summary)
    print(f"SUMMARY: {summary}")
    print("=== 완료 ===")

asyncio.run(main())