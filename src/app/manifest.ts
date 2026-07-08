import type { MetadataRoute } from "next";

// static export(output: "export")에서 메타데이터 라우트를 정적 파일로 생성.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "서울대 등록금 뽕뽑기",
    short_name: "뽕뽑기",
    description: "낸 등록금만큼 서울대 무료 서비스 다 누리고 졸업하기",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#191F28",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
