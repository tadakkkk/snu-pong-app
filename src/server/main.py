from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from importlib import util
from pathlib import Path
from typing import Any, Callable, Literal
import asyncio
import dataclasses
import json
import logging
import os
import random
import sys
import time


_SERVER_DIR = str(Path(__file__).resolve().parent)
if _SERVER_DIR not in sys.path:
    sys.path.insert(0, _SERVER_DIR)

from tag_pool import ACTIVITY_TAGS, DOMAIN_TAGS, TAG_POOL

logger = logging.getLogger("enrichment")

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
ENRICHMENT_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6")
ANTHROPIC_API_KEY_ENV = "ANTHROPIC_API_KEY"
ENRICHMENT_BODY_LIMIT = 2000

VALUE_GUIDE = """가치 환산 기준 (사설 시세 대비):
- 1:1 상담/코칭: 회당 5~15만원
- 집단 상담/워크숍: 회당 3~5만원
- 글쓰기 첨삭: 회당 3~5만원
- 어학 강좌: 학기당 30~50만원
- 장학금/지원금: 공고에 적힌 금액 그대로
- 인턴십/근로장학: 월 급여 기준
- 무료 강연/행사: 외부 유료 강연 시세 1~3만원
- 해외 프로그램: 항공+숙박+수업료 합산
- 무료 서비스는 위 기준 또는 명시된 공식 가격을 사용
- 개인별 금액 차등: 최소/최대 범위와 산정 조건을 저장
- 조건부 보상: 확정 혜택은 최소값에, 최고 가능 보상은 최대값에 저장
- 근거 없는 시장가격, 급여, 수상확률은 만들지 말 것"""

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
    estimated_value_min_krw: int | None
    estimated_value_max_krw: int | None
    valuation_status: str | None
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
                estimated_value_min_krw=row.get("estimated_value_min"),
                estimated_value_max_krw=row.get("estimated_value_max"),
                valuation_status=row.get("valuation_status"),
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
            estimated_value_min_krw=row.get("estimated_value_min"),
            estimated_value_max_krw=row.get("estimated_value_max"),
            valuation_status=row.get("valuation_status"),
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
            status="failed",
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


class FatalEnrichmentError(RuntimeError):
    """재시도 불가, job을 실패시켜야 하는 에러 (인증/결제/권한/잘못된 요청)."""


class EnrichmentBatchError(RuntimeError):
    """A batch could not be enriched without losing or misrepresenting records."""


_ENRICHMENT_API_RETRIES = 3
_ENRICHMENT_API_BACKOFF = (2, 4, 8)
_TRANSIENT_ANTHROPIC_STATUS_CODES = frozenset({408, 409, 429, 500, 502, 503, 504, 529})


