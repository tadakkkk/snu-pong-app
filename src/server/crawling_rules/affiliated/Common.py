from __future__ import annotations

from datetime import datetime, timezone
from html import unescape
from typing import Any
from urllib.parse import urljoin
import hashlib
import re


BENEFIT_KEYWORDS = (
    "장학",
    "지원",
    "등록금",
    "근로",
    "도우미",
    "분실물",
    "모집",
    "멘토",
    "프로그램",
    "행사",
    "특강",
    "교육",
    "인턴",
    "채용",
    "혜택",
)


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
    views: int | None = None,
    board_category: str | None = None,
    project_categories: list[str] | None = None,
    value_signal: str = "service_or_experience",
    uid_seed: str | None = None,
) -> dict[str, Any]:
    crawled_at = datetime.now(timezone.utc).isoformat()
    uid = stable_uid(source_id, uid_seed or article_url or title)
    deadline_hints = extract_deadline_hints(f"{title}\n{body_excerpt}")

    return {
        "uid": uid,
        "source_id": source_id,
        "crawl_run_id": f"{source_id}_{crawled_at}",
        "source_url": article_url,
        "title": title,
        "board_category": board_category,
        "author": provider,
        "published_at": published_at,
        "views": views,
        "project_categories": project_categories or ["welfare_safety"],
        "value_signal": value_signal,
        "is_benefit_candidate": is_benefit_candidate(f"{title}\n{body_excerpt}"),
        "deadline_hints": deadline_hints,
        "outbound_links": [{"label": title, "url": article_url}] if article_url else [],
        "body_excerpt": body_excerpt[:2000],
        "draft_id": f"{source_id}_{uid}",
        "draft_status": "needs_review",
        "name": title,
        "category": "affiliated",
        "provider": provider,
        "value_status": "needs_ai_or_human_review",
        "value_basis_hint": "crawler extracted an affiliated-site notice candidate; value requires later review",
        "review_priority": review_priority(f"{title}\n{body_excerpt}"),
        "raw_content": raw_content,
        "raw": {"source_name": source_name, "source_base_url": source_url},
        "crawled_at": crawled_at,
    }


def fetch_html(url: str, user_agent: str) -> str:
    from urllib.request import Request, urlopen

    request = Request(url, headers={"User-Agent": user_agent}, method="GET")
    with urlopen(request, timeout=20) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def parse_kboard_default_list(html: str, base_url: str) -> list[dict[str, Any]]:
    board_body = _extract_between_classes(html, "board_body")
    if not board_body:
        return []

    items: list[dict[str, Any]] = []
    for chunk in re.findall(r"<li\b[^>]*>(.*?)</li>", board_body, flags=re.DOTALL | re.IGNORECASE):
        title_match = re.search(
            r'<div\b[^>]*class=["\'][^"\']*\bcut-strings\b[^"\']*["\'][^>]*>(.*?)</div>',
            chunk,
            flags=re.DOTALL | re.IGNORECASE,
        )
        href_match = re.search(r'<a\b[^>]*href=["\']([^"\']+)["\']', chunk, flags=re.IGNORECASE)
        if not title_match or not href_match:
            continue

        title = clean_notice_title(title_match.group(1))
        if not title:
            continue

        items.append(
            {
                "title": title,
                "article_url": absolute_url(base_url, href_match.group(1)),
                "board_category": _span_text(chunk, "category"),
                "author": _span_text(chunk, "user"),
                "views": parse_int(_span_text(chunk, "view")),
                "published_at": _span_text(chunk, "date") or None,
                "summary": clean_html(chunk),
                "raw_content": chunk,
            }
        )
    return items


def parse_snudanbi_board_list(html: str, source_url: str) -> list[dict[str, Any]]:
    body = _extract_between_classes(html, "body")
    if not body:
        return []

    items: list[dict[str, Any]] = []
    for chunk in re.findall(r"<li\b[^>]*>(.*?)</li>", body, flags=re.DOTALL | re.IGNORECASE):
        title_match = re.search(r"<strong\b[^>]*>(.*?)</strong>", chunk, flags=re.DOTALL | re.IGNORECASE)
        bid_match = re.search(r"go_board_view\(['\"](\d+)['\"]\)", chunk, flags=re.IGNORECASE)
        if not title_match or not bid_match:
            continue

        title = clean_notice_title(title_match.group(1))
        if not title:
            continue

        bid = bid_match.group(1)
        items.append(
            {
                "title": title,
                "article_url": f"{source_url}#bid-{bid}",
                "board_category": "지원인력 공지",
                "author": _span_text(chunk, "writer") or "장애학생지원센터",
                "views": parse_int(_span_text(chunk, "hit")),
                "published_at": _span_text(chunk, "date") or None,
                "summary": clean_html(chunk),
                "raw_content": chunk,
            }
        )
    return items


def clean_html(value: str | None) -> str:
    if not value:
        return ""
    value = re.sub(r"<(script|style|noscript)[^>]*>.*?</\1>", " ", value, flags=re.DOTALL | re.IGNORECASE)
    value = re.sub(r"<[^>]+>", " ", value)
    return normalize_whitespace(unescape(value))


def clean_notice_title(value: str) -> str:
    title = clean_html(value)
    title = re.sub(r"\bDownload\b", " ", title)
    title = title.replace("새글", " ")
    return normalize_whitespace(title)


def normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def absolute_url(base_url: str, href: str | None) -> str:
    if not href or href.startswith("javascript:"):
        return base_url
    return urljoin(base_url, unescape(href))


def parse_int(value: str | None) -> int | None:
    if not value:
        return None
    digits = re.sub(r"[^0-9]", "", value)
    return int(digits) if digits else None


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


def is_benefit_candidate(text: str) -> bool:
    return any(keyword in text for keyword in BENEFIT_KEYWORDS)


def review_priority(text: str) -> str:
    if any(keyword in text for keyword in ("장학", "등록금", "근로", "시급", "도우미", "지원금")):
        return "high"
    if any(keyword in text for keyword in ("모집", "멘토", "프로그램", "혜택", "인턴")):
        return "medium"
    return "low"


def preview(results: list[dict[str, Any]]) -> None:
    for index, result in enumerate(results, start=1):
        content = result.get("body_excerpt") or result.get("raw_content") or ""
        date = result.get("published_at") or ""
        print(f"{index}. {result['title']}: {content[:50]} | {date}")


def _span_text(html: str, class_name: str) -> str:
    match = re.search(
        rf'<span\b[^>]*class=["\'][^"\']*\b{re.escape(class_name)}\b[^"\']*["\'][^>]*>(.*?)</span>',
        html,
        flags=re.DOTALL | re.IGNORECASE,
    )
    return clean_html(match.group(1)) if match else ""


def _extract_between_classes(html: str, class_name: str) -> str:
    match = re.search(
        rf'<ul\b[^>]*class=["\'][^"\']*\b{re.escape(class_name)}\b[^"\']*["\'][^>]*>',
        html,
        flags=re.IGNORECASE,
    )
    if not match:
        return ""

    start = match.start()
    cursor = match.end()
    depth = 1
    tag_pattern = re.compile(r"</?ul\b[^>]*>", flags=re.IGNORECASE)
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
