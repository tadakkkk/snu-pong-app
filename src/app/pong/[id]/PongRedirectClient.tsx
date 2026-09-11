"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import MobileFrame from "@/components/ui/MobileFrame";
import StatusBar from "@/components/ui/StatusBar";

/**
 * 구버전 링크(/pong/<id>)를 현재 상세 경로(/pong/item?id=<id>)로 넘긴다.
 *
 * 이미 배포된 앱과 밖으로 공유된 URL이 경로 형태이므로 이 경로를 지울 수 없다.
 * history를 남기지 않도록 push가 아니라 replace를 쓴다 — 상세 화면의 뒤로가기가
 * 리다이렉트 페이지로 되돌아왔다가 다시 튕기는 루프를 막는다.
 */
export default function PongRedirectClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (id) router.replace(`/pong/item?id=${encodeURIComponent(id)}`);
    else router.replace("/pong");
  }, [id, router]);

  return (
    <MobileFrame>
      <StatusBar />
      <div className="flex-1" />
    </MobileFrame>
  );
}
