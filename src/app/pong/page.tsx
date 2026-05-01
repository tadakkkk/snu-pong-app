"use client";

import { useState } from "react";
import Link from "next/link";
import MobileFrame from "@/components/ui/MobileFrame";
import BottomTabBar from "@/components/layout/BottomTabBar";
import MagpieWithCoin from "@/components/magpie/MagpieWithCoin";
import { items, CATEGORY_META, type Category } from "@/data/items";
import { usePongStore } from "@/store/pong";
import { useSemesterStore } from "@/store/semester";

const CATEGORIES = Object.entries(CATEGORY_META) as [
  Category,
  { label: string; emoji: string }
][];

// 가치 기준 인기 항목 (value 높은 순 top 5)
const popularItems = [...items].sort((a, b) => b.value - a.value).slice(0, 5);

// 마감 임박: deadline_type === 'weekly' 인 항목
const deadlineItems = items.filter((i) => i.deadline_type === "weekly");
// weekly 없으면 value 높은 항목 3개로 대체
const urgentItems =
  deadlineItems.length > 0 ? deadlineItems.slice(0, 3) : items.slice(0, 3);

function ItemRow({
  item,
  ponged,
}: {
  item: (typeof items)[0];
  ponged: boolean;
}) {
  return (
    <Link href={`/pong/${item.id}`}>
      <div className="py-2.5 flex justify-between items-center">
        <span
          className={`text-[13px] ${ponged ? "text-ink-3 line-through" : "text-ink"}`}
        >
          {item.name}
          {item.deadline_type === "weekly" && (
            <span className="ml-2 text-[11px] text-red">
              · {item.deadline_label}
            </span>
          )}
        </span>
        <span
          className={`text-[12px] font-medium ml-3 shrink-0 ${ponged ? "text-ink-4" : "text-ink"}`}
        >
          +{Math.round(item.value / 10000)}만
        </span>
      </div>
    </Link>
  );
}

export default function PongPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);

  const { activeSemesterId } = useSemesterStore();
  const { hasRecordForItem } = usePongStore();

  const isPonged = (id: string) =>
    activeSemesterId ? hasRecordForItem(activeSemesterId, id) : false;

  const filtered = items.filter((item) => {
    const q = search.trim();
    const matchSearch =
      !q ||
      item.name.toLowerCase().includes(q.toLowerCase()) ||
      item.category_label.includes(q);
    const matchCat = !activeCategory || item.category === activeCategory;
    return matchSearch && matchCat;
  });

  const showFiltered = !!search || !!activeCategory;

  return (
    <MobileFrame>
      {/* 상태바 */}
      <div className="px-5 pt-3 flex justify-between text-[11px] text-ink-3">
        <span>9:41</span>
        <span>● ● ●</span>
      </div>

      {/* 헤더 */}
      <div className="px-5 pt-4 pb-3 flex justify-between items-center">
        <h1 className="text-[22px] font-medium text-ink">등록금 뽕뽑기</h1>
        <MagpieWithCoin size="sm" />
      </div>

      {/* 검색 */}
      <div className="px-5 pb-3">
        <div className="bg-surface-muted rounded-[10px] px-[14px] py-[11px] flex items-center gap-2">
          <span className="text-[14px] text-ink-3">⌕</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="검색"
            className="flex-1 text-[13px] text-ink bg-transparent outline-none placeholder:text-ink-3"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-[13px] text-ink-3"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 카테고리 그리드 (검색 중엔 숨김) */}
      {!search && (
        <div className="px-5 pb-2">
          <div className="grid grid-cols-4 gap-1.5">
            {CATEGORIES.map(([cat, meta]) => {
              const catItems = items.filter((i) => i.category === cat);
              const count = catItems.length;
              if (count === 0) return null;
              const done = catItems.filter((i) => isPonged(i.id)).length;
              const isActive = activeCategory === cat;
              const allDone = done === count;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(isActive ? null : cat)}
                  className={`rounded-[10px] py-2.5 px-1 text-center transition-colors ${
                    isActive ? "bg-ink" : allDone ? "bg-blue/10" : "bg-surface-sub"
                  }`}
                >
                  <p className="text-[16px] mb-0.5">{meta.emoji}</p>
                  <p
                    className={`text-[10px] font-medium ${isActive ? "text-white" : "text-ink"}`}
                  >
                    {meta.label}
                  </p>
                  <p
                    className={`text-[10px] ${
                      isActive
                        ? "text-white/70"
                        : allDone
                        ? "text-blue font-medium"
                        : "text-ink-3"
                    }`}
                  >
                    {done > 0 ? `${done}/${count}` : count}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto">
        {showFiltered ? (
          /* ── 검색 / 카테고리 필터 결과 ── */
          <div className="px-5 pb-6">
            {activeCategory && (
              <div className="py-2.5 flex justify-between items-center">
                <p className="text-[13px] font-medium text-ink">
                  {CATEGORY_META[activeCategory].emoji}{" "}
                  {CATEGORY_META[activeCategory].label}
                </p>
                <button
                  onClick={() => setActiveCategory(null)}
                  className="text-[12px] text-blue"
                >
                  전체 보기
                </button>
              </div>
            )}
            {filtered.map((item) => (
              <ItemRow key={item.id} item={item} ponged={isPonged(item.id)} />
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-[13px] text-ink-3 py-12">
                검색 결과가 없어요
              </p>
            )}
          </div>
        ) : (
          /* ── 기본 섹션 뷰 ── */
          <>
            {/* 마감 임박 */}
            <div className="border-t border-hairline px-5 pt-3 pb-4">
              <p className="text-[11px] text-red font-medium mb-1">
                ⚠ 마감 임박
              </p>
              {urgentItems.map((item) => (
                <div
                  key={item.id}
                  className="py-2 flex justify-between items-center"
                >
                  <span className="text-[13px] text-ink">
                    {item.name}
                    <span className="text-[11px] text-ink-3 ml-1">
                      · {item.deadline_label}
                    </span>
                  </span>
                  <span className="text-[12px] font-medium text-ink">
                    +{Math.round(item.value / 10000)}만
                  </span>
                </div>
              ))}
            </div>

            {/* 많이 뽕뽑는 거 */}
            <div className="border-t border-hairline px-5 pt-3 pb-4">
              <p className="text-[11px] text-ink-3 font-medium mb-1">
                가치 높은 항목
              </p>
              {popularItems.map((item, idx) => (
                <Link key={item.id} href={`/pong/${item.id}`}>
                  <div className="py-2 flex justify-between items-center">
                    <span className="text-[13px] text-ink">
                      <span className="text-ink-3 mr-2">{idx + 1}</span>
                      {item.name}
                    </span>
                    <span className="text-[12px] font-medium text-ink">
                      +{Math.round(item.value / 10000)}만
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* 전체 항목 */}
            <div className="border-t border-hairline px-5 pt-3 pb-6">
              <p className="text-[11px] text-ink-3 font-medium mb-1">
                전체 {items.length}개
              </p>
              {items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  ponged={isPonged(item.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <BottomTabBar />
    </MobileFrame>
  );
}
