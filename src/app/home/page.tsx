"use client";

import { useState } from "react";
import Link from "next/link";
import MobileFrame from "@/components/ui/MobileFrame";
import StatusBar from "@/components/ui/StatusBar";
import BottomTabBar from "@/components/layout/BottomTabBar";
import MagpieByProgress from "@/components/magpie/MagpieByProgress";
import ProgressBar from "@/components/ui/ProgressBar";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SemesterModal from "@/components/home/SemesterModal";
import AddSemesterModal from "@/components/home/AddSemesterModal";
import SettingsSheet from "@/components/home/SettingsSheet";
import { useUserStore } from "@/store/user";
import { usePongStore } from "@/store/pong";
import { useSemesterStore } from "@/store/semester";
import { items } from "@/data/items";
import { getDaysUntilSemesterEnd, getRecommendText } from "@/lib/semester";

function getMood(percent: number): string {
  if (percent === 0) return "배고파";
  if (percent < 25) return "심심해";
  if (percent < 50) return "좋아";
  if (percent < 75) return "신나";
  if (percent < 100) return "행복해";
  return "완벽해 ✨";
}

export default function HomePage() {
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [showAddSemester, setShowAddSemester] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const user = useUserStore();
  const { semesters, activeSemesterId, setActive, addSemester, removeSemester } =
    useSemesterStore();
  const { getTotalBySemester, hasRecordForItem } = usePongStore();

  const activeSemester = semesters.find((s) => s.id === activeSemesterId);
  const netBurden = activeSemester?.netBurden ?? user.netBurden ?? 0;
  const totalPonged = activeSemesterId ? getTotalBySemester(activeSemesterId) : 0;
  const percent = netBurden > 0 ? Math.round((totalPonged / netBurden) * 100) : 0;

  const daysLeft = activeSemester
    ? getDaysUntilSemesterEnd(activeSemester.year, activeSemester.term)
    : 0;

  const recommendedItem = (() => {
    const uncompleted = items.filter(
      (item) => !activeSemesterId || !hasRecordForItem(activeSemesterId, item.id)
    );
    if (user.interests.length > 0) {
      const match = uncompleted.find((i) => (user.interests as string[]).includes(i.category));
      if (match) return match;
    }
    return uncompleted[0];
  })();

  const semesterLabel = activeSemester
    ? `${activeSemester.year} - ${activeSemester.term}학기`
    : "학기 없음";

  const remainingCount = activeSemesterId
    ? items.filter((i) => !hasRecordForItem(activeSemesterId, i.id)).length
    : items.length;

  return (
    <MobileFrame>
      <StatusBar />

      {/* 헤더 */}
      <div className="px-5 pt-4 pb-1 flex justify-between items-center">
        <div>
          <p className="text-[18px] font-medium text-ink leading-tight">까마고치</p>
          <button
            onClick={() => setShowSemesterModal(true)}
            className="flex items-center gap-1 mt-0.5"
          >
            <span className="text-[12px] text-ink-3">{semesterLabel}</span>
            <span className="text-[10px] text-ink-3">▾</span>
          </button>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="text-[22px] text-ink active:opacity-60"
        >
          ≡
        </button>
      </div>
      {activeSemester && daysLeft > 0 && (
        <div className="px-5 pb-1">
          <p className="text-[11px] text-ink-3">학기 종료까지 {daysLeft}일</p>
        </div>
      )}

      {/* ── 스크롤 콘텐츠 영역 ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── 첫 뽕뽑기 유도 (까치 위) ── */}
        {totalPonged === 0 && (
          <div className="px-6 pt-5 pb-2">
            <div className="bg-surface-sub rounded-xl p-[18px]">
              <p className="text-[13px] text-ink leading-relaxed mb-3">
                첫 항목 뽑으면 까마고치 표정이 바뀌어.{" "}
                {recommendedItem
                  ? `${Math.round(recommendedItem.value / 10000)}만원짜리 ${recommendedItem.name}부터 어때?`
                  : "글쓰기 첨삭부터 어때?"}
              </p>
              <Link href="/pong" className="text-[13px] text-blue font-medium">
                바로 뽕뽑으러 가기 →
              </Link>
            </div>
          </div>
        )}

        {/* ── 까마고치 (까치 + 기분) ── */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex flex-col items-center">
            <MagpieByProgress percent={percent} size={120} />
            <p className="mt-2 text-[12px] text-ink-3">{getMood(percent)}</p>
          </div>
          <div className="text-center mt-4">
            <p className="text-[13px] text-ink-3 mb-1.5">
              {user.nickname ? `${user.nickname}의 이번 학기 뽕뽑은 가치` : "이번 학기 등록금 뽕뽑은 가치"}
            </p>
            <p className="text-[38px] font-medium text-ink leading-tight">
              {totalPonged.toLocaleString("ko-KR")}
              <span className="text-[20px] text-ink-3 ml-0.5">원</span>
            </p>
            {netBurden > 0 && (
              <p className="text-[13px] text-ink-3 mt-1.5">
                실 부담 {netBurden.toLocaleString("ko-KR")}원 중 {percent}%
              </p>
            )}
          </div>
          <ProgressBar percent={percent} className="mt-6" />
        </div>

        {/* ── 등록금 내역 카드 ── */}
        {activeSemester && (
          <div className="px-6 mb-5">
            <div className="bg-surface-sub rounded-xl px-4 py-[14px]">
              <div className="flex justify-between text-[13px] mb-2">
                <span className="text-ink-3">등록금</span>
                <span className="text-ink">
                  {activeSemester.tuition.toLocaleString("ko-KR")}원
                </span>
              </div>
              {activeSemester.scholarship > 0 && (
                <div className="flex justify-between text-[13px] mb-2">
                  <span className="text-ink-3">받은 장학금</span>
                  <span className="text-ink">
                    - {activeSemester.scholarship.toLocaleString("ko-KR")}원
                  </span>
                </div>
              )}
              <div className="border-t border-hairline pt-2.5 flex justify-between text-[13px]">
                <span className="font-medium text-ink">실 부담액</span>
                <span className="font-medium text-ink">
                  {activeSemester.netBurden.toLocaleString("ko-KR")}원
                </span>
              </div>
            </div>
          </div>
        )}

        {totalPonged === 0 ? (
          <div className="px-5 pb-8">
            <Link href="/pong">
              <PrimaryButton>
                이번 학기 뽕뽑기 {remainingCount}개 보기
              </PrimaryButton>
            </Link>
          </div>
        ) : (
          <>
            <div className="px-5 mb-3">
              <Link href="/pong">
                <div className="bg-ink rounded-xl px-[18px] py-4 flex justify-between items-center">
                  <div>
                    <p className="text-[15px] font-medium text-white mb-0.5">
                      이번 학기 뽕뽑기 {remainingCount}개
                    </p>
                    <p className="text-[12px] text-white/70">
                      아직 안 한 것들이 남아 있어
                    </p>
                  </div>
                  <span className="text-[20px] text-white">→</span>
                </div>
              </Link>
            </div>

            {recommendedItem && (
              <div className="px-5 mb-8">
                <div className="bg-surface-sub rounded-xl px-[18px] py-4">
                  <p className="text-[11px] text-blue font-medium mb-1.5 tracking-wide">
                    까마고치 추천
                  </p>
                  <p className="text-[14px] text-ink leading-relaxed mb-2.5">
                    {getRecommendText(
                      recommendedItem.name,
                      recommendedItem.value,
                      recommendedItem.deadline_label
                    )}
                  </p>
                  <Link
                    href={`/pong/${recommendedItem.id}`}
                    className="text-[13px] text-blue font-medium"
                  >
                    자세히 보기 →
                  </Link>
                </div>
              </div>
            )}
          </>
        )}

      </div>
      <BottomTabBar />

      {showSemesterModal && (
        <SemesterModal
          semesters={semesters}
          activeSemesterId={activeSemesterId}
          onSelect={setActive}
          onAddNew={() => setShowAddSemester(true)}
          onClose={() => setShowSemesterModal(false)}
          onRemove={removeSemester}
          getTotalBySemester={getTotalBySemester}
        />
      )}

      {showSettings && (
        <SettingsSheet onClose={() => setShowSettings(false)} />
      )}

      {showAddSemester && (
        <AddSemesterModal
          collegeId={user.collegeId}
          trackId={user.trackId}
          existingIds={semesters.map((s) => s.id)}
          onAdd={(sem) => {
            addSemester(sem);
            setActive(sem.id);
          }}
          onClose={() => setShowAddSemester(false)}
        />
      )}
    </MobileFrame>
  );
}
