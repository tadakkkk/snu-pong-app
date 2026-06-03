from __future__ import annotations

from datetime import datetime, timezone
from html import unescape
from pathlib import Path
from typing import Any, NamedTuple
from urllib.parse import urljoin
from urllib.request import Request, urlopen
import hashlib
import random
import re
import time


SOURCE_ID = "department_landing_pages"
SOURCE_NAME = "대학 및 학과"
USER_AGENT = "snu-pong-crawler-prototype/0.1"
DEFAULT_REQUEST_DELAY_SECONDS = 1.5
DEFAULT_REQUEST_JITTER_SECONDS = 0.5
SNU_SUBSITES_FILE = Path(__file__).resolve().parents[3] / "data" / "snu_subsites.ts"
DEPARTMENT_ROW_OFFSET = 31


class DepartmentSource(NamedTuple):
    row_number: int
    name: str
    english_name: str
    url: str


def crawl(
    max_records: int | None = None,
    max_departments: int | None = None,
    max_records_per_department: int | None = None,
    max_board_pages_per_department: int = 3,
    request_delay_seconds: float = DEFAULT_REQUEST_DELAY_SECONDS,
    request_jitter_seconds: float = DEFAULT_REQUEST_JITTER_SECONDS,
) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    sources = _department_sources_from_snu_subsites()
    speed_limiter = SpeedLimiter(request_delay_seconds, request_jitter_seconds)
    request_index = 0

    for department_index, source in enumerate(sources):
        if max_departments is not None and department_index >= max_departments:
            break

        dept_record_count = 0

        speed_limiter.wait_before_request(request_index)
        request_index += 1

        try:
            html, final_url = _fetch_html(source.url)
        except Exception:
            continue

        board_links = _board_links(html, final_url)[:max_board_pages_per_department]
        if not board_links:
            continue

        for board_link in board_links:
            if max_records_per_department is not None and dept_record_count >= max_records_per_department:
                break

            speed_limiter.wait_before_request(request_index)
            request_index += 1

            try:
                board_html, board_final_url = _fetch_html(board_link["url"])
            except Exception:
                continue

            for article in _parse_board_articles(board_html, board_final_url):
                records.append(_build_article_record(source, board_link, article))
                dept_record_count += 1

                if max_records is not None and len(records) >= max_records:
                    return records[:max_records]

                if max_records_per_department is not None and dept_record_count >= max_records_per_department:
                    break

    return records


class SpeedLimiter:
    def __init__(self, delay_seconds: float, jitter_seconds: float) -> None:
        self.delay_seconds = max(0.0, delay_seconds)
        self.jitter_seconds = max(0.0, jitter_seconds)

    def wait_before_request(self, request_index: int) -> None:
        if request_index <= 0:
            return
        delay = self.delay_seconds + random.uniform(0.0, self.jitter_seconds)
        if delay:
            time.sleep(delay)


def _build_article_record(source: DepartmentSource, board_link: dict[str, str], article: dict[str, str]) -> dict[str, Any]:
    return _build_result(
        source_id=f"{SOURCE_ID}_{source.row_number}",
        source_name=source.name,
        source_url=source.url,
        title=article["title"],
        body_excerpt=article["summary"],
        raw_content=article["raw_content"],
        article_url=article["article_url"],
        provider=source.name,
        published_at=article.get("published_at"),
        board_category=board_link["label"],
        project_categories=["department_notice", "learning_support", "event_culture"],
        value_signal="department_notice",
        outbound_links=[{"label": article["title"], "url": article["article_url"]}],
        uid_seed=article["article_url"],
        raw_extra={
            "english_name": source.english_name,
            "row_number": source.row_number,
            "board_url": board_link["url"],
            "board_label": board_link["label"],
        },
    )


def _department_sources_from_snu_subsites() -> list[DepartmentSource]:
    text = SNU_SUBSITES_FILE.read_text(encoding="utf-8")
    block = _department_group_block(text)
    sources: list[DepartmentSource] = []
    for index, match in enumerate(
        re.finditer(r'\{\s*label:\s*"([^"]+)",\s*url:\s*"([^"]+)"\s*\}', block),
        start=DEPARTMENT_ROW_OFFSET,
    ):
        name, url = match.groups()
        sources.append(
            DepartmentSource(
                row_number=index,
                name=name,
                english_name="",
                url=url,
            )
        )
    return sources


