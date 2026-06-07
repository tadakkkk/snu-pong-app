"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import MobileFrame from "@/components/ui/MobileFrame";
import PrimaryButton from "@/components/ui/PrimaryButton";
import StatusBar from "@/components/ui/StatusBar";
import MagpieWithCoin from "@/components/magpie/MagpieWithCoin";
import MagpieHappy from "@/components/magpie/MagpieHappy";
import { colleges, type College, type Track } from "@/data/colleges";
import { items, CATEGORY_META, type Category } from "@/data/items";
import {
  personalizationQuestions,
  type PersonalizationAnswers,
} from "@/data/personalization_questions";
import { buildInterestVectorFromAnswers, interestsFromAnswers } from "@/lib/personalization/buildInterestVector";
import PersonalizationQuestions from "@/components/onboarding/PersonalizationQuestions";
import { pushToCloud } from "@/lib/supabase/sync";
import { useUserStore, type PersonalizationInputMethod } from "@/store/user";
import { useSemesterStore } from "@/store/semester";
import { createClient } from "@/lib/supabase/client";
import { formatWon, formatWonCompact } from "@/lib/format-currency";

// 0 로그인 · 1 단과대 · 2 계열 · 3 학년 · 4 등록금 · 5 맞춤추천 동의 · 6 맞춤 질문 · 7 결과
type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

function formatKRW(n: number) {
  return formatWon(n);
}

// ─── Step 0: 스플래시 ──────────────────────────────────────────────
function StepWelcome({ onNext }: { onNext: () => void }) {
  const supabase = createClient();

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-7">
        <MagpieWithCoin size="lg" />
        <div className="text-center mt-6 mb-3">
          <h1 className="text-[26px] font-medium text-ink leading-snug">
            서울대 등록금<br />뽕뽑기
          </h1>
          <p className="text-[14px] text-ink-3 mt-2 leading-relaxed">
            낸 등록금만큼 누리고 졸업하기
          </p>
        </div>
      </div>
      <div className="px-5 pb-8 flex flex-col gap-3">
        <button
          onClick={handleGoogleLogin}
          className="w-full py-4 rounded-2xl bg-surface-sub border border-hairline flex items-center justify-center gap-2.5 active:opacity-70"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="text-[15px] font-medium text-ink">Google로 시작하기</span>
        </button>
        <button onClick={onNext} className="text-center text-[13px] text-ink-3 py-2">
          로그인 없이 둘러보기
        </button>
      </div>
    </div>
  );
}

