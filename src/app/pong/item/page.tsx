// 혜택 상세 화면. 아이템 id는 경로가 아니라 쿼리스트링(/pong/item?id=...)으로 받는다.
//
// 정적 export에서는 빌드 시점에 존재하는 id로만 경로를 만들 수 있어서, 경로 기반
// (/pong/[id]) 구조로는 빌드 후 새로 수집된 혜택을 열 수 없었다. 단일 경로 + 쿼리로
// 바꿔서 id를 몰라도 상세를 열 수 있게 한다.
//
// useSearchParams()는 프리렌더 시점에 값을 알 수 없으므로 Suspense 경계가 필수다.
// (없으면 next build가 실패한다.)
import { Suspense } from "react";
import MobileFrame from "@/components/ui/MobileFrame";
import StatusBar from "@/components/ui/StatusBar";
import PongDetailClient from "./PongDetailClient";

// 프리렌더된 HTML에 담기는 화면. 흰 화면 대신 상세와 같은 프레임을 그려서
// 하이드레이션 직후 내용이 채워질 때 레이아웃이 튀지 않게 한다.
function DetailFallback() {
  return (
    <MobileFrame>
      <StatusBar />
      <div className="px-5 py-4 text-[22px] text-ink self-start">←</div>
      <div className="flex-1" />
    </MobileFrame>
  );
}

export default function PongItemPage() {
  return (
    <Suspense fallback={<DetailFallback />}>
      <PongDetailClient />
    </Suspense>
  );
}
