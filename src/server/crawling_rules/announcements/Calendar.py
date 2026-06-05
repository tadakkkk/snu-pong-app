from __future__ import annotations

from typing import Any

from AnnouncementsCommon import build_result, fetch_html, parse_event_cards, preview, value_signal_for_title


SOURCE_ID = "snu_calendar_events"
SOURCE_NAME = "SNU 캘린더"
SOURCE_URL = "https://www.snu.ac.kr/snunow/events"


def crawl(max_records: int | None = None) -> list[dict[str, Any]]:
    html = fetch_html(SOURCE_URL)
    records: list[dict[str, Any]] = []

    for item in parse_event_cards(html, SOURCE_URL):
        records.append(
            build_result(
                source_id=SOURCE_ID,
                source_name=SOURCE_NAME,
                source_url=SOURCE_URL,
                title=item["title"],
                body_excerpt=item["summary"],
                raw_content=item["raw_content"],
                article_url=item["article_url"],
                provider="서울대학교",
                published_at=item["published_at"],
                board_category="SNU 캘린더",
                project_categories=["event_culture", "career_experience", "learning_support"],
                value_signal=value_signal_for_title(item["title"]),
                uid_seed=item["article_url"],
            )
        )
        if max_records is not None and len(records) >= max_records:
            return records[:max_records]

    return records


if __name__ == "__main__":
    preview(crawl(max_records=10))
