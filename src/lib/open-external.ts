import { Capacitor } from "@capacitor/core";

// 외부 URL 열기.
// 네이티브(Capacitor 웹뷰)에서는 target="_blank"가 동작하지 않으므로
// @capacitor/browser의 인앱 브라우저로 연다. 웹에서는 새 탭으로 연다.
export async function openExternalUrl(url: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url });
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
