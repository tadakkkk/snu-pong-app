from __future__ import annotations

from datetime import datetime, timezone
from html import unescape
from typing import Any
from urllib.parse import urljoin
import hashlib
import re


USER_AGENT = "snu-pong-crawler-prototype/0.1"


def fetch_html(url: str) -> str:
    from urllib.request import Request, urlopen

    request = Request(url, headers={"User-Agent": USER_AGENT}, method="GET")
    with urlopen(request, timeout=20) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def build_result(
    *,
    source_id: str,
    source_name: str,
    source_url: str,
    title: str,
    body_excerpt: str,
    raw_content: str,
    article_url: str,
    provider: str,
    published_at: str | None = None,
    board_category: str | None = None,
    project_categories: list[str] | None = None,
    value_signal: str = "service_or_experience",
    uid_seed: str | None = None,
) -> dict[str, Any]:
    crawled_at = datetime.now(timezone.utc).isoformat()
    uid = stable_uid(source_id, uid_seed or article_url or title)
    return {
        "uid": uid,
        "source_id": source_id,
        "crawl_run_id": f"{source_id}_{crawled_at}",
        "source_url": article_url,
        "title": title,
        "board_category": board_category,
        "author": provider,
        "published_at": published_at,
        "views": None,
        "project_categories": project_categories or ["event_culture", "learning_support"],
        "value_signal": value_signal,
        "is_benefit_candidate": True,
        "deadline_hints": extract_deadline_hints(f"{title}\n{body_excerpt}"),
        "outbound_links": [{"label": title, "url": article_url}] if article_url else [],
        "body_excerpt": body_excerpt[:2000],
        "draft_id": f"{source_id}_{uid}",
        "draft_status": "needs_review",
        "name": title,
        "category": "related",
        "provider": provider,
        "value_status": "needs_ai_or_human_review",
        "value_basis_hint": "related SNU site notice/event item; concrete value requires later review",
        "review_priority": review_priority(f"{title}\n{body_excerpt}"),
        "raw_content": raw_content,
        "raw": {"source_name": source_name, "source_base_url": source_url},
        "crawled_at": crawled_at,
    }


def parse_oia_news_items(html: str, base_url: str) -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    for chunk in re.findall(r'<div\b[^>]*class=["\'][^"\']*\bnews-list\b[^"\']*\bitem\b[^"\']*["\'][^>]*>(.*?)</div>\s*</div>', html, flags=re.DOTALL | re.IGNORECASE):
        date_text = _class_text(chunk, "views-field-created")
        href_match = re.search(r'<a\b[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', chunk, flags=re.DOTALL | re.IGNORECASE)
        if not href_match:
            continue
        href, title_html = href_match.groups()
        title = clean_html(title_html)
        if not title:
            continue
        items.append(
            {
                "title": title,
                "article_url": absolute_url(base_url, href),
                "published_at": normalize_date(date_text),
                "summary": clean_html(chunk),
                "raw_content": chunk,
            }
        )
    return dedupe_items(items)


def parse_jet_posts(html: str, base_url: str) -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    for chunk in re.findall(r'<div\b[^>]*class=["\'][^"\']*\bjet-posts__item\b[^"\']*["\'][^>]*>(.*?)</div>\s*</div>\s*</div>', html, flags=re.DOTALL | re.IGNORECASE):
        title_match = re.search(r'<h4\b[^>]*class=["\'][^"\']*\bentry-title\b[^"\']*["\'][^>]*>\s*<a\b[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', chunk, flags=re.DOTALL | re.IGNORECASE)
        if not title_match:
            continue
        href, title_html = title_match.groups()
        title = clean_html(title_html)
        if not title:
            continue
        time_match = re.search(r"<time\b[^>]*datetime=[\"']([^\"']+)[\"'][^>]*>(.*?)</time>", chunk, flags=re.DOTALL | re.IGNORECASE)
        date_text = time_match.group(1) if time_match else ""
        summary = _class_text(chunk, "entry-excerpt") or clean_html(chunk)
        items.append(
            {
                "title": title,
                "article_url": absolute_url(base_url, href),
                "published_at": normalize_date(date_text),
                "summary": summary,
                "raw_content": chunk,
            }
        )
    return dedupe_items(items)


def parse_library_latest_notices(html: str, base_url: str) -> list[dict[str, str]]:
    container = _id_region(html, "redo-category2-notice")
    if not container:
        return []
    items: list[dict[str, str]] = []
    for chunk in re.findall(r"<li\b[^>]*>(.*?)</li>", container, flags=re.DOTALL | re.IGNORECASE):
        href_match = re.search(r'<a\b[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', chunk, flags=re.DOTALL | re.IGNORECASE)
        if not href_match:
            continue
        href, title_html = href_match.groups()
        title = clean_html(title_html)
        if not title:
            continue
        date_text = _tag_text(chunk, "span")
        items.append(
            {
                "title": title,
                "article_url": absolute_url(base_url, href),
                "published_at": normalize_date(date_text),
                "summary": clean_html(chunk),
                "raw_content": chunk,
            }
        )
    return dedupe_items(items)


