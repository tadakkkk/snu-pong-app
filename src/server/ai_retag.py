import os, json, psycopg
from collections import Counter
from psycopg.types.json import Jsonb
import anthropic

conn = psycopg.connect(os.environ["DATABASE_URL"])
client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

# 1. 기존 태그 풀 (2개 이상 쓰인 것, 두루뭉술 fallback 제외)
allrows = conn.execute("SELECT tags FROM benefit_items WHERE is_benefit = true").fetchall()
c = Counter()
for r in allrows:
    for t in (r[0] or []):
        c[t] += 1
exclude = {"#학습","#진로","#복지","#문화","#경험","#시설","#운동","#기타","#모집","#프로그램"}
tag_pool = sorted([t for t, n in c.items() if n >= 2 and len(t) <= 12 and t not in exclude])
print(f"태그 풀: {len(tag_pool)}개")

# 2. 전체 혜택 항목 대상 (기존 태그 풀 기준으로 전부 통일)
rows = conn.execute("SELECT id, name, tags FROM benefit_items WHERE is_benefit = true").fetchall()
targets = [(r[0], r[1], r[2] or []) for r in rows]
print(f"보정 대상: {len(targets)}개\n")

# 3. 배치로 AI 호출 (10개씩)
def retag_batch(batch):
    items_desc = "\n".join(f"{i+1}. {name} (현재태그: {tags})" for i, (_, name, tags) in enumerate(batch))
    prompt = f"""다음은 서울대 학생 혜택/공지 제목 목록이야. 각 항목에 어울리는 태그를 아래 '태그 목록'에서만 골라줘.

규칙:
- 반드시 아래 태그 목록에 있는 것만 사용 (새로 만들지 마)
- 각 항목당 2~4개
- 제목 내용에 가장 잘 맞는 구체적인 걸로

태그 목록:
{', '.join(tag_pool)}

항목:
{items_desc}

출력: JSON 배열만. 각 원소는 태그 문자열 배열. 항목 순서대로. 예: [["#장학금","#국제교류"],["#특강수강","#심리학"]]
설명 없이 JSON만."""
    resp = client.messages.create(
        model=os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6"),
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}],
    )
    text = resp.content[0].text.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)

fixed = 0
for i in range(0, len(targets), 10):
    batch = targets[i:i+10]
    try:
        result = retag_batch(batch)
        for (item_id, name, _), new_tags in zip(batch, result):
            valid = [t for t in new_tags if t in tag_pool]
            if valid:
                conn.execute("UPDATE benefit_items SET tags = %s WHERE id = %s", (Jsonb(valid), item_id))
                fixed += 1
        conn.commit()
        print(f"  배치 {i//10+1}: {len(batch)}개 처리")
    except Exception as e:
        print(f"  배치 {i//10+1} 실패: {e}")

print(f"\n완료: {fixed}개 재태깅됨")