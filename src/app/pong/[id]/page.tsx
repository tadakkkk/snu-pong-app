// 구버전 링크 호환 전용 경로. 상세 화면은 /pong/item?id=<id>로 옮겨졌고
// 여기서는 클라이언트 리다이렉트만 수행한다.
//
// 이미 출시된 앱과 밖으로 공유된 URL이 /pong/<id> 형태라 경로 자체가 계속 존재해야 한다.
// 그래서 generateStaticParams와 dynamicParams=false를 그대로 유지한다.
// (현재 번들에 있는 아이템 수만큼 경로가 생성되며, 내용은 전부 리다이렉트 셸이다.)
import { items } from "@/data/items";
import PongRedirectClient from "./PongRedirectClient";

export function generateStaticParams() {
  return items.map((item) => ({ id: item.id }));
}

export const dynamicParams = false;

export default function PongLegacyDetailPage() {
  return <PongRedirectClient />;
}
