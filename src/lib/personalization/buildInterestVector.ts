import {
  personalizationQuestions,
  type PersonalizationAnswers,
} from "@/data/personalization_questions";

export type InterestVectorEntry = {
  weight: number;
  confidence: number;
  source: string[];
};

export type InterestTagVector = Record<string, InterestVectorEntry>;

export function buildInterestVectorFromAnswers(
  answers: PersonalizationAnswers,
): InterestTagVector {
  const scores = new Map<string, number>();

  for (const question of personalizationQuestions) {
    const answer = answers[question.id];
    const selectedIds = Array.isArray(answer) ? answer : answer ? [answer] : [];
    for (const selectedId of selectedIds) {
      const option = question.options.find((candidate) => candidate.id === selectedId);
      if (!option) continue;
      const optionWeight = option.weight ?? 1;
      for (const tag of option.tags) {
        scores.set(tag, (scores.get(tag) ?? 0) + optionWeight);
      }
    }
  }

  const maxScore = Math.max(1, ...scores.values());
  const vector: InterestTagVector = {};
  for (const [tag, score] of scores.entries()) {
    vector[tag] = {
      weight: Number((score / maxScore).toFixed(3)),
      confidence: 0.8,
      source: ["onboarding_question"],
    };
  }
  return vector;
}
