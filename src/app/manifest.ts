import type { MetadataRoute } from "next";

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
