import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createClient() {
  // 네이티브(Capacitor 웹뷰): code_verifier와 세션을 localStorage에 저장한다.
  //
  // 배경: @supabase/ssr의 createBrowserClient는 code_verifier/세션을 "쿠키"에 저장한다.
  // 네이티브 OAuth는 Browser.open()으로 인앱 브라우저(ASWebAuthenticationSession)를 띄웠다가
  // 커스텀 스킴 딥링크로 웹뷰에 복귀하는데, 이 왕복에서 웹뷰 쿠키가 유실되어
  // 복귀 후 exchangeCodeForSession 시 "PKCE code verifier not found in storage"가 발생한다.
  // localStorage는 Capacitor 웹뷰에서 왕복/앱 재시작에도 유지되므로 code_verifier가 살아남는다.
  //
  // 주의: 이 분기는 런타임 네이티브에서만 진입한다. 정적 export 프리렌더(Node)에서는
  // isNativePlatform()이 false라 아래 웹 경로를 타므로 window 접근이 없다(빌드 안전).
  if (Capacitor.isNativePlatform()) {
    return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        flowType: "pkce",
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
