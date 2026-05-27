from __future__ import annotations

from datetime import datetime, timezone
from html import unescape
from typing import Any
from urllib.parse import urljoin
import hashlib
import re


BENEFIT_KEYWORDS = (
    "모집",
    "신청",
    "참여",
    "참가",
    "프로그램",
    "특강",
    "강연",
    "세미나",
    "워크숍",
    "멘토링",
    "튜터링",
    "봉사",
    "인턴",
    "장학",
    "지원",
    "교육",
    "캠프",
    "공모",
    "행사",
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
    project_categories = project_categories or ["career_experience", "event_culture", "learning_support"]

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
        "project_categories": project_categories,
        "value_signal": value_signal,
        "is_benefit_candidate": is_benefit_candidate(f"{title}\n{body_excerpt}"),
        "deadline_hints": deadline_hints,
        "outbound_links": [{"label": title, "url": article_url}] if article_url else [],
        "body_excerpt": body_excerpt[:2000],
        "draft_id": f"{source_id}_{uid}",
        "draft_status": "needs_review",
        "name": title,
        "category": "extracurricular",
        "provider": provider,
        "value_status": "needs_ai_or_human_review",
        "value_basis_hint": "crawler extracted a program/notice candidate; value requires later review",
        "review_priority": review_priority(f"{title}\n{body_excerpt}"),
        "raw_content": raw_content,
        "raw": {"source_name": source_name, "source_base_url": source_url},
        "crawled_at": crawled_at,
    }


def clean_html(value: str | None) -> str:
    if not value:
        return ""
    value = re.sub(r"<(script|style|noscript)[^>]*>.*?</\1>", " ", value, flags=re.DOTALL | re.IGNORECASE)
    value = re.sub(r"<[^>]+>", " ", value)
    return normalize_whitespace(unescape(value))


def normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def absolute_url(base_url: str, href: str | None) -> str:
    if not href:
        return base_url
    if href.startswith("javascript:"):
        return base_url
    return urljoin(base_url, href)


def stable_uid(source_id: str, seed: str) -> str:
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()[:12]
    return f"{source_id}_{digest}"


def extract_deadline_hints(text: str) -> list[str]:
    patterns = (
        r"~\s*\d{1,4}[./년-]\s*\d{1,2}[./월-]\s*\d{0,2}\s*(?:까지)?",
        r"\d{1,4}[./년-]\s*\d{1,2}[./월-]\s*\d{0,2}\s*까지",
        r"D-\d+",
    )
    hints: list[str] = []
    for pattern in patterns:
        hints.extend(normalize_whitespace(match) for match in re.findall(pattern, text))
    return list(dict.fromkeys(hint for hint in hints if hint))


def is_benefit_candidate(text: str) -> bool:
    return any(keyword in text for keyword in BENEFIT_KEYWORDS)


def review_priority(text: str) -> str:
    if any(keyword in text for keyword in ("장학", "인턴", "모집", "지원금", "멘토링", "튜터링")):
        return "high"
    if any(keyword in text for keyword in ("특강", "강연", "세미나", "프로그램", "행사")):
        return "medium"
    return "low"


def preview(results: list[dict[str, Any]]) -> None:
    for index, result in enumerate(results, start=1):
        content = result.get("body_excerpt") or result.get("raw_content") or ""
        date = result.get("published_at") or ""
        print(f"{index}. {result['title']}: {content[:50]} | {date}")
