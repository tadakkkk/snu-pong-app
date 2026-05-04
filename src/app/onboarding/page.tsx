"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import MobileFrame from "@/components/ui/MobileFrame";
import PrimaryButton from "@/components/ui/PrimaryButton";
import MagpieWithCoin from "@/components/magpie/MagpieWithCoin";
import MagpieSad from "@/components/magpie/MagpieSad";
import { colleges, type College, type Track } from "@/data/colleges";
import { totalClaimableValue } from "@/data/items";
import { useUserStore } from "@/store/user";
import { useSemesterStore } from "@/store/semester";

type Step = 0 | 1 | 2 | 3 | 4 | 5;

function formatKRW(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

// ─── Step 0: 스플래시 ──────────────────────────────────────────────
function StepWelcome({ onNext }: { onNext: () => void }) {
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
      <div className="px-5 pb-8 flex flex-col gap-4">
        <PrimaryButton onClick={onNext}>시작하기</PrimaryButton>
        <p className="text-center text-[13px] text-ink-3">이미 가입했어요</p>
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
    <div className="flex-1 flex flex-col">
      {/* 진행 바 */}
      <div className="px-5 pb-5">
        <div className="h-[3px] bg-surface-muted rounded-full">
          <div className="w-1/4 h-[3px] bg-ink rounded-full" />
        </div>
        <p className="text-[11px] text-ink-3 mt-1.5">1 / 4</p>
      </div>

      <div className="px-6 pb-5">
        <h2 className="text-[22px] font-medium text-ink leading-snug mb-2">
          어느 단과대야?
        </h2>
        <p className="text-[13px] text-ink-3">단과대마다 등록금이 달라</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5">
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

      <div className="px-5 pb-7 pt-4">
        <PrimaryButton onClick={onNext} disabled={!selected}>
          다음
        </PrimaryButton>
      </div>
    </div>
  );
}

// ─── Step 2: 계열 ──────────────────────────────────────────────────
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
    <div className="flex-1 flex flex-col">
      <div className="px-5 pb-5">
        <div className="h-[3px] bg-surface-muted rounded-full">
          <div className="w-2/4 h-[3px] bg-ink rounded-full" />
        </div>
        <p className="text-[11px] text-ink-3 mt-1.5">2 / 4</p>
      </div>

      <div className="px-6 pb-6">
        <h2 className="text-[22px] font-medium text-ink leading-snug mb-2">
          {college.name.replace("대학", "대").replace("학부", "")} 어느 학과야?
        </h2>
        <p className="text-[13px] text-ink-3">학과별로 등록금이 달라</p>
      </div>

      <div className="flex-1 px-5 overflow-y-auto">
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
                    <p
                      className={`text-[11px] mt-0.5 ${
                        isSelected ? "text-white/70" : "text-ink-3"
                      }`}
                    >
                      {t.departments}
                    </p>
                  )}
                </div>
                <span className={`text-[13px] font-medium ${isSelected ? "text-white" : "text-ink"}`}>
                  {formatKRW(t.tuition_2025_1)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 pb-7 pt-4">
        <PrimaryButton onClick={onNext} disabled={!selected}>
          다음
        </PrimaryButton>
      </div>
    </div>
  );
}

