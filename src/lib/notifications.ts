import { getRecentNewItems } from "@/data/items";

// first_seen / seenAt 모두 날짜 prefix(YYYY-MM-DD)로 비교 — 포맷(타임존 유무)이 섞여 있어 안전.
export function isUnread(
  firstSeen: string | null | undefined,
  seenAt: string | null
): boolean {
  if (!firstSeen) return false;
  if (!seenAt) return true;
  return firstSeen.slice(0, 10) > seenAt.slice(0, 10);
}

/** 최근 7일 새 혜택 중 마지막 확인 이후 추가된(안읽음) 개수 */
export function getUnreadCount(seenAt: string | null): number {
  return getRecentNewItems(7).filter((i) => isUnread(i.first_seen, seenAt)).length;
}