// ─── Step 1: 단과대 ────────────────────────────────────────────────
function StepCollege({
  selected,
  onSelect,
  onNext,
}: {
  selected: College | null;
  onSelect: (c: College) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="shrink-0 px-5 pb-5">
        <div className="h-[3px] bg-surface-muted rounded-full">
          <div className="w-1/4 h-[3px] bg-ink rounded-full" />
        </div>
        <p className="text-[11px] text-ink-3 mt-1.5">1 / 4</p>
      </div>
      <div className="shrink-0 px-6 pb-5">
        <h2 className="text-[22px] font-medium text-ink leading-snug mb-2">
          어느 단과대야?
        </h2>
        <p className="text-[13px] text-ink-3">단과대마다 등록금이 달라</p>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 px-5">
        <div className="flex flex-col gap-1.5 pb-4">
          {colleges.map((c) => {
            const isSelected = selected?.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c)}
                className={`w-full text-left rounded-[10px] px-4 py-[13px] text-[14px] border transition-colors ${
                  isSelected
                    ? "bg-ink text-white border-ink font-medium"
                    : "bg-surface text-ink border-hairline"
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>
      <div className="shrink-0 px-5 pb-7 pt-4 bg-surface border-t border-hairline">
        <PrimaryButton onClick={onNext} disabled={!selected}>
          다음
        </PrimaryButton>
      </div>
    </div>
  );
}

// ─── Step 2: 계열 (조건부) ─────────────────────────────────────────
function StepTrack({
  college,
  selected,
  onSelect,
  onNext,
}: {
  college: College;
  selected: Track | null;
  onSelect: (t: Track) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="shrink-0 px-5 pb-5">
        <div className="h-[3px] bg-surface-muted rounded-full">
          <div className="w-2/4 h-[3px] bg-ink rounded-full" />
        </div>
        <p className="text-[11px] text-ink-3 mt-1.5">2 / 4</p>
      </div>
      <div className="shrink-0 px-6 pb-6">
        <h2 className="text-[22px] font-medium text-ink leading-snug mb-2">
          {college.name.replace("대학", "대").replace("학부", "")} 어느 학과야?
        </h2>
        <p className="text-[13px] text-ink-3">학과별로 등록금이 달라</p>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 px-5">
        <div className="flex flex-col gap-2 pb-4">
          {college.tracks.map((t) => {
            const isSelected = selected?.id === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onSelect(t)}
                className={`w-full text-left rounded-xl px-[18px] py-4 border transition-colors flex justify-between items-center ${
                  isSelected
                    ? "bg-ink text-white border-ink"
                    : "bg-surface text-ink border-hairline"
                }`}
              >
                <div>
                  <p className={`text-[14px] font-medium ${isSelected ? "text-white" : "text-ink"}`}>
                    {t.name}
                  </p>
                  {t.departments && (
                    <p className={`text-[11px] mt-0.5 ${isSelected ? "text-white/70" : "text-ink-3"}`}>
                      {t.departments}
                    </p>
                  )}
                </div>
                <span className={`text-[13px] font-medium shrink-0 ml-3 ${isSelected ? "text-white" : "text-ink"}`}>
                  {formatKRW(t.tuition_2025_1)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="shrink-0 px-5 pb-7 pt-4 bg-surface border-t border-hairline">
        <PrimaryButton onClick={onNext} disabled={!selected}>
          다음
        </PrimaryButton>
      </div>
    </div>
  );
}

// ─── Step 3: 학년 ─────────────────────────────────────────────────
function StepGrade({
  selected,
  onSelect,
  onNext,
}: {
  selected: number | null;
  onSelect: (g: number) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="shrink-0 px-5 pb-5">
        <div className="h-[3px] bg-surface-muted rounded-full">
          <div className="w-3/4 h-[3px] bg-ink rounded-full" />
        </div>
        <p className="text-[11px] text-ink-3 mt-1.5">3 / 4</p>
      </div>
      <div className="shrink-0 px-6 pb-6">
        <h2 className="text-[22px] font-medium text-ink leading-snug mb-2">
          몇 학년이야?
        </h2>
        <p className="text-[13px] text-ink-3">학년별 맞춤 추천에 활용할게</p>
      </div>
      <div className="flex-1 min-h-0 px-5">
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((g) => (
            <button
              key={g}
              onClick={() => onSelect(g)}
              className={`py-[14px] rounded-[10px] text-[14px] border transition-colors ${
                selected === g
                  ? "bg-ink text-white border-ink font-medium"
                  : "text-ink-3 border-hairline"
              }`}
            >
              {g === 4 ? "4+" : g}
            </button>
          ))}
        </div>
      </div>
      <div className="shrink-0 px-5 pb-7 pt-4 bg-surface border-t border-hairline flex flex-col gap-3">
        <PrimaryButton onClick={onNext} disabled={!selected}>
          다음
        </PrimaryButton>
        {!selected && (
          <button onClick={onNext} className="text-center text-[13px] text-ink-3 py-1">
            건너뛰기
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Step 4: 등록금 + 장학금 ──────────────────────────────────────
function StepTuition({
  tuition,
  hasScholarship,
  scholarshipAmount,
  onTuitionChange,
  onToggle,
  onChange,
  onNext,
}: {
  tuition: number;
  hasScholarship: boolean | null;
  scholarshipAmount: number;
  onTuitionChange: (n: number) => void;
  onToggle: (v: boolean) => void;
  onChange: (n: number) => void;
  onNext: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState("");

  const appliedScholarship = hasScholarship ? scholarshipAmount : 0;
  const netBurden = Math.max(0, tuition - appliedScholarship);
  const disabled = hasScholarship === null || (hasScholarship && scholarshipAmount <= 0);

  const formatNumber = (val: string) => {
    const digits = val.replace(/[^0-9]/g, "");
    return digits ? Number(digits).toLocaleString("ko-KR") : "";
  };

  const handleEdit = () => {
    setTempValue(tuition.toLocaleString("ko-KR"));
    setIsEditing(true);
  };

  const handleConfirm = () => {
    const num = Number(tempValue.replace(/,/g, ""));
    if (num > 0) {
      onTuitionChange(num);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="shrink-0 px-5 pb-5">
        <div className="h-[3px] bg-surface-muted rounded-full">
          <div className="w-full h-[3px] bg-ink rounded-full" />
        </div>
        <p className="text-[11px] text-ink-3 mt-1.5">4 / 4</p>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 px-6">
        <h2 className="text-[22px] font-medium text-ink leading-snug mb-1">
          이번 학기 등록금
        </h2>
        <p className="text-[13px] text-ink-3 mb-6">
          트랙 기준으로 자동입력했어, 다르면 수정해줘
        </p>

        {/* 등록금 */}
        <div className="bg-surface-sub rounded-xl px-5 py-4 mb-5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[13px] text-ink-3">등록금</span>
            <button
              onClick={isEditing ? handleConfirm : handleEdit}
              className="text-[13px] text-blue font-medium"
              disabled={isEditing && !tempValue}
            >
              {isEditing ? "확인" : "수정"}
            </button>
          </div>
          {isEditing ? (
            <input
              autoFocus
              type="text"
              inputMode="numeric"
              value={tempValue}
              onChange={(e) => setTempValue(formatNumber(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirm();
                if (e.key === "Escape") setIsEditing(false);
              }}
              className="w-full text-[28px] font-medium text-ink bg-surface-muted rounded-[8px] px-3 py-1 outline-none"
            />
          ) : (
            <p className="text-[28px] font-medium text-ink">{formatKRW(tuition)}</p>
          )}
        </div>

        {/* 장학금 */}
        <p className="text-[14px] font-medium text-ink mb-3">장학금 받았어?</p>
        <div className="flex gap-2 mb-4">
          {([false, true] as const).map((v) => (
            <button
              key={String(v)}
              onClick={() => {
                onToggle(v);
                if (!v) onChange(0);
              }}
              className={`flex-1 py-[13px] rounded-[10px] text-[14px] border transition-colors ${
                hasScholarship === v
                  ? "bg-ink text-white border-ink font-medium"
                  : "text-ink-3 border-hairline"
              }`}
            >
              {v ? "받음" : "안 받음"}
            </button>
          ))}
        </div>

        {hasScholarship && (
          <div className="mb-5">
            <p className="text-[12px] text-ink-3 mb-2">받은 금액</p>
            <div className="border border-hairline rounded-[10px] px-4 py-[14px] flex justify-between items-center">
              <input
                autoFocus
                type="number"
                value={scholarshipAmount || ""}
                onChange={(e) => onChange(Number(e.target.value))}
                placeholder="0"
                className="flex-1 text-[16px] text-ink outline-none bg-transparent"
              />
              <span className="text-[14px] text-ink-3">원</span>
            </div>
          </div>
        )}

        {hasScholarship !== null && (
          <div className="bg-surface-sub rounded-xl px-5 py-4 mb-6">
            <div className="flex justify-between text-[13px] mb-2">
              <span className="text-ink-3">등록금</span>
              <span className="text-ink">{formatKRW(tuition)}</span>
            </div>
            {hasScholarship && (
              <div className="flex justify-between text-[13px] mb-2">
                <span className="text-ink-3">장학금</span>
                <span className="text-ink">− {formatKRW(appliedScholarship)}</span>
              </div>
            )}
            <div className="border-t border-hairline pt-2.5 flex justify-between text-[14px]">
              <span className="text-ink font-medium">실 부담액</span>
              <span className="text-ink font-medium">{formatKRW(netBurden)}</span>
            </div>
          </div>
        )}
      </div>
      <div className="shrink-0 px-5 pb-7 pt-4 bg-surface border-t border-hairline">
        <PrimaryButton onClick={onNext} disabled={disabled}>
          다음
        </PrimaryButton>
      </div>
    </div>
  );
}

// ─── Step 5: 맞춤 추천 동의 ────────────────────────────────────────
function StepPersonalizationConsent({
  onAccept,
  onSkip,
}: {
  onAccept: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto min-h-0 px-6 pt-8">
        <p className="text-[12px] font-medium text-blue mb-3">맞춤 추천</p>
        <h2 className="text-[22px] font-medium text-ink leading-snug mb-4">
          놓치기 쉬운 혜택부터
          <br />
          너에게 맞춰 보여줄게
        </h2>
        <div className="bg-surface-sub rounded-xl px-5 py-5 mb-5">
          <p className="text-[14px] text-ink leading-relaxed">
            서울대에는 학생이 쓸 수 있는 장학, 프로그램, 상담, 교육, 행사 정보가 많지만
            흩어져 있어서 놓치기 쉽습니다.
          </p>
          <p className="text-[14px] text-ink leading-relaxed mt-3">
            관심 분야를 알려주면 지금 나에게 더 맞는 혜택부터 보여줄게요.
            개인화는 언제든 끄거나 다시 설정할 수 있습니다.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {[
            "질문 몇 개만 답하면 관심 태그를 만들어요",
            "답변은 이 기기에 저장되고, 로그인하면 계정에 동기화돼요",
          ].map((line) => (
            <div key={line} className="flex items-start gap-2 text-[13px] text-ink-3">
              <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-blue shrink-0" />
              <span>{line}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="shrink-0 px-5 pb-8 pt-4 bg-surface border-t border-hairline flex flex-col gap-3">
        <PrimaryButton onClick={onAccept}>맞춤 추천 설정하기</PrimaryButton>
        <button onClick={onSkip} className="text-center text-[13px] text-ink-3 py-1">
          나중에 할게
        </button>
      </div>
    </div>
  );
}

// ─── Step 7: 결과 화면 ────────────────────────────────────────────
function StepResult({
  interests,
  personalized,
  netBurden,
  onStart,
}: {
  interests: Category[];
  personalized: boolean;
  netBurden: number;
  onStart: () => void;
}) {
  const matchingItems = (
    interests.length > 0
      ? items.filter((i) => !i.is_crawled && (interests as string[]).includes(i.category))
      : items.filter((i) => !i.is_crawled)
  ).sort((a, b) => b.value - a.value);

  const topItems = matchingItems.slice(0, 4);
  const potential = matchingItems.reduce((sum, i) => sum + i.value, 0);
  const ratio = netBurden > 0 ? Math.round((potential / netBurden) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto px-7 pt-10">
        <div className="flex justify-center mb-7">
          <MagpieHappy size={96} />
        </div>
        <p className="text-[14px] text-ink-3 mb-1">
          {interests.length > 0 ? "관심 분야 기준" : "전체 기준"} 이번 학기 최대
        </p>
        <p className="text-[38px] font-medium text-ink leading-tight mb-1">
          {formatKRW(potential)}
        </p>
        {netBurden > 0 && (
          <p className="text-[13px] text-ink-3 mb-8">
            실 부담액의 {ratio}%를 뽑을 수 있어
          </p>
        )}
        {personalized && (
          <p className="text-[13px] text-blue mb-4">
            관심사를 저장했어. 이제 홈에서 너에게 맞는 혜택부터 보여줄게.
            <br />
            뽑을수록 추천이 점점 더 똑똑해져.
          </p>
        )}

        {topItems.length > 0 && (
          <div className="flex flex-col gap-2 mb-4">
            {topItems.map((item) => (
              <div
                key={item.id}
                className="bg-surface-sub rounded-xl px-4 py-3 flex justify-between items-center"
              >
                <div>
                  <p className="text-[11px] text-ink-3 mb-0.5">{item.category_label}</p>
                  <p className="text-[13px] font-medium text-ink">{item.name}</p>
                </div>
                <span className="text-[13px] font-medium text-ink shrink-0 ml-3">
                  +{formatWonCompact(item.value)}
                </span>
              </div>
            ))}
            {matchingItems.length > 4 && (
              <p className="text-[12px] text-ink-3 text-center mt-1">
                외 {matchingItems.length - 4}개 항목
              </p>
            )}
          </div>
        )}
      </div>
      <div className="shrink-0 px-5 pb-8 pt-4 bg-surface border-t border-hairline">
        <PrimaryButton onClick={onStart}>뽕뽑으러 가기</PrimaryButton>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const setProfile = useUserStore((s) => s.setProfile);
  const addSemester = useSemesterStore((s) => s.addSemester);

  const [step, setStep] = useState<Step>(0);

  // Google 로그인 완료 후 돌아온 경우 step 0을 건너뜀
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStep(1);
    });
  }, []);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [hasScholarship, setHasScholarship] = useState<boolean | null>(null);
  const [scholarshipAmount, setScholarshipAmount] = useState(0);
  const [customTuition, setCustomTuition] = useState<number | null>(null);
  const [personalizationEnabled, setPersonalizationEnabled] = useState(false);
  const [personalizationInputMethod, setPersonalizationInputMethod] =
    useState<PersonalizationInputMethod | null>(null);
  const [personalizationConsentAt, setPersonalizationConsentAt] = useState<string | null>(null);
  const [personalizationAnswers, setPersonalizationAnswers] = useState<PersonalizationAnswers>({});

  const baseTuition =
    selectedTrack?.tuition_2025_1 ??
    selectedCollege?.tracks[0]?.tuition_2025_1 ??
    0;
  const tuition = customTuition ?? baseTuition;
  const appliedScholarship = hasScholarship ? scholarshipAmount : 0;
  const netBurden = Math.max(0, tuition - appliedScholarship);

  const derivedInterests = useMemo(
    () => interestsFromAnswers(personalizationAnswers),
    [personalizationAnswers]
  );

  const goNext = useCallback(() => {
    setStep((s) => {
      if (s === 1) {
        if (!selectedCollege) return s;
        if (selectedCollege.tracks.length === 1) {
          setSelectedTrack(selectedCollege.tracks[0]);
          return 3; // skip Track → Grade
        }
        return 2; // Track
      }
      return (s + 1) as Step;
    });
  }, [selectedCollege]);

  const goBack = useCallback(() => {
    setStep((s) => {
      if (s === 3 && selectedCollege && selectedCollege.tracks.length === 1) return 1;
      return Math.max(0, s - 1) as Step;
    });
  }, [selectedCollege]);

  const completeOnboarding = useCallback((override?: {
    personalizationEnabled?: boolean;
    personalizationInputMethod?: PersonalizationInputMethod | null;
    personalizationConsentAt?: string | null;
    personalizationAnswers?: PersonalizationAnswers;
  }) => {
    if (!selectedCollege || hasScholarship === null) return;
    const track = selectedTrack ?? selectedCollege.tracks[0];
    const scholarship = hasScholarship ? scholarshipAmount : 0;
    const net = Math.max(0, tuition - scholarship);
    const enabled = override?.personalizationEnabled ?? personalizationEnabled;
    const method = override?.personalizationInputMethod ?? personalizationInputMethod;
    const consentAt = override?.personalizationConsentAt ?? personalizationConsentAt;
    const answers = override?.personalizationAnswers ?? personalizationAnswers;
    const interests = enabled ? interestsFromAnswers(answers) : [];
    const interestTagVector = enabled ? buildInterestVectorFromAnswers(answers) : {};
    const updatedAt = new Date().toISOString();

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const term: 1 | 2 = month >= 3 && month <= 8 ? 1 : 2;
    const semesterId = `${year}-${term}`;

    setProfile({
      interests,
      collegeId: selectedCollege.id,
      trackId: track.id,
      grade: selectedGrade,
      tuition,
      scholarship,
      netBurden: net,
      personalizationEnabled: enabled,
      personalizationInputMethod: method,
      personalizationConsentAt: consentAt,
      interestTagVector,
      personalizationAnswers: answers,
      personalizationSummary: enabled
        ? `온보딩 질문으로 관심 태그 ${Object.keys(interestTagVector).length}개를 만들었습니다.`
        : null,
      personalizationUpdatedAt: enabled ? updatedAt : null,
      onboardingDone: true,
    });

    addSemester({
      id: semesterId,
      year,
      term,
      tuition,
      scholarship,
      netBurden: net,
      isActive: true,
    });

    void pushToCloud().catch(() => {
      // Local onboarding must not fail because optional cloud sync failed.
    });
    setStep(7);
  }, [
    selectedCollege,
    selectedTrack,
    selectedGrade,
    hasScholarship,
    scholarshipAmount,
    tuition,
    personalizationEnabled,
    personalizationInputMethod,
    personalizationConsentAt,
    personalizationAnswers,
    setProfile,
    addSemester,
  ]);

  return (
    <MobileFrame>
      <StatusBar />

      {step > 0 && step < 7 && (
        <button
          onClick={goBack}
          className="shrink-0 px-5 py-4 text-[22px] text-ink-3 self-start"
        >
          ←
        </button>
      )}

      {step === 0 && <StepWelcome onNext={() => setStep(1)} />}

      {step === 1 && (
        <StepCollege
          selected={selectedCollege}
          onSelect={(c) => {
            setSelectedCollege(c);
            setSelectedTrack(null);
            setHasScholarship(null);
            setScholarshipAmount(0);
            setCustomTuition(null);
          }}
          onNext={goNext}
        />
      )}

      {step === 2 && selectedCollege && (
        <StepTrack
          college={selectedCollege}
          selected={selectedTrack}
          onSelect={(t) => {
            setSelectedTrack(t);
            setHasScholarship(null);
            setScholarshipAmount(0);
            setCustomTuition(null);
          }}
          onNext={goNext}
        />
      )}

      {step === 3 && (
        <StepGrade
          selected={selectedGrade}
          onSelect={setSelectedGrade}
          onNext={goNext}
        />
      )}

      {step === 4 && (
        <StepTuition
          tuition={tuition}
          hasScholarship={hasScholarship}
          scholarshipAmount={scholarshipAmount}
          onTuitionChange={setCustomTuition}
          onToggle={setHasScholarship}
          onChange={setScholarshipAmount}
          onNext={goNext}
        />
      )}

      {step === 5 && (
        <StepPersonalizationConsent
          onAccept={() => {
            const consentAt = new Date().toISOString();
            setPersonalizationEnabled(true);
            setPersonalizationConsentAt(consentAt);
            setPersonalizationInputMethod("questions");
            setStep(6);
          }}
          onSkip={() => {
            setPersonalizationEnabled(false);
            setPersonalizationInputMethod("skip");
            setPersonalizationConsentAt(null);
            setPersonalizationAnswers({});
            completeOnboarding({
              personalizationEnabled: false,
              personalizationInputMethod: "skip",
              personalizationConsentAt: null,
              personalizationAnswers: {},
            });
          }}
        />
      )}

      {step === 6 && (
        <PersonalizationQuestions
          answers={personalizationAnswers}
          onChange={setPersonalizationAnswers}
          onFinish={() => {
            setPersonalizationEnabled(true);
            setPersonalizationInputMethod("questions");
            completeOnboarding({
              personalizationEnabled: true,
              personalizationInputMethod: "questions",
              personalizationConsentAt,
              personalizationAnswers,
            });
          }}
          onSkip={() => {
            setPersonalizationEnabled(false);
            setPersonalizationInputMethod("skip");
            setPersonalizationAnswers({});
            completeOnboarding({
              personalizationEnabled: false,
              personalizationInputMethod: "skip",
              personalizationConsentAt,
              personalizationAnswers: {},
            });
          }}
        />
      )}

      {step === 7 && (
        <StepResult
          interests={derivedInterests}
          personalized={personalizationEnabled && Object.keys(personalizationAnswers).length > 0}
          netBurden={netBurden}
          onStart={() => router.replace("/home")}
        />
      )}
    </MobileFrame>
  );
}
