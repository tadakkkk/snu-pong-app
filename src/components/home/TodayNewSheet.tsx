"use client";

import Link from "next/link";
import { items } from "@/data/items";
import { logEvent } from "@/lib/analytics";

interface TodayNewSheetProps {
  open: boolean;
  onClose: () => void;
}

function getDday(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export default function TodayNewSheet({ open, onClose }: TodayNewSheetProps) {
  if (!open) return null;

  const kstToday = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  const todayItems = items
    .filter((i) => i.first_seen && i.first_seen.slice(0, 10) === kstToday)
    .sort((a, b) => (b.first_seen ?? "").localeCompare(a.first_seen ?? ""));

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      {/* dim */}
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      {/* sheet */}
      <div className="relative bg-surface rounded-t-[20px] max-h-[75%] flex flex-col">
        {/* handle + header */}
        <div className="pt-3 pb-2 px-5 shrink-0">
          <div className="w-9 h-1 bg-ink/15 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <p className="text-[16px] font-semibold text-ink">
              오늘 들어온 혜택 {todayItems.length}개
            </p>
            <button onClick={onClose} className="text-[15px] text-ink-3 active:opacity-60">
              ✕
            </button>
          </div>
        </div>

        {/* list */}
        <div className="px-5 overflow-y-auto flex-1">
          {todayItems.length === 0 ? (
            <p className="text-[13px] text-ink-3 py-6 text-center">
              오늘은 아직 새 혜택이 없어요
            </p>
          ) : (
            <div className="divide-y divide-hairline">
              {todayItems.map((item) => {
                const isCrawledUnestimated =
                  item.is_crawled && item.value_status === "needs_estimation";
                const dday = item.deadline_date ? getDday(item.deadline_date) : null;
                return (
                  <Link
                    key={item.id}
                    href={`/pong/${item.id}`}
                    onClick={() => {
                      logEvent("today_new_item_click", { item_id: item.id });
                      onClose();
                    }}
                  >
                    <div className="py-2.5 flex justify-between items-center">
                      <span className="text-[13px] flex-1 min-w-0 text-ink">
                        {item.name}
                        {item.is_crawled ? (
                          <span className="ml-1.5 inline-block px-1 py-0.5 text-[10px] rounded bg-[#E1F5EE] text-[#0F6E56] font-normal not-italic">
                            자동수집
                          </span>
                        ) : !item.deadline_date ? (
                          <span className="ml-1.5 inline-block px-1 py-0.5 text-[10px] rounded bg-[#E8F0FE] text-[#2F6FE8] font-normal not-italic">
                            상시
                          </span>
                        ) : null}
                      </span>
                      {dday !== null && dday >= 0 && (
                        <span
                          className={`text-[11px] font-medium ml-2 shrink-0 tabular-nums ${
                            dday <= 3 ? "text-red" : dday <= 14 ? "text-[#E88B30]" : "text-ink-3"
                          }`}
                        >
                          {dday === 0 ? "D-Day" : `D-${dday}`}
                        </span>
                      )}
                      <span
                        className={`text-[12px] font-medium ml-3 shrink-0 ${
                          isCrawledUnestimated ? "text-[#8B95A1]" : "text-ink"
                        }`}
                      >
                        {isCrawledUnestimated
                          ? "가치 확인 중"
                          : `+${Math.round(item.value / 10000)}만`}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* bottom action */}
        <div className="px-5 pb-7 pt-2 shrink-0 border-t border-hairline">
          <Link
            href="/pong?sort=recent"
            onClick={onClose}
            className="block w-full py-3.5 rounded-2xl bg-ink text-white text-[15px] font-medium active:opacity-80 text-center"
          >
            전체 목록에서 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
