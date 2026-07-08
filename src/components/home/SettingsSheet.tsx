"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCollege } from "@/data/colleges";
import { CATEGORY_META } from "@/data/items";
import { useUserStore } from "@/store/user";
import { useSemesterStore } from "@/store/semester";
import { usePongStore } from "@/store/pong";
import { createClient } from "@/lib/supabase/client";
import { loginWithGoogle } from "@/lib/auth-gate";
import { pushToCloud } from "@/lib/supabase/sync";
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
    await pushToCloud();
    await supabase.auth.signOut();
    setAuthUser(null);
  }

  const [scholarshipInput, setScholarshipInput] = useState(
    String(activeSemester?.scholarship ?? 0)
  );
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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

        {/* 구글 로그인 */}
        <div className="px-5 mb-4">
          <p className="text-[12px] text-ink-3 mb-2">계정</p>
          <div className="bg-surface-sub rounded-xl px-4 py-3.5">
            {authUser ? (
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
            ) : (
              <button
                onClick={loginWithGoogle}
                className="w-full flex items-center justify-center gap-2 py-1"
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-[13px] text-ink font-medium">Google로 로그인</span>
              </button>
            )}
          </div>
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
      </div>
    </div>
  );
}
