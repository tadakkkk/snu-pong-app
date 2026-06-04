from __future__ import annotations

import os
from typing import Any

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

_DATABASE_URL_ENV = "DATABASE_URL"

_TITLE_TAG_RULES = [
    ("캠프", "#캠프"),
    ("세미나", "#세미나"),
    ("콜로키움", "#세미나"),
    ("특강", "#특강"),
    ("강연", "#특강"),
    ("강좌", "#특강"),
    ("장학", "#장학금"),
    ("인턴", "#인턴십"),
    ("현장실습", "#현장실습"),
    ("공모전", "#공모전"),
    ("경진대회", "#공모전"),
    ("공모", "#공모"),
    ("워크숍", "#워크숍"),
    ("워크샵", "#워크숍"),
    ("멘토링", "#멘토링"),
    ("봉사", "#봉사"),
    ("교환학생", "#교환학생"),
    ("해외", "#글로벌"),
    ("글로벌", "#글로벌"),
    ("국제", "#국제교류"),
    ("전시", "#전시"),
    ("박람회", "#박람회"),
    ("채용", "#채용"),
    ("모집", "#모집"),
    ("프로그램", "#프로그램"),
    ("학술대회", "#학술대회"),
    ("창업", "#창업"),
    ("연수", "#연수"),
    ("상담", "#상담"),
    ("공연", "#공연"),
    ("콘서트", "#공연"),
]

_CATEGORY_FALLBACK_TAG = {
    "learning": "#학습",
    "career": "#진로",
    "scholarship": "#장학금",
    "welfare": "#복지",
    "culture": "#문화",
    "experience": "#경험",
    "facility": "#시설",
    "sports": "#운동",
}


def _tags_from_title(title: str, category: str | None) -> list[str]:
    title = title or ""
    found: list[str] = []
    for kw, tag in _TITLE_TAG_RULES:
        if kw in title and tag not in found:
            found.append(tag)
        if len(found) >= 3:
            break
    if not found:
        fb = _CATEGORY_FALLBACK_TAG.get(category or "", "#기타")
        found.append(fb)
    return found


def _connect() -> psycopg.Connection[dict[str, Any]]:
    url = os.environ.get(_DATABASE_URL_ENV)
    if not url:
        raise RuntimeError(f"{_DATABASE_URL_ENV} environment variable is not set")
    return psycopg.connect(url, row_factory=dict_row)


def init_db() -> None:
    with _connect() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS benefit_items (
                id TEXT PRIMARY KEY,
                name TEXT,
                category TEXT,
                provider TEXT,
                source_url TEXT,
                estimated_value INTEGER,
                value_basis TEXT,
                subtitle TEXT,
                unit TEXT,
                eligibility TEXT,
                deadline_date TEXT,
                apply_url TEXT,
                how_to_apply JSONB,
                site_id TEXT,
                tags JSONB,
                value_status TEXT,
                body_excerpt TEXT,
                updated_at TIMESTAMPTZ DEFAULT now()
            )
        """)
        conn.execute("""
            ALTER TABLE benefit_items
            ADD COLUMN IF NOT EXISTS is_benefit BOOLEAN DEFAULT true
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS crawl_sources (
                id TEXT PRIMARY KEY,
                name TEXT,
                url TEXT,
                last_crawled_at TIMESTAMPTZ
            )
        """)


def upsert_items(records: list[dict[str, Any]]) -> None:
    if not records:
        return
    with _connect() as conn:
        for record in records:
            item_id = (
                record.get("id")
                or record.get("draft_id")
                or str(record.get("source_url") or "")
            )
            if not item_id:
                continue
            conn.execute(
                """
                INSERT INTO benefit_items (
                    id, name, category, provider, source_url,
                    estimated_value, value_basis, subtitle, unit,
                    eligibility, deadline_date, apply_url, how_to_apply,
                    site_id, tags, value_status, is_benefit, body_excerpt, first_seen, updated_at
                ) VALUES (
                    %(id)s, %(name)s, %(category)s, %(provider)s, %(source_url)s,
                    %(estimated_value)s, %(value_basis)s, %(subtitle)s, %(unit)s,
                    %(eligibility)s, %(deadline_date)s, %(apply_url)s, %(how_to_apply)s,
                    %(site_id)s, %(tags)s, %(value_status)s, %(is_benefit)s, %(body_excerpt)s, now(), now()
                )
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    category = EXCLUDED.category,
                    provider = EXCLUDED.provider,
                    source_url = EXCLUDED.source_url,
                    estimated_value = EXCLUDED.estimated_value,
                    value_basis = EXCLUDED.value_basis,
                    subtitle = EXCLUDED.subtitle,
                    unit = EXCLUDED.unit,
                    eligibility = EXCLUDED.eligibility,
                    deadline_date = EXCLUDED.deadline_date,
                    apply_url = EXCLUDED.apply_url,
                    how_to_apply = EXCLUDED.how_to_apply,
                    site_id = EXCLUDED.site_id,
                    tags = EXCLUDED.tags,
                    value_status = EXCLUDED.value_status,
                    is_benefit = EXCLUDED.is_benefit,
                    body_excerpt = EXCLUDED.body_excerpt,
                    updated_at = now()
                """,
                {
                    "id": item_id,
                    "name": record.get("name") or record.get("title"),
                    "category": record.get("category"),
                    "provider": record.get("provider") or record.get("author"),
                    "source_url": record.get("source_url"),
                    "estimated_value": record.get("estimated_value"),
                    "value_basis": record.get("value_basis"),
                    "subtitle": record.get("subtitle"),
                    "unit": record.get("unit"),
                    "eligibility": record.get("eligibility"),
                    "deadline_date": record.get("deadline_date"),
                    "apply_url": record.get("apply_url"),
                    "how_to_apply": Jsonb(record.get("how_to_apply") or []),
                    "site_id": record.get("site_id"),
                    "tags": Jsonb(
                        record.get("tags")
                        or _tags_from_title(
                            record.get("name") or record.get("title") or "",
                            record.get("category"),
                        )
                    ),
                    "value_status": record.get("value_status"),
                    "is_benefit": record.get("is_benefit", True),
                    "body_excerpt": record.get("body_excerpt"),
                },
            )


def get_items(category: str | None = None, only_benefits: bool = False) -> list[dict[str, Any]]:
    conditions: list[str] = []
    params: list[Any] = []
    if category:
        conditions.append("category = %s")
        params.append(category)
    if only_benefits:
        conditions.append("is_benefit = true")
    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    with _connect() as conn:
        rows = conn.execute(
            f"SELECT * FROM benefit_items {where} ORDER BY updated_at DESC",
            params,
        ).fetchall()
    return [dict(row) for row in rows]


def get_item_by_id(item_id: str) -> dict[str, Any] | None:
    with _connect() as conn:
        row = conn.execute(
            "SELECT * FROM benefit_items WHERE id = %s",
            (item_id,),
        ).fetchone()
    return dict(row) if row else None

def get_existing_ids() -> set[str]:
    with _connect() as conn:
        rows = conn.execute("SELECT id FROM benefit_items").fetchall()
    return {row["id"] for row in rows}

def get_sources() -> list[dict[str, Any]]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM crawl_sources ORDER BY id"
        ).fetchall()
    return [dict(row) for row in rows]
