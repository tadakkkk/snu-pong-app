// 서버 컴포넌트: static export를 위해 번들된 모든 아이템 id를 빌드 타임에 미리 생성한다.
// 실제 UI는 클라이언트 컴포넌트(PongDetailClient)가 useParams로 id를 읽어 렌더링한다.
import { items } from "@/data/items";
import PongDetailClient from "./PongDetailClient";

export function generateStaticParams() {
  return items.map((item) => ({ id: item.id }));
}

// generateStaticParams로 생성되지 않은 경로(빌드 후 만료/신규 항목)는 정적 export에서
// 존재하지 않으므로 on-demand 생성을 시도하지 않는다.
export const dynamicParams = false;

export default function PongDetailPage() {
  return <PongDetailClient />;
}
