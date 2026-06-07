"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MobileFrame from "@/components/ui/MobileFrame";
import StatusBar from "@/components/ui/StatusBar";
import BottomTabBar from "@/components/layout/BottomTabBar";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SemesterModal from "@/components/home/SemesterModal";
import AddSemesterModal from "@/components/home/AddSemesterModal";
import SettingsSheet from "@/components/home/SettingsSheet";
import FortuneCard from "@/components/home/FortuneCard";
import NotificationBell from "@/components/notifications/NotificationBell";
import NotificationPanel from "@/components/notifications/NotificationPanel";
import { useUserStore } from "@/store/user";
import { usePongStore } from "@/store/pong";
import { useSemesterStore } from "@/store/semester";
import { items, getRecentNewItems, CATEGORY_META, type PongItem } from "@/data/items";
import { rankByInterest, type TimeCommitment } from "@/lib/personalization/rankByInterest";
import { buildBehaviorSignal } from "@/lib/personalization/buildBehaviorVector";
import { getUnreadCount } from "@/lib/notifications";
import { useAuthGate } from "@/lib/auth-gate";
import { logEvent } from "@/lib/analytics";
import LoginRequiredModal from "@/components/auth/LoginRequiredModal";
import TourOverlay from "@/components/tour/TourOverlay";