// ─── Step 3: 학년 ──────────────────────────────────────────────────
function StepGrade({
  college,
  track,
  tuition,
  selectedGrade,
  onSelect,
  onNext,
  onTuitionChange,
}: {
  college: College;
  track: Track | null;
  tuition: number;
  selectedGrade: number | null;
  onSelect: (g: number) => void;
  onNext: () => void;
  onTuitionChange: (n: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState("");

  const gradeOptions = [1, 2, 3, 4];
  const collegeShort = college.name.replace("대학교", "").replace("대학", "대").replace("학부", "");
  const trackLabel = track?.name ? ` ${track.name}` : "";

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleConfirm();
    if (e.key === "Escape") {
      setIsEditing(false);
      setTempValue("");
    }
  };

  const parsedTemp = Number(tempValue.replace(/,/g, ""));
  const confirmDisabled = !tempValue || parsedTemp <= 0;

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-5 pb-5">
        <div className="h-[3px] bg-surface-muted rounded-full">
          <div className="w-3/4 h-[3px] bg-ink rounded-full" />
        </div>
        <p className="text-[11px] text-ink-3 mt-1.5">3 / 4</p>
      </div>

      <div className="px-6 pb-7">
        <h2 className="text-[22px] font-medium text-ink leading-snug mb-2">
          몇 학년이야?
        </h2>
        <p className="text-[13px] text-ink-3 mb-7">
          학년에 따라 등록금이 살짝 달라
        </p>

        <div className="grid grid-cols-4 gap-1.5 mb-6">
          {gradeOptions.map((g) => {
            const isSelected = selectedGrade === g;
            return (
              <button
                key={g}
                onClick={() => onSelect(g)}
                className={`py-[14px] rounded-[10px] text-[14px] border transition-colors ${
                  isSelected
                    ? "bg-ink text-white border-ink font-medium"
                    : "text-ink-3 border-hairline"
                }`}
              >
                {g === 4 ? "4+" : g}
              </button>
            );
          })}
        </div>

        {selectedGrade && (
          <div className="bg-surface-sub rounded-xl p-[18px]">
            <p className="text-[12px] text-ink-3 mb-1">
              {collegeShort}
              {trackLabel} · {selectedGrade}학년
            </p>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-[13px] text-ink-3">이번 학기 등록금</span>
              <button
                onClick={isEditing ? handleConfirm : handleEdit}
                className={`text-[13px] font-medium transition-colors ${
                  isEditing && confirmDisabled ? "text-ink-4" : "text-blue"
                }`}
                disabled={isEditing && confirmDisabled}
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
                onChange={(e) =>
                  setTempValue(formatNumber(e.target.value))
                }
                onKeyDown={handleKeyDown}
                placeholder={tuition.toLocaleString("ko-KR")}
                className="w-full text-[28px] font-medium text-ink bg-surface-muted rounded-[8px] px-3 py-1 outline-none"
              />
            ) : (
              <p className="text-[28px] font-medium text-ink">
                {formatKRW(tuition)}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-auto px-5 pb-7">
        <PrimaryButton onClick={onNext} disabled={!selectedGrade}>
          다음
        </PrimaryButton>
      </div>
    </div>
  );
}

// ─── Step 4: 장학금 ────────────────────────────────────────────────
function StepScholarship({
  tuition,
  hasScholarship,
  scholarshipAmount,
  onToggle,
  onChange,
  onDone,
}: {
  tuition: number;
  hasScholarship: boolean;
  scholarshipAmount: number;
  onToggle: (v: boolean) => void;
  onChange: (v: number) => void;
  onDone: () => void;
}) {
  const netBurden = Math.max(0, tuition - scholarshipAmount);

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-5 pb-5">
        <div className="h-[3px] bg-surface-muted rounded-full">
          <div className="w-full h-[3px] bg-ink rounded-full" />
        </div>
        <p className="text-[11px] text-ink-3 mt-1.5">4 / 4</p>
      </div>

      <div className="px-6 pb-7">
        <h2 className="text-[22px] font-medium text-ink leading-snug mb-2">
          장학금 받았어?
        </h2>
        <p className="text-[13px] text-ink-3 mb-7">
          받았으면 실 부담액에서 빼줄게
        </p>

        <div className="flex gap-2 mb-5">
          {[false, true].map((v) => (
            <button
              key={String(v)}
              onClick={() => onToggle(v)}
              className={`flex-1 py-[14px] rounded-[10px] text-[14px] border transition-colors ${
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

        <div className="bg-surface-sub rounded-xl px-[18px] py-4">
          <div className="flex justify-between text-[13px] mb-2">
            <span className="text-ink-3">등록금</span>
            <span className="text-ink">{formatKRW(tuition)}</span>
          </div>
          {hasScholarship && (
            <div className="flex justify-between text-[13px] mb-2">
              <span className="text-ink-3">장학금</span>
              <span className="text-ink">- {formatKRW(scholarshipAmount)}</span>
            </div>
          )}
          <div className="border-t border-hairline pt-2.5 flex justify-between text-[14px]">
            <span className="text-ink font-medium">실 부담액</span>
            <span className="text-ink font-medium">{formatKRW(netBurden)}</span>
          </div>
        </div>
      </div>

      <div className="mt-auto px-5 pb-7">
        <PrimaryButton onClick={onDone}>완료</PrimaryButton>
      </div>
    </div>
  );
}

// ─── Step 5: 충격 화면 ─────────────────────────────────────────────
function StepShock({
  netBurden,
  onStart,
}: {
  netBurden: number;
  onStart: () => void;
}) {
  const ratio = netBurden > 0
    ? Math.round((totalClaimableValue / netBurden) * 100)
    : 0;

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 px-7 pt-14">
        <p className="text-[14px] text-ink-3 mb-2">너가 낸 등록금</p>
        <p className="text-[36px] font-medium text-ink leading-tight mb-8">
          {formatKRW(netBurden)}
        </p>

        <div className="border-t border-surface-muted mb-8" />

        <p className="text-[14px] text-ink-3 mb-2">이 돈으로 뽑을 수 있는 가치</p>
        <p className="text-[36px] font-medium text-ink leading-tight mb-2">
          {formatKRW(totalClaimableValue)}
        </p>
        <p className="text-[13px] text-ink-3 mb-8">
          잘 뽑으면 등록금의 {ratio}%까지
        </p>

        <div className="flex justify-center mb-7">
          <MagpieSad size={80} />
        </div>

        <p className="text-center text-[13px] text-ink-3 leading-relaxed">
          평균 학생은 이 중 15%만 뽑고<br />나머지 85%를 그냥 버려
        </p>
      </div>

      <div className="px-5 pb-8 pt-6">
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
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [hasScholarship, setHasScholarship] = useState(false);
  const [scholarshipAmount, setScholarshipAmount] = useState(0);
  const [customTuition, setCustomTuition] = useState<number | null>(null);

  const baseTuition = selectedTrack?.tuition_2025_1 ?? selectedCollege?.tracks[0]?.tuition_2025_1 ?? 0;
  const tuition = customTuition ?? baseTuition;
  const netBurden = Math.max(0, tuition - (hasScholarship ? scholarshipAmount : 0));

  const goNext = useCallback(() => {
    setStep((s) => {
      if (s === 1) {
        // step 1 → step 2 or 3 (skip track if single track)
        if (selectedCollege && selectedCollege.tracks.length === 1) {
          setSelectedTrack(selectedCollege.tracks[0]);
          return 3;
        }
        return 2;
      }
      return (s + 1) as Step;
    });
  }, [selectedCollege]);

  const goBack = useCallback(() => {
    setStep((s) => {
      if (s === 3 && selectedCollege && selectedCollege.tracks.length === 1) {
        return 1;
      }
      return Math.max(0, s - 1) as Step;
    });
  }, [selectedCollege]);

  const handleDone = useCallback(() => {
    if (!selectedCollege) return;
    const track = selectedTrack ?? selectedCollege.tracks[0];
    const scholarship = hasScholarship ? scholarshipAmount : 0;
    const net = Math.max(0, tuition - scholarship);

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const term: 1 | 2 = month >= 3 && month <= 8 ? 1 : 2;
    const semesterId = `${year}-${term}`;

    setProfile({
      collegeId: selectedCollege.id,
      trackId: track.id,
      grade: selectedGrade,
      tuition,
      scholarship,
      netBurden: net,
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

    setStep(5);
  }, [
    selectedCollege,
    selectedTrack,
    selectedGrade,
    hasScholarship,
    scholarshipAmount,
    tuition,
    setProfile,
    addSemester,
  ]);

  return (
    <MobileFrame>
      {/* 상단 상태바 영역 */}
      <div className="px-5 pt-3 pb-0 flex justify-between text-[11px] text-ink-3">
        <span>9:41</span>
        <span>● ● ●</span>
      </div>

      {/* 뒤로 버튼 */}
      {step > 0 && step < 5 && (
        <button
          onClick={goBack}
          className="px-5 py-4 text-[22px] text-ink-3 self-start"
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
            setCustomTuition(null);
          }}
          onNext={goNext}
        />
      )}

      {step === 2 && selectedCollege && (
        <StepTrack
          college={selectedCollege}
          selected={selectedTrack}
          onSelect={setSelectedTrack}
          onNext={goNext}
        />
      )}

      {step === 3 && selectedCollege && (
        <StepGrade
          college={selectedCollege}
          track={selectedTrack}
          tuition={tuition}
          selectedGrade={selectedGrade}
          onSelect={setSelectedGrade}
          onNext={goNext}
          onTuitionChange={setCustomTuition}
        />
      )}

      {step === 4 && (
        <StepScholarship
          tuition={tuition}
          hasScholarship={hasScholarship}
          scholarshipAmount={scholarshipAmount}
          onToggle={(v) => {
            setHasScholarship(v);
            if (!v) setScholarshipAmount(0);
          }}
          onChange={setScholarshipAmount}
          onDone={handleDone}
        />
      )}

      {step === 5 && (
        <StepShock
          netBurden={netBurden}
          onStart={() => router.replace("/home")}
        />
      )}
    </MobileFrame>
  );
}
