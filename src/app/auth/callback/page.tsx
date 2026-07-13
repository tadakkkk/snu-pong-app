"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// OAuth 리다이렉트 콜백 (PKCE).
// 기존 서버 라우트 핸들러(route.ts)를 static export 호환 클라이언트 페이지로 대체.
// signInWithOAuth 시 저장된 code_verifier로 ?code= 를 세션으로 교환한 뒤 홈으로 이동한다.
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const params = new URL(window.location.href).searchParams;
    const code = params.get("code");

    (async () => {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          // 이미 교환됐거나 일시적 오류여도 홈에서 세션 상태를 다시 확인하므로 계속 진행.
          console.warn("[auth/callback] exchangeCodeForSession 실패:", error.message);
        }
      }
      router.replace("/");
    })();
  }, [router]);

  return (
    <div className="min-h-full flex items-center justify-center">
      <p className="text-[14px] text-ink-3">로그인 중…</p>
    </div>
  );
}
