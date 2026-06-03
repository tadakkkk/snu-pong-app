from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from importlib import util
from pathlib import Path
from typing import Any, Callable, Literal
import asyncio
import dataclasses
import json
import os
import random
import sys


_SERVER_DIR = str(Path(__file__).resolve().parent)
if _SERVER_DIR not in sys.path:
    sys.path.insert(0, _SERVER_DIR)

from tag_pool import ACTIVITY_TAGS, DOMAIN_TAGS, TAG_POOL

SERVER_TIME_ZONE = "Asia/Seoul"
DAILY_CRAWL_HOUR_KST = 5
DAILY_CRAWL_CRON_UTC = "0 20 * * *"
PROJECT_ROOT = Path(__file__).resolve().parents[2]
CRAWLING_RULES_DIR = PROJECT_ROOT / "src" / "server" / "crawling_rules"
SCHEDULED_CRAWLER_DELAY_SECONDS = 2.0
SCHEDULED_CRAWLER_JITTER_SECONDS = 1.0
DEPARTMENT_REQUEST_DELAY_SECONDS = 1.5
DEPARTMENT_REQUEST_JITTER_SECONDS = 0.5
ENRICHMENT_BATCH_SIZE = 5
ENRICHMENT_MODEL = "claude-sonnet-4-20250514"
ANTHROPIC_API_KEY_ENV = "ANTHROPIC_API_KEY"

VALUE_GUIDE = """가치 환산 기준 (사설 시세 대비):
- 1:1 상담/코칭: 회당 5~15만원
- 집단 상담/워크숍: 회당 3~5만원
- 글쓰기 첨삭: 회당 3~5만원
- 어학 강좌: 학기당 30~50만원
- 장학금/지원금: 공고에 적힌 금액 그대로
- 인턴십/근로장학: 월 급여 기준
- 무료 강연/행사: 외부 유료 강연 시세 1~3만원
- 해외 프로그램: 항공+숙박+수업료 합산
- 판단 불가: null"""

TAG_GUIDE = f"""활동 태그 풀 ({len(ACTIVITY_TAGS)}개) — 이 풀에서만 골라라:
{', '.join(ACTIVITY_TAGS)}

분야 태그 풀 ({len(DOMAIN_TAGS)}개) — 이 풀에서만 골라라:
{', '.join(DOMAIN_TAGS)}"""

CATEGORY_GUIDE = """카테고리 분류 기준 (8개 중 하나):
- learning: 강의/세미나/특강/콜로키움, 글쓰기 첨삭, 학습코칭, 워크숍, 학술대회
- career: 진로상담, 자소서/이력서, 면접, 인턴십, 현장실습, 채용, 커리어
- sports: 헬스장, 수영, 테니스, 러닝, 체육활동
- welfare: 심리상담, 건강검진, 집단상담, 비만클리닉, 법률상담
- culture: 공연, 전시, 음악회, 영화제, 미술관, 콘서트
- experience: 교환학생, 해외연수/실습, 해외봉사, 탐방, 단기연수, 글로벌프로그램
- facility: 도서 대출, 열람실, 학술DB, 출판료 지원
- scholarship: 장학금, 등록금 지원, 학자금대출, 근로장학"""

CrawlStatus = Literal[
    "ready",
    "needs_config",
    "needs_adapter",
    "manual_seed",
    "login_required",
    "blocked",
    "retired",
]


@dataclass(frozen=True)
class ServerQueryContext:
    request_id: str | None = None
    now: datetime | None = None


@dataclass(frozen=True)
class BenefitItemQuery:
    search: str | None = None
    categories: list[str] | None = None
    source_ids: list[str] | None = None
    include_expired: bool = False
    only_benefits: bool = False
    limit: int | None = None
    offset: int | None = None


@dataclass(frozen=True)
class BenefitItemSummary:
    id: str
    title: str
    source_name: str
    source_url: str
    category: str
    estimated_value_krw: int | None
    deadline_at: str | None
    updated_at: str
    tags: list[str]


@dataclass(frozen=True)
class BenefitItemDetail(BenefitItemSummary):
    description: str
    eligibility_text: str | None
    application_url: str | None
    location: str | None


@dataclass(frozen=True)
class SourceQuery:
    enabled_only: bool = False
    crawlable_only: bool = False


