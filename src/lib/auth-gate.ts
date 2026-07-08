"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

// 네이티브(iOS/Android) OAuth 리다이렉트용 커스텀 스킴.
// iOS: Info.plist의 CFBundleURLSchemes, Supabase Auth Redirect URLs에도 동일 등록 필요.
export const NATIVE_AUTH_REDIRECT = "com.snupong.app://auth/callback";

export function useAuthGate() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  return { user, loading, isAuthed: !!user };
}

// 구글 로그인 진입점(웹/네이티브 공용). 호출 위치는 이 함수 하나로 통일한다.
export async function loginWithGoogle() {
  const supabase = createClient();

  if (Capacitor.isNativePlatform()) {
    // 네이티브: 서버 리다이렉트를 막고(auth URL만 수신) 인앱 브라우저로 연다.
    // 리다이렉트는 커스텀 스킴 딥링크로 돌아오고, appUrlOpen 리스너가 code를 교환한다.
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: NATIVE_AUTH_REDIRECT,
        skipBrowserRedirect: true,
      },
    });
    if (error) {
      console.error("[auth] signInWithOAuth(native) 실패:", error.message);
      return;
    }
    if (data?.url) {
      // ASWebAuthenticationSession 계열 인앱 브라우저(Safari 외부로 튀지 않음).
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url: data.url });
    }
    return;
  }

  // 웹: 기존 동작 유지 (브라우저 리다이렉트 → /auth/callback 페이지에서 교환).
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
}
