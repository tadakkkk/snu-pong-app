import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Capacitor(iOS/Android) 및 정적 호스팅을 위한 static export.
  // out/ 디렉토리에 라우트별 HTML/JS/CSS를 생성한다. Vercel에도 동일 적용됨.
  output: "export",
  // static export에서는 Next 이미지 최적화 서버가 없으므로 unoptimized 필요.
  // (현재 next/image 미사용이지만 방어적으로 설정)
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
