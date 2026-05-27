from __future__ import annotations

from typing import Any

from RelatedCommon import build_result, fetch_html, parse_ifs_board_items, preview


SOURCE_ID = "related_future_strategy"
SOURCE_NAME = "국가미래전략원"
SOURCE_URL = "https://ifs.snu.ac.kr/"


def crawl(max_records: int | None = None) -> list[dict[str, Any]]:
    html = fetch_html(SOURCE_URL)
    records: list[dict[str, Any]] = []
    for item in parse_ifs_board_items(html, SOURCE_URL):
        records.append(
            build_result(
                source_id=SOURCE_ID,
                source_name=SOURCE_NAME,
                source_url=SOURCE_URL,
                title=item["title"],
                body_excerpt=item["summary"],
                raw_content=item["raw_content"],
                article_url=item["article_url"],
                provider="서울대학교 국가미래전략원",
                published_at=item["published_at"],
                board_category="공지 및 행사",
                project_categories=["event_culture", "research_support", "career_experience"],
                value_signal="event_or_research_opportunity",
                uid_seed=item["article_url"],
            )
        )
        if max_records is not None and len(records) >= max_records:
            return records[:max_records]
    return records


if __name__ == "__main__":
    preview(crawl(max_records=10))
