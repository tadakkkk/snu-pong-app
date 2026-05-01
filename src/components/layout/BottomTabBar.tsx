"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/home", label: "홈" },
  { href: "/pong", label: "등록금 뽕뽑기" },
  { href: "/records", label: "내 기록" },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <div className="border-t border-hairline flex pb-6 pt-3 bg-surface">
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 flex flex-col items-center gap-0.5 text-[11px] font-medium transition-colors ${
              active ? "text-ink" : "text-ink-3"
            }`}
          >
            <span className="text-[18px]">{active ? "●" : "○"}</span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