def _department_group_block(text: str) -> str:
    group_marker = 'section: "footer", title: "대학 및 학과"'
    next_group_marker = 'section: "footer", title: "유관 기관"'
    start = text.find(group_marker)
    if start == -1:
        raise RuntimeError(f"Could not find department group in {SNU_SUBSITES_FILE}")
    end = text.find(next_group_marker, start)
    if end == -1:
        raise RuntimeError(f"Could not find end of department group in {SNU_SUBSITES_FILE}")
    return text[start:end]


def _fetch_html(url: str) -> tuple[str, str]:
    request = Request(url, headers={"User-Agent": USER_AGENT}, method="GET")
    with urlopen(request, timeout=20) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        final_url = response.geturl()
        return response.read().decode(charset, errors="replace"), final_url


def _board_links(html: str, base_url: str) -> list[dict[str, str]]:
    links: list[dict[str, str]] = []
    for href, label_html in re.findall(
        r'<a\b[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>',
        html,
        flags=re.DOTALL | re.IGNORECASE,
    ):
        label = clean_html(label_html)
        if not label or not _looks_like_notice_board(label, href):
            continue
        links.append({"label": label[:80], "url": absolute_url(base_url, href)})
    return sorted(_dedupe_links(links), key=lambda link: _board_link_score(link["label"], link["url"]))


def _looks_like_notice_board(label: str, href: str) -> bool:
    compact_label = normalize_whitespace(label)
    if not compact_label or len(compact_label) > 32:
        return False
    if _looks_like_navigation_label(compact_label):
        return False
    if re.search(r"\d{4}|\d{1,2}[./-]\d{1,2}|[~:]", compact_label):
        return False
    return _label_looks_like_notice_board(compact_label) or (
        _href_looks_like_notice_board(href) and _label_looks_like_board_menu(compact_label)
    )


def _board_link_score(label: str, href: str) -> tuple[int, int, str]:
    compact_label = normalize_whitespace(label).lower()
    href_text = href.lower()
    if compact_label in {"공지사항", "notice", "notices"}:
        rank = 0
    elif compact_label == "공지" or any(marker in compact_label for marker in ("학사공지", "일반공지", "소식", "알림", "notice")):
        rank = 1
    elif any(marker in compact_label for marker in ("뉴스", "news")):
        rank = 2
    elif any(marker in href_text for marker in ("notice", "board", "bbs")):
        rank = 3
    else:
        rank = 4
    return (rank, len(compact_label), href)


def _label_looks_like_notice_board(label: str) -> bool:
    text = label.lower()
    return (
        text == "공지"
        or "공지사항" in text
        or text.endswith("공지")
        or any(marker in text for marker in ("소식", "뉴스", "알림", "notice", "news"))
    )


def _href_looks_like_notice_board(href: str) -> bool:
    text = href.lower()
    return any(marker in text for marker in ("notice", "board", "bbs", "community"))


def _label_looks_like_board_menu(label: str) -> bool:
    text = label.lower()
    return any(marker in text for marker in ("게시판", "커뮤니티", "마당", "board", "bbs", "community"))


def _parse_board_articles(html: str, board_url: str) -> list[dict[str, str]]:
    content = _board_article_region(html)
    if not content:
        return []
    chunks = _article_candidate_chunks(content)
    articles: list[dict[str, str]] = []

    for chunk in chunks:
        href_match = _article_link_match(chunk)
        if not href_match:
            continue
        href, title_html = href_match.groups()
        title = _article_title(title_html)
        if not title or _looks_like_navigation_label(title):
            continue
        article_url = absolute_url(board_url, href)
        if article_url == board_url:
            continue
        articles.append(
            {
                "title": title,
                "article_url": article_url,
                "published_at": _find_date(chunk),
                "summary": clean_html(chunk),
                "raw_content": chunk,
            }
        )

    return _dedupe_articles(articles)


def _board_article_region(html: str) -> str:
    for class_name in ("board_body", "kboard-list", "default-list"):
        region = _extract_balanced_tag_by_class(html, "ul", class_name) or _extract_balanced_tag_by_class(html, "div", class_name)
        if region:
            return region

    tbody_match = re.search(r"<tbody\b[^>]*>(.*?)</tbody>", html, flags=re.DOTALL | re.IGNORECASE)
    if tbody_match:
        return tbody_match.group(1)

    return ""


