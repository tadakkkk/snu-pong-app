import type { PongItem, Category } from "@/data/items";
import type { InterestTagVector } from "@/lib/personalization/buildInterestVector";
import type { BehaviorSignal } from "@/lib/personalization/buildBehaviorVector";

export type ScoredItem = {
  item: PongItem;
  score: number;
  matchedTags: string[];
  /** 아이템 카테고리가 사용자의 관심 카테고리(interests)에 속하는지 */
  matchedCategory: boolean;
};

/**
 * 명시적 카테고리 관심사(온보딩 "어떤 걸 누리고 싶어?")에 대한 가산점.
 * 세부 태그 매칭(weight 0~1)과 함께 합산되어, 태그가 안 겹쳐도
 * 사용자가 고른 카테고리는 항상 랭킹에 반영되도록 한다.
 */
export const CATEGORY_MATCH_WEIGHT = 0.6;

/** 행동 신호(뽑은 기록) 비중. 명시적 신호보다 약하게 둬서 보조적으로 작동. */
export const BEHAVIOR_TAG_WEIGHT = 0.4;
export const BEHAVIOR_CATEGORY_WEIGHT = 0.4;

/** 시간 여유 선호(time_commitment)와 항목의 deadline_type가 맞을 때 가점. */
export const TIME_FIT_WEIGHT = 0.3;

/** 온보딩 "일주일에 낼 수 있는 시간?" 답변 */
export type TimeCommitment = "one_off" | "sometimes" | "regular";

/** 사용자의 시간 선호에 맞는 deadline_type면 true (timeFit 가점 대상). */
function fitsTimePreference(
  deadlineType: PongItem["deadline_type"],
  timeCommitment: TimeCommitment
): boolean {
  if (timeCommitment === "one_off") {
    // 한 번에 끝나는 것 선호 → 상시/일회성
    return deadlineType === "always" || deadlineType === "once";
  }
  if (timeCommitment === "regular") {
    // 꾸준히 가능 → 주간/학기 단위 프로그램
    return deadlineType === "weekly" || deadlineType === "semester";
  }
  return false; // sometimes: 보정 없음
}

export type RankPrefs = {
  /** 온보딩 time_commitment 답변 (없으면 timeFit 미적용) */
  timeCommitment?: TimeCommitment;
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
 * 사용자 계정에 저장된 개인화 신호로 아이템을 정렬한다.
 * 세 신호를 함께 합산한다:
 *  1) 세부 태그 매칭 — 온보딩 질문에서 만든 interestTagVector (weight 0~1)
 *  2) 카테고리 관심사 — 온보딩 "어떤 걸 누리고 싶어?"(interests)면 가산점
 *  3) 행동 신호 — 실제로 뽑은 기록(BehaviorSignal). 뽑을수록 누적되어 고도화.
 *  4) 시간 적합 — time_commitment ↔ deadline_type 부합 시 가점(timeFit).
 * 태그가 하나도 안 겹쳐도 사용자가 고른 카테고리는 항상 반영된다.
 * matchedCategory는 ①명시적 관심사 기준만 표기한다(배지용, 행동 신호로 오염 안 됨).
 * 점수 동률은 value(가치) 높은 순.
 */
export function rankByInterest(
  list: PongItem[],
  vector: InterestTagVector,
  interestCategories: Category[] = [],
  behavior?: BehaviorSignal,
  prefs?: RankPrefs
): ScoredItem[] {
  const hasVector = Object.keys(vector).length > 0;
  const catSet = new Set<string>(interestCategories);
  const hasBehavior = !!behavior && behavior.claimedCount > 0;
  const timeCommitment = prefs?.timeCommitment;

  return list
    .map((item) => {
      const { score: tagScore, matchedTags } = hasVector
        ? scoreItem(item, vector)
        : { score: 0, matchedTags: [] as string[] };
      const matchedCategory = catSet.has(item.category);

      let score = tagScore + (matchedCategory ? CATEGORY_MATCH_WEIGHT : 0);
      if (hasBehavior) {
        const behaviorTag = scoreItem(item, behavior!.tagVector).score;
        const behaviorCat = behavior!.categoryWeights[item.category] ?? 0;
        score +=
          behaviorTag * BEHAVIOR_TAG_WEIGHT +
          behaviorCat * BEHAVIOR_CATEGORY_WEIGHT;
      }
      if (timeCommitment && fitsTimePreference(item.deadline_type, timeCommitment)) {
        score += TIME_FIT_WEIGHT;
      }
      return { item, score, matchedTags, matchedCategory };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.item.value ?? 0) - (a.item.value ?? 0);
    });
}
