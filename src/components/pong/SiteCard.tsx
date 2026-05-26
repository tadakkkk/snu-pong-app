import { type Site, SITE_CATEGORY_LABELS } from "@/data/sites";

interface SiteCardProps {
  site: Site;
  noticeCount?: number;
}

export default function SiteCard({ site, noticeCount }: SiteCardProps) {
  return (
    <a
      href={site.url}
      target="_blank"
      rel="noopener noreferrer"
      className="py-3 flex items-start justify-between gap-3 active:opacity-70"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[13px] text-ink font-medium truncate">{site.name}</p>
          {noticeCount != null && noticeCount > 0 && (
            <span className="shrink-0 text-[10px] px-1 py-0.5 rounded bg-[#E1F5EE] text-[#0F6E56]">
              최근 공지 {noticeCount}개
            </span>
          )}
        </div>
        <p className="text-[11px] text-ink-3 mt-0.5 line-clamp-1">
          {site.description}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0 mt-0.5">
        <span className="text-[10px] text-ink-3">
          {SITE_CATEGORY_LABELS[site.category]}
        </span>
        <span className="text-[11px] text-blue">↗</span>
      </div>
    </a>
  );
}
