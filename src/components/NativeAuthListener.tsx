"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { createClient } from "@/lib/supabase/client";

// 네이티브 전용: OAuth 커스텀 스킴 딥링크(com.snupong.app://auth/callback?code=...)를 수신해
// 인앱 브라우저를 닫고 code를 세션으로 교환한다. 웹에서는 /auth/callback 페이지가 처리하므로
// 이 리스너는 아무 것도 하지 않는다.
export default function NativeAuthListener() {
  const router = useRouter();
  // 디버깅용(심사 반려 대응): 딥링크 복귀 후 code 교환 실패를 화면에 노출.
  const [authError, setAuthError] = useState<string | null>(null);

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

        // OAuth 제공자가 에러를 딥링크로 되돌려준 경우(사용자 취소/설정 오류 등)
        const errDesc = new URL(url).searchParams.get("error_description");
        if (errDesc) {
          console.warn("[native-auth] OAuth 콜백 에러:", errDesc);
          setAuthError(`로그인 실패: ${errDesc}`);
          return;
        }

        const code = new URL(url).searchParams.get("code");
        if (code) {
          const supabase = createClient();
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.warn("[native-auth] exchangeCodeForSession 실패:", error.message);
            setAuthError(`세션 교환 실패: ${error.message}`);
            return;
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

  if (!authError) return null;

  // 상단 상태바 아래 고정 배너로 에러를 노출(디버깅용). 원인 파악 후 제거할 것.
  return (
    <div
      onClick={() => setAuthError(null)}
      className="fixed inset-x-0 top-0 z-[100] bg-red text-white text-[12px] leading-relaxed px-4 break-words"
      style={{ paddingTop: "max(12px, env(safe-area-inset-top))", paddingBottom: "12px" }}
    >
      {authError} (탭하면 닫기)
    </div>
  );
}
