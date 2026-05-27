from __future__ import annotations

from typing import Any

from RelatedCommon import build_result, fetch_html, parse_library_latest_notices, preview


SOURCE_ID = "related_library"
SOURCE_NAME = "도서관"
SOURCE_URL = "https://lib.snu.ac.kr/"


def crawl(max_records: int | None = None) -> list[dict[str, Any]]:
    html = fetch_html(SOURCE_URL)
    records: list[dict[str, Any]] = []
    for item in parse_library_latest_notices(html, SOURCE_URL):
        records.append(
            build_result(
                source_id=SOURCE_ID,
                source_name=SOURCE_NAME,
                source_url=SOURCE_URL,
                title=item["title"],
                body_excerpt=item["summary"],
                raw_content=item["raw_content"],
                article_url=item["article_url"],
                provider="서울대학교 도서관",
                published_at=item["published_at"],
                board_category="알림",
                project_categories=["library_service", "learning_support", "research_support"],
                value_signal="library_service",
                uid_seed=item["article_url"],
            )
        )
        if max_records is not None and len(records) >= max_records:
            return records[:max_records]
    return records


if __name__ == "__main__":
    preview(crawl(max_records=10))
