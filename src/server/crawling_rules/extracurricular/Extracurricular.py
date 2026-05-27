from __future__ import annotations

from typing import Any
from urllib.request import Request, urlopen
import re

from Common import absolute_url, build_result, clean_html, normalize_whitespace, preview


SOURCE_ID = "snu_extra_programs"
SOURCE_NAME = "SNU 비교과"
BASE_URL = "https://extra.snu.ac.kr"
SOURCE_URL = f"{BASE_URL}/ptfol/pgm/index.do"
USER_AGENT = "snu-pong-crawler-prototype/0.1"


def crawl(max_records: int | None = None) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    seen: set[str] = set()
    html = _fetch_program_index()

    for item in _parse_program_items(html):
        key = item["article_url"] or item["title"]
        if not key or key in seen:
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
                provider="서울대학교 비교과관리센터",
                board_category="비교과 프로그램",
                project_categories=["career_experience", "learning_support", "event_culture"],
                value_signal="service_or_experience",
                uid_seed=key,
            )
        )
        if max_records is not None and len(records) >= max_records:
            return records[:max_records]

    return records


def _fetch_program_index() -> str:
    request = Request(
        SOURCE_URL,
        headers={
            "User-Agent": USER_AGENT,
        },
        method="GET",
    )
    with urlopen(request, timeout=20) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def _parse_program_items(html: str) -> list[dict[str, str]]:
    lica_wrap = _extract_lica_wrap(html)
    if not lica_wrap:
        return []
    chunks = _candidate_chunks(lica_wrap)
    items: list[dict[str, str]] = []
    for chunk in chunks:
        text = clean_html(chunk)
        title = _extract_title(chunk, text)
        if not title:
            continue
        href = _extract_href(chunk)
        if not href:
            continue
        article_url = absolute_url(BASE_URL, href)
        items.append(
            {
                "title": title,
                "summary": text,
                "article_url": article_url,
                "raw_content": chunk,
            }
        )
    return items


def _extract_lica_wrap(html: str) -> str:
    match = re.search(
        r'<div\b[^>]*class=["\'][^"\']*\blica_wrap\b[^"\']*["\'][^>]*>',
        html,
        flags=re.IGNORECASE,
    )
    if not match:
        return ""

    start = match.start()
    cursor = match.end()
    depth = 1
    tag_pattern = re.compile(r"</?div\b[^>]*>", flags=re.IGNORECASE)
    while depth > 0:
        tag_match = tag_pattern.search(html, cursor)
        if not tag_match:
            return html[start:]
        tag = tag_match.group(0)
        if tag.startswith("</"):
            depth -= 1
        else:
            depth += 1
        cursor = tag_match.end()

    return html[start:cursor]


def _candidate_chunks(html: str) -> list[str]:
    chunks = _program_card_chunks(html)
    if chunks:
        return chunks
    chunks = re.findall(
        r'<div\b[^>]*class=["\'][^"\']*\blica_gp\b[^"\']*["\'][^>]*>(.*?)'
        r'<div\b[^>]*class=["\'][^"\']*\blica_etc_gp\b',
        html,
        flags=re.DOTALL | re.IGNORECASE,
    )
    return chunks


def _extract_title(chunk: str, text: str) -> str:
    patterns = (
        r'<a\b[^>]*class=["\'][^"\']*\btit\b[^"\']*["\'][^>]*>(.*?)</a>',
        r'class=["\'][^"\']*(?:title|subject|name)[^"\']*["\'][^>]*>(.*?)<',
        r'<strong[^>]*>(.*?)</strong>',
    )
    for pattern in patterns:
        match = re.search(pattern, chunk, flags=re.DOTALL | re.IGNORECASE)
        if match:
            title = clean_html(match.group(1))
            if len(title) >= 2:
                return title
    return normalize_whitespace(text.split("  ")[0])[:120]


def _extract_href(chunk: str) -> str | None:
    write_match = re.search(
        r"global\.write\(\s*['\"]([^'\"]+)['\"]\s*,\s*['\"](/ptfol/pgm/view\.do)['\"]",
        chunk,
        flags=re.IGNORECASE,
    )
    if write_match:
        pgm_key, path = write_match.groups()
        return f"{path}?pgmSeq={pgm_key}"

    match = re.search(r'href=["\']([^"\']+)["\']', chunk, flags=re.IGNORECASE)
    if match and match.group(1) != "#":
        return match.group(1)
    return None


def _program_card_chunks(html: str) -> list[str]:
    marker = '<li class=""><!--  lica_gp -->'
    if marker not in html:
        return []
    chunks: list[str] = []
    parts = html.split(marker)
    for part in parts[1:]:
        next_marker_index = part.find(marker)
        chunk = part if next_marker_index == -1 else part[:next_marker_index]
        chunks.append(f"{marker}{chunk}")
    return chunks


if __name__ == "__main__":
    preview(crawl(max_records=10))
