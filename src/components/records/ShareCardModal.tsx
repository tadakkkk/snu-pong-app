"use client";

import MagpieByProgress from "@/components/magpie/MagpieByProgress";
import type { PongRecord } from "@/store/pong";
import { getItem } from "@/data/items";

interface Props {
  semesterLabel: string;
  total: number;
  netBurden: number;
  percent: number;
  records: PongRecord[];
  onClose: () => void;
  onShareText: () => void;
  copied: boolean;
}

export default function ShareCardModal({
  semesterLabel,
  total,
  netBurden,
  percent,
  records,
  onClose,
  onShareText,
  copied,
}: Props) {
  const topRecords = [...records]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center px-5">
      <div className="absolute inset-0 bg-ink/70" onClick={onClose} />

      <div className="relative w-full">
        {/* 카드 */}
        <div className="bg-ink rounded-2xl px-6 pt-8 pb-7 w-full">
          {/* 헤더 */}
          <p className="text-[11px] text-white/50 font-medium tracking-widest mb-1">
            서울대 등록금 뽕뽑기
          </p>
          <p className="text-[15px] text-white/70 mb-6">{semesterLabel}</p>

          {/* 까치 + 금액 */}
          <div className="flex items-center gap-5 mb-6">
            <MagpieByProgress percent={percent} size={64} />
            <div>
              <p className="text-[34px] font-medium text-white leading-tight">
                +{total.toLocaleString("ko-KR")}원
              </p>
              {netBurden > 0 && (
                <p className="text-[13px] text-white/60 mt-0.5">
                  등록금의 {percent}% 뽕뽑음
                </p>
              )}
            </div>
          </div>

          {/* 항목 목록 */}
          {topRecords.length > 0 && (
            <div className="border-t border-white/10 pt-4 flex flex-col gap-2">
              {topRecords.map((record) => {
                const item = getItem(record.itemId);
                return (
                  <div key={record.id} className="flex justify-between items-center">
                    <p className="text-[12px] text-white/70 truncate pr-3">
                      {item?.name ?? record.itemId}
                    </p>
                    <p className="text-[12px] text-white/50 shrink-0">
                      +{Math.round(record.value / 10000)}만
                    </p>
                  </div>
                );
              })}
              {records.length > 5 && (
                <p className="text-[11px] text-white/40 mt-1">
                  외 {records.length - 5}개 항목
                </p>
              )}
            </div>
          )}

          {records.length === 0 && (
            <p className="text-[13px] text-white/40 text-center py-4">
              아직 뽑은 항목이 없어요
            </p>
          )}
        </div>

        {/* 안내 + 버튼 */}
        <p className="text-center text-[12px] text-white/50 mt-3 mb-3">
          스크린샷으로 저장해서 공유해요
        </p>
        <div className="flex gap-2">
          <button
            onClick={onShareText}
            className="flex-1 py-3 rounded-xl text-[13px] bg-white/10 text-white font-medium active:opacity-70"
          >
            {copied ? "복사됨 ✓" : "링크 복사"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-[13px] bg-white/10 text-white/70 active:opacity-70"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
