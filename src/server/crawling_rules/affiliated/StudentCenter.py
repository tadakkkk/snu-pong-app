from __future__ import annotations

from typing import Any

from Common import build_result, fetch_html, parse_kboard_default_list, preview


SOURCE_ID = "affiliated_student_center_notices"
SOURCE_NAME = "학생지원센터"
BASE_URL = "https://student.snu.ac.kr"
SOURCE_URL = f"{BASE_URL}/%ec%86%8c%ec%8b%9d%c2%b7%ec%95%8c%eb%a6%bc/%ea%b3%b5%ec%a7%80%ec%82%ac%ed%95%ad/"
USER_AGENT = "snu-pong-crawler-prototype/0.1"


def crawl(max_records: int | None = None) -> list[dict[str, Any]]:
    html = fetch_html(SOURCE_URL, USER_AGENT)
    records: list[dict[str, Any]] = []
    seen: set[str] = set()

    for item in parse_kboard_default_list(html, BASE_URL):
        if not _is_useful_notice(item["title"], item["board_category"]):
            continue
        key = item["article_url"] or item["title"]
        if key in seen:
            continue
        seen.add(key)

        records.append(
            build_result(
                source_id=SOURCE_ID,
                source_name=SOURCE_NAME,
                source_url=SOURCE_URL,
                title=item["title"],
                body_excerpt=item["summary"],
                raw_content=item["raw_content"],
                article_url=item["article_url"],
                provider=item["author"] or "서울대학교 학생처",
                published_at=item["published_at"],
                views=item["views"],
                board_category=item["board_category"] or "공지사항",
                project_categories=["scholarship_finance", "welfare_safety", "event_culture", "career_experience"],
                value_signal=_value_signal(item["title"], item["board_category"]),
                uid_seed=key,
            )
        )
        if max_records is not None and len(records) >= max_records:
            return records[:max_records]

    return records


def _value_signal(title: str, board_category: str | None) -> str:
    text = f"{title} {board_category or ''}"
    if any(keyword in text for keyword in ("장학", "등록금", "근로")):
        return "direct_money"
    if any(keyword in text for keyword in ("지원", "혜택", "분실물")):
        return "service_or_experience"
    return "unknown_or_low"


def _is_useful_notice(title: str, board_category: str | None) -> bool:
    if board_category == "캠퍼스견학":
        return False
    if board_category in ("장학공지", "행사·모집"):
        return True
    return any(keyword in title for keyword in ("지원", 
    "상담", "혜택", "장학", "근로", "멘토", "프로그램"))


if __name__ == "__main__":
    preview(crawl(max_records=10))
