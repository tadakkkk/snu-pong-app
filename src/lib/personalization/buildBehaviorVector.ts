import type { PongItem, Category } from "@/data/items";
import type { InterestTagVector } from "@/lib/personalization/buildInterestVector";
import type { PongRecord } from "@/store/pong";

/**
 * 뽕뽑기 행동(claim) 기반 개인화 신호.
 * 실제로 뽑은 아이템의 category·tags를 집계·정규화해서,
 * 뽑을수록 비슷한(아직 안 뽑은) 혜택을 상위로 끌어올리는 데 쓴다.
 */
export type BehaviorSignal = {
  /** 뽑은 아이템 태그 기반 가중치 (0~1 정규화) */
  tagVector: InterestTagVector;
  /** 뽑은 아이템 카테고리 기반 가중치 (0~1 정규화) */
  categoryWeights: Partial<Record<Category, number>>;
  /** 뽑은 고유 아이템 수 (멘트·고도화 단계 표시용) */
  claimedCount: number;
  /** 가장 많이 뽑은 카테고리 */
  topCategory: Category | null;
};

export function buildBehaviorSignal(
  records: PongRecord[],
  items: PongItem[],
): BehaviorSignal {
  const itemById = new Map(items.map((i) => [i.id, i]));
  const tagCount = new Map<string, number>();
  const catCount = new Map<Category, number>();
  const claimed = new Set<string>();

  for (const r of records) {
    const item = itemById.get(r.itemId);
    if (!item) continue;
    if (claimed.has(item.id)) continue; // 같은 아이템을 여러 학기에 뽑아도 1회로 집계
    claimed.add(item.id);
    catCount.set(item.category, (catCount.get(item.category) ?? 0) + 1);
    for (const tag of item.tags ?? []) {
      tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1);
    }
  }

  const maxTag = Math.max(1, ...tagCount.values());
  const tagVector: InterestTagVector = {};
  for (const [tag, count] of tagCount) {
    tagVector[tag] = {
      weight: Number((count / maxTag).toFixed(3)),
      confidence: 0.6,
      source: ["pong_behavior"],
    };
  }

  const maxCat = Math.max(1, ...catCount.values());
  const categoryWeights: Partial<Record<Category, number>> = {};
  let topCategory: Category | null = null;
  let topVal = 0;
  for (const [cat, count] of catCount) {
    categoryWeights[cat] = Number((count / maxCat).toFixed(3));
    if (count > topVal) {
      topVal = count;
      topCategory = cat;
    }
  }

  return {
    tagVector,
    categoryWeights,
    claimedCount: claimed.size,
    topCategory,
  };
}
