"use client";

import { useRouter } from "next/navigation";
import MobileFrame from "@/components/ui/MobileFrame";
import StatusBar from "@/components/ui/StatusBar";
import MagpieIdle from "@/components/magpie/MagpieIdle";
import { APP_VERSION } from "@/lib/app-meta";
import { openExternalUrl } from "@/lib/open-external";

const PRIVACY_POLICY_URL =
  "https://tadakkkk.github.io/snu-pong-app/snupong-privacy.html"; // 개인정보처리방침
const SUPPORT_URL =
  "https://tadakkkk.github.io/snu-pong-app/snupong-support.html"; // 고객지원

const TEAM = ["이주현", "김나은", "김다현"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-[12px] text-ink-3 mb-2">{title}</p>
      <div className="bg-surface-sub rounded-xl px-5 py-4">{children}</div>
    </div>
  );
}

function LinkRow({ label, url }: { label: string; url: string }) {
  // href를 유지해 웹의 우클릭·새 탭 열기를 보존하면서, 클릭 시엔 플랫폼에 맞게
  // (네이티브=인앱 브라우저, 웹=새 탭) openExternalUrl로 처리한다.
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        e.preventDefault();
        void openExternalUrl(url);
      }}
      className="flex items-center justify-between px-4 py-3.5 active:bg-surface-muted"
    >
      <span className="text-[14px] text-ink">{label}</span>
      <span className="text-ink-3 text-[13px]">↗</span>
    </a>
  );
}

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

        {/* 서비스 소개 */}
        <Section title="샤뽕이 하는 일">
          <p className="text-[13px] text-ink leading-relaxed">
            샤뽕은 서울대 학생이 내는 등록금 대비 실제로 누릴 수 있는 학교 혜택을
            찾아주는 서비스예요. 무료 강좌, 상담, 시설처럼 곳곳에 흩어져 있는
            혜택 공지를 한데 모아, 내가 낸 등록금만큼 제대로 뽑고 있는지 눈에
            보이게 해줘요.
          </p>
        </Section>

        {/* 만들게 된 계기 */}
        <Section title="어떻게 시작했나요">
          <p className="text-[13px] text-ink leading-relaxed">
            서울대학교 &lsquo;인간-AI 상호작용 이론 및 실습&rsquo; 수업의 팀
            프로젝트로 시작해, 학생들이 실제로 쓸 수 있는 서비스로 발전시켰어요.
          </p>
        </Section>

        {/* 정보 출처 안내 */}
        <Section title="정보는 이렇게 모아요">
          <p className="text-[13px] text-ink leading-relaxed">
            학교와 관련 기관이 공개한 웹페이지를 자동으로 수집해 정리하고, 각
            혜택에 원문 출처 링크를 함께 보여줘요. 마감일이나 신청 조건은 바뀔 수
            있으니, 신청 전에 원본 공지를 꼭 확인해 주세요.
          </p>
        </Section>

        {/* 비공식 서비스 표기 */}
        <Section title="알려드려요">
          <p className="text-[13px] text-ink leading-relaxed">
            샤뽕은 서울대학교 학생들이 만든 비공식 서비스입니다. 서울대학교와
            공식적인 관련이 없습니다.
          </p>
        </Section>

        {/* 팀 크레딧 */}
        <Section title="만든 사람들">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {TEAM.map((name, i) => (
              <span key={name} className="text-[14px] text-ink">
                {name}
                {i < TEAM.length - 1 && (
                  <span className="text-ink-3 ml-2">·</span>
                )}
              </span>
            ))}
          </div>
        </Section>

        {/* 정책 / 지원 링크 (URL 확정 전까지는 '준비 중'으로 표시) */}
        <div className="bg-surface-sub rounded-xl overflow-hidden mb-5 divide-y divide-hairline">
          <LinkRow label="개인정보처리방침" url={PRIVACY_POLICY_URL} />
          <LinkRow label="고객지원" url={SUPPORT_URL} />
        </div>

        <p className="text-[11px] text-ink-3 text-center mt-2">
          버전 {APP_VERSION}
        </p>
      </div>
    </MobileFrame>
  );
}