@dataclass(frozen=True)
class CrawlSourceSummary:
    id: str
    name: str
    url: str
    group: str
    enabled: bool
    crawl_status: CrawlStatus
    last_crawled_at: str | None


@dataclass(frozen=True)
class ScheduledActionContext:
    trigger: Literal["cron", "manual"] = "cron"
    scheduled_for_kst_hour: int = DAILY_CRAWL_HOUR_KST
    now: datetime | None = None
    max_records_per_crawler: int | None = None
    enrich_records: bool = True


@dataclass(frozen=True)
class ScheduledCrawlerResult:
    crawler_id: str
    group: str
    status: Literal["success", "failed"]
    records_count: int
    error: str | None = None


@dataclass(frozen=True)
class EnrichmentResult:
    status: Literal["success", "skipped", "failed"]
    input_records_count: int
    enriched_records_count: int
    estimated_value_count: int
    error: str | None = None


@dataclass(frozen=True)
class ScheduledActionResult:
    status: Literal["success", "partial_failure", "failed"]
    scheduled_cron_utc: str
    scheduled_time_zone: str
    started_at: str
    finished_at: str
    records_count: int
    crawler_results: list[ScheduledCrawlerResult]
    enrichment_result: EnrichmentResult


@dataclass(frozen=True)
class CrawlerScheduleEntry:
    crawler_id: str
    group: str
    relative_path: str
    crawl_kwargs: dict[str, Any] | None = None


@dataclass(frozen=True)
class CrawlerRunOutcome:
    result: ScheduledCrawlerResult
    records: list[dict[str, Any]]


SCHEDULED_CRAWLERS: tuple[CrawlerScheduleEntry, ...] = (
    CrawlerScheduleEntry("announcements_calendar", "announcements", "announcements/Calendar.py"),
    CrawlerScheduleEntry("announcements_events", "announcements", "announcements/Events.py"),
    CrawlerScheduleEntry("announcements_notices", "announcements", "announcements/GeneralNotices.py"),
    CrawlerScheduleEntry("announcements_public_events", "announcements", "announcements/PublicEvents.py"),
    CrawlerScheduleEntry("affiliated_disability_support", "affiliated", "affiliated/DisabilitySupport.py"),
    CrawlerScheduleEntry("affiliated_student_center", "affiliated", "affiliated/StudentCenter.py"),
    CrawlerScheduleEntry("related_international_affairs", "related", "related/InternationalAffairs.py"),
    CrawlerScheduleEntry("related_it_office", "related", "related/ITOffice.py"),
    CrawlerScheduleEntry("related_library", "related", "related/Library.py"),
    CrawlerScheduleEntry("related_future_strategy", "related", "related/FutureStrategy.py"),
CrawlerScheduleEntry("extracurricular_programs", "extracurricular", "extracurricular/Extracurricular.py"),
    CrawlerScheduleEntry("extracurricular_social_outreach", "extracurricular", "extracurricular/SocialOutreach.py"),
    CrawlerScheduleEntry(
        "departments",
        "departments",
        "departments/Departments.py",
        {
            "request_delay_seconds": DEPARTMENT_REQUEST_DELAY_SECONDS,
            "request_jitter_seconds": DEPARTMENT_REQUEST_JITTER_SECONDS,
        },
    ),
)


