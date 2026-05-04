"use client";

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "검색",
}: SearchBarProps) {
  return (
    <div className="px-5 pb-3">
      <div className="bg-surface-muted rounded-[10px] px-[14px] py-[11px] flex items-center gap-2">
        <span className="text-[14px] text-ink-3">⌕</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 text-[13px] text-ink bg-transparent outline-none placeholder:text-ink-3"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="text-[13px] text-ink-3 active:opacity-60"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
