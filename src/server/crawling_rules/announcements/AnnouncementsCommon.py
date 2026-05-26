from __future__ import annotations

from datetime import datetime, timezone
from html import unescape
from typing import Any
from urllib.parse import urljoin
import hashlib
import re


SNU_BASE_URL = "https://www.snu.ac.kr"
USER_AGENT = "snu-pong-crawler-prototype/0.1"

BENEFIT_KEYWORDS = (
    "모집",
    "신청",
    "참가",
    "참여",
    "인턴",
    "장학",
    "지원",
    "공모",
    "캠프",
    "프로그램",
    "특강",
    "강연",
    "세미나",
    "워크숍",
    "콘서트",
    "전시",
    "무료",
    "튜터",
    "멘토",
)

LOW_VALUE_NOTICE_KEYWORDS = (
    "개인정보 처리방침",
    "공개검증",
    "후보 추천",
    "정부포상",
    "발전공로상",
    "사회봉사상",
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
        "views": None,
        "project_categories": project_categories or ["event_culture"],
        "value_signal": value_signal,
        "is_benefit_candidate": is_benefit_candidate(f"{title}\n{body_excerpt}"),
        "deadline_hints": deadline_hints,
        "outbound_links": [{"label": title, "url": article_url}] if article_url else [],
        "body_excerpt": body_excerpt[:2000],
        "draft_id": f"{source_id}_{uid}",
        "draft_status": "needs_review",
        "name": title,
        "category": "announcements",
        "provider": provider,
        "value_status": "needs_ai_or_human_review",
        "value_basis_hint": "crawler extracted a public SNU announcement candidate; value requires later review",
        "review_priority": review_priority(f"{title}\n{body_excerpt}"),
        "raw_content": raw_content,
        "raw": {"source_name": source_name, "source_base_url": source_url},
        "crawled_at": crawled_at,
    }


def fetch_html(url: str) -> str:
    from urllib.request import Request, urlopen

    request = Request(url, headers={"User-Agent": USER_AGENT}, method="GET")
    with urlopen(request, timeout=20) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def parse_event_cards(html: str, source_url: str) -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    for chunk in re.findall(
        r'<a\b[^>]*href=["\']([^"\']*?/snunow/events\?md=v&bbsidx=\d+[^"\']*)["\'][^>]*class=["\'][^"\']*\bitem\b[^"\']*["\'][^>]*>(.*?)</a>',
        html,
        flags=re.DOTALL | re.IGNORECASE,
    ):
        href, body = chunk
        title = _class_text(body, "title")
        if not title:
            continue
        date_text = _class_text(body, "point") or _class_text(body, "date")
        summary = _class_text(body, "summary")
        if not summary:
            summary = clean_html(_class_html(body, "sub") or body)
        items.append(
            {
                "title": title,
                "article_url": absolute_url(source_url, href),
                "published_at": normalize_snu_date(date_text),
                "date_text": date_text,
                "summary": normalize_whitespace(f"{date_text} {summary}"),
                "raw_content": body,
            }
        )
    return _dedupe(items)


def parse_notice_table(html: str, source_url: str) -> list[dict[str, str]]:
    tbody_match = re.search(r"<tbody\b[^>]*>(.*?)</tbody>", html, flags=re.DOTALL | re.IGNORECASE)
    if not tbody_match:
        return []

    items: list[dict[str, str]] = []
    for row in re.findall(r"<tr\b[^>]*>(.*?)</tr>", tbody_match.group(1), flags=re.DOTALL | re.IGNORECASE):
        href_match = re.search(r'<a\b[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', row, flags=re.DOTALL | re.IGNORECASE)
        if not href_match:
            continue
        href, title_html = href_match.groups()
        title = clean_html(title_html)
        title = re.sub(r"\b첨부파일 있음\b", " ", title)
        title = normalize_whitespace(title)
        if not title:
            continue
        date_text = _class_text(row, "col-date")
        items.append(
            {
                "title": title,
                "article_url": absolute_url(source_url, href),
                "published_at": normalize_snu_date(date_text),
                "date_text": date_text,
                "summary": clean_html(row),
                "raw_content": row,
            }
        )
    return _dedupe(items)


