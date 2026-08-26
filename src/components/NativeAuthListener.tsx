"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { createClient } from "@/lib/supabase/client";
import {
  clearNativeAuthDebug,
  getPkceVerifierStorageStatus,
  logNativeAuthDebug,
  subscribeNativeAuthDebug,
  type NativeAuthDebugEntry,
} from "@/lib/native-auth-debug";

// 네이티브 전용: OAuth 커스텀 스킴 딥링크를 수신해 code를 세션으로 교환한다.
// 실기기에서 PKCE 흐름의 단계별 상태를 화면에 남겨 원인을 추적한다.
export default function NativeAuthListener() {
  const router = useRouter();
  // 디버깅용(심사 반려 대응): 딥링크 복귀 후 code 교환 실패를 화면에 노출.
  const [authError, setAuthError] = useState<string | null>(null);
  const [debugEntries, setDebugEntries] = useState<NativeAuthDebugEntry[]>([]);

  useEffect(() => subscribeNativeAuthDebug(setDebugEntries), []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      logNativeAuthDebug("listener skipped: native platform=no");
      return;
    }

    let remove: (() => void) | undefined;
    let active = true;
    logNativeAuthDebug("A. listener effect start");

    const logVisibility = () => logNativeAuthDebug(`lifecycle: document.visibilityState=${document.visibilityState}`);
    const logPageHide = () => logNativeAuthDebug("lifecycle: pagehide fired (webview may be closing/reloading)");
    const logPageShow = () => logNativeAuthDebug("lifecycle: pageshow fired");
    document.addEventListener("visibilitychange", logVisibility);
    window.addEventListener("pagehide", logPageHide);
    window.addEventListener("pageshow", logPageShow);

    (async () => {
      // 네이티브 플러그인은 클라이언트에서만 로드 (정적 export 프리렌더 시 평가 방지)
      const { App } = await import("@capacitor/app");
      const { Browser } = await import("@capacitor/browser");

      const lifecycleHandle = await App.addListener("appStateChange", ({ isActive }) => {
        logNativeAuthDebug(`lifecycle: appStateChange isActive=${isActive}`);
      });
      const supabase = createClient();
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        logNativeAuthDebug(`auth state: event=${event}; session=${session ? "yes" : "no"}`);
      });

      const handle = await App.addListener("appUrlOpen", async ({ url }) => {
        logNativeAuthDebug(`4. appUrlOpen fired: ${url}`);
        if (!url.includes("auth/callback")) {
          logNativeAuthDebug("4. appUrlOpen ignored: not auth/callback");
          return;
        }

        // 인앱 브라우저(ASWebAuthenticationSession) 닫기
        try {
          logNativeAuthDebug("E. Browser.close start (before code exchange)");
          await Browser.close();
          logNativeAuthDebug("E. Browser.close resolved");
        } catch {
          logNativeAuthDebug("E. Browser.close skipped/failed (already closed or unavailable)");
          // 이미 닫혔거나 미지원이면 무시
        }

        // OAuth 제공자가 에러를 딥링크로 되돌려준 경우(사용자 취소/설정 오류 등)
        const callbackUrl = new URL(url);
        const errDesc = callbackUrl.searchParams.get("error_description");
        if (errDesc) {
          console.warn("[native-auth] OAuth 콜백 에러:", errDesc);
          logNativeAuthDebug(`4. OAuth callback error: ${errDesc}`);
          setAuthError(`로그인 실패: ${errDesc}`);
          return;
        }

        const code = callbackUrl.searchParams.get("code");
        logNativeAuthDebug(`5. callback code parsed=${code ? "yes" : "no"}; verifier now=${getPkceVerifierStorageStatus()}`);
        if (!code) {
          setAuthError("로그인 code를 받지 못했어요. 다시 시도해 주세요.");
          return;
        }

        logNativeAuthDebug("6. exchangeCodeForSession start");
        const exchangeStartedAt = Date.now();
        const slowAfterThreeSeconds = window.setTimeout(() => {
          logNativeAuthDebug("6c. exchange still pending after 3s");
        }, 3_000);
        const slowAfterTenSeconds = window.setTimeout(() => {
          logNativeAuthDebug("6c. exchange still pending after 10s");
        }, 10_000);
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        window.clearTimeout(slowAfterThreeSeconds);
        window.clearTimeout(slowAfterTenSeconds);
        logNativeAuthDebug(`6. exchangeCodeForSession settled after ${Date.now() - exchangeStartedAt}ms`);
        if (error) {
          console.warn("[native-auth] exchangeCodeForSession 실패:", error.message);
          logNativeAuthDebug(`6. exchangeCodeForSession failed: ${error.message}`);
          setAuthError(`세션 교환 실패: ${error.message}`);
          return;
        }
        logNativeAuthDebug("6. exchangeCodeForSession success");

        // 루트로 보내 인증/온보딩 상태에 따라 홈 또는 온보딩으로 분기(웹 콜백과 동일 동작).
        router.replace("/");
      });

      if (active) {
        logNativeAuthDebug("A. appUrlOpen listener registered");
        remove = () => {
          handle.remove();
          lifecycleHandle.remove();
          subscription.unsubscribe();
        };
      } else {
        // 언마운트가 리스너 등록보다 먼저 끝난 경우 즉시 정리
        logNativeAuthDebug("A. listener registration completed after cleanup; removing immediately");
        handle.remove();
        lifecycleHandle.remove();
        subscription.unsubscribe();
      }
    })();

    return () => {
      active = false;
      logNativeAuthDebug("A. listener cleanup start");
      remove?.();
      document.removeEventListener("visibilitychange", logVisibility);
      window.removeEventListener("pagehide", logPageHide);
      window.removeEventListener("pageshow", logPageShow);
    };
  }, [router]);

  if (!Capacitor.isNativePlatform()) return null;

  return (
    <div className="fixed inset-x-2 bottom-2 z-[100] max-h-[46vh] overflow-hidden rounded-xl border border-white/30 bg-black/90 text-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/20 px-3 py-2">
        <p className="text-[11px] font-bold tracking-wide">NATIVE AUTH DEBUG</p>
        <button onClick={clearNativeAuthDebug} className="text-[11px] text-white/70">지우기</button>
      </div>
      {authError && (
        <button onClick={() => setAuthError(null)} className="block w-full bg-red px-3 py-2 text-left text-[11px] break-words">
          오류: {authError} (탭해서 닫기)
        </button>
      )}
      <div className="max-h-[36vh] overflow-y-auto px-3 py-2 font-mono text-[10px] leading-relaxed">
        {debugEntries.length === 0 ? (
          <p className="text-white/60">로그인 버튼을 누르면 여기 과정이 기록돼요.</p>
        ) : (
          debugEntries.map((entry) => <p key={entry.id}>[{entry.at}] {entry.message}</p>)
        )}
      </div>
    </div>
  );
}
