"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

// 네이티브 전용: iOS 상태바(시간/와이파이/배터리)를 앱 헤더와 안 겹치게 하고 가독성을 확보한다.
// - iOS WKWebView는 기본적으로 edge-to-edge(상태바 아래까지 웹뷰가 깔림)이므로
//   layout의 viewport-fit=cover + CSS env(safe-area-inset-top)로 헤더를 상태바 아래로 내린다.
//   (실제 인셋 처리는 StatusBar 컴포넌트가 담당)
// - 여기서는 상태바 아이콘/시계 색을 어둡게 고정한다. 헤더 배경이 흰색(surface)이라
//   밝은 아이콘이면 시계가 안 보여 "깨진 것처럼" 보이기 때문.
export default function NativeStatusBar() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    (async () => {
      try {
        // 정적 export 프리렌더 시 네이티브 플러그인 평가를 막기 위해 클라이언트에서만 로드.
        const { StatusBar, Style } = await import("@capacitor/status-bar");

        // 웹뷰를 상태바 아래까지 확장(edge-to-edge)해 env(safe-area-inset-top)가
        // 실제 인셋을 반환하게 한다. (Android 전용 API지만 iOS에선 무해한 no-op)
        try {
          await StatusBar.setOverlaysWebView({ overlay: true });
        } catch {
          // iOS 등 미지원 플랫폼 무시
        }

        // Style.Light = "밝은 배경용 = 어두운 텍스트/아이콘". 흰 헤더에 맞춰 시계를 검게.
        await StatusBar.setStyle({ style: Style.Light });
      } catch (e) {
        console.warn("[status-bar] 설정 실패:", e);
      }
    })();
  }, []);

  return null;
}