class ServerQueries:
    async def list_benefit_items(
        self,
        query: BenefitItemQuery,
        context: ServerQueryContext = ServerQueryContext(),
    ) -> list[BenefitItemSummary]:
        import db as _db
        category = query.categories[0] if query.categories else None
        rows = await asyncio.to_thread(_db.get_items, category, query.only_benefits)
        results: list[BenefitItemSummary] = []
        for row in rows:
            updated_at = row.get("updated_at")
            if hasattr(updated_at, "isoformat"):
                updated_at = updated_at.isoformat()
            results.append(BenefitItemSummary(
                id=row["id"],
                title=row.get("name") or "",
                source_name=row.get("provider") or "",
                source_url=row.get("source_url") or "",
                category=row.get("category") or "",
                estimated_value_krw=row.get("estimated_value"),
                deadline_at=row.get("deadline_date"),
                updated_at=str(updated_at or ""),
                tags=row.get("tags") or [],
            ))
        return results

    async def get_benefit_item_by_id(
        self,
        item_id: str,
        context: ServerQueryContext = ServerQueryContext(),
    ) -> BenefitItemDetail | None:
        import db as _db
        row = await asyncio.to_thread(_db.get_item_by_id, item_id)
        if row is None:
            return None
        updated_at = row.get("updated_at")
        if hasattr(updated_at, "isoformat"):
            updated_at = updated_at.isoformat()
        return BenefitItemDetail(
            id=row["id"],
            title=row.get("name") or "",
            source_name=row.get("provider") or "",
            source_url=row.get("source_url") or "",
            category=row.get("category") or "",
            estimated_value_krw=row.get("estimated_value"),
            deadline_at=row.get("deadline_date"),
            updated_at=str(updated_at or ""),
            tags=row.get("tags") or [],
            description=row.get("body_excerpt") or "",
            eligibility_text=row.get("eligibility"),
            application_url=row.get("apply_url"),
            location=None,
        )

    async def list_crawl_sources(
        self,
        query: SourceQuery = SourceQuery(),
        context: ServerQueryContext = ServerQueryContext(),
    ) -> list[CrawlSourceSummary]:
        import db as _db
        db_rows = await asyncio.to_thread(_db.get_sources)
        db_by_id = {row["id"]: row for row in db_rows}
        results: list[CrawlSourceSummary] = []
        for entry in SCHEDULED_CRAWLERS:
            db_row = db_by_id.get(entry.crawler_id, {})
            last_crawled_at = db_row.get("last_crawled_at")
            if hasattr(last_crawled_at, "isoformat"):
                last_crawled_at = last_crawled_at.isoformat()
            results.append(CrawlSourceSummary(
                id=entry.crawler_id,
                name=entry.crawler_id.replace("_", " ").title(),
                url="",
                group=entry.group,
                enabled=True,
                crawl_status="ready",
                last_crawled_at=str(last_crawled_at) if last_crawled_at else None,
            ))
        return results


class DailyCrawlAt5amKst:
    cron_utc = DAILY_CRAWL_CRON_UTC
    time_zone = SERVER_TIME_ZONE
    hour_kst = DAILY_CRAWL_HOUR_KST

    async def run(
        self,
        context: ScheduledActionContext = ScheduledActionContext(),
    ) -> ScheduledActionResult:
        started_at = (context.now or datetime.now()).isoformat()
        crawler_results: list[ScheduledCrawlerResult] = []
        crawled_records: list[dict[str, Any]] = []

        for index, crawler_entry in enumerate(SCHEDULED_CRAWLERS):
            if index > 0:
                await _sleep_between_crawlers()
            outcome = await _run_scheduled_crawler(crawler_entry, context)
            crawler_results.append(outcome.result)
            crawled_records.extend(outcome.records)

        enrichment_result = await _enrich_crawled_records(crawled_records, context)

        finished_at = datetime.now().isoformat()
        failed_count = sum(1 for result in crawler_results if result.status == "failed")
        if failed_count == 0 and enrichment_result.status != "failed":
            status: Literal["success", "partial_failure", "failed"] = "success"
        elif failed_count == len(crawler_results):
            status = "failed"
        else:
            status = "partial_failure"

        return ScheduledActionResult(
            status=status,
            scheduled_cron_utc=DAILY_CRAWL_CRON_UTC,
            scheduled_time_zone=SERVER_TIME_ZONE,
            started_at=started_at,
            finished_at=finished_at,
            records_count=sum(result.records_count for result in crawler_results),
            crawler_results=crawler_results,
            enrichment_result=enrichment_result,
        )


async def _sleep_between_crawlers() -> None:
    delay = SCHEDULED_CRAWLER_DELAY_SECONDS + random.uniform(0.0, SCHEDULED_CRAWLER_JITTER_SECONDS)
    await asyncio.sleep(delay)


async def _run_scheduled_crawler(
    crawler_entry: CrawlerScheduleEntry,
    context: ScheduledActionContext,
) -> CrawlerRunOutcome:
    try:
        crawl = _load_crawl_function(crawler_entry)
        kwargs = dict(crawler_entry.crawl_kwargs or {})
        if context.max_records_per_crawler is not None:
            kwargs["max_records"] = context.max_records_per_crawler
        records = await asyncio.to_thread(crawl, **kwargs)
        return CrawlerRunOutcome(
            result=ScheduledCrawlerResult(
                crawler_id=crawler_entry.crawler_id,
                group=crawler_entry.group,
                status="success",
                records_count=len(records),
            ),
            records=records,
        )
    except Exception as error:
        return CrawlerRunOutcome(
            result=ScheduledCrawlerResult(
                crawler_id=crawler_entry.crawler_id,
                group=crawler_entry.group,
                status="failed",
                records_count=0,
                error=repr(error),
            ),
            records=[],
        )


