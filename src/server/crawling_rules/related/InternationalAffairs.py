from __future__ import annotations

from typing import Any

from RelatedCommon import build_result, fetch_html, parse_oia_news_items, preview


SOURCE_ID = "related_international_affairs"
SOURCE_NAME = "국제처"
SOURCE_URL = "https://oia.snu.ac.kr/"


def crawl(max_records: int | None = None) -> list[dict[str, Any]]:
    html = fetch_html(SOURCE_URL)
    records: list[dict[str, Any]] = []
    for item in parse_oia_news_items(html, SOURCE_URL):
        records.append(
            build_result(
                source_id=SOURCE_ID,
                source_name=SOURCE_NAME,
                source_url=SOURCE_URL,
                title=item["title"],
                body_excerpt=item["summary"],
                raw_content=item["raw_content"],
                article_url=item["article_url"],
                provider="서울대학교 국제처",
                published_at=item["published_at"],
                board_category="News & Events",
                project_categories=["international", "scholarship_finance", "career_experience", "event_culture"],
                value_signal="international_opportunity",
                uid_seed=item["article_url"],
            )
        )
        if max_records is not None and len(records) >= max_records:
            return records[:max_records]
    return records


if __name__ == "__main__":
    preview(crawl(max_records=10))
