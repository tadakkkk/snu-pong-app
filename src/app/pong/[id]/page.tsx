"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import MobileFrame from "@/components/ui/MobileFrame";
import PrimaryButton from "@/components/ui/PrimaryButton";
import MagpieIdle from "@/components/magpie/MagpieIdle";
import { getItem } from "@/data/items";
import { getSite } from "@/data/sites";
import { usePongStore } from "@/store/pong";
import { useSemesterStore } from "@/store/semester";

export default function PongDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const item = getItem(id);
  const site = item?.site_id ? getSite(item.site_id) : undefined;

  const { addRecord, removeRecord, hasRecordForItem, getTotalBySemester, getRecordsBySemester } = usePongStore();
  const { activeSemesterId } = useSemesterStore();
  const [showToast, setShowToast] = useState(false);

  if (!item) {
    return (
      <MobileFrame>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-ink-3">항목을 찾을 수 없어요</p>
        </div>
      </MobileFrame>
    );
  }

  const alreadyPonged = activeSemesterId
    ? hasRecordForItem(activeSemesterId, item.id)
    : false;

  const currentRecord = activeSemesterId
    ? getRecordsBySemester(activeSemesterId).find((r) => r.itemId === item.id)
    : undefined;

  const semesterTotal = activeSemesterId
    ? getTotalBySemester(activeSemesterId) + (alreadyPonged ? 0 : item.value)
    : item.value;

  function handlePong() {
    if (!activeSemesterId || alreadyPonged) return;
    addRecord({
      id: `${item!.id}-${Date.now()}`,
      semesterId: activeSemesterId,
      itemId: item!.id,
      value: item!.value,
      pongAt: new Date().toISOString(),
    });
    setShowToast(true);
  }

  function handleUndo() {
    if (!currentRecord) return;
    removeRecord(currentRecord.id);
  }

  return (
    <MobileFrame>
      {/* 상태바 */}
      <div className="px-5 pt-3 flex justify-between text-[11px] text-ink-3">
        <span>9:41</span>
        <span>● ● ●</span>
      </div>

      <button
        onClick={() => router.back()}
        className="px-5 py-4 text-[22px] text-ink self-start"
      >
        ←
      </button>

      <div className="flex-1 overflow-y-auto">
        {/* 카테고리 + 이름 + 가치 */}
        <div className="px-6 pb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block bg-surface-muted text-ink-2 text-[11px] px-2.5 py-1 rounded-md">
              {item.category_label}
            </span>
            {item.is_crawled && (
              <span className="inline-block bg-[#E1F5EE] text-[#0F6E56] text-[10px] px-1.5 py-1 rounded">
                자동수집
              </span>
            )}
          </div>
          <h1 className={`text-[26px] font-medium text-ink leading-snug ${item.subtitle ? "mb-1" : "mb-4"}`}>
            {item.name}
          </h1>
          {item.subtitle && (
            <p className="text-[13px] text-ink-3 mb-3">{item.subtitle}</p>
          )}
          <p className="text-[13px] text-ink-3 mb-1">뽕뽑을 가치</p>
          {item.is_crawled && item.value_status === "needs_estimation" ? (
            <p className="text-[28px] font-medium text-ink-3 leading-tight">
              가치 확인 중
            </p>
          ) : (
            <p className="text-[36px] font-medium text-ink leading-tight">
              +{item.value.toLocaleString("ko-KR")}원
            </p>
          )}
          {item.value_basis && (
            <p className="text-[12px] text-ink-3 mt-1">{item.value_basis}</p>
          )}
        </div>

        {/* 메타 정보 */}
        <div className="px-6 py-4 border-t border-hairline flex flex-col gap-3">
          {item.duration_minutes && (
            <div className="flex justify-between text-[13px]">
              <span className="text-ink-3">소요시간</span>
              <span className="text-ink">{item.duration_minutes}분</span>
            </div>
          )}
          <div className="flex justify-between text-[13px]">
            <span className="text-ink-3">단위</span>
            <span className="text-ink">{item.unit}</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-ink-3">자격</span>
            <span className="text-ink">{item.eligibility}</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-ink-3">마감</span>
            <span
              className={
                item.deadline_type !== "always"
                  ? "text-red font-medium"
                  : "text-ink"
              }
            >
              {item.deadline_label}
            </span>
          </div>
          {item.provider && (
            <div className="flex justify-between text-[13px]">
              <span className="text-ink-3">운영</span>
              <span className="text-ink">{item.provider}</span>
            </div>
          )}
        </div>

        {/* 설명 */}
        {item.description && (
          <div className="px-6 py-4 border-t border-hairline">
            <p className="text-[13px] text-ink-3 font-medium mb-2">이런 거야</p>
            <p className="text-[14px] text-ink leading-[1.7]">
              {item.description}
            </p>
          </div>
        )}

        {/* 여기서 신청 */}
        {site && (
          <div className="px-6 py-4 border-t border-hairline">
            <p className="text-[13px] text-ink-3 font-medium mb-2">여기서 신청</p>
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-surface-sub rounded-xl px-4 py-[14px] active:opacity-70"
            >
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[14px] font-medium text-ink">{site.name}</p>
                <span className="text-[13px] text-blue">↗</span>
              </div>
              <p className="text-[11px] text-ink-3 leading-[1.5]">
                {site.description}
              </p>
            </a>
          </div>
        )}

        {/* 자동수집 항목: 원문 링크 */}
        {item.is_crawled && item.url && !site && (
          <div className="px-6 py-4 border-t border-hairline">
            <p className="text-[13px] text-ink-3 font-medium mb-2">원문 공지</p>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-surface-sub rounded-xl px-4 py-[14px] active:opacity-70"
            >
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-ink truncate pr-4">{item.provider}</p>
                <span className="text-[13px] text-blue shrink-0">↗</span>
              </div>
            </a>
          </div>
        )}

        {/* 신청 방법 */}
        {item.how_to_apply.length > 0 && (
          <div className="px-6 py-4 border-t border-hairline">
            <p className="text-[13px] text-ink-3 font-medium mb-2">신청 방법</p>
            <div className="bg-surface-sub rounded-xl px-4 py-[14px] flex flex-col gap-2">
              {item.how_to_apply.map((step, i) => (
                <p key={i} className="text-[13px] text-ink leading-relaxed">
                  {i + 1}. {step}
                </p>
              ))}
            </div>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-2.5 text-[13px] text-blue"
              >
                홈페이지로 이동 →
              </a>
            )}
          </div>
        )}

        {/* 이미 뽑았을 때 안내 */}
        {alreadyPonged && (
          <div className="px-6 py-4 border-t border-hairline">
            <div className="bg-surface-sub rounded-xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[14px]">✓</span>
                <p className="text-[13px] text-ink-3">이번 학기에 이미 뽕뽑았어요</p>
              </div>
              <button
                onClick={handleUndo}
                className="text-[12px] text-ink-3 underline active:opacity-60"
              >
                취소
              </button>
            </div>
          </div>
        )}

        <div className="h-28" />
      </div>

      {/* 액션 버튼 */}
      <div className="px-5 pb-7 pt-4 border-t border-hairline bg-surface">
        {item.is_crawled && item.value_status === "needs_estimation" ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-4 rounded-2xl bg-surface-sub text-[16px] font-medium text-blue active:opacity-70"
          >
            공지 원문 보기 ↗
          </a>
        ) : (
          <PrimaryButton
            onClick={handlePong}
            disabled={alreadyPonged || !activeSemesterId}
          >
            {alreadyPonged ? "이미 뽕뽑았어요 ✓" : "뽕뽑았어요"}
          </PrimaryButton>
        )}
      </div>

      {/* ── 뽕뽑았어요 토스트 ── */}
      {showToast && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setShowToast(false)}
          />
          <div className="relative bg-ink text-white rounded-[18px] px-[22px] py-6 mx-5 w-full">
            <div className="flex items-center gap-4 mb-4">
              <MagpieIdle size={60} />
              <div>
                <p className="text-[12px] text-white/70 mb-0.5">방금 뽕뽑음</p>
                <p className="text-[24px] font-medium leading-tight">
                  +{item.value.toLocaleString("ko-KR")}원
                </p>
              </div>
            </div>
            <p className="text-[13px] text-white/80 mb-4">
              이번 학기 누적 {semesterTotal.toLocaleString("ko-KR")}원
            </p>
            <div className="border-t border-white/15 pt-3.5 flex justify-between">
              <button
                onClick={() => {
                  setShowToast(false);
                  router.push("/home");
                }}
                className="text-[13px] text-white/70 active:opacity-70"
              >
                홈으로
              </button>
              <button
                onClick={() => {
                  setShowToast(false);
                  router.back();
                }}
                className="text-[13px] font-medium text-white active:opacity-70"
              >
                계속 뽕뽑기 →
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileFrame>
  );
}
