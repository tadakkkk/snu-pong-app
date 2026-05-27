from __future__ import annotations

from typing import Any
from urllib.request import Request, urlopen
import re

from Common import absolute_url, build_result, clean_html, preview


SOURCE_ID = "snusr_notice"
SOURCE_NAME = "글로벌사회공헌단"
SOURCE_URL = "https://snusr.snu.ac.kr/community/notice"
USER_AGENT = "snu-pong-crawler-prototype/0.1"


def crawl(max_records: int | None = None) -> list[dict[str, Any]]:
    html = _fetch(SOURCE_URL)
    records: list[dict[str, Any]] = []

    for item in _parse_notice_items(html):
        records.append(
            build_result(
                source_id=SOURCE_ID,
                source_name=SOURCE_NAME,
                source_url=SOURCE_URL,
                title=item["title"],
                body_excerpt=item["summary"],
                raw_content=item["raw_content"],
                article_url=item["article_url"],
                provider="서울대학교 글로벌사회공헌단",
                published_at=item["published_at"],
                views=item["views"],
                board_category="공지사항",
                project_categories=["volunteering", "event_culture", "career_experience"],
                value_signal="service_or_experience",
                uid_seed=item["article_url"],
            )
        )
        if max_records is not None and len(records) >= max_records:
            return records[:max_records]

    return records


def _fetch(url: str) -> str:
    request = Request(url, headers={"User-Agent": USER_AGENT}, method="GET")
    with urlopen(request, timeout=20) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def _parse_notice_items(html: str) -> list[dict[str, Any]]:
    rows = re.findall(r"<tr[^>]*>(.*?)</tr>", html, flags=re.DOTALL | re.IGNORECASE)
    items: list[dict[str, Any]] = []
    for row in rows:
        href_match = re.search(r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', row, flags=re.DOTALL | re.IGNORECASE)
        if not href_match:
            continue
        href, title_html = href_match.groups()
        title = clean_html(title_html)
        if not title or title in {"제목", "공지"}:
            continue
        cells = [clean_html(cell) for cell in re.findall(r"<td[^>]*>(.*?)</td>", row, flags=re.DOTALL | re.IGNORECASE)]
        published_at = _find_date(cells)
        views = _find_views(cells)
        article_url = absolute_url(SOURCE_URL, href)
        items.append(
            {
                "title": title,
                "summary": clean_html(row),
                "article_url": article_url,
                "published_at": published_at,
                "views": views,
                "raw_content": row,
            }
        )
    return items


def _find_date(cells: list[str]) -> str | None:
    for cell in cells:
        match = re.search(r"\d{4}[./-]\d{1,2}[./-]\d{1,2}", cell)
        if match:
            return match.group(0).replace(".", "-").replace("/", "-")
    return None


def _find_views(cells: list[str]) -> int | None:
    for cell in reversed(cells):
        if re.fullmatch(r"\d+", cell):
            return int(cell)
    return None


if __name__ == "__main__":
    preview(crawl(max_records=10))
