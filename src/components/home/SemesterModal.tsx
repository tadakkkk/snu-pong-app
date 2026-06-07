"use client";

import { useState } from "react";
import type { Semester } from "@/store/semester";
import { formatWon } from "@/lib/format-currency";

interface Props {
  semesters: Semester[];
  activeSemesterId: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
  onClose: () => void;
  onRemove: (id: string) => void;
  getTotalBySemester: (id: string) => number;
}

export default function SemesterModal({
  semesters,
  activeSemesterId,
  onSelect,
  onAddNew,
  onClose,
  onRemove,
  getTotalBySemester,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function handleRemove(id: string) {
    onRemove(id);
    setConfirmDelete(null);
    if (semesters.length <= 1) onClose();
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      {/* 딤 배경 */}
      <div
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
      />

      {/* 모달 시트 */}
      <div className="relative bg-surface rounded-t-2xl pb-8 shadow-xl">
        <div className="px-6 pt-5 pb-2">
          <p className="text-[12px] text-ink-3">학기 선택</p>
        </div>

        {semesters.length === 0 && (
          <div className="px-6 py-4 text-[14px] text-ink-3">학기가 없어요</div>
        )}

        {[...semesters]
          .sort((a, b) => b.year - a.year || b.term - a.term)
          .map((sem) => {
            const isActive = sem.id === activeSemesterId;
            const total = getTotalBySemester(sem.id);
            const pct =
              sem.netBurden > 0
                ? Math.round((total / sem.netBurden) * 100)
                : 0;
            const sublabel = sem.isActive
              ? `진행 중 · ${formatWon(total)} 뽕뽑음`
              : `종료 · ${formatWon(total)} 뽕뽑음 (${pct}%)`;

            return (
              <div
                key={sem.id}
                className={`px-6 py-3.5 flex items-center transition-colors ${
                  isActive ? "bg-surface-sub" : ""
                }`}
              >
                <button
                  onClick={() => {
                    onSelect(sem.id);
                    onClose();
                  }}
                  className="flex-1 text-left"
                >
                  <p
                    className={`text-[15px] ${
                      isActive ? "font-medium text-ink" : "text-ink"
                    }`}
                  >
                    {sem.year} - {sem.term}학기
                  </p>
                  <p className="text-[12px] text-ink-3 mt-0.5">{sublabel}</p>
                </button>
                {isActive ? (
                  <span className="text-ink text-[10px] ml-2">●</span>
                ) : confirmDelete === sem.id ? (
                  <div className="flex items-center gap-2 ml-2">
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="text-[12px] text-ink-3"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => handleRemove(sem.id)}
                      className="text-[12px] text-red font-medium"
                    >
                      삭제
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(sem.id)}
                    className="ml-2 text-[14px] text-ink-4 active:opacity-60"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}

        <div className="border-t border-hairline mt-2 mx-0">
          <button
            onClick={() => {
              onClose();
              onAddNew();
            }}
            className="w-full px-6 py-4 text-left text-[14px] text-blue font-medium"
          >
            + 새 학기 추가
          </button>
        </div>
      </div>
    </div>
  );
}
