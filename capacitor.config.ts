import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.snupong.app", // 임시 — 앱스토어 배포 전 확정 필요
  appName: "샤뽕",
  // next build(output: "export")의 산출물 디렉토리
  webDir: "out",
  server: {
    androidScheme: "https",
  },
  plugins: {
    // Supabase 등 외부 API 호출 시 웹뷰 CORS 우회를 위해 네이티브 HTTP 사용
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
