import Link from "next/link";
import { type PongItem } from "@/data/items";
import { type Site } from "@/data/sites";
import SiteCard from "./SiteCard";

interface SearchResultsProps {
  items: PongItem[];
  sites: Site[];
  pongedIds: Set<string>;
  query: string;
}

export default function SearchResults({
  items,
  sites,
  pongedIds,
  query,
}: SearchResultsProps) {
  const hasItems = items.length > 0;
  const hasSites = sites.length > 0;

  if (!hasItems && !hasSites) {
    return (
      <div className="flex flex-col items-center py-12 px-5 text-center">
        <span className="text-3xl mb-3">🔍</span>
        <p className="text-[14px] text-ink-3">
          &lsquo;{query}&rsquo; 검색 결과가 없어요
        </p>
        <p className="text-[12px] text-ink-4 mt-1">
          다른 키워드로 찾아보거나 카테고리를 둘러보세요
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 pb-6">
      {hasItems && (
        <>
          <p className="text-[11px] text-ink-3 font-medium tracking-[0.05em] pt-3 pb-1">
            항목 {items.length}개
          </p>
          {items.map((item) => {
            const ponged = pongedIds.has(item.id);
            return (
              <Link key={item.id} href={`/pong/${item.id}`}>
                <div className="py-2.5 flex justify-between items-center border-b border-hairline last:border-0">
                  <span
                    className={`text-[13px] ${ponged ? "text-ink-3 line-through" : "text-ink"}`}
                  >
                    {item.name}
                  </span>
                  <span
                    className={`text-[12px] font-medium ml-3 shrink-0 ${ponged ? "text-ink-4" : "text-ink"}`}
                  >
                    +{Math.round(item.value / 10000)}만
                  </span>
                </div>
              </Link>
            );
          })}
        </>
      )}

      {hasSites && (
        <>
          <div className={`${hasItems ? "border-t border-hairline mt-2" : ""}`}>
            <p className="text-[11px] text-ink-3 font-medium tracking-[0.05em] pt-3 pb-1">
              부서 {sites.length}개
            </p>
            {sites.map((site) => (
              <div key={site.id} className="border-b border-hairline last:border-0">
                <SiteCard site={site} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
