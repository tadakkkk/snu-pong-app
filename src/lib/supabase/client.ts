import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // OAuth code exchange를 클라이언트(/auth/callback 페이지)에서 직접 수행한다.
        // static export에는 서버 라우트 핸들러가 없으므로 PKCE flow를 명시하고,
        // URL 자동감지는 끄고 콜백 페이지에서 exchangeCodeForSession으로 결정적으로 처리한다.
        flowType: "pkce",
        detectSessionInUrl: false,
        autoRefreshToken: true,
        persistSession: true,
      },
    }
  );
}
