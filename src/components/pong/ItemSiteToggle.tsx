"use client";

export type ToggleMode = "items" | "sites";

interface ItemSiteToggleProps {
  mode: ToggleMode;
  onChange: (mode: ToggleMode) => void;
  itemCount: number;
  siteCount: number;
}

export default function ItemSiteToggle({
  mode,
  onChange,
  itemCount,
  siteCount,
}: ItemSiteToggleProps) {
  return (
    <div className="px-5 pb-3">
      <div className="bg-surface-muted rounded-[10px] p-1 flex">
        <button
          onClick={() => onChange("items")}
          className={`flex-1 py-2 rounded-[8px] text-[12px] font-medium transition-colors ${
            mode === "items"
              ? "bg-surface text-ink shadow-sm"
              : "text-ink-3"
          }`}
        >
          항목 {itemCount}
        </button>
        <button
          onClick={() => onChange("sites")}
          className={`flex-1 py-2 rounded-[8px] text-[12px] font-medium transition-colors ${
            mode === "sites"
              ? "bg-surface text-ink shadow-sm"
              : "text-ink-3"
          }`}
        >
          부서 {siteCount}
        </button>
      </div>
    </div>
  );
}
