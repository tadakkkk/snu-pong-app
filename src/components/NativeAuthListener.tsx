"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { createClient } from "@/lib/supabase/client";

// 네이티브 전용: OAuth 커스텀 스킴 딥링크를 수신해 code를 세션으로 교환한다.
export default function NativeAuthListener() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let remove: (() => void) | undefined;
    let active = true;

    (async () => {
      // 네이티브 플러그인은 클라이언트에서만 로드 (정적 export 프리렌더 시 평가 방지)
      const { App } = await import("@capacitor/app");
      const { Browser } = await import("@capacitor/browser");

      const supabase = createClient();

      const handle = await App.addListener("appUrlOpen", async ({ url }) => {
        if (!url.includes("auth/callback")) return;

        // 인앱 브라우저(ASWebAuthenticationSession) 닫기
        try {
          await Browser.close();
        } catch {
          // 이미 닫혔거나 미지원이면 무시
        }

        // OAuth 제공자가 에러를 딥링크로 되돌려준 경우(사용자 취소/설정 오류 등)
        const callbackUrl = new URL(url);
        const errDesc = callbackUrl.searchParams.get("error_description");
        if (errDesc) {
          console.warn("[native-auth] OAuth 콜백 에러:", errDesc);
          setAuthError("로그인에 실패했어요. 잠시 후 다시 시도해 주세요.");
          return;
        }

        const code = callbackUrl.searchParams.get("code");
        if (!code) {
          setAuthError("로그인 code를 받지 못했어요. 다시 시도해 주세요.");
          return;
        }

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.warn("[native-auth] exchangeCodeForSession 실패:", error.message);
          setAuthError("로그인 세션을 만들지 못했어요. 다시 시도해 주세요.");
          return;
        }

        // 루트로 보내 인증/온보딩 상태에 따라 홈 또는 온보딩으로 분기(웹 콜백과 동일 동작).
        router.replace("/");
      });

      if (active) {
        remove = () => {
          handle.remove();
        };
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

  if (!Capacitor.isNativePlatform()) return null;

  if (!authError) return null;

  return (
    <button
      onClick={() => setAuthError(null)}
      className="fixed inset-x-4 bottom-4 z-[100] rounded-xl bg-red px-4 py-3 text-left text-sm text-white shadow-lg"
    >
      {authError} (탭해서 닫기)
    </button>
  );
}
