"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { createClient } from "@/lib/supabase/client";

// 네이티브 전용: OAuth 커스텀 스킴 딥링크(com.snupong.app://auth/callback?code=...)를 수신해
// 인앱 브라우저를 닫고 code를 세션으로 교환한다. 웹에서는 /auth/callback 페이지가 처리하므로
// 이 리스너는 아무 것도 하지 않는다.
export default function NativeAuthListener() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let remove: (() => void) | undefined;
    let active = true;

    (async () => {
      // 네이티브 플러그인은 클라이언트에서만 로드 (정적 export 프리렌더 시 평가 방지)
      const { App } = await import("@capacitor/app");
      const { Browser } = await import("@capacitor/browser");

      const handle = await App.addListener("appUrlOpen", async ({ url }) => {
        if (!url.includes("auth/callback")) return;

        // 인앱 브라우저(ASWebAuthenticationSession) 닫기
        try {
          await Browser.close();
        } catch {
          // 이미 닫혔거나 미지원이면 무시
        }

        const code = new URL(url).searchParams.get("code");
        if (code) {
          const supabase = createClient();
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.warn("[native-auth] exchangeCodeForSession 실패:", error.message);
          }
        }

        // 루트로 보내 인증/온보딩 상태에 따라 홈 또는 온보딩으로 분기(웹 콜백과 동일 동작).
        router.replace("/");
      });

      if (active) {
        remove = () => handle.remove();
      } else {
        // 언마운트가 리스너 등록보다 먼저 끝난 경우 즉시 정리
        handle.remove();
      }
    })();

    return () => {
      active = false;
      remove?.();
    };
  }, [router]);

  return null;
}