async def _enrich_crawled_records(
    records: list[dict[str, Any]],
    context: ScheduledActionContext,
) -> EnrichmentResult:
    if not context.enrich_records:
        return EnrichmentResult(
            status="skipped",
            input_records_count=len(records),
            enriched_records_count=0,
            estimated_value_count=0,
            error="Enrichment disabled by ScheduledActionContext.enrich_records",
        )
    if not records:
        return EnrichmentResult(
            status="skipped",
            input_records_count=0,
            enriched_records_count=0,
            estimated_value_count=0,
            error="No crawled records to enrich",
        )
    if not os.environ.get(ANTHROPIC_API_KEY_ENV):
        return EnrichmentResult(
            status="skipped",
            input_records_count=len(records),
            enriched_records_count=0,
            estimated_value_count=0,
            error=f"{ANTHROPIC_API_KEY_ENV} is not configured",
        )

    try:
        import db as _db
        existing_ids = await asyncio.to_thread(_db.get_existing_ids)
        def _rec_id(r: dict[str, Any]) -> str:
            return r.get("id") or r.get("draft_id") or str(r.get("source_url") or "")
        new_records = [r for r in records if _rec_id(r) not in existing_ids]
        print(f"증분 필터: 전체 {len(records)}개 중 신규 {len(new_records)}개만 정제 (기존 {len(records)-len(new_records)}개 스킵)")
        if not new_records:
            return EnrichmentResult(
                status="success",
                input_records_count=len(records),
                enriched_records_count=0,
                estimated_value_count=0,
                error=None,
            )
        records = new_records
        enriched_records = await asyncio.to_thread(enrich_records, records)
        await _store_enriched_records(enriched_records)
        return EnrichmentResult(
            status="success",
            input_records_count=len(records),
            enriched_records_count=len(enriched_records),
            estimated_value_count=sum(1 for record in enriched_records if record.get("estimated_value")),
        )
    except Exception as error:
        return EnrichmentResult(
            status="failed",
            input_records_count=len(records),
            enriched_records_count=0,
            estimated_value_count=0,
            error=repr(error),
        )