def parse_ifs_board_items(html: str, base_url: str) -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    for chunk in re.findall(r"<li\b[^>]*>\s*(<a\b[^>]*href=[\"'][^\"']+[\"'][^>]*>.*?</a>)\s*</li>", html, flags=re.DOTALL | re.IGNORECASE):
        href_match = re.search(r'<a\b[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', chunk, flags=re.DOTALL | re.IGNORECASE)
        if not href_match:
            continue
        href, body = href_match.groups()
        if "news/notice" not in href or "md=v" not in href:
            continue
        title = _class_text(body, "title")
        if not title:
            continue
        date_text = _class_text(body, "date")
        summary = _class_text(body, "desc") or clean_html(body)
        items.append(
            {
                "title": title,
                "article_url": absolute_url(base_url, href),
                "published_at": normalize_date(date_text),
                "summary": summary,
                "raw_content": chunk,
            }
        )
    return dedupe_items(items)


def clean_html(value: str | None) -> str:
    if not value:
        return ""
    value = re.sub(r"<(script|style|noscript|svg)[^>]*>.*?</\1>", " ", value, flags=re.DOTALL | re.IGNORECASE)
    value = re.sub(r"<[^>]+>", " ", value)
    return normalize_whitespace(unescape(value))


def normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def absolute_url(base_url: str, href: str | None) -> str:
    if not href or href.startswith(("javascript:", "mailto:", "tel:", "#")):
        return base_url
    return urljoin(base_url, unescape(href))


def normalize_date(value: str | None) -> str | None:
    if not value:
        return None
    match = re.search(r"(\d{4})[./-]\s*(\d{1,2})[./-]\s*(\d{1,2})", value)
    if match:
        year, month, day = match.groups()
        return f"{int(year):04d}-{int(month):02d}-{int(day):02d}"
    match = re.search(r"(\d{1,2})[./-]\s*(\d{1,2})", value)
    if match:
        month, day = match.groups()
        return f"{datetime.now().year:04d}-{int(month):02d}-{int(day):02d}"
    return None


def stable_uid(source_id: str, seed: str) -> str:
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()[:12]
    return f"{source_id}_{digest}"


def extract_deadline_hints(text: str) -> list[str]:
    patterns = (
        r"~\s*\d{1,4}[./년-]\s*\d{1,2}[./월-]\s*\d{0,2}\s*(?:까지)?",
        r"\d{1,4}[./년-]\s*\d{1,2}[./월-]\s*\d{0,2}\s*(?:까지|마감)",
        r"D-\d+",
    )
    hints: list[str] = []
    for pattern in patterns:
        hints.extend(normalize_whitespace(match) for match in re.findall(pattern, text))
    return list(dict.fromkeys(hint for hint in hints if hint))


def review_priority(text: str) -> str:
    if any(keyword in text for keyword in ("장학", "지원금", "할인", "무료", "출판료", "APC")):
        return "high"
    if any(keyword in text for keyword in ("모집", "신청", "프로그램", "행사", "세미나", "교육", "인턴")):
        return "medium"
    return "low"


def dedupe_items(items: list[dict[str, str]]) -> list[dict[str, str]]:
    seen: set[str] = set()
    unique: list[dict[str, str]] = []
    for item in items:
        key = item["article_url"]
        if key in seen:
            continue
        seen.add(key)
        unique.append(item)
    return unique


def preview(results: list[dict[str, Any]]) -> None:
    for index, result in enumerate(results, start=1):
        content = result.get("body_excerpt") or result.get("raw_content") or ""
        date = result.get("published_at") or ""
        print(f"{index}. {result['title']}: {content[:50]} | {date}")


def _class_text(html: str, class_name: str) -> str:
    pattern = rf'<[^>]*class=["\'][^"\']*\b{re.escape(class_name)}\b[^"\']*["\'][^>]*>(.*?)</[^>]+>'
    match = re.search(pattern, html, flags=re.DOTALL | re.IGNORECASE)
    return clean_html(match.group(1)) if match else ""


def _tag_text(html: str, tag_name: str) -> str:
    match = re.search(rf"<{tag_name}\b[^>]*>(.*?)</{tag_name}>", html, flags=re.DOTALL | re.IGNORECASE)
    return clean_html(match.group(1)) if match else ""


def _id_region(html: str, element_id: str) -> str:
    match = re.search(
        rf'<div\b[^>]*id=["\']{re.escape(element_id)}["\'][^>]*>(.*?)(?:</div>\s*</div>|</main>|</section>)',
        html,
        flags=re.DOTALL | re.IGNORECASE,
    )
    return match.group(1) if match else ""
