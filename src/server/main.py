from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from importlib import util
from pathlib import Path
from typing import Any, Callable, Literal
import asyncio
import random
import sys


SERVER_TIME_ZONE = "Asia/Seoul"
DAILY_CRAWL_HOUR_KST = 5
DAILY_CRAWL_CRON_UTC = "0 20 * * *"
PROJECT_ROOT = Path(__file__).resolve().parents[2]
CRAWLING_RULES_DIR = PROJECT_ROOT / "src" / "server" / "crawling_rules"
SCHEDULED_CRAWLER_DELAY_SECONDS = 2.0
SCHEDULED_CRAWLER_JITTER_SECONDS = 1.0
DEPARTMENT_REQUEST_DELAY_SECONDS = 1.5
DEPARTMENT_REQUEST_JITTER_SECONDS = 0.5

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


@dataclass(frozen=True)
class ScheduledCrawlerResult:
    crawler_id: str
    group: str
    status: Literal["success", "failed"]
    records_count: int
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


@dataclass(frozen=True)
class CrawlerScheduleEntry:
    crawler_id: str
    group: str
    relative_path: str
    crawl_kwargs: dict[str, Any] | None = None


SCHEDULED_CRAWLERS: tuple[CrawlerScheduleEntry, ...] = (
    CrawlerScheduleEntry("announcements_calendar", "announcements", "announcements/Calendar.py"),
    CrawlerScheduleEntry("announcements_events", "announcements", "announcements/Events.py"),
    CrawlerScheduleEntry("announcements_notices", "announcements", "announcements/GeneralNotices.py"),
    CrawlerScheduleEntry("announcements_public_events", "announcements", "announcements/PublicEvents.py"),
    CrawlerScheduleEntry("welfare_amenities", "welfare", "welfare/Amenities.py"),
    CrawlerScheduleEntry("welfare_culture", "welfare", "welfare/Culture.py"),
    CrawlerScheduleEntry("welfare_dining", "welfare", "welfare/Dining.py"),
    CrawlerScheduleEntry("welfare_disability_support", "welfare", "welfare/DisabilitySupport.py"),
    CrawlerScheduleEntry("welfare_dormitory", "welfare", "welfare/Dormitory.py"),
    CrawlerScheduleEntry("welfare_health_services", "welfare", "welfare/HealthServices.py"),
    CrawlerScheduleEntry("welfare_it_services", "welfare", "welfare/ITServices.py"),
    CrawlerScheduleEntry("welfare_library", "welfare", "welfare/Library.py"),
    CrawlerScheduleEntry("welfare_scholarships", "welfare", "welfare/Scholarships.py"),
    CrawlerScheduleEntry("welfare_student_support", "welfare", "welfare/StudentSupport.py"),
    CrawlerScheduleEntry("welfare_transit", "welfare", "welfare/Transit.py"),
    CrawlerScheduleEntry("affiliated_disability_support", "affiliated", "affiliated/DisabilitySupport.py"),
    CrawlerScheduleEntry("affiliated_student_center", "affiliated", "affiliated/StudentCenter.py"),
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
        raise NotImplementedError("list_benefit_items is not implemented")

    async def get_benefit_item_by_id(
        self,
        item_id: str,
        context: ServerQueryContext = ServerQueryContext(),
    ) -> BenefitItemDetail | None:
        raise NotImplementedError("get_benefit_item_by_id is not implemented")

    async def list_crawl_sources(
        self,
        query: SourceQuery = SourceQuery(),
        context: ServerQueryContext = ServerQueryContext(),
    ) -> list[CrawlSourceSummary]:
        raise NotImplementedError("list_crawl_sources is not implemented")


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

        for index, crawler_entry in enumerate(SCHEDULED_CRAWLERS):
            if index > 0:
                await _sleep_between_crawlers()
            crawler_results.append(await _run_scheduled_crawler(crawler_entry, context))

        finished_at = datetime.now().isoformat()
        failed_count = sum(1 for result in crawler_results if result.status == "failed")
        if failed_count == 0:
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
        )


async def _sleep_between_crawlers() -> None:
    delay = SCHEDULED_CRAWLER_DELAY_SECONDS + random.uniform(0.0, SCHEDULED_CRAWLER_JITTER_SECONDS)
    await asyncio.sleep(delay)


async def _run_scheduled_crawler(
    crawler_entry: CrawlerScheduleEntry,
    context: ScheduledActionContext,
) -> ScheduledCrawlerResult:
    try:
        crawl = _load_crawl_function(crawler_entry)
        kwargs = dict(crawler_entry.crawl_kwargs or {})
        if context.max_records_per_crawler is not None:
            kwargs["max_records"] = context.max_records_per_crawler
        records = await asyncio.to_thread(crawl, **kwargs)
        return ScheduledCrawlerResult(
            crawler_id=crawler_entry.crawler_id,
            group=crawler_entry.group,
            status="success",
            records_count=len(records),
        )
    except Exception as error:
        return ScheduledCrawlerResult(
            crawler_id=crawler_entry.crawler_id,
            group=crawler_entry.group,
            status="failed",
            records_count=0,
            error=repr(error),
        )


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
