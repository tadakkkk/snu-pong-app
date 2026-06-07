"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatWonCompact } from "@/lib/format-currency";
import type { PongItem } from "@/data/items";

interface Props {
  label: string;
  labelColor: string; // tailwind text color class
  cover: string; // 카드 앞면 이모지 심볼
  item: PongItem;
  dday: number | null;
  /** 계정에 저장된 관심사(태그/카테고리)에 맞춰 뽑힌 카드면 true → 맞춤 배지 표시 */
  personalized?: boolean;
  /** 부모가 새로고침 시 열린 카드를 앞면으로 닫는 신호 */
  closeSignal?: boolean;
}

/** 탭하면 뒤집혀 추천 혜택이 드러나는 '운세 카드'. 다시 탭하면 상세로 이동. */
export default function FortuneCard({ label, labelColor, cover, item, dday, personalized, closeSignal }: Props) {
  const router = useRouter();
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (closeSignal) setFlipped(false);
  }, [closeSignal]);

  return (
    <div className="[perspective:1000px] h-[185px]">
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "none",
        }}
      >
        {/* 앞면 (타로 카드) */}
        <button
          onClick={() => setFlipped(true)}
          className="absolute inset-0 rounded-2xl overflow-hidden active:opacity-90"
          style={{
            background: "radial-gradient(circle at 50% 42%, #241B3A 0%, #130E22 100%)",
            backfaceVisibility: "hidden",
          }}
          aria-label={`${label} 카드 뒤집기`}
        >
          {/* 골드 프레임 + 아치 + 오너먼트 */}
          <svg viewBox="0 0 150 185" className="absolute inset-0 w-full h-full" preserveAspectRatio="none" aria-hidden="true">
            {/* 골드 이중 테두리 */}
            <rect x="6" y="6" width="138" height="173" rx="11" fill="none" stroke="#C9A24B" strokeWidth="1"/>
            {/* 상단 아치 */}
            <path d="M28 92 Q28 38 75 38 Q122 38 122 92" fill="none" stroke="#C9A24B" strokeWidth="0.8"/>
            <path d="M33 92 Q33 44 75 44 Q117 44 117 92" fill="none" stroke="#C9A24B" strokeWidth="0.4" opacity="0.5"/>
            {/* 별 흩뿌림 */}
            <g fill="#E6C98A">
              <path d="M55 60 l1.2 3 l3 0.4 l-2.2 2 l0.6 3 l-2.6-1.5 l-2.6 1.5 l0.6-3 l-2.2-2 l3-0.4 z" opacity="0.9"/>
              <circle cx="95" cy="62" r="1.3"/><circle cx="78" cy="53" r="1"/>
              <circle cx="64" cy="76" r="0.8"/><circle cx="90" cy="78" r="0.8"/>
            </g>
            {/* 중앙 구분선 + 점 */}
            <line x1="34" y1="116" x2="116" y2="116" stroke="#C9A24B" strokeWidth="0.5" opacity="0.6"/>
            <circle cx="75" cy="116" r="1.6" fill="#E6C98A"/>
            {/* 하단 곡선 오너먼트 */}
            <path d="M45 165 Q60 159 75 165 Q90 171 105 165" fill="none" stroke="#C9A24B" strokeWidth="0.6" opacity="0.6"/>
            {/* 모서리 점 */}
            <g fill="#E6C98A">
              <circle cx="18" cy="18" r="1.3"/><circle cx="132" cy="18" r="1.3"/>
              <circle cx="18" cy="167" r="1.3"/><circle cx="132" cy="167" r="1.3"/>
            </g>
          </svg>

          {/* 이모지 심볼 (아치 안) */}
          <span className="absolute left-0 right-0 text-center text-[30px] leading-none" style={{ top: "52px" }}>{cover}</span>

          {/* 라벨 (구분선 아래) */}
          <span className="absolute left-0 right-0 text-center" style={{ top: "126px", color: "#F0E6C8", fontFamily: 'Georgia, "Nanum Myeongjo", serif', letterSpacing: "3px", fontSize: "12px", fontWeight: 500 }}>{label}</span>

          {/* 부제 */}
          <span className="absolute left-0 right-0 text-center italic" style={{ top: "144px", color: "#A99564", fontFamily: 'Georgia, "Nanum Myeongjo", serif', fontSize: "9px" }}>클릭해서 뽑기</span>

          {/* personalized 배지 */}
          {personalized && (
            <span
              className="absolute top-2.5 right-2.5 text-[8px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ color: "#1A1330", backgroundColor: "#E6C98A" }}
            >
              ✦ 관심
            </span>
          )}
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