def _article_candidate_chunks(html: str) -> list[str]:
    chunks: list[str] = []
    for pattern in (
        r"<tr\b[^>]*>(.*?)</tr>",
        r"<li\b[^>]*>(.*?)</li>",
        r'<div\b[^>]*class=["\'][^"\']*(?:post|article|notice|board|list|item)[^"\']*["\'][^>]*>(.*?)</div>',
    ):
        chunks.extend(re.findall(pattern, html, flags=re.DOTALL | re.IGNORECASE))
    return chunks


def _article_link_match(chunk: str) -> re.Match[str] | None:
    subject_match = re.search(
        r'<div\b[^>]*class=["\'][^"\']*\bsubject\b[^"\']*["\'][^>]*>.*?'
        r'<a\b[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>',
        chunk,
        flags=re.DOTALL | re.IGNORECASE,
    )
    if subject_match:
        return subject_match
    return re.search(r'<a\b[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', chunk, flags=re.DOTALL | re.IGNORECASE)


def _article_title(title_html: str) -> str:
    cut_match = re.search(
        r'<div\b[^>]*class=["\'][^"\']*\bcut-strings\b[^"\']*["\'][^>]*>(.*?)</div>',
        title_html,
        flags=re.DOTALL | re.IGNORECASE,
    )
    title = clean_html(cut_match.group(1) if cut_match else title_html)
    title = re.sub(r"\b(?:new|첨부파일|download)\b", " ", title, flags=re.IGNORECASE)
    return normalize_whitespace(title)


def _looks_like_navigation_label(title: str) -> bool:
    if len(title) < 2:
        return True
    blocked = {
        "home",
        "홈",
        "login",
        "로그인",
        "검색",
        "더보기",
        "처음",
        "이전",
        "다음",
        "목록",
        "전체",
    }
    return title.strip().lower() in blocked


def _extract_balanced_tag_by_class(html: str, tag_name: str, class_name: str) -> str:
    match = re.search(
        rf'<{tag_name}\b[^>]*class=["\'][^"\']*\b{re.escape(class_name)}\b[^"\']*["\'][^>]*>',
        html,
        flags=re.IGNORECASE,
    )
    if not match:
        return ""

    start = match.start()
    cursor = match.end()
    depth = 1
    tag_pattern = re.compile(rf"</?{tag_name}\b[^>]*>", flags=re.IGNORECASE)
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


def _find_date(text: str) -> str | None:
    date_node_match = re.search(
        r'<(?:span|td|div)\b[^>]*class=["\'][^"\']*\bdate\b[^"\']*["\'][^>]*>(.*?)</(?:span|td|div)>',
        text,
        flags=re.DOTALL | re.IGNORECASE,
    )
    if date_node_match:
        node_date = _normalize_date_match(date_node_match.group(1))
        if node_date:
            return node_date

    datetime_match = re.search(r'<time\b[^>]*datetime=["\'](\d{4})-(\d{1,2})-(\d{1,2})', text, flags=re.IGNORECASE)
    if datetime_match:
        return _format_date_match(datetime_match.groups())

    return _normalize_date_match(text)


def _normalize_date_match(text: str) -> str | None:
    match = re.search(r"(\d{4})[./-]\s*(\d{1,2})[./-]\s*(\d{1,2})", text)
    if not match:
        return None
    return _format_date_match(match.groups())


def _format_date_match(groups: tuple[str, str, str]) -> str:
    year, month, day = groups
    return f"{int(year):04d}-{int(month):02d}-{int(day):02d}"


def _page_title(html: str) -> str:
    patterns = (
        r'<meta\b[^>]*property=["\']og:title["\'][^>]*content=["\']([^"\']+)["\']',
        r'<meta\b[^>]*name=["\']title["\'][^>]*content=["\']([^"\']+)["\']',
        r"<title\b[^>]*>(.*?)</title>",
        r"<h1\b[^>]*>(.*?)</h1>",
    )
    for pattern in patterns:
        match = re.search(pattern, html, flags=re.DOTALL | re.IGNORECASE)
        if match:
            title = clean_html(match.group(1))
            if title:
                return title[:180]
    return ""


def _meta_description(html: str) -> str:
    match = re.search(
        r'<meta\b[^>]*name=["\']description["\'][^>]*content=["\']([^"\']+)["\']',
        html,
        flags=re.DOTALL | re.IGNORECASE,
    )
    return clean_html(match.group(1)) if match else ""


