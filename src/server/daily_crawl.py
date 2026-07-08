import logging
import os, sys, asyncio, json
from collections import Counter

logging.basicConfig(level=logging.INFO)
from psycopg.types.json import Jsonb
import anthropic
import db as _db
from dedup import collapse, dedup_key
from main import (
    ScheduledActionContext, SCHEDULED_CRAWLERS,
    _run_scheduled_crawler, enrich_records, _store_enriched_records,
    FatalEnrichmentError, EnrichmentBatchError,
)
from crawling_rules.departments.Departments import crawl as crawl_departments

INCLUDE_DEPT = os.environ.get("INCLUDE_DEPARTMENTS", "false").lower() == "true"
MAX_PER_DEPT = int(os.environ.get("MAX_PER_DEPT", "3"))
RETRY_FAILED_ENRICHMENT = os.environ.get("RETRY_FAILED_ENRICHMENT", "false").lower() == "true"
MAX_RETRY_FAILED = int(os.environ.get("MAX_RETRY_FAILED", "50"))
ALLOW_FATAL_ENRICHMENT_FALLBACK = (
    os.environ.get("ALLOW_FATAL_ENRICHMENT_FALLBACK", "true").lower() == "true"
)
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
    with _db.connect() as conn:
        rows = conn.execute("""
            SELECT id, name, category, source_url, provider,
                   estimated_value, estimated_value_min, estimated_value_max,
                   expected_value, guaranteed_value,
                   conditional_reward_min, conditional_reward_max,
                   valuation_status, eligibility_scope, confidence,
                   requires_source_review, deadline_date, tags, value_status,
                   enrichment_status, is_benefit, first_seen,
                   eligibility, apply_url, how_to_apply, subtitle, unit
            FROM benefit_items
            ORDER BY is_benefit DESC, estimated_value DESC NULLS LAST
        """).fetchall()
    out = [{
        "id": r["id"], "name": r["name"], "category": r["category"],
        "source_url": r["source_url"] or "", "provider": r["provider"] or "",
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
        "tags": r["tags"] or [], "value_status": r["value_status"] or "needs_estimation",
        "enrichment_status": r["enrichment_status"],
        "review_priority": "medium", "deadline_hints": [],
        "is_benefit": bool(r["is_benefit"]),
        "first_seen": r["first_seen"].isoformat() if r["first_seen"] else None,
        "eligibility": r["eligibility"],
        "apply_url": r["apply_url"],
        "how_to_apply": r["how_to_apply"] or [],   # DB에서 JSONB라 이미 list로 옴
        "subtitle": r["subtitle"],
        "unit": r["unit"],
        "source": "crawled_enriched",
    } for r in rows]
    # 같은 공지 중복 제거(여러 학과 게시판 재게시/URL 파라미터 차이/source_id 차이).
    # 대표 1개로 합치고 source_count / also_posted_by 를 붙인다.
    before = len(out)
    out = collapse(out)
    print(f"dedup: {before}개 → {len(out)}개 (중복 {before - len(out)}개 병합)")
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
        model=os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6"),
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}],
    )
    text = resp.content[0].text.strip().replace("```json", "").replace("```", "").strip()
    return json.loads(text)

def retag_new_items(new_ids):
    if not new_ids:
        return 0, 0
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    with _db.connect() as conn:
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
            return 0, 0
        print(f"신규 재태깅 대상: {len(targets)}개")
        fixed = 0
        failed_batches = 0
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
                failed_batches += 1
        print(f"신규 재태깅 완료: {fixed}개 (실패 배치: {failed_batches}개)")
        return fixed, failed_batches


