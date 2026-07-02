"""공지 중복 제거(dedup) 공통 로직.

같은 공지가 (A) 여러 학과 크롤러에서 각기 다른 source_id로,
(B) page/bm 같은 껍데기 URL 파라미터 차이로,
(C) 서로 다른 학과 게시판에 재게시되어
서로 다른 id로 여러 번 저장되는 문제를 해결한다.

- normalize_url : 껍데기 쿼리 파라미터 제거 → (B) 대응
- dedup_key     : 정규화 제목 + 마감일 → (A)(C) 대응 (source_id/URL 무관)
- collapse      : dedup_key가 같은 레코드를 대표 1개로 합치고
                  also_posted_by / source_count 를 붙인다.

순수 함수라 DB 없이도 테스트/실행 가능하다.
"""

from __future__ import annotations

import re
from typing import Any, Iterable
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

# 게시판 페이지네이션/뷰 상태 등 "내용과 무관한" 쿼리 파라미터
_VOLATILE_QUERY_KEYS = {
    "page", "pageindex", "pageunit", "curpage", "totalpage",
    "bm", "mode", "offset", "p", "startpage", "pageno",
}

# 제목 앞에 붙는 게시판 태그: [모집], (공지), 【안내】 등
_LEADING_TAG_RE = re.compile(r"^\s*[\[\(【][^\]\)】]{0,20}[\]\)】]\s*")
# 인용부호류 (게시판마다 붙였다 뗐다 함)
_QUOTE_CHARS_RE = re.compile(r"[「」『』“”\"'’‘]")
# 제목 끝의 마감 안내 괄호: (~6/22), (…까지), (마감 6.1) 등
_TRAILING_DEADLINE_PAREN_RE = re.compile(
    r"\s*[\(（][^\)）]*(?:~|까지|마감|\d{1,2}\s*[./월]\s*\d{1,2})[^\)）]*[\)）]\s*$"
)
_WS_RE = re.compile(r"\s+")


def normalize_url(url: str | None) -> str:
    """껍데기 쿼리 파라미터를 제거하고 호스트를 소문자화한 정규 URL."""
    if not url:
        return ""
    try:
        parts = urlsplit(url.strip())
    except ValueError:
        return url.strip().lower()
    query = [
        (k, v)
        for k, v in parse_qsl(parts.query, keep_blank_values=False)
        if k.lower() not in _VOLATILE_QUERY_KEYS
    ]
    query.sort()
    return urlunsplit((
        parts.scheme.lower(),
        parts.netloc.lower(),
        parts.path.rstrip("/"),
        urlencode(query),
        "",  # fragment 제거
    ))


def normalize_title(title: str | None) -> str:
    """게시판 태그/인용부호/말미 마감괄호를 벗겨낸 비교용 제목."""
    if not title:
        return ""
    t = title.strip()
    # 앞쪽 태그가 여러 개 붙는 경우([기타] [주의] ...) 반복 제거
    while True:
        stripped = _LEADING_TAG_RE.sub("", t)
        if stripped == t:
            break
        t = stripped
    t = _QUOTE_CHARS_RE.sub("", t)
    t = _TRAILING_DEADLINE_PAREN_RE.sub("", t)
    t = _WS_RE.sub(" ", t).strip().lower()
    return t


def dedup_key(record: dict[str, Any]) -> str:
    """중복 판정 키. source_id·URL과 무관하게 '같은 공지'면 같은 키."""
    name = record.get("name") or record.get("title") or ""
    title = normalize_title(name)
    deadline = (record.get("deadline_date") or "").strip()
    if title:
        return f"t:{title}|d:{deadline}"
    # 제목이 없으면(예외) URL로라도 합친다
    return f"u:{normalize_url(record.get('source_url'))}"


def _canonical_score(record: dict[str, Any]) -> tuple:
    """대표 레코드 선택 우선순위 (클수록 우선).
    혜택 여부 > 가치 큼 > 마감일 있음 > 먼저 발견됨."""
    is_benefit = 1 if record.get("is_benefit", True) else 0
    value = record.get("estimated_value") or record.get("value") or 0
    has_deadline = 1 if record.get("deadline_date") else 0
    first_seen = record.get("first_seen") or ""
    # first_seen은 빠를수록(작을수록) 우선이라 음수 비교용으로 뒤집는다
    return (is_benefit, value, has_deadline, _neg_str(first_seen))


def _neg_str(s: str) -> tuple:
    # 문자열을 "작을수록 우선"으로 정렬하기 위한 보조 (빈 값은 맨 뒤)
    return (0, "") if not s else (1, _invert(s))


def _invert(s: str) -> str:
    # 사전식 역순 정렬용: 각 문자를 반전
    return "".join(chr(0x10FFFF - ord(c)) if ord(c) < 0x10FFFF else c for c in s)


def collapse(records: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
    """dedup_key가 같은 레코드를 대표 1개로 합친다.

    대표 레코드에 아래를 덧붙인다:
      - source_count  : 합쳐진 원본 개수(대표 포함)
      - also_posted_by: 대표 외 게시처(provider) 목록 (중복/빈값 제거, 정렬)
    """
    groups: dict[str, list[dict[str, Any]]] = {}
    order: list[str] = []
    for rec in records:
        key = dedup_key(rec)
        if key not in groups:
            groups[key] = []
            order.append(key)
        groups[key].append(rec)

    result: list[dict[str, Any]] = []
    for key in order:
        members = groups[key]
        canonical = max(members, key=_canonical_score)
        merged = dict(canonical)
        providers = {
            (m.get("provider") or "").strip()
            for m in members
            if (m.get("provider") or "").strip()
            and (m.get("provider") or "").strip()
            != (canonical.get("provider") or "").strip()
        }
        merged["source_count"] = len(members)
        merged["also_posted_by"] = sorted(providers)
        result.append(merged)
    return result
