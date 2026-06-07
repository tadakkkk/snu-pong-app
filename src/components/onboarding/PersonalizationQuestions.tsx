"use client";

import PrimaryButton from "@/components/ui/PrimaryButton";
import {
  personalizationQuestions,
  type PersonalizationAnswers,
} from "@/data/personalization_questions";

interface Props {
  answers: PersonalizationAnswers;
  onChange: (answers: PersonalizationAnswers) => void;
  onFinish: () => void;
  onSkip?: () => void;
  finishLabel?: string;
}

export default function PersonalizationQuestions({ answers, onChange, onFinish, onSkip, finishLabel = "완료" }: Props) {
  const selectedCount = Object.values(answers).reduce((count, answer) => {
    if (Array.isArray(answer)) return count + answer.length;
    return answer ? count + 1 : count;
  }, 0);

  const toggleOption = (questionId: string, optionId: string, type: "multi_select" | "single_select") => {
    const current = answers[questionId];
    if (type === "single_select") {
      onChange({ ...answers, [questionId]: optionId });
      return;
    }
    const currentList = Array.isArray(current) ? current : [];
    const nextList = currentList.includes(optionId)
      ? currentList.filter((id) => id !== optionId)
      : [...currentList, optionId];
    onChange({ ...answers, [questionId]: nextList });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto min-h-0 px-6 pt-8">
        <h2 className="text-[22px] font-medium text-ink leading-snug mb-2">
          관심사를 조금만 더 알려줘
        </h2>
        <p className="text-[13px] text-ink-3 mb-6">
          답변은 추천 태그로 바뀌어 저장돼
        </p>
        <div className="flex flex-col gap-7 pb-4">
          {personalizationQuestions.map((question) => (
            <section key={question.id}>
              <h3 className="text-[15px] font-medium text-ink mb-1">{question.title}</h3>
              {question.subtitle && (
                <p className="text-[12px] text-ink-3 mb-3">{question.subtitle}</p>
              )}
              <div className="grid grid-cols-2 gap-2">
                {question.options.map((option) => {
                  const answer = answers[question.id];
                  const isSelected = Array.isArray(answer)
                    ? answer.includes(option.id)
                    : answer === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleOption(question.id, option.id, question.type)}
                      className={`text-left rounded-xl border px-3.5 py-3.5 transition-colors min-h-[86px] ${
                        isSelected
                          ? "bg-ink text-white border-ink"
                          : "bg-surface text-ink border-hairline"
                      }`}
                    >
                      <span className={`block text-[14px] font-medium leading-snug ${isSelected ? "text-white" : "text-ink"}`}>
                        {option.label}
                      </span>
                      {option.description && (
                        <span className={`block text-[11px] leading-snug mt-1.5 ${isSelected ? "text-white/65" : "text-ink-3"}`}>
                          {option.description}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
      <div className="shrink-0 px-5 pb-8 pt-4 bg-surface border-t border-hairline flex flex-col gap-3">
        <PrimaryButton onClick={onFinish} disabled={selectedCount === 0}>
          {selectedCount > 0 ? `${selectedCount}개 선택 · ${finishLabel}` : finishLabel}
        </PrimaryButton>
        {onSkip && (
          <button onClick={onSkip} className="text-center text-[13px] text-ink-3 py-1">
            맞춤 추천 없이 계속
          </button>
        )}
      </div>
    </div>
  );
}
