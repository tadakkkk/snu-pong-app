import Link from "next/link";
import { type PongItem } from "@/data/items";
import { type Site } from "@/data/sites";
import SiteCard from "./SiteCard";

interface SearchResultsProps {
  items: PongItem[];
  sites: Site[];
  pongedIds: Set<string>;
}

export default function SearchResults({
  items,
  sites,
  pongedIds,
}: SearchResultsProps) {
  const hasItems = items.length > 0;
  const hasSites = sites.length > 0;

  if (!hasItems && !hasSites) {
    return (
      <p className="text-center text-[13px] text-ink-3 py-12">
        검색 결과가 없어요
      </p>
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
