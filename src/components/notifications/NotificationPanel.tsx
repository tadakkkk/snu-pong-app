"use client";

import Link from "next/link";
import { getRecentNewItems } from "@/data/items";
import { isUnread } from "@/lib/notifications";
import { logEvent } from "@/lib/analytics";

interface Props {
  open: boolean;
  onClose: () => void;
  /** 패널을 연 순간 고정된 seenAt — 패널 안에서 '새 항목' 점이 사라지지 않게 */
  frozenSeenAt: string | null;
}

function getDday(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

export default function NotificationPanel({ open, onClose, frozenSeenAt }: Props) {
  if (!open) return null;
  const recent = getRecentNewItems(7);

  return (
    <div className="absolute inset-0 z-50">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="absolute top-0 left-0 right-0 bg-surface rounded-b-[20px] max-h-[80%] flex flex-col shadow-lg">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0">
          <p className="text-[16px] font-semibold text-ink">새로 들어온 혜택</p>
          <button onClick={onClose} className="text-[15px] text-ink-3 active:opacity-60">
            ✕
          </button>
        </div>

        <div className="px-5 overflow-y-auto flex-1 pb-3">
          {recent.length === 0 ? (
            <p className="text-[13px] text-ink-3 py-8 text-center">
              최근 새로 들어온 혜택이 없어요
            </p>
          ) : (
            <div className="divide-y divide-hairline">
              {recent.map((item) => {
                const unread = isUnread(item.first_seen, frozenSeenAt);
                const isCrawledUnestimated =
                  item.is_crawled && item.value_status === "needs_estimation";
                const dday = item.deadline_date ? getDday(item.deadline_date) : null;
                return (
                  <Link
                    key={item.id}
                    href={`/pong/${item.id}`}
                    onClick={() => {
                      logEvent("notification_item_click", { item_id: item.id });
                      onClose();
                    }}
                  >
                    <div className="py-3 flex items-center gap-2.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          unread ? "bg-red" : "bg-transparent"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-ink leading-snug line-clamp-2">
                          {item.name}
                          {item.is_crawled ? (
                            <span className="ml-1.5 inline-block px-1 py-0.5 text-[10px] rounded bg-[#E1F5EE] text-[#0F6E56] align-middle">
                              자동수집
                            </span>
                          ) : null}
                        </p>
                        <p className="text-[11px] text-ink-3 mt-0.5">
                          {item.category_label}
                          {item.first_seen
                            ? ` · ${item.first_seen.slice(5, 10).replace("-", ".")}`
                            : ""}
                        </p>
                      </div>
                      {dday !== null && dday >= 0 && (
                        <span
                          className={`text-[11px] font-medium shrink-0 tabular-nums ${
                            dday <= 3 ? "text-red" : dday <= 14 ? "text-[#E88B30]" : "text-ink-3"
                          }`}
                        >
                          {dday === 0 ? "D-Day" : `D-${dday}`}
                        </span>
                      )}
                      <span
                        className={`text-[12px] font-medium shrink-0 ${
                          isCrawledUnestimated ? "text-[#8B95A1]" : "text-ink"
                        }`}
                      >
                        {isCrawledUnestimated ? "확인 중" : `+${Math.round(item.value / 10000)}만`}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-5 pb-5 pt-2 shrink-0 border-t border-hairline">
          <Link
            href="/pong?sort=recent"
            onClick={onClose}
            className="block w-full py-3 rounded-2xl bg-surface-sub text-ink text-[14px] font-medium active:opacity-70 text-center"
          >
            전체 목록에서 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
