from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Literal


SERVER_TIME_ZONE = "Asia/Seoul"
DAILY_CRAWL_HOUR_KST = 5
DAILY_CRAWL_CRON_UTC = "0 20 * * *"

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


@dataclass(frozen=True)
class ScheduledActionResult:
    status: Literal["not_implemented"]
    scheduled_cron_utc: str
    scheduled_time_zone: str


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
        return ScheduledActionResult(
            status="not_implemented",
            scheduled_cron_utc=DAILY_CRAWL_CRON_UTC,
            scheduled_time_zone=SERVER_TIME_ZONE,
        )


server_queries = ServerQueries()
daily_crawl_at_5am_kst = DailyCrawlAt5amKst()

