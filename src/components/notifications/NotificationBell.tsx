"use client";

interface Props {
  count: number;
  onClick: () => void;
}

export default function NotificationBell({ count, onClick }: Props) {
  return (
    <button onClick={onClick} className="relative text-ink active:opacity-60" aria-label="알림">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3a6 6 0 0 0-6 6c0 3.5-1 5-1.8 5.9-.4.4-.1 1.1.5 1.1h14.6c.6 0 .9-.7.5-1.1C19 14 18 12.5 18 9a6 6 0 0 0-6-6Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-red text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
