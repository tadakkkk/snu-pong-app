"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { createClient } from "@/lib/supabase/client";

// 네이티브 전용: OAuth 커스텀 스킴 딥링크를 수신해 인앱 브라우저를 닫고 세션을 저장한다.
// 네이티브는 iOS 웹뷰 storage의 PKCE verifier 유실을 피하기 위해 implicit flow를 쓴다.
// 웹은 /auth/callback 페이지에서 기존 PKCE 교환을 계속 처리한다.
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

        const callbackUrl = new URL(url);
        const fragmentParams = new URLSearchParams(callbackUrl.hash.slice(1));
        const getCallbackParam = (name: string) =>
          callbackUrl.searchParams.get(name) ?? fragmentParams.get(name);

        // OAuth 제공자가 에러를 딥링크로 되돌려준 경우(사용자 취소/설정 오류 등)
        const errDesc = getCallbackParam("error_description");
        if (errDesc) {
          console.warn("[native-auth] OAuth 콜백 에러:", errDesc);
          setAuthError(`로그인 실패: ${errDesc}`);
          return;
        }

        const supabase = createClient();
        const accessToken = getCallbackParam("access_token");
        const refreshToken = getCallbackParam("refresh_token");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            console.warn("[native-auth] setSession 실패:", error.message);
            setAuthError(`로그인 세션 저장 실패: ${error.message}`);
            return;
          }
        } else {
          // 이전 PKCE 빌드에서 이미 시작한 로그인 왕복도 마무리할 수 있게 호환성을 남긴다.
          const code = getCallbackParam("code");
          if (!code) {
            setAuthError("로그인 정보를 받지 못했어요. 다시 시도해 주세요.");
            return;
          }
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
