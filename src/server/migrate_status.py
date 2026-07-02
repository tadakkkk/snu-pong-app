import os, sys, psycopg
from psycopg.rows import dict_row

DRY = "--run" not in sys.argv

c = psycopg.connect(os.environ["DATABASE_URL"], row_factory=dict_row)

# 분류 규칙 (CASE)
classify = """
CASE
  WHEN value_basis = 'AI 정제 실패' THEN 'failed'
  WHEN estimated_value IS NOT NULL THEN 'success_valued'
  WHEN value_basis IS NOT NULL AND value_basis != 'AI 정제 실패' THEN 'success_unvalued'
  ELSE 'pending'
END
"""

# 먼저 분류 분포 미리보기
print("=== 분류 결과 미리보기 ===")
rows = c.execute(f"SELECT {classify} AS st, COUNT(*) AS n FROM benefit_items GROUP BY st ORDER BY n DESC").fetchall()
total = 0
for r in rows:
    print(f"  {r['n']:4d}  | {r['st']}")
    total += r['n']
print(f"  합계: {total}")

# 현재 enrichment_status 상태
print("\n=== 현재 enrichment_status (마이그레이션 전) ===")
cur = c.execute("SELECT enrichment_status AS st, COUNT(*) AS n FROM benefit_items GROUP BY st").fetchall()
for r in cur:
    print(f"  {r['n']:4d}  | {r['st']}")

if DRY:
    print("\n[DRY-RUN] 실제 UPDATE 안 함. 실행하려면: python migrate_status.py --run")
    sys.exit(0)

# 실제 마이그레이션
print("\n[RUN] enrichment_status 채우는 중...")
c.execute(f"UPDATE benefit_items SET enrichment_status = ({classify}) WHERE enrichment_status IS NULL")
c.commit()
print("완료. 결과:")
for r in c.execute("SELECT enrichment_status AS st, COUNT(*) AS n FROM benefit_items GROUP BY st ORDER BY n DESC").fetchall():
    print(f"  {r['n']:4d}  | {r['st']}")