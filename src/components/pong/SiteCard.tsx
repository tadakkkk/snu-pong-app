import { type Site, SITE_CATEGORY_LABELS } from "@/data/sites";

interface SiteCardProps {
  site: Site;
}

export default function SiteCard({ site }: SiteCardProps) {
  return (
    <a
      href={site.url}
      target="_blank"
      rel="noopener noreferrer"
      className="py-3 flex items-start justify-between gap-3 active:opacity-70"
    >
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-ink font-medium truncate">{site.name}</p>
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