def enrich_records(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    enriched_items: list[dict[str, Any]] = []
    for index in range(0, len(records), ENRICHMENT_BATCH_SIZE):
        batch = records[index : index + ENRICHMENT_BATCH_SIZE]
        try:
            batch_enrichment = _enrich_batch(batch)
        except FatalEnrichmentError:
            # 인증/결제/권한/BadRequest 등 재시도 불가 — 전체 job 중단.
            raise
        except Exception as exc:
            record_ids = [_record_id(r) for r in batch]
            logger.warning(
                "Batch enrichment failed, isolating per-record class=%s ids=%s detail=%s",
                type(exc).__name__, record_ids, str(exc),
            )
            enriched_items.extend(_enrich_batch_isolated(batch))
            continue
        enriched_items.extend(_merge_enrichment(batch, batch_enrichment))
    return enriched_items


def _enrich_batch_isolated(batch: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """배치가 비치명 오류로 실패했을 때 항목 1개씩 재시도하고,
    개별로도 실패하면 그 항목만 enrichment_status='failed'로 보존한다."""
    recovered: list[dict[str, Any]] = []
    for record in batch:
        record_id = _record_id(record)
        try:
            single_enrichment = _enrich_batch([record])
        except FatalEnrichmentError:
            # 단일 항목에서도 치명 오류면 전체 중단.
            raise
        except Exception as exc:
            logger.warning(
                "Record enrichment failed, marking failed id=%s class=%s detail=%s",
                record_id, type(exc).__name__, str(exc),
            )
            recovered.append(_fallback_enrichment(record, exc))
            continue
        recovered.append(_merge_enrichment([record], single_enrichment)[0])
    return recovered


def _fallback_enrichment(record: dict[str, Any], exc: Exception) -> dict[str, Any]:
    """정제에 실패한 항목을 잃지 않고 'failed' 상태로 보존하는 레코드를 만든다.
    금액 필드는 모두 None, 다음 실행에서 재처리 대상이 되도록 표시한다."""
    merged = dict(record)
    for key in _MONEY_FIELDS:
        merged[key] = None
    merged["value_basis"] = "AI 정제 실패"
    merged["valuation_status"] = None
    merged["eligibility_scope"] = None
    merged["confidence"] = None
    merged["requires_source_review"] = True
    merged["tags"] = [t for t in (record.get("tags") or []) if t in _TAG_POOL_SET]
    merged["is_benefit"] = bool(record.get("is_benefit", True))
    merged["value_status"] = "needs_estimation"
    merged["enrichment_status"] = "failed"
    merged["enrichment_error"] = str(exc)
    merged["source"] = "server_crawled_unenriched"
    return merged


def _enrich_batch(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    try:
        import anthropic
    except ImportError as error:
        raise RuntimeError("anthropic package is required for server-side enrichment") from error

    record_ids = [_record_id(r) for r in records]
    client = anthropic.Anthropic(api_key=os.environ[ANTHROPIC_API_KEY_ENV])
    prompt = _enrichment_prompt(records)

    def _api_call() -> str:
        try:
            resp = client.messages.create(
                model=ENRICHMENT_MODEL,
                max_tokens=4096,
                messages=[{"role": "user", "content": prompt}],
            )
            return resp.content[0].text.strip()
        except (
            anthropic.AuthenticationError,
            anthropic.PermissionDeniedError,
            anthropic.BadRequestError,
            anthropic.NotFoundError,
        ) as exc:
            logger.error(
                "Fatal enrichment error class=%s status=%s request_id=%s ids=%s",
                type(exc).__name__, exc.status_code, getattr(exc, "request_id", None), record_ids,
            )
            raise FatalEnrichmentError(
                f"{type(exc).__name__} status={exc.status_code} "
                f"request_id={getattr(exc, 'request_id', None)}"
            ) from exc
        except anthropic.APIStatusError as exc:
            if exc.status_code not in _TRANSIENT_ANTHROPIC_STATUS_CODES:
                logger.error(
                    "Fatal enrichment error class=%s status=%s request_id=%s ids=%s",
                    type(exc).__name__, exc.status_code, getattr(exc, "request_id", None), record_ids,
                )
                raise FatalEnrichmentError(
                    f"{type(exc).__name__} status={exc.status_code} "
                    f"request_id={getattr(exc, 'request_id', None)}"
                ) from exc
            raise

    def _api_call_with_retries() -> str:
        last_exc: BaseException | None = None
        for attempt in range(_ENRICHMENT_API_RETRIES):
            try:
                return _api_call()
            except FatalEnrichmentError:
                raise
            except (anthropic.APIStatusError, anthropic.APIConnectionError) as exc:
                logger.warning(
                    "Transient enrichment error class=%s status=%s request_id=%s ids=%s attempt=%d/%d",
                    type(exc).__name__,
                    getattr(exc, "status_code", None),
                    getattr(exc, "request_id", None),
                    record_ids, attempt + 1, _ENRICHMENT_API_RETRIES,
                )
                last_exc = exc
                if attempt < _ENRICHMENT_API_RETRIES - 1:
                    time.sleep(_ENRICHMENT_API_BACKOFF[attempt])
        raise EnrichmentBatchError(
            f"Anthropic request failed after {_ENRICHMENT_API_RETRIES} attempts"
        ) from last_exc

    def _parse(raw: str) -> list[dict[str, Any]]:
        text = raw
        if text.startswith("```"):
            lines = text.splitlines()
            text = "\n".join(lines[1:])
            if text.endswith("```"):
                text = text[:-3].strip()
        parsed = json.loads(text)
        if isinstance(parsed, dict) and isinstance(parsed.get("items"), list):
            items = parsed["items"]
            _validate_enrichment_response(records, items)
            return items
        if isinstance(parsed, list):
            _validate_enrichment_response(records, parsed)
            return parsed
        raise ValueError("AI enrichment response must be a JSON array or an object with an items array")

    raw_text = _api_call_with_retries()
    try:
        return _parse(raw_text)
    except (json.JSONDecodeError, ValueError) as first_parse_exc:
        logger.warning(
            "Parse error on attempt 1, retrying API call class=%s ids=%s detail=%s",
            type(first_parse_exc).__name__, record_ids, str(first_parse_exc),
        )
        raw_text = _api_call_with_retries()
        try:
            return _parse(raw_text)
        except (json.JSONDecodeError, ValueError) as exc:
            logger.warning(
                "Parse error on attempt 2, giving up class=%s ids=%s detail=%s",
                type(exc).__name__, record_ids, str(exc),
            )
            logger.warning(
                "Final parse failure raw response (truncated) ids=%s raw=%s",
                record_ids, raw_text[:800],
            )
            raise


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
            articles_text += f"본문발췌: {str(body)[:ENRICHMENT_BODY_LIMIT]}\n"
        attachments = record.get("attachment_texts") or record.get("attachments") or []
        if attachments:
            articles_text += (
                "첨부자료: "
                f"{json.dumps(attachments, ensure_ascii=False)[:ENRICHMENT_BODY_LIMIT]}\n"
            )

    return f"""너는 서울대학교 학생 혜택 데이터를 정제하는 AI다.
다음 서울대 공지 {len(records)}개를 아래 순서로 판단한다.

1. 실제 학생 혜택인지 판단한다.
2. 대상 학생 범위를 판단한다.
3. 혜택 지급 방식과 금액 산정 방식을 분류한다.
4. 원문 정보가 충분한지 판단한다.
5. 정해진 기준으로 금액 또는 범위를 계산한다.

{VALUE_GUIDE}

각 항목마다 이 형식의 JSON 객체로 만들어:
{{
  "id": "원본 id 그대로",
  "estimated_value": 숫자(원) 또는 null,
  "estimated_value_min": 숫자(원) 또는 null,
  "estimated_value_max": 숫자(원) 또는 null,
  "expected_value": 숫자(원) 또는 null,
  "guaranteed_value": 숫자(원) 또는 null,
  "conditional_reward_min": 숫자(원) 또는 null,
  "conditional_reward_max": 숫자(원) 또는 null,
  "value_basis": "산출 근거 또는 null 사유 한 줄",
  "valuation_status": "estimated/not_a_benefit/missing_source_data/variable_by_recipient/conditional_reward/undisclosed_compensation/needs_market_reference 중 하나",
  "eligibility_scope": "undergraduate/graduate/all_students/unknown 중 하나",
  "confidence": "high/medium/low 중 하나",
  "requires_source_review": true 또는 false,
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
- true: 학생이 신청·지원·참여·이용할 수 있는 모든 것.
  "모집", "공모", "선발", "지원사업", "장학생 모집", "캠프", "프로그램",
  "특강", "세미나", "상담", "인턴십", "공모전" 등은 거의 항상 true.
- false:
  "~결과 발표", "~선정 결과", "합격자 발표", "수상작 발표" (이미 끝난 결과 공지),
  입학·신입생 모집, 등록·복학·재입학·학점인정·학과배정·전공배정,
  의무교육·졸업요건·뉴스레터, 전공이수규정/교과과정/교수진 소개/학과 비전·소개,
  시스템 오류·조치완료 안내, 안내판 설치, 게시판 운영 안내,
  단순 일정변경 공지, 교직원·직원 채용공고.

가치 상태 규칙:
- is_benefit=false이면 valuation_status=not_a_benefit이고 모든 금액 필드는 null.
- 확정 단일 금액이면 valuation_status=estimated, estimated_value/min/max를 같은 값으로 작성.
- 개인별 차등이면 valuation_status=variable_by_recipient이고 공식 최소/최대 범위를 작성.
- 공모전 등 조건부 보상은 valuation_status=conditional_reward.
  guaranteed_value와 estimated_value_min에는 확정 참가 혜택을, 없으면 0을 작성.
  estimated_value_max에는 한 사람이 받을 수 있는 최고 조건부 보상과 확정 혜택의 합계를 작성.
  객관적 확률이 없으면 expected_value와 estimated_value는 null.
- 급여·활동비가 공식적으로 공개되지 않은 근로·인턴십은 undisclosed_compensation.
- 시장 대체가격 기준은 있으나 입력만으로 계산할 수 없으면 needs_market_reference.
- 본문·첨부 등 원문 정보가 부족하면 missing_source_data와 requires_source_review=true.
- estimated_value가 null이면 value_basis와 valuation_status가 반드시 있어야 한다.
- value_basis에서 혜택이 아니라고 판단했다면 is_benefit=false여야 한다.

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
_VALID_VALUATION_STATUSES: frozenset[str] = frozenset({
    "estimated",
    "not_a_benefit",
    "missing_source_data",
    "variable_by_recipient",
    "conditional_reward",
    "undisclosed_compensation",
    "needs_market_reference",
})
_VALID_ELIGIBILITY_SCOPES: frozenset[str] = frozenset({
    "undergraduate", "graduate", "all_students", "unknown",
})
_VALID_CONFIDENCE_LEVELS: frozenset[str] = frozenset({"high", "medium", "low"})
_MONEY_FIELDS: tuple[str, ...] = (
    "estimated_value",
    "estimated_value_min",
    "estimated_value_max",
    "expected_value",
    "guaranteed_value",
    "conditional_reward_min",
    "conditional_reward_max",
)
_NON_BENEFIT_BASIS_MARKERS: tuple[str, ...] = (
    "학생 혜택 없음",
    "직접적 혜택 없음",
    "직접적인 혜택 없음",
    "혜택 아님",
    "행정 절차",
    "행정절차",
    "입학 모집",
    "신입생 모집",
    "졸업 요건",
)


def _validate_enrichment_response(
    records: list[dict[str, Any]],
    enrichments: list[dict[str, Any]],
) -> None:
    expected_ids = [_record_id(record) for record in records]
    if len(enrichments) != len(expected_ids):
        raise ValueError(
            f"Expected {len(expected_ids)} enrichment items, received {len(enrichments)}"
        )

    received_ids = [str(item.get("id")) for item in enrichments]
    if len(set(received_ids)) != len(received_ids) or set(received_ids) != set(expected_ids):
        raise ValueError(
            f"Enrichment ids do not match input ids: expected={expected_ids} received={received_ids}"
        )

    for item in enrichments:
        item_id = str(item.get("id"))
        status = item.get("valuation_status")
        if status not in _VALID_VALUATION_STATUSES:
            raise ValueError(f"{item_id}: invalid valuation_status {status!r}")
        if item.get("eligibility_scope") not in _VALID_ELIGIBILITY_SCOPES:
            raise ValueError(f"{item_id}: invalid eligibility_scope")
        if item.get("confidence") not in _VALID_CONFIDENCE_LEVELS:
            raise ValueError(f"{item_id}: invalid confidence")
        if not isinstance(item.get("requires_source_review"), bool):
            raise ValueError(f"{item_id}: requires_source_review must be boolean")
        if not isinstance(item.get("is_benefit"), bool):
            raise ValueError(f"{item_id}: is_benefit must be boolean")

        for field in _MONEY_FIELDS:
            value = item.get(field)
            if value is not None and (
                isinstance(value, bool) or not isinstance(value, (int, float)) or value < 0
            ):
                raise ValueError(f"{item_id}: {field} must be a non-negative number or null")

        minimum = item.get("estimated_value_min")
        maximum = item.get("estimated_value_max")
        if minimum is not None and maximum is not None and minimum > maximum:
            raise ValueError(f"{item_id}: estimated_value_min exceeds estimated_value_max")

        if not item["is_benefit"]:
            if status != "not_a_benefit":
                raise ValueError(f"{item_id}: non-benefit must use not_a_benefit")
            if any(item.get(field) is not None for field in _MONEY_FIELDS):
                raise ValueError(f"{item_id}: non-benefit cannot contain monetary values")
        elif status == "not_a_benefit":
            raise ValueError(f"{item_id}: benefit cannot use not_a_benefit")

        if item.get("estimated_value") is None and not str(item.get("value_basis") or "").strip():
            raise ValueError(f"{item_id}: null estimate requires value_basis")
        basis = str(item.get("value_basis") or "")
        if item["is_benefit"] and any(marker in basis for marker in _NON_BENEFIT_BASIS_MARKERS):
            raise ValueError(f"{item_id}: value_basis contradicts is_benefit=true")
        if status == "estimated" and item.get("estimated_value") is None:
            raise ValueError(f"{item_id}: estimated status requires estimated_value")
        if status == "conditional_reward":
            if item.get("estimated_value_min") is None:
                raise ValueError(f"{item_id}: conditional reward requires a minimum (guaranteed) value")
            # estimated_value_max는 null 허용 (상금 미공개 공모전은 최대값 산출 불가가 정상)
        if status == "missing_source_data" and not item["requires_source_review"]:
            raise ValueError(f"{item_id}: missing source data requires source review")


def _merge_enrichment(records: list[dict[str, Any]], enrichments: list[dict[str, Any]]) -> list[dict[str, Any]]:
    enrichment_by_id = {str(item.get("id")): item for item in enrichments if item.get("id") is not None}
    merged_records: list[dict[str, Any]] = []
    for record in records:
        merged = dict(record)
        enrichment = enrichment_by_id.get(_record_id(record))
        if enrichment is None:
            raise EnrichmentBatchError(
                f"Missing enrichment result for record {_record_id(record)}"
            )
        for key in (
            "estimated_value",
            "estimated_value_min",
            "estimated_value_max",
            "expected_value",
            "guaranteed_value",
            "conditional_reward_min",
            "conditional_reward_max",
            "value_basis",
            "valuation_status",
            "eligibility_scope",
            "confidence",
            "requires_source_review",
        ):
            merged[key] = enrichment.get(key)
        for key in (
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
        merged["value_status"] = (
            "estimated" if enrichment.get("estimated_value") is not None else "needs_estimation"
        )
        merged["enrichment_status"] = (
            "success_valued"
            if enrichment.get("estimated_value") is not None
            else "success_unvalued"
        )
        merged["enrichment_error"] = None
        merged["source"] = "server_crawled_enriched"
        merged_records.append(merged)
    return merged_records


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
