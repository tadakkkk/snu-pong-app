"use client";

import { useState } from "react";
import Link from "next/link";
import MobileFrame from "@/components/ui/MobileFrame";
import BottomTabBar from "@/components/layout/BottomTabBar";
import MagpieWithCoin from "@/components/magpie/MagpieWithCoin";
import SearchBar from "@/components/pong/SearchBar";
import ItemSiteToggle, { type ToggleMode } from "@/components/pong/ItemSiteToggle";
import SiteCard from "@/components/pong/SiteCard";
import SearchResults from "@/components/pong/SearchResults";
import { items, CATEGORY_META, type Category } from "@/data/items";
import {
  sites,
  SITE_CATEGORY_LABELS,
  SITE_CATEGORY_EMOJI,
  FREQUENT_SITE_IDS,
  type SiteCategory,
} from "@/data/sites";
import { usePongStore } from "@/store/pong";
import { useSemesterStore } from "@/store/semester";
import { useSearch } from "@/hooks/useSearch";

const CATEGORIES = Object.entries(CATEGORY_META) as [
  Category,
  { label: string; emoji: string }
][];

const SITE_CATEGORIES = [
  ...new Set(sites.map((s) => s.category)),
] as SiteCategory[];

const popularItems = [...items].sort((a, b) => b.value - a.value).slice(0, 5);
const deadlineItems = items.filter((i) => i.deadline_type === "weekly");
const urgentItems =
  deadlineItems.length > 0 ? deadlineItems.slice(0, 3) : items.slice(0, 3);
const frequentSites = FREQUENT_SITE_IDS.map((id) =>
  sites.find((s) => s.id === id)
).filter(Boolean) as typeof sites;

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
  const [mode, setMode] = useState<ToggleMode>("items");
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeSiteCategory, setActiveSiteCategory] =
    useState<SiteCategory | null>(null);

  const { activeSemesterId } = useSemesterStore();
  const { hasRecordForItem } = usePongStore();

  const isPonged = (id: string) =>
    activeSemesterId ? hasRecordForItem(activeSemesterId, id) : false;

  const pongedIds = new Set(
    items.filter((i) => isPonged(i.id)).map((i) => i.id)
  );

  const { items: searchItems, sites: searchSites, isSearching } = useSearch(search);

  const filteredItems = activeCategory
    ? items.filter((i) => i.category === activeCategory)
    : items;

  const filteredSites = activeSiteCategory
    ? sites.filter((s) => s.category === activeSiteCategory)
    : sites;

  const searchPlaceholder = mode === "sites" ? "부서 검색" : "검색";

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

      {/* 검색바 */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder={searchPlaceholder}
      />

      {/* 토글 (검색 전에만) */}
      {!isSearching && (
        <ItemSiteToggle
          mode={mode}
          onChange={(m) => {
            setMode(m);
            setActiveCategory(null);
            setActiveSiteCategory(null);
          }}
          itemCount={items.length}
          siteCount={sites.length}
        />
      )}

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto">
        {isSearching ? (
          /* ── 검색 결과: 항목 + 부서 통합 ── */
          <SearchResults
            items={searchItems}
            sites={searchSites}
            pongedIds={pongedIds}
          />
        ) : mode === "items" ? (
          /* ── 항목 모드 ── */
          <>
            {/* 카테고리 그리드 */}
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
                      onClick={() =>
                        setActiveCategory(isActive ? null : cat)
                      }
                      className={`rounded-[10px] py-2.5 px-1 text-center transition-colors ${
                        isActive
                          ? "bg-ink"
                          : allDone
                          ? "bg-blue/10"
                          : "bg-surface-sub"
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

            {activeCategory ? (
              /* 카테고리 필터 결과 */
              <div className="px-5 pb-6">
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
                {filteredItems.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    ponged={isPonged(item.id)}
                  />
                ))}
              </div>
            ) : (
              /* 기본 섹션 뷰 */
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

                {/* 가치 높은 항목 */}
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
          </>
        ) : (
          /* ── 부서 모드 ── */
          <>
            {/* 부서 카테고리 칩 */}
            <div className="px-5 pb-2">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {SITE_CATEGORIES.map((cat) => {
                  const isActive = activeSiteCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() =>
                        setActiveSiteCategory(isActive ? null : cat)
                      }
                      className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                        isActive
                          ? "bg-ink text-white"
                          : "bg-surface-sub text-ink-2"
                      }`}
                    >
                      {SITE_CATEGORY_EMOJI[cat]} {SITE_CATEGORY_LABELS[cat]}
                    </button>
                  );
                })}
              </div>
            </div>

            {activeSiteCategory ? (
              /* 카테고리 필터 결과 */
              <div className="px-5 pb-6">
                <div className="py-2.5 flex justify-between items-center">
                  <p className="text-[13px] font-medium text-ink">
                    {SITE_CATEGORY_EMOJI[activeSiteCategory]}{" "}
                    {SITE_CATEGORY_LABELS[activeSiteCategory]}
                  </p>
                  <button
                    onClick={() => setActiveSiteCategory(null)}
                    className="text-[12px] text-blue"
                  >
                    전체 보기
                  </button>
                </div>
                {filteredSites.map((site) => (
                  <div
                    key={site.id}
                    className="border-b border-hairline last:border-0"
                  >
                    <SiteCard site={site} />
                  </div>
                ))}
              </div>
            ) : (
              /* 자주 가는 곳 + 전체 */
              <>
                <div className="border-t border-hairline px-5 pt-3 pb-4">
                  <p className="text-[11px] text-ink-3 font-medium mb-1">
                    자주 가는 곳
                  </p>
                  {frequentSites.map((site) => (
                    <div
                      key={site.id}
                      className="border-b border-hairline last:border-0"
                    >
                      <SiteCard site={site} />
                    </div>
                  ))}
                </div>

                <div className="border-t border-hairline px-5 pt-3 pb-6">
                  <p className="text-[11px] text-ink-3 font-medium mb-1">
                    전체 {sites.length}개
                  </p>
                  {sites.map((site) => (
                    <div
                      key={site.id}
                      className="border-b border-hairline last:border-0"
                    >
                      <SiteCard site={site} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <BottomTabBar />
    </MobileFrame>
  );
}