def _main_content(html: str) -> str:
    patterns = (
        r"<main\b[^>]*>(.*?)</main>",
        r'<div\b[^>]*id=["\'](?:content|contents|container|main)["\'][^>]*>(.*?)</div>',
        r'<div\b[^>]*class=["\'][^"\']*(?:content|contents|container|main)[^"\']*["\'][^>]*>(.*?)</div>',
        r"<body\b[^>]*>(.*?)</body>",
    )
    for pattern in patterns:
        match = re.search(pattern, html, flags=re.DOTALL | re.IGNORECASE)
        if match:
            return match.group(1)
    return html


def _build_result(
    *,
    source_id: str,
    source_name: str,
    source_url: str,
    title: str,
    body_excerpt: str,
    raw_content: str,
    article_url: str,
    provider: str,
    published_at: str | None,
    board_category: str,
    project_categories: list[str],
    value_signal: str,
    outbound_links: list[dict[str, str]],
    uid_seed: str,
    raw_extra: dict[str, Any],
) -> dict[str, Any]:
    crawled_at = datetime.now(timezone.utc).isoformat()
    uid = _stable_uid(source_id, uid_seed)
    return {
        "uid": uid,
        "source_id": source_id,
        "crawl_run_id": f"{SOURCE_ID}_{crawled_at}",
        "source_url": article_url,
        "title": title,
        "board_category": board_category,
        "author": provider,
        "published_at": published_at,
        "views": None,
        "project_categories": project_categories,
        "value_signal": value_signal,
        "is_benefit_candidate": True,
        "deadline_hints": _extract_deadline_hints(f"{title}\n{body_excerpt}"),
        "outbound_links": outbound_links,
        "body_excerpt": body_excerpt[:2000],
        "draft_id": f"{source_id}_{uid}",
        "draft_status": "needs_review",
        "name": title,
        "category": "departments",
        "provider": provider,
        "value_status": "needs_ai_or_human_review",
        "value_basis_hint": "department notice-board article extracted from a board discovered on the department site; concrete value requires later review",
        "review_priority": "low",
        "raw_content": raw_content,
        "raw": {"source_name": source_name, "source_base_url": source_url, **raw_extra},
        "crawled_at": crawled_at,
    }


def clean_html(value: str | None) -> str:
    if not value:
        return ""
    value = re.sub(r"<(script|style|noscript|svg)[^>]*>.*?</\1>", " ", value, flags=re.DOTALL | re.IGNORECASE)
    value = re.sub(r"<[^>]+>", " ", value)
    return normalize_whitespace(unescape(value))


def normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def absolute_url(base_url: str, href: str | None) -> str:
    if not href or href.startswith(("javascript:", "mailto:", "tel:")):
        return base_url
    return urljoin(base_url, unescape(href))


def _stable_uid(source_id: str, seed: str) -> str:
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()[:12]
    return f"{source_id}_{digest}"


def _extract_deadline_hints(text: str) -> list[str]:
    patterns = (
        r"~\s*\d{1,4}[./년-]\s*\d{1,2}[./월-]\s*\d{0,2}\s*(?:까지)?",
        r"\d{1,4}[./년-]\s*\d{1,2}[./월-]\s*\d{0,2}\s*(?:까지|마감)",
        r"D-\d+",
    )
    hints: list[str] = []
    for pattern in patterns:
        hints.extend(normalize_whitespace(match) for match in re.findall(pattern, text))
    return list(dict.fromkeys(hint for hint in hints if hint))


def _dedupe_links(links: list[dict[str, str]]) -> list[dict[str, str]]:
    seen: set[str] = set()
    unique: list[dict[str, str]] = []
    for link in links:
        key = link["url"]
        if key in seen:
            continue
        seen.add(key)
        unique.append(link)
    return unique


def _dedupe_articles(articles: list[dict[str, str]]) -> list[dict[str, str]]:
    seen: set[str] = set()
    unique: list[dict[str, str]] = []
    for article in articles:
        key = article["article_url"]
        if key in seen:
            continue
        seen.add(key)
        unique.append(article)
    return unique


def preview(results: list[dict[str, Any]]) -> None:
    for index, result in enumerate(results, start=1):
        content = result.get("body_excerpt") or result.get("raw_content") or ""
        date = result.get("published_at") or ""
        print(f"{index}. {result['title']}: {content[:50]} | {date}")


if __name__ == "__main__":
    preview(crawl(max_departments=1, request_delay_seconds=0.0, request_jitter_seconds=0.0))
