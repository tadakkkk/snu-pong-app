from __future__ import annotations

from typing import Any

from Common import build_result, fetch_html, parse_snudanbi_board_list, preview


SOURCE_ID = "affiliated_disability_support_staff_notices"
SOURCE_NAME = "장애학생지원센터"
BASE_URL = "https://snudanbi.snu.ac.kr"
SOURCE_URL = f"{BASE_URL}/category/board-12-gn-trs7tfdm-20250123150550/"
USER_AGENT = "snu-pong-crawler-prototype/0.1"


def crawl(max_records: int | None = None) -> list[dict[str, Any]]:
    html = fetch_html(SOURCE_URL, USER_AGENT)
    records: list[dict[str, Any]] = []
    seen: set[str] = set()

    for item in parse_snudanbi_board_list(html, SOURCE_URL):
        if not _is_useful_notice(item["title"]):
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
                provider=item["author"] or "서울대학교 장애학생지원센터",
                published_at=item["published_at"],
                views=item["views"],
                board_category=item["board_category"],
                project_categories=["welfare_safety", "career_experience", "scholarship_finance"],
                value_signal=_value_signal(item["title"]),
                uid_seed=key,
            )
        )
        if max_records is not None and len(records) >= max_records:
            return records[:max_records]

    return records


def _value_signal(title: str) -> str:
    if any(keyword in title for keyword in ("시급", "근로", "채용", "도우미")):
        return "direct_money"
    return "service_or_experience"


def _is_useful_notice(title: str) -> bool:
    return any(keyword in title for keyword in ("도우미", "근로", "지원인력", "시급", "교육지원인력"))


if __name__ == "__main__":
    preview(crawl(max_records=10))
