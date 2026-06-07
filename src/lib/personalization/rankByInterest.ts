import type { PongItem, Category } from "@/data/items";
import type { InterestTagVector } from "@/lib/personalization/buildInterestVector";

export type ScoredItem = {
  item: PongItem;
  score: number;
  matchedTags: string[];
};

/**
 * 관심사 태그 벡터로 혜택 아이템을 점수화한다.
 * 점수 = 아이템 태그 중 벡터에 존재하는 태그들의 weight 합.
 */
export function scoreItem(
  item: PongItem,
  vector: InterestTagVector
): { score: number; matchedTags: string[] } {
  const tags = item.tags ?? [];
  let score = 0;
  const matchedTags: string[] = [];
  for (const tag of tags) {
    const entry = vector[tag];
    if (entry) {
      score += entry.weight;
      matchedTags.push(tag);
    }
  }
  return { score, matchedTags };
}

/**
 * 관심사 벡터 기반으로 아이템을 정렬한다.
 * - 벡터가 비어 있으면(개인화 미사용) category(user.interests) 기반으로 폴백.
 * - 점수 동률은 value(가치) 높은 순.
 */
export function rankByInterest(
  list: PongItem[],
  vector: InterestTagVector,
  fallbackCategories: Category[] = []
): ScoredItem[] {
  const hasVector = Object.keys(vector).length > 0;
  const catSet = new Set<string>(fallbackCategories);

  return list
    .map((item) => {
      if (hasVector) {
        const { score, matchedTags } = scoreItem(item, vector);
        return { item, score, matchedTags };
      }
      // 폴백: 관심 카테고리에 속하면 1점
      const score = catSet.has(item.category) ? 1 : 0;
      return { item, score, matchedTags: [] };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.item.value ?? 0) - (a.item.value ?? 0);
    });
}
