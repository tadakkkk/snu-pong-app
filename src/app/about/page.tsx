"use client";

import { useRouter } from "next/navigation";
import MobileFrame from "@/components/ui/MobileFrame";
import StatusBar from "@/components/ui/StatusBar";
import MagpieIdle from "@/components/magpie/MagpieIdle";
import { APP_VERSION } from "@/lib/app-meta";

// TODO: 실제 URL 확정 후 채우기. 값이 있으면 링크가 노출된다.
const PRIVACY_POLICY_URL = ""; // 개인정보처리방침
const SUPPORT_URL = ""; // 지원/문의 페이지

const TEAM = ["이주현", "김나은", "김다현"];

export default function AboutPage() {
  const router = useRouter();

  return (
    <MobileFrame>
      <StatusBar />

      <button
        onClick={() => router.back()}
        className="shrink-0 px-5 py-4 text-[22px] text-ink self-start"
        aria-label="뒤로"
      >
        ←
      </button>

      <div className="flex-1 overflow-y-auto px-6 pb-10">
        {/* 캐릭터 + 이름 (서울대 공식 로고/상징색/정문 이미지는 사용하지 않음, 물까치 캐릭터만 사용) */}
        <div className="flex flex-col items-center text-center pt-2 pb-7">
          <MagpieIdle size={88} />
          <h1 className="text-[24px] font-medium text-ink mt-4 leading-tight">
            샤뽕
          </h1>
          <p className="text-[13px] text-ink-3 mt-1">
            낸 등록금만큼 누리고 졸업하기
          </p>
        </div>

        {/* 비공식 서비스 표기 */}
        <div className="bg-surface-sub rounded-xl px-5 py-4 mb-5">
          <p className="text-[13px] text-ink leading-relaxed">
            샤뽕은 서울대학교 학생들이 만든 비공식 서비스입니다. 서울대학교와
            공식적인 관련이 없습니다.
          </p>
        </div>

        {/* 팀 크레딧 */}
        <p className="text-[12px] text-ink-3 mb-2">만든 사람들</p>
        <div className="bg-surface-sub rounded-xl px-5 py-4 mb-5">
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            {TEAM.map((name, i) => (
              <span key={name} className="text-[14px] text-ink">
                {name}
                {i < TEAM.length - 1 && (
                  <span className="text-ink-3 ml-2">·</span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* 정책 / 지원 링크 (URL 확정 전까지는 값이 있을 때만 노출) */}
        {(PRIVACY_POLICY_URL || SUPPORT_URL) && (
          <div className="bg-surface-sub rounded-xl overflow-hidden mb-5">
            {PRIVACY_POLICY_URL && (
              <a
                href={PRIVACY_POLICY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3.5 active:bg-surface-muted"
              >
                <span className="text-[14px] text-ink">개인정보처리방침</span>
                <span className="text-ink-3 text-[13px]">↗</span>
              </a>
            )}
            {PRIVACY_POLICY_URL && SUPPORT_URL && (
              <div className="h-px bg-hairline mx-4" />
            )}
            {SUPPORT_URL && (
              <a
                href={SUPPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3.5 active:bg-surface-muted"
              >
                <span className="text-[14px] text-ink">지원 · 문의</span>
                <span className="text-ink-3 text-[13px]">↗</span>
              </a>
            )}
          </div>
        )}

        <p className="text-[11px] text-ink-3 text-center mt-2">
          버전 {APP_VERSION}
        </p>
      </div>
    </MobileFrame>
  );
}
