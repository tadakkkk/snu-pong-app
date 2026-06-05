"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { items, getTodayNewCount } from "@/data/items";
import { getDaysUntilSemesterEnd } from "@/lib/semester";
import { useAuthGate } from "@/lib/auth-gate";
import { logEvent } from "@/lib/analytics";
import LoginRequiredModal from "@/components/auth/LoginRequiredModal";
import TourOverlay from "@/components/tour/TourOverlay";

function getMood(percent: number): string {
  if (percent === 0) return "배고파";
  if (percent < 25) return "심심해";
  if (percent < 50) return "좋아";
  if (percent < 75) return "신나";
  if (percent < 100) return "행복해";
  return "완벽해 ✨";
}

function getDday(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export default function HomePage() {
  const router = useRouter();
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [showAddSemester, setShowAddSemester] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const { isAuthed, loading: authLoading } = useAuthGate();
  const user = useUserStore();

  // 온보딩이 아직 안 끝났는데 직접 /home으로 들어온 경우 → 온보딩으로 보냄
  // (로그인된 유저의 cloud pull이 끝나기를 잠시 기다림)
  useEffect(() => {
    if (authLoading) return;
    if (!user.onboardingDone && !isAuthed) {
      router.replace("/onboarding");
    }
  }, [authLoading, isAuthed, user.onboardingDone, router]);
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

  const semesterLabel = activeSemester
    ? `${activeSemester.year} - ${activeSemester.term}학기`
    : "학기 없음";

  const remainingCount = activeSemesterId
    ? items.filter((i) => !hasRecordForItem(activeSemesterId, i.id)).length
    : items.length;

  // 운세 카드 3장 계산
  const unponged = items.filter(
    (i) => !activeSemesterId || !hasRecordForItem(activeSemesterId, i.id)
  );

  const fortuneCards = useMemo(() => {
    function pickRandom<T>(pool: T[]): T | null {
      if (pool.length === 0) return null;
      return pool[Math.floor(Math.random() * pool.length)];
    }

    let urgentPick: typeof items[0] | null;
    let interestPick: typeof items[0] | null;
    let randomPick: typeof items[0] | null;

    if (refreshSeed === 0) {
      // 초기: 기존 로직 — 급한 순 정렬 + 날짜 시드
      urgentPick = unponged
        .filter((i) => i.deadline_date && getDday(i.deadline_date) >= 0 && getDday(i.deadline_date) <= 30)
        .sort((a, b) => getDday(a.deadline_date!) - getDday(b.deadline_date!))[0] ?? null;

      const excl1 = new Set([urgentPick?.id]);
      if (user.interests.length > 0) {
        interestPick = unponged.find(
          (i) => !excl1.has(i.id) && (user.interests as string[]).includes(i.category)
        ) ?? null;
      } else {
        interestPick = unponged.find((i) => !excl1.has(i.id)) ?? null;
      }

      const excl2 = new Set([urgentPick?.id, interestPick?.id]);
      const pool3 = unponged.filter((i) => !excl2.has(i.id));
      const seed = new Date().getDate() + new Date().getMonth() * 31;
      randomPick = pool3.length > 0 ? pool3[seed % pool3.length] : null;
    } else {
      // 새로고침: 각 풀에서 Math.random()
      const urgentPool = unponged.filter(
        (i) => i.deadline_date && getDday(i.deadline_date) >= 0 && getDday(i.deadline_date) <= 3
      );
      urgentPick = pickRandom(urgentPool);

      const excl1 = new Set([urgentPick?.id]);
      const interestPool = user.interests.length > 0
        ? unponged.filter((i) => !excl1.has(i.id) && (user.interests as string[]).includes(i.category))
        : unponged.filter((i) => !excl1.has(i.id));
      interestPick = pickRandom(interestPool);

      const excl2 = new Set([urgentPick?.id, interestPick?.id]);
      randomPick = pickRandom(unponged.filter((i) => !excl2.has(i.id)));
    }

    return [
      urgentPick && {
        item: urgentPick,
        label: "마감 임박",
        labelColor: "text-red",
        dday: getDday(urgentPick.deadline_date!),
      },
      interestPick && {
        item: interestPick,
        label: user.interests.length > 0 ? "관심 분야" : "추천",
        labelColor: "text-blue",
        dday: null,
      },
      randomPick && {
        item: randomPick,
        label: "오늘의 운",
        labelColor: "text-ink-3",
        dday: null,
      },
    ].filter(Boolean) as { item: typeof items[0]; label: string; labelColor: string; dday: number | null }[];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSeed, activeSemesterId, unponged.length, user.interests]);

  const firstUnponged = unponged[0] ?? null;
  const todayNewCount = getTodayNewCount();

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

        {/* ── 둘러보기 모드 안내 배너 ── */}
        {!isAuthed && (
          <div className="px-5 pt-3">
            <button
              onClick={() => setShowLogin(true)}
              className="w-full bg-[#FFF7E6] border border-[#FFE2A8] rounded-xl px-4 py-3 text-left active:opacity-80"
            >
              <p className="text-[12px] font-medium text-[#8A5A00] mb-0.5">
                지금은 둘러보기 모드야
              </p>
              <p className="text-[11px] text-[#8A5A00]/80 leading-snug">
                새로고침하면 데이터가 사라져. 로그인하면 안전하게 저장돼 →
              </p>
            </button>
          </div>
        )}

        {/* ── 오늘 새로 들어온 혜택 (토스 스타일) ── */}
        {todayNewCount > 0 && (
          <div className="px-5 pt-3">
            <Link
              href="/pong?sort=recent"
              onClick={() => logEvent("new_banner_click", { count: todayNewCount })}
              className="flex items-center gap-3 w-full bg-[#F2F4F6] rounded-2xl px-4 py-3.5 active:bg-[#E8EBED] transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 text-[18px]">
                🐦
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-ink leading-tight">
                  오늘 물까치가 {todayNewCount}개 물어왔어
                </p>
                <p className="text-[12px] text-ink-3 mt-0.5">
                  방금 들어온 새 혜택 보러 가기
                </p>
              </div>
              <span className="text-ink-3 text-[18px] shrink-0">›</span>
            </Link>
          </div>
        )}

        {/* ── 첫 뽕뽑기 유도 (빈 상태, 까치 위) ── */}
        {totalPonged === 0 && firstUnponged && (
          <div className="px-6 pt-5 pb-2">
            <div className="bg-surface-sub rounded-xl p-[18px]">
              <p className="text-[13px] text-ink leading-relaxed mb-3">
                첫 항목 뽑으면 물까치 표정이 바뀌어.{" "}
                {`${Math.round(firstUnponged.value / 10000)}만원짜리 ${firstUnponged.name}부터 어때?`}
              </p>
              <Link href="/pong" className="text-[13px] text-blue font-medium">
                바로 뽕뽑으러 가기 →
              </Link>
            </div>
          </div>
        )}

        {/* ── 까마고치 (까치 + 기분) ── */}
        <div className="px-6 pt-6 pb-4">
          <div data-tour="magpie" className="flex flex-col items-center">
            <MagpieByProgress percent={percent} size={120} />
            <p className="mt-2 text-[12px] text-ink-3">{getMood(percent)}</p>
          </div>
          <div data-tour="total" className="text-center mt-4">
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

        {/* ── 운세 카드 3장 ── */}
        {fortuneCards.length > 0 && (
          <div data-tour="fortune" className="mb-5">
            <div className="px-5 mb-2 flex items-center justify-between">
              <p className="text-[11px] text-ink-3 font-medium">오늘의 뽕운세</p>
              <button
                onClick={() => {
                  setRefreshSeed((s) => s + 1);
                  setSpinning(true);
                  setTimeout(() => setSpinning(false), 400);
                  logEvent("fortune_refresh");
                }}
                className={`text-[16px] text-ink-3 active:opacity-60 transition-transform duration-300 ${spinning ? "rotate-180" : ""}`}
                aria-label="운세 새로고침"
              >
                ↻
              </button>
            </div>
            <div className="flex gap-2.5 overflow-x-auto px-5 pb-1 [&::-webkit-scrollbar]:hidden">
              {fortuneCards.map(({ item, label, labelColor, dday }) => (
                <Link
                  key={item.id}
                  href={`/pong/${item.id}`}
                  className="shrink-0 w-[148px] bg-surface-sub rounded-xl p-3.5 active:opacity-70"
                >
                  <p className={`text-[10px] font-medium mb-2 ${labelColor}`}>{label}</p>
                  <p className="text-[13px] text-ink font-medium leading-snug line-clamp-2 mb-3">
                    {item.name}
                  </p>
                  <div className="flex items-end justify-between">
                    <p className="text-[12px] font-medium text-ink">
                      +{Math.round(item.value / 10000)}만
                    </p>
                    {dday !== null && (
                      <p className={`text-[11px] font-medium tabular-nums ${dday <= 3 ? "text-red" : "text-[#E88B30]"}`}>
                        D-{dday}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── CTA ── */}
        <div data-tour="cta">
          {totalPonged === 0 ? (
            <div className="px-5 pb-8">
              <Link href="/pong">
                <PrimaryButton>
                  남은 뽕 {remainingCount}개 뽑으러 가기 보기
                </PrimaryButton>
              </Link>
            </div>
          ) : (
            <div className="px-5 mb-8">
              <Link href="/pong">
                <div className="bg-ink rounded-xl px-[18px] py-4 flex justify-between items-center">
                  <div>
                    <p className="text-[15px] font-medium text-white mb-0.5">
                      남은 뽕 {remainingCount}개 뽑으러 가기
                    </p>
                    <p className="text-[12px] text-white/70">
                      아직 안 한 것들이 남아 있어
                    </p>
                  </div>
                  <span className="text-[20px] text-white">→</span>
                </div>
              </Link>
            </div>
          )}
        </div>

      </div>
      <BottomTabBar />

      <TourOverlay
        storageKey="tour:home"
        steps={[
          { selector: '[data-tour="magpie"]', title: "물까치가 혜택을 물어와요", desc: "등록금 본전 뽑을 학교 혜택을 모아뒀어요. 뽑을수록 물까치 표정이 밝아져요." },
          { selector: '[data-tour="total"]', title: "뽑은 가치가 쌓여요", desc: "이번 학기에 뽑은 혜택의 환산 가치가 여기 모여요." },
          { selector: '[data-tour="fortune"]', title: "오늘의 뽕운세", desc: "마감 임박·관심 분야·랜덤으로 매일 다른 혜택을 추천해드려요." },
          { selector: '[data-tour="cta"]', title: "혜택 뽑으러 가기", desc: "여기를 눌러 받을 수 있는 혜택을 둘러보세요." },
          { selector: '[data-tour="tabbar"]', title: "이렇게 이동해요", desc: "홈·뽕뽑기·기록 탭으로 화면을 옮길 수 있어요." },
          { title: "잠깐, 시작하기 전에", desc: "혜택 가치는 AI가 매긴 어림값이라 실제 가치와 다를 수 있어요. 숫자가 작아도 모두 다 소중한 기회예요.\n\n아직 베타 버전이라 엉뚱한 값이나 태그가 보일 수 있어요. 개발자에게만 살짝 알려주세요." },
        ]}
      />

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
            if (!isAuthed) {
              setShowAddSemester(false);
              setShowLogin(true);
              return;
            }
            addSemester(sem);
            setActive(sem.id);
          }}
          onClose={() => setShowAddSemester(false)}
        />
      )}

      {showLogin && (
        <LoginRequiredModal
          message="학기 정보를 저장하려면 로그인이 필요해. 로그인하면 클라우드에 안전하게 보관돼."
          onClose={() => setShowLogin(false)}
        />
      )}
    </MobileFrame>
  );
}
