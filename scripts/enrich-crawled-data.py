import openai, json, os, sys

client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

BATCH_SIZE = 5

VALUE_GUIDE = """가치 환산 기준 (사설 시세 대비):
- 1:1 상담/코칭: 회당 5~15만원
- 집단 상담/워크숍: 회당 3~5만원
- 글쓰기 첨삭: 회당 3~5만원
- 어학 강좌: 학기당 30~50만원
- 장학금/지원금: 공고에 적힌 금액 그대로
- 인턴십/근로장학: 월 급여 기준
- 무료 강연/행사: 외부 유료 강연 시세 1~3만원
- 해외 프로그램: 항공+숙박+수업료 합산
- 판단 불가: null"""

SYSTEM_PROMPT = """너는 서울대 학생 혜택 데이터를 정제하는 AI야.
공지 제목과 본문을 보고 학생에게 도움 되는 정보를 구조화해서 JSON으로 반환해.
반드시 JSON 배열만 반환. 다른 텍스트 없이."""

def enrich_batch(articles):
    articles_text = ""
    for i, a in enumerate(articles):
        articles_text += f"\n---\n항목 {i+1} (id: {a.get('id', 'unknown')}):\n"
        articles_text += f"제목: {a.get('name', '')}\n"
        articles_text += f"카테고리: {a.get('category', '')}\n"
        articles_text += f"제공: {a.get('provider', '')}\n"
        articles_text += f"원본URL: {a.get('source_url', '')}\n"
        articles_text += f"마감힌트: {json.dumps(a.get('deadline_hints', []), ensure_ascii=False)}\n"
        articles_text += f"가치힌트: {a.get('value_basis_hint', '')}\n"
        body = a.get('body_excerpt', '')
        if body:
            articles_text += f"본문발췌: {body[:500]}\n"

    user_prompt = f"""다음 서울대 공지 {len(articles)}개에서 학생 혜택 정보를 추출해.

{VALUE_GUIDE}

각 항목마다 이 형식으로:
{{
  "id": "원본 id 그대로",
  "estimated_value": 숫자(원) 또는 null,
  "value_basis": "산출 근거 한 줄",
  "subtitle": "15자 이내 한 줄 설명",
  "unit": "1회 / 8회 코스 / 학기 / 상시 등",
  "eligibility": "학부생 누구나 / 1학년만 등",
  "deadline_date": "2026-05-29 형식 또는 null",
  "apply_url": "신청 링크 또는 null",
  "how_to_apply": ["단계1", "단계2", "단계3"],
  "site_id": "career_center / writing_center 등 또는 null"
}}

JSON 배열만 반환. 마크다운 코드블록이나 설명 텍스트 없이.

{articles_text}"""

    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.2,
    )

    raw_text = resp.choices[0].message.content.strip()
    if raw_text.startswith("```"):
        raw_text = raw_text.split("\n", 1)[1]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]

    return json.loads(raw_text)

def main():
    crawled_path = os.path.join(os.path.dirname(__file__), "..", "src", "data", "crawled-items.json")
    crawled_path = os.path.normpath(crawled_path)

    if not os.path.exists(crawled_path):
        print(f"crawled-items.json not found at {crawled_path}")
        sys.exit(1)

    with open(crawled_path, "r", encoding="utf-8") as f:
        items = json.load(f)

    print(f"Loaded {len(items)} items")

    enriched = []
    for i in range(0, len(items), BATCH_SIZE):
        batch = items[i:i+BATCH_SIZE]
        print(f"Batch {i//BATCH_SIZE + 1} ({len(batch)} items)...")
        try:
            result = enrich_batch(batch)
            if isinstance(result, list):
                enriched.extend(result)
            elif isinstance(result, dict) and "items" in result:
                enriched.extend(result["items"])
        except Exception as e:
            print(f"Error: {e}")
            for item in batch:
                enriched.append({
                    "id": item.get("id", "unknown"),
                    "estimated_value": None,
                    "value_basis": "AI 정제 실패",
                    "subtitle": "", "unit": "", "eligibility": "",
                    "deadline_date": None, "apply_url": None,
                    "how_to_apply": [], "site_id": None
                })

    enriched_map = {e["id"]: e for e in enriched}
    final = []
    for item in items:
        merged = {**item}
        ai = enriched_map.get(item.get("id", ""))
        if ai:
            for key in ["estimated_value", "value_basis", "subtitle", "unit",
                        "eligibility", "deadline_date", "apply_url", "how_to_apply", "site_id"]:
                if ai.get(key) is not None:
                    merged[key] = ai[key]
            merged["value_status"] = "estimated" if ai.get("estimated_value") else "needs_estimation"
            merged["source"] = "crawled_enriched"
        final.append(merged)

    output_path = os.path.join(os.path.dirname(__file__), "..", "src", "data", "enriched-items.json")
    output_path = os.path.normpath(output_path)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(final, f, ensure_ascii=False, indent=2)

    estimated = sum(1 for i in final if i.get("estimated_value"))
    print(f"Done: {len(final)} items, {estimated} with values")

if __name__ == "__main__":
    main()
