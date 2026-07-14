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

type OAuthProvider = "google" | "apple";

// 소셜 로그인 진입점(웹/네이티브 공용). provider만 다르고 흐름은 동일하므로 공통화한다.
// 실패 시 사용자에게 보여줄 에러 메시지를 반환한다(성공/리다이렉트 시작 시 null).
async function loginWithOAuth(provider: OAuthProvider): Promise<string | null> {
  try {
    const supabase = createClient();

    if (Capacitor.isNativePlatform()) {
      // 네이티브: 서버 리다이렉트를 막고(auth URL만 수신) 인앱 브라우저로 연다.
      // 리다이렉트는 커스텀 스킴 딥링크로 돌아오고, appUrlOpen 리스너가 code를 교환한다.
      // (provider 무관 — 딥링크 수신부는 code만 교환하므로 Google/Apple 공통)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: NATIVE_AUTH_REDIRECT,
          skipBrowserRedirect: true,
        },
      });
      if (error) {
        console.error(`[auth] signInWithOAuth(native, ${provider}) 실패:`, error.message);
        return `로그인 시작 실패 (${provider}): ${error.message}`;
      }
      if (!data?.url) {
        return `로그인 URL을 받지 못했어 (${provider}). Supabase 설정을 확인해줘.`;
      }
      // ASWebAuthenticationSession 계열 인앱 브라우저(Safari 외부로 튀지 않음).
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url: data.url });
      return null;
    }

    // 웹: 기존 동작 유지 (브라우저 리다이렉트 → /auth/callback 페이지에서 교환).
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      console.error(`[auth] signInWithOAuth(web, ${provider}) 실패:`, error.message);
      return `로그인 시작 실패 (${provider}): ${error.message}`;
    }
    return null;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[auth] loginWithOAuth(${provider}) 예외:`, msg);
    return `로그인 중 오류 (${provider}): ${msg}`;
  }
}

export function loginWithGoogle() {
  return loginWithOAuth("google");
}

export function loginWithApple() {
  return loginWithOAuth("apple");
}
