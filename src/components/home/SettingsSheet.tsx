"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCollege } from "@/data/colleges";
import { CATEGORY_META } from "@/data/items";
import { useUserStore } from "@/store/user";
import { useSemesterStore } from "@/store/semester";
import { usePongStore } from "@/store/pong";
import { createClient } from "@/lib/supabase/client";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { pushToCloud } from "@/lib/supabase/sync";
import { deleteAccount } from "@/lib/account";
import { formatWon } from "@/lib/format-currency";
import type { User } from "@supabase/supabase-js";
import PersonalizationQuestions from "@/components/onboarding/PersonalizationQuestions";
import { buildInterestVectorFromAnswers, interestsFromAnswers } from "@/lib/personalization/buildInterestVector";
import type { PersonalizationAnswers } from "@/data/personalization_questions";

interface Props {
  onClose: () => void;
}

export default function SettingsSheet({ onClose }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const user = useUserStore();
  const { semesters, activeSemesterId, updateSemester } = useSemesterStore();

  const activeSemester = semesters.find((s) => s.id === activeSemesterId);
  const college = user.collegeId ? getCollege(user.collegeId) : null;
  const track = college?.tracks.find((t) => t.id === user.trackId) ?? null;

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [editingScholarship, setEditingScholarship] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthUser(data.user));
  }, []);

  async function handleLogout() {
    // 로그아웃을 클라우드 동기화에 묶어두면 Supabase가 일시 중지됐거나
    // 네트워크가 느릴 때 버튼이 눌리지 않는 것처럼 보인다. 세션을 우선 끝낸다.
    await supabase.auth.signOut();
    setAuthUser(null);
  }

  const [scholarshipInput, setScholarshipInput] = useState(
    String(activeSemester?.scholarship ?? 0)
  );
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // 계정 삭제: 2단계 확인 (버튼 → 확인 문구 "삭제" 입력 → 실행)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDeleteAccount() {
    if (deleteConfirmText.trim() !== "삭제" || deleting) return;
    setDeleting(true);
    setDeleteError(null);

    const { ok, error } = await deleteAccount();
    if (!ok) {
      setDeleteError(error ?? "삭제에 실패했어요. 잠시 후 다시 시도해 주세요.");
      setDeleting(false);
      return;
    }

    // 서버 계정/데이터 삭제 완료 → 로컬 상태 전부 초기화 후 온보딩으로.
    user.reset();
    useSemesterStore.setState({ semesters: [], activeSemesterId: null });
    usePongStore.setState({ records: [] });
    router.replace("/onboarding");
  }

  // 관심사 편집
  const [editingInterests, setEditingInterests] = useState(false);
  const [answersDraft, setAnswersDraft] = useState<PersonalizationAnswers>(
    (user.personalizationAnswers ?? {}) as PersonalizationAnswers
  );

  function startEditInterests() {
    setAnswersDraft((user.personalizationAnswers ?? {}) as PersonalizationAnswers);
    setEditingInterests(true);
  }

  function handleInterestsSave() {
    const interests = interestsFromAnswers(answersDraft);
    const interestTagVector = buildInterestVectorFromAnswers(answersDraft);
    user.setProfile({
      interests,
      interestTagVector,
      personalizationAnswers: answersDraft,
      personalizationEnabled: true,
      personalizationSummary: `관심 태그 ${Object.keys(interestTagVector).length}개를 반영했어요.`,
    });
    setEditingInterests(false);
    void pushToCloud().catch(() => {});
  }

  function handleScholarshipSave() {
    if (!activeSemesterId || !activeSemester) return;
    const newScholarship = Math.max(0, Number(scholarshipInput) || 0);
    const newNetBurden = Math.max(0, activeSemester.tuition - newScholarship);
    updateSemester(activeSemesterId, {
      scholarship: newScholarship,
      netBurden: newNetBurden,
    });
    user.setProfile({ scholarship: newScholarship, netBurden: newNetBurden });
    setEditingScholarship(false);
  }

  function handleReset() {
    user.reset();
    useSemesterStore.setState({ semesters: [], activeSemesterId: null });
    usePongStore.setState({ records: [] });
    router.replace("/onboarding");
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />

      <div className="relative bg-surface rounded-t-2xl pb-8 shadow-xl">
        {/* 핸들 + 헤더 */}
        <div className="pt-3 pb-0 flex flex-col items-center">
          <div className="w-10 h-1 rounded-full bg-hairline mb-4" />
        </div>
        <div className="px-5 pb-5 flex justify-between items-center">
          <p className="text-[17px] font-medium text-ink">설정</p>
          <button onClick={onClose} className="text-[13px] text-blue">
            닫기
          </button>
        </div>

        {/* 계정 (로그인/로그아웃) */}
        <div className="px-5 mb-4">
          <p className="text-[12px] text-ink-3 mb-2">계정</p>
          {authUser ? (
            <div className="bg-surface-sub rounded-xl px-4 py-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {authUser.user_metadata?.avatar_url && (
                    <img
                      src={authUser.user_metadata.avatar_url}
                      alt="프로필"
                      className="w-7 h-7 rounded-full"
                    />
                  )}
                  <div>
                    <p className="text-[13px] text-ink font-medium">
                      {authUser.user_metadata?.full_name ?? authUser.email}
                    </p>
                    <p className="text-[11px] text-ink-3">{authUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-[12px] text-ink-3"
                >
                  로그아웃
                </button>
              </div>
            </div>
          ) : (
            <SocialLoginButtons />
          )}
        </div>

        {/* 프로필 */}
        <div className="px-5 mb-4">
          <p className="text-[12px] text-ink-3 mb-2">프로필</p>
          <div className="bg-surface-sub rounded-xl px-4 py-3.5">
            <div className="flex justify-between text-[13px] mb-2">
              <span className="text-ink-3">단과대</span>
              <span className="text-ink">{college?.name ?? "—"}</span>
            </div>
            {track && (
              <div className="flex justify-between text-[13px] mb-2">
                <span className="text-ink-3">학과/계열</span>
                <span className="text-ink">{track.name}</span>
              </div>
            )}
            <div className="flex justify-between text-[13px]">
              <span className="text-ink-3">학년</span>
              <span className="text-ink">
                {user.grade ? `${user.grade}학년` : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* 관심사 */}
        <div className="px-5 mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[12px] text-ink-3">내 관심사</p>
            {editingInterests ? (
              <button
                onClick={() => setEditingInterests(false)}
                className="text-[12px] text-ink-3"
              >
                취소
              </button>
            ) : (
              <button
                onClick={startEditInterests}
                className="text-[12px] text-blue"
              >
                수정
              </button>
            )}
          </div>
          {editingInterests ? (
            <div className="mt-2" style={{ height: "70vh", display: "flex", flexDirection: "column" }}>
              <PersonalizationQuestions
                answers={answersDraft}
                onChange={setAnswersDraft}
                onFinish={handleInterestsSave}
                finishLabel="저장"
              />
            </div>
          ) : (
            <>
              <div className="bg-surface-sub rounded-xl px-4 py-3.5">
                {user.interests.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {user.interests.map((cat) => (
                      <span
                        key={cat}
                        className="flex items-center gap-1 text-[12px] text-ink bg-surface border border-hairline rounded-full px-2.5 py-1"
                      >
                        <span className="leading-none">{CATEGORY_META[cat]?.emoji}</span>
                        {CATEGORY_META[cat]?.label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-ink-3">
                    아직 고른 관심사가 없어요. 수정을 눌러 골라보세요.
                  </p>
                )}
              </div>
              <p className="text-[11px] text-ink-3 mt-1.5 px-1">
                뽑은 기록도 추천에 자동 반영돼요. 뽑을수록 더 똑똑해져요.
              </p>
            </>
          )}
        </div>

        {/* 이번 학기 장학금 */}
        {!editingInterests && activeSemester && (
          <div className="px-5 mb-4">
            <p className="text-[12px] text-ink-3 mb-2">
              이번 학기 ({activeSemester.year} - {activeSemester.term}학기)
            </p>
            <div className="bg-surface-sub rounded-xl px-4 py-3.5">
              <div className="flex justify-between text-[13px] mb-2">
                <span className="text-ink-3">등록금</span>
                <span className="text-ink">
                  {formatWon(activeSemester.tuition)}
                </span>
              </div>

              <div className="flex justify-between items-center text-[13px]">
                <span className="text-ink-3">장학금</span>
                {editingScholarship ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={scholarshipInput}
                      onChange={(e) => setScholarshipInput(e.target.value)}
                      className="w-28 text-right text-[13px] text-ink border border-hairline rounded-lg px-2 py-1 outline-none bg-surface"
                      autoFocus
                    />
                    <span className="text-ink-3">원</span>
                    <button
                      onClick={handleScholarshipSave}
                      className="text-[13px] text-blue font-medium"
                    >
                      저장
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-ink">
                      {formatWon(activeSemester.scholarship)}
                    </span>
                    <button
                      onClick={() => setEditingScholarship(true)}
                      className="text-[12px] text-blue"
                    >
                      수정
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t border-hairline mt-2.5 pt-2.5 flex justify-between text-[13px]">
                <span className="font-medium text-ink">실 부담액</span>
                <span className="font-medium text-ink">
                  {formatWon(activeSemester.netBurden)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 더보기: 제보 / 소개 */}
        {!editingInterests && (
          <div className="px-5 mb-4">
            <div className="bg-surface-sub rounded-xl overflow-hidden">
              <button
                onClick={() => router.push("/report")}
                className="w-full flex items-center justify-between px-4 py-3.5 active:bg-surface-muted"
              >
                <span className="text-[14px] text-ink">개발자에게 제보하기</span>
                <span className="text-ink-3 text-[16px]">›</span>
              </button>
              <div className="h-px bg-hairline mx-4" />
              <button
                onClick={() => router.push("/about")}
                className="w-full flex items-center justify-between px-4 py-3.5 active:bg-surface-muted"
              >
                <span className="text-[14px] text-ink">샤뽕 소개</span>
                <span className="text-ink-3 text-[16px]">›</span>
              </button>
            </div>
          </div>
        )}

        {/* 데이터 초기화 */}
        {!editingInterests && (
          <div className="px-5">
            {showResetConfirm ? (
              <div className="bg-red-light rounded-xl px-4 py-4">
                <p className="text-[13px] text-ink mb-3">
                  모든 뽕뽑기 기록과 학기 데이터가 삭제돼요. 정말로?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-2.5 rounded-[10px] text-[13px] border border-hairline text-ink-3"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 py-2.5 rounded-[10px] text-[13px] font-medium bg-red text-white"
                  >
                    초기화
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-3 text-[13px] text-red text-center"
              >
                데이터 초기화
              </button>
            )}
          </div>
        )}

        {/* 계정 삭제 (로그인 상태에서만 노출, 2단계 확인) */}
        {!editingInterests && authUser && (
          <div className="px-5 mt-1">
            {showDeleteConfirm ? (
              <div className="bg-red-light rounded-xl px-4 py-4">
                <p className="text-[13px] font-medium text-ink mb-1">
                  계정을 정말 삭제할까요?
                </p>
                <p className="text-[12px] text-ink-3 mb-3 leading-relaxed">
                  계정과 클라우드에 저장된 모든 데이터(프로필·학기·뽕뽑기 기록)가
                  영구 삭제되며 되돌릴 수 없어요. 계속하려면 아래에{" "}
                  <span className="font-medium text-ink">삭제</span>를 입력해 주세요.
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="삭제"
                  autoFocus
                  className="w-full text-[14px] text-ink bg-surface rounded-[10px] px-3 py-2.5 outline-none border border-hairline mb-2 placeholder:text-ink-3"
                />
                {deleteError && (
                  <p className="text-[12px] text-red mb-2">{deleteError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText("");
                      setDeleteError(null);
                    }}
                    disabled={deleting}
                    className="flex-1 py-2.5 rounded-[10px] text-[13px] border border-hairline text-ink-3 disabled:opacity-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText.trim() !== "삭제" || deleting}
                    className="flex-1 py-2.5 rounded-[10px] text-[13px] font-medium bg-red text-white disabled:opacity-40"
                  >
                    {deleting ? "삭제 중…" : "영구 삭제"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-3 text-[13px] text-red/80 text-center"
              >
                계정 삭제
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
