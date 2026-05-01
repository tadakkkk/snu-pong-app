"use client";

import { useState } from "react";
import Link from "next/link";
import MobileFrame from "@/components/ui/MobileFrame";
import BottomTabBar from "@/components/layout/BottomTabBar";
import MagpieByProgress from "@/components/magpie/MagpieByProgress";
import ProgressBar from "@/components/ui/ProgressBar";
import ShareCardModal from "@/components/records/ShareCardModal";
import { usePongStore } from "@/store/pong";
import { useSemesterStore } from "@/store/semester";
import { getItem } from "@/data/items";

type SortMode = "value" | "date";

export default function RecordsPage() {
  const { semesters, activeSemesterId } = useSemesterStore();
  const { getRecordsBySemester, getTotalBySemester } = usePongStore();

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
    const text = `서울대 등록금 뽕뽑기\n${semLabel}: +${total.toLocaleString("ko-KR")}원 달성!${
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
      {/* 상태바 */}
      <div className="px-5 pt-3 flex justify-between text-[11px] text-ink-3">
        <span>9:41</span>
        <span>● ● ●</span>
      </div>

      {/* 헤더 */}
      <div className="px-5 pt-4 pb-3 flex justify-between items-center">
        <h1 className="text-[22px] font-medium text-ink">내가 모은 것</h1>
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
        {/* 요약 */}
        <div className="px-6 pb-5 pt-1">
          <div className="flex items-center gap-3 mb-2">
            <MagpieByProgress percent={percent} size={52} />
            <div>
              <p className="text-[12px] text-ink-3 mb-0.5">
                {viewSemester
                  ? `${viewSemester.year} - ${viewSemester.term}학기`
                  : "전체"}{" "}
                뽕뽑은 가치
              </p>
              <p className="text-[28px] font-medium text-ink leading-tight">
                +{total.toLocaleString("ko-KR")}원
              </p>
            </div>
          </div>
          {netBurden > 0 && (
            <p className="text-[12px] text-ink-3 mb-3">
              실 부담 {netBurden.toLocaleString("ko-KR")}원의 {percent}%
            </p>
          )}
          <ProgressBar percent={percent} />
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
                          +{record.value.toLocaleString("ko-KR")}원
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
                    +{semTotal.toLocaleString("ko-KR")}원
                  </span>
                </div>
              );
            })}
            <div className="pt-3 flex justify-between items-center">
              <span className="text-[13px] font-medium text-ink">전체 누적</span>
              <span className="text-[16px] font-medium text-ink">
                +{allTotal.toLocaleString("ko-KR")}원
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