def parse_static_public_lecture_groups(html: str, source_url: str) -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    for chunk in _split_by_marker(html, '<div class="volunteer-group">'):
        title = _class_text(chunk, "common-smalltitle")
        href_match = re.search(
            r'<a\b(?=[^>]*class=["\'][^"\']*\blink\b[^"\']*["\'])[^>]*href=["\']([^"\']+)["\']',
            chunk,
            flags=re.IGNORECASE,
        )
        desc = _class_text(chunk, "desc")
        if not title:
            continue
        article_url = absolute_url(source_url, href_match.group(1)) if href_match else source_url
        items.append(
            {
                "title": title,
                "article_url": article_url,
                "published_at": None,
                "date_text": "",
                "summary": desc,
                "raw_content": chunk,
            }
        )
    return _dedupe(items)


def clean_html(value: str | None) -> str:
    if not value:
        return ""
    value = re.sub(r"<(script|style|noscript)[^>]*>.*?</\1>", " ", value, flags=re.DOTALL | re.IGNORECASE)
    value = re.sub(r"<[^>]+>", " ", value)
    return normalize_whitespace(unescape(value))


def normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def absolute_url(base_url: str, href: str | None) -> str:
    if not href or href.startswith("javascript:"):
        return base_url
    return urljoin(base_url, unescape(href))


def stable_uid(source_id: str, seed: str) -> str:
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()[:12]
    return f"{source_id}_{digest}"


def normalize_snu_date(value: str | None) -> str | None:
    if not value:
        return None
    match = re.search(r"(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})", value)
    if match:
        year, month, day = match.groups()
        return f"{int(year):04d}-{int(month):02d}-{int(day):02d}"
    match = re.search(r"(\d{1,2})\.\s*(\d{1,2})\.", value)
    if match:
        month, day = match.groups()
        return f"{datetime.now().year:04d}-{int(month):02d}-{int(day):02d}"
    return None


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


def is_useful_general_notice(title: str) -> bool:
    if any(keyword in title for keyword in LOW_VALUE_NOTICE_KEYWORDS):
        return False
    return any(keyword in title for keyword in BENEFIT_KEYWORDS)


def value_signal_for_title(title: str) -> str:
    if any(keyword in title for keyword in ("장학", "지원금", "등록금", "인턴", "튜터", "멘토")):
        return "direct_money"
    return "service_or_experience"


def review_priority(text: str) -> str:
    if any(keyword in text for keyword in ("장학", "인턴", "튜터", "멘토", "모집", "지원금")):
        return "high"
    if any(keyword in text for keyword in ("특강", "강연", "세미나", "전시", "콘서트", "프로그램")):
        return "medium"
    return "low"


def preview(results: list[dict[str, Any]]) -> None:
    for index, result in enumerate(results, start=1):
        content = result.get("body_excerpt") or result.get("raw_content") or ""
        date = result.get("published_at") or ""
        print(f"{index}. {result['title']}: {content[:50]} | {date}")


def _class_text(html: str, class_name: str) -> str:
    return clean_html(_class_html(html, class_name))


def _class_html(html: str, class_name: str) -> str:
    match = re.search(
        rf'<[^>]*class=["\'][^"\']*\b{re.escape(class_name)}\b[^"\']*["\'][^>]*>(.*?)</[^>]+>',
        html,
        flags=re.DOTALL | re.IGNORECASE,
    )
    return match.group(1) if match else ""


def _dedupe(items: list[dict[str, str]]) -> list[dict[str, str]]:
    seen: set[str] = set()
    unique: list[dict[str, str]] = []
    for item in items:
        key = item["article_url"] or item["title"]
        if key in seen:
            continue
        seen.add(key)
        unique.append(item)
    return unique


def _split_by_marker(html: str, marker: str) -> list[str]:
    if marker not in html:
        return []
    parts = html.split(marker)
    chunks: list[str] = []
    for part in parts[1:]:
        chunks.append(f"{marker}{part}")
    return chunks
