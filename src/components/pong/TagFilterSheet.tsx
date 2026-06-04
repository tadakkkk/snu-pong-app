"use client";

import { useState } from "react";

interface TagFilterSheetProps {
  open: boolean;
  onClose: () => void;
  tags: { tag: string; count: number }[];
  selected: string[];
  onChange: (next: string[]) => void;
  resultCount: number;
}

export default function TagFilterSheet({
  open,
  onClose,
  tags,
  selected,
  onChange,
  resultCount,
}: TagFilterSheetProps) {
  const [query, setQuery] = useState("");
  if (!open) return null;

  const filtered = query
    ? tags.filter((t) => t.tag.toLowerCase().includes(query.toLowerCase()))
    : tags;

  function toggle(tag: string) {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  }

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
            <p className="text-[16px] font-semibold text-ink">태그 선택</p>
            <button onClick={onClose} className="text-[15px] text-ink-3 active:opacity-60">닫기</button>
          </div>
        </div>

        {/* search */}
        <div className="px-5 pb-2 shrink-0">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="태그 검색"
            className="w-full bg-[#F2F4F6] rounded-xl px-3.5 py-2.5 text-[14px] text-ink placeholder:text-ink-3 outline-none"
          />
        </div>

        {/* selected summary */}
        {selected.length > 0 && (
          <div className="px-5 pb-2 shrink-0 flex items-center justify-between">
            <p className="text-[12px] text-ink-3">{selected.length}개 선택됨</p>
            <button onClick={() => onChange([])} className="text-[12px] text-blue active:opacity-60">
              모두 해제
            </button>
          </div>
        )}

        {/* tag chips */}
        <div className="px-5 pb-3 overflow-y-auto flex-1">
          <div className="flex flex-wrap gap-2">
            {filtered.map(({ tag, count }) => {
              const on = selected.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggle(tag)}
                  className={`text-[13px] px-3 py-1.5 rounded-full transition-colors ${
                    on ? "bg-ink text-white" : "bg-surface-sub text-ink-2"
                  }`}
                >
                  {tag} <span className={on ? "text-white/60" : "text-ink-3"}>{count}</span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-[13px] text-ink-3 py-4">검색 결과가 없어요</p>
            )}
          </div>
        </div>

        {/* bottom action */}
        <div className="px-5 pb-7 pt-2 shrink-0 border-t border-hairline">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-ink text-white text-[15px] font-medium active:opacity-80"
          >
            {resultCount}개 항목 보기
          </button>
        </div>
      </div>
    </div>
  );
}