def enrich_records(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    enriched_items: list[dict[str, Any]] = []
    for index in range(0, len(records), ENRICHMENT_BATCH_SIZE):
        batch = records[index : index + ENRICHMENT_BATCH_SIZE]
        try:
            batch_enrichment = _enrich_batch(batch)
        except Exception:
            batch_enrichment = [_fallback_enrichment(record) for record in batch]
        enriched_items.extend(_merge_enrichment(batch, batch_enrichment))
    return enriched_items


def _enrich_batch(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    try:
        import anthropic
    except ImportError as error:
        raise RuntimeError("anthropic package is required for server-side enrichment") from error

    client = anthropic.Anthropic(api_key=os.environ[ANTHROPIC_API_KEY_ENV])
    response = client.messages.create(
        model=ENRICHMENT_MODEL,
        max_tokens=4096,
        messages=[{"role": "user", "content": _enrichment_prompt(records)}],
    )
    raw_text = response.content[0].text.strip()
    if raw_text.startswith("```"):
        lines = raw_text.splitlines()
        raw_text = "\n".join(lines[1:])
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3].strip()

    parsed = json.loads(raw_text)
    if isinstance(parsed, dict) and isinstance(parsed.get("items"), list):
        return parsed["items"]
    if isinstance(parsed, list):
        return parsed
    raise ValueError("AI enrichment response must be a JSON array or an object with an items array")


def _enrichment_prompt(records: list[dict[str, Any]]) -> str:
    articles_text = ""
    for index, record in enumerate(records):
        record_id = _record_id(record)
        articles_text += f"\n---\n항목 {index + 1} (id: {record_id}):\n"
        articles_text += f"제목: {record.get('name') or record.get('title') or ''}\n"
        articles_text += f"카테고리: {record.get('category') or ''}\n"
        articles_text += f"제공: {record.get('provider') or record.get('author') or ''}\n"
        articles_text += f"원본URL: {record.get('source_url') or ''}\n"
        articles_text += f"마감힌트: {json.dumps(record.get('deadline_hints', []), ensure_ascii=False)}\n"
        articles_text += f"가치힌트: {record.get('value_basis_hint') or ''}\n"
        body = record.get("body_excerpt") or record.get("raw_content") or ""
        if body:
            articles_text += f"본문발췌: {str(body)[:500]}\n"

    return f"""너는 서울대 학생 혜택 데이터를 정제하는 AI야.
다음 서울대 공지 {len(records)}개에서 학생 혜택 정보를 추출해.

{VALUE_GUIDE}

각 항목마다 이 형식의 JSON 객체로 만들어:
{{
  "id": "원본 id 그대로",
  "estimated_value": 숫자(원) 또는 null,
  "value_basis": "산출 근거 한 줄",
  "subtitle": "15자 이내 한 줄 설명",
  "unit": "1회 / 8회 코스 / 학기 / 상시 등",
  "eligibility": "학부생 누구나 / 1학년만 등",
  "deadline_date": "2026-05-29 형식 또는 null",
  "apply_url": "신청 링크 또는 null",
  "how_to_apply": ["단계1", "단계2", "단계3"],
  "site_id": "career_center / writing_center 등 또는 null",
  "category": "learning/career/sports/welfare/culture/experience/facility/scholarship 중 하나",
  "is_benefit": true 또는 false,
  "tags": ["풀에서 고른 활동태그 2~4개 + 분야태그 1~3개, 합쳐서 3~7개"]
}}

{CATEGORY_GUIDE}

category 선택 규칙:
- 반드시 위 8개 값 중 하나만 사용.
- 제목과 본문을 보고 항목의 실제 성격에 맞게 판단해.

is_benefit 판단 규칙:
- 기본값은 true. 애매하면 true(보이는 쪽으로).
- true: 학생이 신청·지원·참여·이용할 수 있는 모든 것.
  "모집", "공모", "선발", "지원사업", "장학생 모집", "캠프", "프로그램",
  "특강", "세미나", "상담", "인턴십", "공모전" 등은 거의 항상 true.
  가치 금액이 없어도, 학부생 외 대상(대학원생/유학생/박사후연구원)이어도
  학생 기회·혜택에 해당하면 true.
- false: 확실히 행정·결과·내부 정보일 때만.
  "~결과 발표", "~선정 결과", "합격자 발표", "수상작 발표" (이미 끝난 결과 공지),
  전공이수규정/교과과정/교수진 소개/학과 비전·소개,
  시스템 오류·조치완료 안내, 안내판 설치, 게시판 운영 안내,
  단순 일정변경 공지, 교직원·직원 채용공고.

{TAG_GUIDE}

tags 선택 규칙:
- 반드시 위 풀에 있는 태그만 사용. 풀에 없는 태그 절대 금지.
- 활동 태그 2~4개 + 분야 태그 1~3개를 붙여. 합쳐서 3~7개.
- 제목과 본문에서 명확히 드러나는 것만 태그로 달아. 추측하지 마.
- 활동의 실제 성격에 맞는 태그를 골라 (예: 캠프/프로그램이면 그 주제에 맞는 활동 태그).
- 분야가 제목/본문에 나타나면 반드시 분야 태그를 1개 이상 포함해.
- 애매하면 활동 태그라도 정확한 걸로 채우되, 풀에 없는 태그는 절대 만들지 말 것.

JSON 배열만 반환. 마크다운 코드블록이나 설명 텍스트 없이 [ 로 시작해서 ] 로 끝나게.

{articles_text}"""


_TAG_POOL_SET: frozenset[str] = frozenset(TAG_POOL)
_VALID_CATEGORIES: frozenset[str] = frozenset({
    "learning", "career", "sports", "welfare",
    "culture", "experience", "facility", "scholarship",
})


def _merge_enrichment(records: list[dict[str, Any]], enrichments: list[dict[str, Any]]) -> list[dict[str, Any]]:
    enrichment_by_id = {str(item.get("id")): item for item in enrichments if item.get("id") is not None}
    merged_records: list[dict[str, Any]] = []
    for record in records:
        merged = dict(record)
        enrichment = enrichment_by_id.get(_record_id(record))
        if enrichment is None:
            enrichment = _fallback_enrichment(record)
        for key in (
            "estimated_value",
            "value_basis",
            "subtitle",
            "unit",
            "eligibility",
            "deadline_date",
            "apply_url",
            "how_to_apply",
            "site_id",
        ):
            if enrichment.get(key) is not None:
                merged[key] = enrichment[key]
        merged["tags"] = [t for t in (enrichment.get("tags") or []) if t in _TAG_POOL_SET]
        if enrichment.get("category") in _VALID_CATEGORIES:
            merged["category"] = enrichment["category"]
        merged["is_benefit"] = bool(enrichment.get("is_benefit", True))
        merged["value_status"] = "estimated" if enrichment.get("estimated_value") else "needs_estimation"
        merged["source"] = "server_crawled_enriched"
        merged_records.append(merged)
    return merged_records


def _fallback_enrichment(record: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": _record_id(record),
        "estimated_value": None,
        "value_basis": "AI 정제 실패",
        "subtitle": "",
        "unit": "",
        "eligibility": "",
        "deadline_date": None,
        "apply_url": None,
        "how_to_apply": [],
        "site_id": None,
        "is_benefit": True,
        "tags": [],
    }


def _record_id(record: dict[str, Any]) -> str:
    return str(record.get("id") or record.get("uid") or record.get("draft_id") or record.get("source_url") or "unknown")


async def _store_enriched_records(records: list[dict[str, Any]]) -> None:
    import db as _db
    await asyncio.to_thread(_db.upsert_items, records)


def _load_crawl_function(crawler_entry: CrawlerScheduleEntry) -> Callable[..., list[dict[str, Any]]]:
    path = CRAWLING_RULES_DIR / crawler_entry.relative_path
    _ensure_crawler_import_paths()
    module_name = f"scheduled_crawler_{crawler_entry.crawler_id}"
    spec = util.spec_from_file_location(module_name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load crawler module: {path}")
    module = util.module_from_spec(spec)
    spec.loader.exec_module(module)
    crawl = getattr(module, "crawl", None)
    if not callable(crawl):
        raise RuntimeError(f"Crawler module has no callable crawl(): {path}")
    return crawl


def _ensure_crawler_import_paths() -> None:
    for path in CRAWLING_RULES_DIR.iterdir():
        if path.is_dir() and str(path) not in sys.path:
            sys.path.append(str(path))


server_queries = ServerQueries()
daily_crawl_at_5am_kst = DailyCrawlAt5amKst()


# ─── FastAPI web server ────────────────────────────────────────────────────────

from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

_ALLOWED_ORIGINS = [
    "https://snu-pong-app.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8000",
]


@asynccontextmanager
async def _lifespan(application: FastAPI):
    import db as _db
    await asyncio.to_thread(_db.init_db)
    scheduler = AsyncIOScheduler(timezone=SERVER_TIME_ZONE)
    scheduler.add_job(
        daily_crawl_at_5am_kst.run,
        "cron",
        hour=DAILY_CRAWL_HOUR_KST,
        kwargs={"context": ScheduledActionContext(trigger="cron")},
    )
    scheduler.start()
    yield
    scheduler.shutdown(wait=False)


app = FastAPI(title="SNU Pong Server", lifespan=_lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/items")
async def list_items(category: str | None = None, only_benefits: bool = False):
    query = BenefitItemQuery(
        categories=[category] if category else None,
        only_benefits=only_benefits,
    )
    items = await server_queries.list_benefit_items(query)
    return [dataclasses.asdict(item) for item in items]


@app.get("/api/items/{item_id}")
async def get_item(item_id: str):
    item = await server_queries.get_benefit_item_by_id(item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return dataclasses.asdict(item)


@app.get("/api/sources")
async def list_sources():
    sources = await server_queries.list_crawl_sources()
    return [dataclasses.asdict(s) for s in sources]


@app.post("/api/crawl")
async def trigger_crawl(background_tasks: BackgroundTasks):
    async def _run():
        await daily_crawl_at_5am_kst.run(ScheduledActionContext(trigger="manual"))

    background_tasks.add_task(_run)
    return {"status": "crawl_started"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