async def main():
    key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not key:
        print("CONFIG ERROR: ANTHROPIC_API_KEY is missing or empty. Aborting before crawl.")
        sys.exit(1)
    if not os.environ.get("DATABASE_URL"):
        print("CONFIG ERROR: DATABASE_URL is missing. Aborting.")
        sys.exit(1)

    _db.init_db()
    print(f"=== daily crawl 시작 (departments={INCLUDE_DEPT}) ===")
    records = await crawl_all()
    crawled_count = len(records)
    print(f"\n크롤 {crawled_count}개 수집")

    existing = await asyncio.to_thread(_db.get_existing_ids)
    existing_keys = await asyncio.to_thread(_db.get_existing_dedup_keys)
    seen: set[str] = set()
    seen_keys: set[str] = set()
    deduped: list = []
    internal_dupes = 0
    for r in records:
        rid = _rec_id(r)
        key = dedup_key(r)
        # 이미 아는 공지(다른 게시판/URL로 재게시된 것 포함)면 재정제하지 않는다.
        if rid in existing or key in existing_keys:
            continue
        if rid in seen or key in seen_keys:
            internal_dupes += 1
            continue
        seen.add(rid)
        seen_keys.add(key)
        deduped.append(r)
    new_records = deduped
    print(
        f"증분 필터: 신규 {len(new_records)}개 / 기존 {len(records)-len(new_records)-internal_dupes}개 스킵"
        f" / 내부 중복 {internal_dupes}개 제거"
    )

    new_count = len(new_records)
    retry_records = []
    if RETRY_FAILED_ENRICHMENT:
        retry_records = (await asyncio.to_thread(_db.get_failed_enrichment_items))[:MAX_RETRY_FAILED]
        print(f"실패 재처리 활성화: {len(retry_records)}개 (최대 {MAX_RETRY_FAILED}개)")
    else:
        print("실패 재처리 비활성화: RETRY_FAILED_ENRICHMENT=true로 명시적으로 활성화")

    retry_ids = {_rec_id(record) for record in retry_records}
    records_to_enrich = new_records + [
        record for record in retry_records if _rec_id(record) not in {_rec_id(r) for r in new_records}
    ]
    enrichment_failed = 0
    retag_failed_batches = 0

    if records_to_enrich:
        print(f"정제 중... 신규 {new_count}개 / 재처리 {len(retry_ids)}개")
        try:
            enriched = await asyncio.to_thread(
                enrich_records,
                records_to_enrich,
                fail_on_fatal=not ALLOW_FATAL_ENRICHMENT_FALLBACK,
            )
        except FatalEnrichmentError as e:
            print(f"FATAL ENRICHMENT ERROR: {e}. DB 저장/export/커밋 없이 종료(코드 1).")
            sys.exit(1)

        enrichment_failed = sum(1 for e in enriched if e.get("enrichment_status") == "failed")
        if enrichment_failed > 0:
            print(f"⚠ 정제 실패 항목 {enrichment_failed}개 - enrichment_status='failed'로 저장 (다음 실행 재처리 대상)")
        b = sum(1 for e in enriched if e.get("is_benefit"))
        print(f"정제 완료: {len(enriched)}개 (혜택 {b} / 비혜택 {len(enriched)-b})")

        await _store_enriched_records(enriched)
        print("DB 저장 완료")

        new_ids = {_rec_id(r) for r in new_records}
        retag_ids = [
            _rec_id(record)
            for record in enriched
            if _rec_id(record) in new_ids and record.get("enrichment_status") != "failed"
        ]
        if retag_ids:
            _, retag_failed_batches = await asyncio.to_thread(retag_new_items, retag_ids)
        else:
            print("재태깅 스킵: 정제 성공한 신규 항목 없음")
    else:
        print("신규 항목 없음 - 정제 스킵")

    total, benefit, expired = export_json()
    enriched_ok = len(records_to_enrich) - enrichment_failed
    valuation_counts = Counter(
        record.get("valuation_status") or "unknown"
        for record in (enriched if records_to_enrich else [])
    )
    summary_parts = [
        f"crawled={crawled_count}",
        f"new={new_count}",
        f"retried={len(retry_ids)}",
        f"enriched={enriched_ok}",
        f"enrichment_failed={enrichment_failed}",
        f"intentionally_unvalued={sum(count for status, count in valuation_counts.items() if status not in {'estimated', 'not_a_benefit', 'unknown'})}",
        f"not_benefit={valuation_counts['not_a_benefit']}",
        f"retag_failed_batches={retag_failed_batches}",
        f"expired={expired}",
        f"total={total}",
    ]
    summary = ", ".join(summary_parts)
    with open("crawl_summary.txt", "w", encoding="utf-8") as f:
        f.write(summary)
    print(f"SUMMARY: {summary}")
    print("=== 완료 ===")

asyncio.run(main())
