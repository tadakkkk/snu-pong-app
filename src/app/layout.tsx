import type { Metadata, Viewport } from "next";
import "./globals.css";
import SupabaseSync from "@/components/SupabaseSync";
import AnalyticsInit from "@/components/AnalyticsInit";
import NativeAuthListener from "@/components/NativeAuthListener";

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
        <NativeAuthListener />
        {children}
      </body>
    </html>
  );
}
