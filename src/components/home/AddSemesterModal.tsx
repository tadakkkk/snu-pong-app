"use client";

import { useState } from "react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { getTuition } from "@/data/colleges";
import { makeSemesterId } from "@/lib/semester";
import { formatWon } from "@/lib/format-currency";
import type { Semester } from "@/store/semester";

interface Props {
  collegeId: string | null;
  trackId: string | null;
  existingIds: string[];
  onAdd: (semester: Semester) => void;
  onClose: () => void;
}

export default function AddSemesterModal({
  collegeId,
  trackId,
  existingIds,
  onAdd,
  onClose,
}: Props) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [term, setTerm] = useState<1 | 2>(1);
  const [scholarship, setScholarship] = useState(0);

  const tuition =
    collegeId && trackId ? getTuition(collegeId, trackId) ?? 0 : 0;
  const netBurden = Math.max(0, tuition - scholarship);
  const newId = makeSemesterId(year, term);
  const alreadyExists = existingIds.includes(newId);

  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  function handleAdd() {
    if (alreadyExists) return;
    onAdd({
      id: newId,
      year,
      term,
      tuition,
      scholarship,
      netBurden,
      isActive: false,
    });
    onClose();
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />

      <div className="relative bg-surface rounded-t-2xl px-5 pb-8 shadow-xl">
        <div className="pt-5 pb-4">
          <p className="text-[17px] font-medium text-ink">새 학기 추가</p>
        </div>

        {/* 연도 */}
        <div className="mb-5">
          <p className="text-[12px] text-ink-3 mb-2">연도</p>
          <div className="flex gap-2">
            {yearOptions.map((y) => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`flex-1 py-3 rounded-[10px] text-[14px] border transition-colors ${
                  year === y
                    ? "bg-ink text-white border-ink font-medium"
                    : "text-ink-3 border-hairline"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* 학기 */}
        <div className="mb-5">
          <p className="text-[12px] text-ink-3 mb-2">학기</p>
          <div className="flex gap-2">
            {([1, 2] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTerm(t)}
                className={`flex-1 py-3 rounded-[10px] text-[14px] border transition-colors ${
                  term === t
                    ? "bg-ink text-white border-ink font-medium"
                    : "text-ink-3 border-hairline"
                }`}
              >
                {t}학기
              </button>
            ))}
          </div>
        </div>

        {/* 장학금 */}
        <div className="mb-5">
          <p className="text-[12px] text-ink-3 mb-2">장학금 (없으면 0)</p>
          <div className="border border-hairline rounded-[10px] px-4 py-[14px] flex justify-between items-center">
            <input
              type="number"
              value={scholarship || ""}
              onChange={(e) => setScholarship(Number(e.target.value))}
              placeholder="0"
              className="flex-1 text-[16px] text-ink outline-none bg-transparent"
            />
            <span className="text-[14px] text-ink-3">원</span>
          </div>
        </div>

        {/* 계산 미리보기 */}
        {tuition > 0 && (
          <div className="bg-surface-sub rounded-xl px-4 py-3.5 mb-5">
            <div className="flex justify-between text-[13px] mb-1.5">
              <span className="text-ink-3">등록금</span>
              <span className="text-ink">{formatWon(tuition)}</span>
            </div>
            {scholarship > 0 && (
              <div className="flex justify-between text-[13px] mb-1.5">
                <span className="text-ink-3">장학금</span>
                <span className="text-ink">- {formatWon(scholarship)}</span>
              </div>
            )}
            <div className="border-t border-hairline pt-2 flex justify-between text-[13px]">
              <span className="font-medium text-ink">실 부담액</span>
              <span className="font-medium text-ink">{formatWon(netBurden)}</span>
            </div>
          </div>
        )}

        {alreadyExists && (
          <p className="text-[12px] text-red mb-3">
            이미 추가된 학기예요
          </p>
        )}

        <PrimaryButton onClick={handleAdd} disabled={alreadyExists}>
          추가하기
        </PrimaryButton>
      </div>
    </div>
  );
}
