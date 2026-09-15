"use client";

import { useMemo, useState } from "react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import WheelPicker, {
  WheelPickerGroup,
  type WheelOption,
} from "@/components/ui/WheelPicker";
import { getTuition } from "@/data/colleges";
import { makeSemesterId } from "@/lib/semester";
import { formatWon } from "@/lib/format-currency";
import type { Semester } from "@/store/semester";

// 연도 목록 범위. 절대 연도를 박지 않고 실행 시점의 현재 연도 기준 상대값으로 잡아서,
// 해가 바뀌어도 코드 수정 없이 목록이 따라 움직이게 한다.
/** 작년 학기도 뒤늦게 기록할 수 있게 한 칸 아래까지 연다. */
const YEARS_BEFORE = 1;
/** 졸업 학기까지 미리 만들어 둘 수 있게 위로 여섯 칸 연다. */
const YEARS_AFTER = 6;

const ITEM_HEIGHT = 36;
const VISIBLE_COUNT = 5;

const TERM_OPTIONS: WheelOption<1 | 2>[] = [
  { value: 1, label: "1학기" },
  { value: 2, label: "2학기" },
];

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
  const yearOptions = useMemo<WheelOption<number>[]>(() => {
    const first = new Date().getFullYear() - YEARS_BEFORE;
    return Array.from({ length: YEARS_BEFORE + YEARS_AFTER + 1 }, (_, i) => ({
      value: first + i,
      label: `${first + i}년`,
    }));
  }, []);

  // 기본값은 항상 올해. 범위가 올해를 기준으로 잡히므로 별도 보정이 필요 없다.
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [term, setTerm] = useState<1 | 2>(1);
  const [scholarship, setScholarship] = useState(0);

  const tuition =
    collegeId && trackId ? getTuition(collegeId, trackId) ?? 0 : 0;
  const netBurden = Math.max(0, tuition - scholarship);
  const newId = makeSemesterId(year, term);
  const alreadyExists = existingIds.includes(newId);

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

      <div className="relative bg-surface rounded-t-2xl px-5 pb-8 shadow-xl max-h-[90%] overflow-y-auto overscroll-contain">
        <div className="pt-5 pb-4">
          <p className="text-[17px] font-medium text-ink">새 학기 추가</p>
        </div>

        {/* 연도 · 학기 */}
        <div className="mb-5">
          <p className="text-[12px] text-ink-3 mb-2">연도 · 학기</p>
          <div className="border border-hairline rounded-[14px] overflow-hidden">
            <WheelPickerGroup
              itemHeight={ITEM_HEIGHT}
              visibleCount={VISIBLE_COUNT}
            >
              <WheelPicker
                options={yearOptions}
                value={year}
                onChange={setYear}
                itemHeight={ITEM_HEIGHT}
                visibleCount={VISIBLE_COUNT}
                ariaLabel="학기 연도"
              />
              <WheelPicker
                options={TERM_OPTIONS}
                value={term}
                onChange={setTerm}
                itemHeight={ITEM_HEIGHT}
                visibleCount={VISIBLE_COUNT}
                ariaLabel="학기"
              />
            </WheelPickerGroup>
          </div>
          <p className="text-[11px] text-ink-3 mt-1.5">
            위아래로 굴려서 학기를 골라요.
          </p>
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
