import os, sys, time, psycopg
from psycopg.rows import dict_row
from main import enrich_records
import db as _db

DRY = "--run" not in sys.argv   # 기본 dry-run. 실제 실행은 --run 플래그
BATCH = 20                       # 배치 크기
TARGET = "AI 정제 실패"

url = os.environ["DATABASE_URL"]
with psycopg.connect(url, row_factory=dict_row) as conn:
    rows = conn.execute("""
        SELECT id, name, category, provider, source_url, body_excerpt
        FROM benefit_items
        WHERE value_basis = %s
    """, (TARGET,)).fetchall()

print(f"재처리 대상('{TARGET}'): {len(rows)}개")
if DRY:
    print("\n[DRY-RUN] 실제 호출/저장 안 함. 샘플 5개:")
    for r in rows[:5]:
        print(f"  - {r['name'][:45]} | cat={r['category']}")
    print(f"\n실제 재처리하려면:  python recover_failed.py --run")
    sys.exit(0)

# 실제 재처리
print(f"\n[RUN] {len(rows)}개 재처리 시작 (배치 {BATCH})...")
done, ok = 0, 0
for i in range(0, len(rows), BATCH):
    batch = rows[i:i+BATCH]
    records = [{
        "id": r["id"], "name": r["name"], "title": r["name"],
        "provider": r.get("provider"), "source_url": r.get("source_url"),
        "body_excerpt": r.get("body_excerpt") or r["name"],
        "category": r["category"],
    } for r in batch]
    try:
        enriched = enrich_records(records)
        # 재처리 후에도 실패한 건(여전히 'AI 정제 실패') 저장 안 함 — 덮어쓰기 방지
        good = [e for e in enriched if e.get("value_basis") != TARGET]
        if good:
            _db.upsert_items(good)
            ok += len(good)
        done += len(batch)
        print(f"  {done}/{len(rows)} 처리 (이번 배치 성공 {len(good)}/{len(batch)})")
    except Exception as ex:
        print(f"  ! 배치 {i//BATCH+1} 오류: {type(ex).__name__}: {ex}")
    time.sleep(2)   # rate limit 여유

print(f"\n완료: {done}개 시도 / {ok}개 정상 정제됨")