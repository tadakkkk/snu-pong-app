import type { Metadata, Viewport } from "next";
import "./globals.css";
import SupabaseSync from "@/components/SupabaseSync";
import AnalyticsInit from "@/components/AnalyticsInit";
import NativeAuthListener from "@/components/NativeAuthListener";
import NativeStatusBar from "@/components/NativeStatusBar";

export const metadata: Metadata = {
  title: "서울대 등록금 뽕뽑기",
  description:
    "낸 등록금만큼 서울대 무료 서비스 다 누리고 졸업하기. 도서관, 글쓰기 첨삭, 체육관, 헬스장, 심리상담까지.",
  keywords: ["서울대", "서울대학교", "등록금", "대학생", "학생복지", "무료서비스"],
  applicationName: "서울대 등록금 뽕뽑기",
  formatDetection: { telephone: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "뽕뽑기",
  },
  openGraph: {
    title: "서울대 등록금 뽕뽑기",
    description: "낸 등록금만큼 서울대 무료 서비스 다 누리고 졸업하기",
    siteName: "서울대 등록금 뽕뽑기",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "서울대 등록금 뽕뽑기",
    description: "낸 등록금만큼 서울대 무료 서비스 다 누리고 졸업하기",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#191F28",
  // iOS 네이티브(Capacitor WKWebView)에서 웹뷰를 화면 전체(노치/상태바 포함)로 확장.
  // 이게 있어야 CSS env(safe-area-inset-*) 값이 실제 인셋으로 채워진다.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full">
        <SupabaseSync />
        <AnalyticsInit />
        <NativeStatusBar />
        <NativeAuthListener />
        {children}
      </body>
    </html>
  );
}
