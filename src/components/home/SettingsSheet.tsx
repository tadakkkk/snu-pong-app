"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getCollege } from "@/data/colleges";
import { useUserStore } from "@/store/user";
import { useSemesterStore } from "@/store/semester";
import { usePongStore } from "@/store/pong";

interface Props {
  onClose: () => void;
}

export default function SettingsSheet({ onClose }: Props) {
  const router = useRouter();

  const user = useUserStore();
  const { semesters, activeSemesterId, updateSemester } = useSemesterStore();

  const activeSemester = semesters.find((s) => s.id === activeSemesterId);
  const college = user.collegeId ? getCollege(user.collegeId) : null;
  const track = college?.tracks.find((t) => t.id === user.trackId) ?? null;

  const [editingScholarship, setEditingScholarship] = useState(false);
  const [scholarshipInput, setScholarshipInput] = useState(
    String(activeSemester?.scholarship ?? 0)
  );
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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

        {/* 이번 학기 장학금 */}
        {activeSemester && (
          <div className="px-5 mb-4">
            <p className="text-[12px] text-ink-3 mb-2">
              이번 학기 ({activeSemester.year} - {activeSemester.term}학기)
            </p>
            <div className="bg-surface-sub rounded-xl px-4 py-3.5">
              <div className="flex justify-between text-[13px] mb-2">
                <span className="text-ink-3">등록금</span>
                <span className="text-ink">
                  {activeSemester.tuition.toLocaleString("ko-KR")}원
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
                      {activeSemester.scholarship.toLocaleString("ko-KR")}원
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
                  {activeSemester.netBurden.toLocaleString("ko-KR")}원
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 데이터 초기화 */}
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
      </div>
    </div>
  );
}
