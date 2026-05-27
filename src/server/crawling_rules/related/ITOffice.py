from __future__ import annotations

from typing import Any

from RelatedCommon import build_result, fetch_html, parse_jet_posts, preview


SOURCE_ID = "related_it_office"
SOURCE_NAME = "정보화본부"
SOURCE_URL = "https://ist.snu.ac.kr/"


def crawl(max_records: int | None = None) -> list[dict[str, Any]]:
    html = fetch_html(SOURCE_URL)
    records: list[dict[str, Any]] = []
    for item in parse_jet_posts(html, SOURCE_URL):
        records.append(
            build_result(
                source_id=SOURCE_ID,
                source_name=SOURCE_NAME,
                source_url=SOURCE_URL,
                title=item["title"],
                body_excerpt=item["summary"],
                raw_content=item["raw_content"],
                article_url=item["article_url"],
                provider="서울대학교 정보화본부",
                published_at=item["published_at"],
                board_category="공지사항",
                project_categories=["it_service", "learning_support", "event_culture"],
                value_signal="campus_it_service",
                uid_seed=item["article_url"],
            )
        )
        if max_records is not None and len(records) >= max_records:
            return records[:max_records]
    return records


if __name__ == "__main__":
    preview(crawl(max_records=10))
