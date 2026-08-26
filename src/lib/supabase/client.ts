import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createClient() {
  // 네이티브(Capacitor 웹뷰)는 implicit flow를 사용한다.
  //
  // iOS의 ASWebAuthenticationSession → 커스텀 스킴 복귀 과정에서는 PKCE verifier가
  // 웹뷰 storage에서 간헐적으로 사라져 code 교환이 실패했다. implicit flow는 세션 토큰을
  // 딥링크 fragment로 바로 돌려주므로 verifier storage에 의존하지 않는다.
  //
  // 주의: 이 분기는 런타임 네이티브에서만 진입한다. 정적 export 프리렌더(Node)에서는
  // isNativePlatform()이 false라 아래 웹 경로를 타므로 window 접근이 없다(빌드 안전).
  if (Capacitor.isNativePlatform()) {
    return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        flowType: "implicit",
        detectSessionInUrl: false,
        persistSession: true,
        autoRefreshToken: true,
        storage: window.localStorage,
      },
    });
  }

  // 웹: 기존 동작 그대로 유지(회귀 방지). 기존 로그인 사용자 세션을 보존한다.
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      // OAuth code exchange를 클라이언트(/auth/callback 페이지)에서 직접 수행한다.
      // static export에는 서버 라우트 핸들러가 없으므로 PKCE flow를 명시하고,
      // URL 자동감지는 끄고 콜백 페이지에서 exchangeCodeForSession으로 결정적으로 처리한다.
      flowType: "pkce",
      detectSessionInUrl: false,
      autoRefreshToken: true,
      persistSession: true,
    },
  });
}