type FortuneCardData = {
  key: string;
  label: string;
  labelColor: string;
  cover: string;
  item: PongItem;
  dday: number | null;
  personalized: boolean;
};

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
  const [notifOpen, setNotifOpen] = useState(false);
  const [frozenSeenAt, setFrozenSeenAt] = useState<string | null>(null);

  const { isAuthed, loading: authLoading } = useAuthGate();
  const user = useUserStore();

  // 온보딩이 아직 안 끝났는데 직접 /home으로 들어온 경우 → 온보딩으로 보냄
  useEffect(() => {
    if (authLoading) return;
    if (!user.onboardingDone && !isAuthed) {
      router.replace("/onboarding");
    }
  }, [authLoading, isAuthed, user.onboardingDone, router]);

  const { semesters, activeSemesterId, setActive, addSemester, removeSemester } =
    useSemesterStore();
  const { hasRecordForItem, getTotalBySemester } = usePongStore();
  const pongRecords = usePongStore((s) => s.records);

  const activeSemester = semesters.find((s) => s.id === activeSemesterId);
  const semesterLabel = activeSemester
    ? `${activeSemester.year} - ${activeSemester.term}학기`
    : "학기 없음";

  // 이번 학기에 아직 안 뽑은 혜택
  const unponged = useMemo(
    () =>
      items.filter(
        (i) => !activeSemesterId || !hasRecordForItem(activeSemesterId, i.id)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeSemesterId, items.length]
  );

  const remainingCount = unponged.length;

  // 추천 후보: 마감이 지난 항목은 제외 (마감일이 있고 D-day < 0)
  const recommendable = useMemo(
    () => unponged.filter((i) => !i.deadline_date || getDday(i.deadline_date) >= 0),
    [unponged]
  );

  // 온보딩 답변에서 추천 보정 신호 추출
  const timeCommitment =
    typeof user.personalizationAnswers?.["time_commitment"] === "string"
      ? (user.personalizationAnswers["time_commitment"] as TimeCommitment)
      : undefined;
  const deadlineSensitivity = user.personalizationAnswers?.["deadline_sensitivity"];

  // ── 행동 신호 (뽑은 기록 기반, 뽑을수록 고도화) ──
  const behavior = useMemo(
    () => buildBehaviorSignal(pongRecords, items),
    [pongRecords]
  );

  // ── 개인화 추천 (관심사 벡터 + 카테고리 + 행동 + 시간적합 합산, 만료 제외) ──
  const ranked = useMemo(
    () =>
      rankByInterest(recommendable, user.interestTagVector, user.interests, behavior, {
        timeCommitment,
      }),
    [recommendable, user.interestTagVector, user.interests, behavior, timeCommitment]
  );

  // 뽕운세 추천 설명 멘트 (뽑을수록 고도화되는 느낌 전달)
  const recoCopy =
    behavior.claimedCount > 0
      ? `${behavior.claimedCount}번 뽑은 걸 학습해서 더 똑똑해졌어`
      : user.interests.length > 0
        ? "내 관심사 기준으로 골랐어"
        : "탭해서 뒤집어 봐";

  // ── 마감 임박 (7일 이내, 가장 급한 순) ──
  const urgent = useMemo(
    () =>
      unponged
        .filter((i) => {
          if (!i.deadline_date) return false;
          const d = getDday(i.deadline_date);
          return d >= 0 && d <= 7;
        })
        .sort((a, b) => getDday(a.deadline_date!) - getDday(b.deadline_date!)),
    [unponged]
  );

  const [refreshSeed, setRefreshSeed] = useState(0);
  const [closing, setClosing] = useState(false);

  // ── 오늘의 뽕운세 카드: 마감 임박 1장 + 카테고리별 맞춤 추천 ──
  const fortuneCards = useMemo<FortuneCardData[]>(() => {
    const cards: FortuneCardData[] = [];
    const usedId = new Set<string>();

    // "내 관심사" 배지는 사용자가 직접 고른 카테고리(interests)에만 붙인다.
    // (태그 매칭은 활동방식·상황 질문에서도 생겨서 관심사로 오인될 수 있어 제외)
    const matchById = new Map(ranked.map((r) => [r.item.id, r]));
    const isPersonalized = (item: PongItem) => {
      const r = matchById.get(item.id);
      return !!r && r.matchedCategory;
    };

    // "임박한 것만" 선호면 마감 임박 카드를 더 띄우고, 기본("다 보여줘")은 1장
    const urgentCount = deadlineSensitivity === "urgent" ? 2 : 1;
    const urgentRotated = urgent.length > 0
      ? [...urgent.slice(refreshSeed % urgent.length), ...urgent.slice(0, refreshSeed % urgent.length)]
      : urgent;
    for (const u of urgentRotated.slice(0, urgentCount)) {
      if (cards.length >= 4) break;
      cards.push({
        key: `urgent-${u.id}`,
        label: "마감 임박",
        labelColor: "text-red",
        cover: "🔥",
        item: u,
        dday: getDday(u.deadline_date!),
        personalized: false,
      });
      usedId.add(u.id);
    }

    // 개인화 랭킹에서 카테고리당 1개씩 (맞춤 추천)
    const usedCat = new Set<string>();
    // ranked를 seed만큼 회전시켜 새로고침마다 다른 추천
    const rotated = ranked.length > 0
      ? [...ranked.slice(refreshSeed % ranked.length), ...ranked.slice(0, refreshSeed % ranked.length)]
      : ranked;
    for (const r of rotated) {
      if (cards.length >= 4) break;
      if (usedId.has(r.item.id) || usedCat.has(r.item.category)) continue;
      usedCat.add(r.item.category);
      usedId.add(r.item.id);
      cards.push({
        key: r.item.category,
        label: r.item.category_label,
        labelColor: "text-blue",
        cover: CATEGORY_META[r.item.category]?.emoji ?? "🎴",
        item: r.item,
        dday: r.item.deadline_date ? getDday(r.item.deadline_date) : null,
        personalized: r.matchedCategory,
      });
    }
    return cards;
  }, [ranked, urgent, deadlineSensitivity, refreshSeed]);

  // ── 알림센터 ──
  const recentNewCount = useMemo(() => getRecentNewItems(7).length, []);
  const unreadCount = getUnreadCount(user.notificationsSeenAt);

  function openNotifications() {
    setFrozenSeenAt(user.notificationsSeenAt);
    setNotifOpen(true);
    logEvent("notifications_open", { unread: unreadCount });
    if (unreadCount > 0) {
      user.setProfile({ notificationsSeenAt: new Date().toISOString() });
    }
  }

  return (
    <MobileFrame>
      <StatusBar />

      {/* 헤더 */}
      <div className="px-5 pt-4 pb-1 flex justify-between items-center">
        <div>
          <p className="text-[18px] font-medium text-ink leading-tight">오늘의 뽕운세</p>
          <button
            onClick={() => setShowSemesterModal(true)}
            className="flex items-center gap-1 mt-0.5"
          >
            <span className="text-[12px] text-ink-3">{semesterLabel}</span>
            <span className="text-[10px] text-ink-3">▾</span>
          </button>
        </div>
        <div className="flex items-center gap-3.5">
          <NotificationBell count={unreadCount} onClick={openNotifications} />
          <button
            onClick={() => setShowSettings(true)}
            className="text-[22px] text-ink active:opacity-60"
          >
            ≡
          </button>
        </div>
      </div>

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

        {/* ── 새로 들어온 혜택 배너 → 알림센터 ── */}
        {recentNewCount > 0 && (
          <div data-tour="notif" className="px-5 pt-4">
            <button
              onClick={openNotifications}
              className="flex items-center gap-3 w-full bg-[#F2F4F6] rounded-2xl px-4 py-3.5 active:bg-[#E8EBED] transition-colors"
            >
              <div className="relative w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 text-[18px]">
                🐦
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red border-2 border-white" />
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[15px] font-semibold text-ink leading-tight">
                  물까치가 {recentNewCount}개 물어왔어
                </p>
                <p className="text-[12px] text-ink-3 mt-0.5">
                  새로 들어온 혜택 보러 가기
                </p>
              </div>
              <span className="text-ink-3 text-[18px] shrink-0">›</span>
            </button>
          </div>
        )}

        {/* ── 오늘의 뽕운세 (뒤집기 카드) ── */}
        {fortuneCards.length > 0 && (
          <div data-tour="fortune" className="px-5 pt-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[15px] font-medium text-ink">오늘의 뽕운세</p>
              <button
                onClick={() => {
                  logEvent("fortune_refresh");
                  setClosing(true);
                  setTimeout(() => {
                    setRefreshSeed((s) => s + 1);
                    setClosing(false);
                  }, 500);
                }}
                className="flex items-center gap-1 text-[11px] text-ink-3 active:opacity-60"
                aria-label="운세 새로고침"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                새로고침
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {fortuneCards.map((c) => (
                <FortuneCard
                  key={c.key}
                  label={c.label}
                  labelColor={c.labelColor}
                  cover={c.cover}
                  item={c.item}
                  dday={c.dday}
                  personalized={c.personalized}
                  closeSignal={closing}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── CTA ── */}
        <div data-tour="cta" className="px-5 pt-7 pb-8">
          <Link href="/pong">
            {remainingCount > 0 ? (
              <div className="bg-ink rounded-xl px-[18px] py-4 flex justify-between items-center">
                <div>
                  <p className="text-[15px] font-medium text-white mb-0.5">
                    남은 뽕 {remainingCount}개 뽑으러 가기
                  </p>
                  <p className="text-[12px] text-white/70">
                    오늘의 운세대로 하나씩 챙겨보자
                  </p>
                </div>
                <span className="text-[20px] text-white">→</span>
              </div>
            ) : (
              <PrimaryButton>전체 혜택 둘러보기</PrimaryButton>
            )}
          </Link>
        </div>
      </div>

      <BottomTabBar />

      <TourOverlay
        storageKey="tour:home"
        steps={[
          {
            selector: '[data-tour="notif"]',
            title: "새로 들어온 혜택",
            desc: "물까치가 새로 물어온 혜택을 여기서 알려드려요. 눌러서 알림을 확인해보세요.",
          },
          {
            selector: '[data-tour="fortune"]',
            title: "오늘의 뽕운세",
            desc: "마감 임박과 관심사 맞춤 추천을 카드로 골라뒀어요. 탭하면 뒤집혀서 오늘의 추천 혜택이 나와요.",
          },
          {
            selector: '[data-tour="cta"]',
            title: "혜택 뽑으러 가기",
            desc: "여기를 눌러 받을 수 있는 혜택을 둘러보세요.",
          },
          {
            selector: '[data-tour="tabbar"]',
            title: "이렇게 이동해요",
            desc: "오늘의 뽕운세·뽕뽑기·까마고치 탭으로 화면을 옮길 수 있어요. 까마고치는 '까마고치' 탭에서 키워요.",
          },
          {
            title: "잠깐, 시작하기 전에",
            desc: "혜택 가치는 AI가 매긴 어림값이라 실제 가치와 다를 수 있어요. 숫자가 작아도 모두 다 소중한 기회예요.\n\n아직 베타 버전이라 엉뚱한 값이나 태그가 보일 수 있어요. 개발자에게만 살짝 알려주세요.",
          },
        ]}
      />

      <NotificationPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        frozenSeenAt={frozenSeenAt}
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

      {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} />}

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
