"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatWonCompact } from "@/lib/format-currency";
import type { PongItem } from "@/data/items";

interface Props {
  label: string;
  labelColor: string; // tailwind text color class
  cover: string; // 카드 뒷면(앞표지) 이모지
  item: PongItem;
  dday: number | null;
  /** 계정에 저장된 관심사(태그/카테고리)에 맞춰 뽑힌 카드면 true → 맞춤 배지 표시 */
  personalized?: boolean;
}

/** 탭하면 뒤집혀 추천 혜택이 드러나는 '운세 카드'. 다시 탭하면 상세로 이동. */
export default function FortuneCard({ label, labelColor, cover, item, dday, personalized }: Props) {
  const router = useRouter();
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="[perspective:1000px] h-[150px]">
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "none",
        }}
      >
        {/* 앞면 (덮인 카드) */}
        <button
          onClick={() => setFlipped(true)}
          className="absolute inset-0 rounded-2xl bg-ink flex flex-col items-center justify-center gap-1.5 active:opacity-90"
          style={{ backfaceVisibility: "hidden" }}
          aria-label={`${label} 카드 뒤집기`}
        >
          {personalized && (
            <span className="absolute top-2 right-2 text-[9px] font-medium text-white/90 bg-blue/90 rounded-full px-1.5 py-0.5">
              ✓ 내 관심사
            </span>
          )}
          <span className={`text-[30px] leading-none ${labelColor}`}>{cover}</span>
          <span className="text-[12px] font-medium text-white">{label}</span>
          <span className="text-[10px] text-white/60 mt-0.5">탭해서 뒤집기</span>
        </button>

        {/* 뒷면 (추천 혜택) */}
        <button
          onClick={() => router.push(`/pong/${item.id}`)}
          className="absolute inset-0 rounded-2xl bg-surface-sub border border-hairline p-3.5 flex flex-col text-left active:opacity-80"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-[10px] font-medium ${labelColor} flex items-center gap-1`}>
              {label}
              {personalized && <span className="text-[9px] text-blue">· ✓ 내 관심사</span>}
            </span>
            {dday !== null && dday >= 0 && (
              <span
                className={`text-[10px] font-medium tabular-nums ${
                  dday <= 3 ? "text-red" : "text-[#E88B30]"
                }`}
              >
                {dday === 0 ? "D-Day" : `D-${dday}`}
              </span>
            )}
          </div>
          <p className="text-[13px] font-medium text-ink leading-snug line-clamp-3 flex-1">
            {item.name}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[13px] font-medium text-ink">
              +{formatWonCompact(item.value)}
            </span>
            <span className="text-[11px] text-blue">보러가기 ›</span>
          </div>
        </button>
      </div>
    </div>
  );
}
