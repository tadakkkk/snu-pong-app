from __future__ import annotations

from typing import Any

from AnnouncementsCommon import (
    build_result,
    fetch_html,
    is_useful_general_notice,
    parse_notice_table,
    preview,
    value_signal_for_title,
)


SOURCE_ID = "snu_general_notices"
SOURCE_NAME = "일반공지"
SOURCE_URL = "https://www.snu.ac.kr/snunow/notice/genernal?sc=y"


def crawl(max_records: int | None = None) -> list[dict[str, Any]]:
    html = fetch_html(SOURCE_URL)
    records: list[dict[str, Any]] = []

    for item in parse_notice_table(html, SOURCE_URL):
        if not is_useful_general_notice(item["title"]):
            continue
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
                board_category="일반공지",
                project_categories=["scholarship_finance", "career_experience", "event_culture", "learning_support"],
                value_signal=value_signal_for_title(item["title"]),
                uid_seed=item["article_url"],
            )
        )
        if max_records is not None and len(records) >= max_records:
            return records[:max_records]

    return records


if __name__ == "__main__":
    preview(crawl(max_records=10))
