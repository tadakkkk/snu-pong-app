from __future__ import annotations

from typing import Any

from AnnouncementsCommon import build_result, fetch_html, parse_static_public_lecture_groups, preview


SOURCE_ID = "snu_public_lectures"
SOURCE_NAME = "대중강연·문화행사"
SOURCE_URL = "https://www.snu.ac.kr/about/sharing-snu/public-lecture"


def crawl(max_records: int | None = None) -> list[dict[str, Any]]:
    html = fetch_html(SOURCE_URL)
    records: list[dict[str, Any]] = []

    for item in parse_static_public_lecture_groups(html, SOURCE_URL):
        record = build_result(
            source_id=SOURCE_ID,
            source_name=SOURCE_NAME,
            source_url=SOURCE_URL,
            title=item["title"],
            body_excerpt=item["summary"],
            raw_content=item["raw_content"],
            article_url=item["article_url"],
            provider="서울대학교",
            published_at=item["published_at"],
            board_category="대중강연·문화행사",
            project_categories=["event_culture", "learning_support"],
            value_signal="service_or_experience",
            uid_seed=item["article_url"],
        )
        record["is_benefit_candidate"] = True
        records.append(record)
        if max_records is not None and len(records) >= max_records:
            return records[:max_records]

    return records


if __name__ == "__main__":
    preview(crawl(max_records=10))
