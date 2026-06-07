"use client";

import { useState } from "react";
import Link from "next/link";
import MobileFrame from "@/components/ui/MobileFrame";
import StatusBar from "@/components/ui/StatusBar";
import BottomTabBar from "@/components/layout/BottomTabBar";
import MagpieByProgress from "@/components/magpie/MagpieByProgress";
import ProgressBar from "@/components/ui/ProgressBar";
import ShareCardModal from "@/components/records/ShareCardModal";
import { usePongStore } from "@/store/pong";
import { useSemesterStore } from "@/store/semester";
import { getItem } from "@/data/items";
import { formatWon } from "@/lib/format-currency";

type SortMode = "value" | "date";

function getMood(percent: number): string {
  if (percent === 0) return "배고파";
  if (percent < 25) return "심심해";
  if (percent < 50) return "좋아";
  if (percent < 75) return "신나";
  if (percent < 100) return "행복해";
  return "완벽해 ✨";
}

export default function RecordsPage() {
  const { semesters, activeSemesterId } = useSemesterStore();
  const { getRecordsBySemester, getTotalBySemester } = usePongStore();
  const allRecords = usePongStore((s) => s.records);
  const claimedTotal = new Set(allRecords.map((r) => r.itemId)).size;

  const sortedSems = [...semesters].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return b.term - a.term;
  });

  const [viewSemId, setViewSemId] = useState<string | null>(activeSemesterId);
  const [sortMode, setSortMode] = useState<SortMode>("value");
  const [showShareCard, setShowShareCard] = useState(false);
  const [copied, setCopied] = useState(false);

  const viewSemester = semesters.find((s) => s.id === viewSemId);
  const records = viewSemId ? getRecordsBySemester(viewSemId) : [];

  const sorted = [...records].sort((a, b) =>
    sortMode === "value"
      ? b.value - a.value
      : new Date(b.pongAt).getTime() - new Date(a.pongAt).getTime()
  );

  const total = viewSemId ? getTotalBySemester(viewSemId) : 0;
  const netBurden = viewSemester?.netBurden ?? 0;
  const percent = netBurden > 0 ? Math.round((total / netBurden) * 100) : 0;
  const allTotal = semesters.reduce((sum, s) => sum + getTotalBySemester(s.id), 0);

  function handleShareText() {
    const semLabel = viewSemester
      ? `${viewSemester.year} - ${viewSemester.term}학기`
      : "전체";
    const text = `서울대 등록금 뽕뽑기\n${semLabel}: +${formatWon(total)} 달성!${
      netBurden > 0 ? ` (등록금의 ${percent}%)` : ""
    }\n\n낸 만큼 누리고 졸업하자`;

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: "서울대 등록금 뽕뽑기", text });
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  function handleShare() {
    setShowShareCard(true);
  }

  return (
    <MobileFrame>
      <StatusBar />

      {/* 헤더 */}
      <div className="px-5 pt-4 pb-3 flex justify-between items-center">
        <h1 className="text-[22px] font-medium text-ink">내가 뽑은 뽕</h1>
        <button
          onClick={handleShare}
          className="text-[13px] text-blue font-medium active:opacity-60"
        >
          {copied ? "복사됨 ✓" : "공유"}
        </button>
      </div>

      {/* 학기 탭 (복수일 때만) */}
      {sortedSems.length > 1 && (
        <div className="px-5 pb-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {sortedSems.map((sem) => (
            <button
              key={sem.id}
              onClick={() => setViewSemId(sem.id)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-[13px] transition-colors ${
                sem.id === viewSemId
                  ? "bg-ink text-white font-medium"
                  : "bg-surface-sub text-ink-3"
              }`}
            >
              {sem.year} {sem.term}학기
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {/* ── 까마고치 (큰 캐릭터 + 기분 + 총액 + 진행바) ── */}
        <div data-tour="magpie" className="px-6 pb-5 pt-2">
          <div className="flex flex-col items-center">
            <MagpieByProgress percent={percent} size={110} />
            <p className="mt-2 text-[12px] text-ink-3">{getMood(percent)}</p>
            <p className="mt-1 text-[11px] text-blue">
              {claimedTotal > 0
                ? `지금까지 ${claimedTotal}개 뽑았어요 · 추천이 학습 중이에요`
                : "뽑을수록 추천이 점점 똑똑해져요"}
            </p>
          </div>
          <div className="text-center mt-4">
            <p className="text-[12px] text-ink-3 mb-1">
              {viewSemester
                ? `${viewSemester.year} - ${viewSemester.term}학기`
                : "전체"}{" "}
              뽑은 가치
            </p>
            <p className="text-[34px] font-medium text-ink leading-tight">
              +{formatWon(total)}
            </p>
            {netBurden > 0 && (
              <p className="text-[12px] text-ink-3 mt-1.5">
                실 부담 {formatWon(netBurden)} 중 {percent}%
              </p>
            )}
          </div>
          <ProgressBar percent={percent} className="mt-5" />
        </div>

        {/* 컬렉션 */}
        {sorted.length === 0 ? (
          <div className="px-6 py-12 text-center border-t border-hairline">
            <p className="text-[14px] text-ink-3 mb-2">아직 뽕뽑은 항목이 없어요</p>
            <Link href="/pong" className="text-[13px] text-blue font-medium">
              뽕뽑으러 가기 →
            </Link>
          </div>
        ) : (
          <div className="border-t border-hairline">
            <div className="px-5 pt-3 pb-2 flex gap-2 items-center">
              <button
                onClick={() => setSortMode("value")}
                className={`px-3 py-1 rounded-full text-[12px] transition-colors ${
                  sortMode === "value"
                    ? "bg-ink text-white"
                    : "bg-surface-sub text-ink-3"
                }`}
              >
                가치순
              </button>
              <button
                onClick={() => setSortMode("date")}
                className={`px-3 py-1 rounded-full text-[12px] transition-colors ${
                  sortMode === "date"
                    ? "bg-ink text-white"
                    : "bg-surface-sub text-ink-3"
                }`}
              >
                최신순
              </button>
              <span className="ml-auto text-[12px] text-ink-3">{sorted.length}개</span>
            </div>
            <div className="px-5 pb-6">
              <div className="grid grid-cols-2 gap-2">
                {sorted.map((record) => {
                  const item = getItem(record.itemId);
                  const date = new Date(record.pongAt);
                  const dateLabel = `${date.getMonth() + 1}.${date.getDate()}`;
                  return (
                    <Link key={record.id} href={`/pong/${record.itemId}`}>
                      <div className="bg-surface-sub rounded-xl p-[14px] active:opacity-70 transition-opacity">
                        <p className="text-[10px] text-ink-3 mb-1.5">
                          {item?.category_label ?? "기타"}
                        </p>
                        <p className="text-[13px] font-medium text-ink leading-snug mb-2.5">
                          {item?.name ?? record.itemId}
                        </p>
                        <p className="text-[15px] font-medium text-ink">
                          +{formatWon(record.value)}
                        </p>
                        <p className="text-[10px] text-ink-3 mt-1">{dateLabel}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 학기별 누적 */}
        {sortedSems.length > 0 && (
          <div className="px-5 py-4 border-t border-hairline">
            <p className="text-[12px] text-ink-3 font-medium mb-3">학기별 누적</p>
            {sortedSems.map((sem) => {
              const semTotal = getTotalBySemester(sem.id);
              return (
                <div
                  key={sem.id}
                  className="py-2.5 border-b border-hairline last:border-0 flex justify-between items-center"
                >
                  <div>
                    <p className="text-[14px] text-ink">
                      {sem.year} - {sem.term}학기
                    </p>
                    {sem.id === activeSemesterId && (
                      <p className="text-[11px] text-blue mt-0.5">진행 중</p>
                    )}
                  </div>
                  <span className="text-[14px] text-ink">
                    +{formatWon(semTotal)}
                  </span>
                </div>
              );
            })}
            <div className="pt-3 flex justify-between items-center">
              <span className="text-[13px] font-medium text-ink">전체 누적</span>
              <span className="text-[16px] font-medium text-ink">
                +{formatWon(allTotal)}
              </span>
            </div>
          </div>
        )}
      </div>

      <BottomTabBar />

      {/* ── 공유 카드 모달 ── */}
      {showShareCard && (
        <ShareCardModal
          semesterLabel={
            viewSemester
              ? `${viewSemester.year} - ${viewSemester.term}학기`
              : "전체"
          }
          total={total}
          netBurden={netBurden}
          percent={percent}
          records={records}
          onClose={() => setShowShareCard(false)}
          onShareText={handleShareText}
          copied={copied}
        />
      )}
    </MobileFrame>
  );
}
