"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MobileFrame from "@/components/ui/MobileFrame";
import StatusBar from "@/components/ui/StatusBar";
import PrimaryButton from "@/components/ui/PrimaryButton";
import MagpieHappy from "@/components/magpie/MagpieHappy";
import { createClient } from "@/lib/supabase/client";
import { APP_VERSION } from "@/lib/app-meta";
import { logEvent } from "@/lib/analytics";

const CATEGORIES = ["버그", "정보오류", "기능제안", "기타"] as const;
type Category = (typeof CATEGORIES)[number];

const MAX_LEN = 2000;

export default function ReportPage() {
  const router = useRouter();
  const [category, setCategory] = useState<Category>("버그");
  const [content, setContent] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = content.trim();
  const canSubmit = trimmed.length > 0 && trimmed.length <= MAX_LEN && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      // 비로그인 제보 허용: 로그인 상태면 user_id를 붙이고, 아니면 null.
      const { data: { user } } = await supabase.auth.getUser();

      const { error: insertError } = await supabase.from("reports").insert({
        user_id: user?.id ?? null,
        category,
        content: trimmed,
        contact: contact.trim() || null,
        app_version: APP_VERSION,
      });

      if (insertError) {
        console.error("[report] insert 실패:", insertError.message, insertError);
        setError("제보 전송에 실패했어요. 잠시 후 다시 시도해 주세요.");
        setSubmitting(false);
        return;
      }

      logEvent("report_submit", { category, has_contact: !!contact.trim() });
      setDone(true);
    } catch (e) {
      console.error("[report] 예외:", e);
      setError("제보 전송에 실패했어요. 잠시 후 다시 시도해 주세요.");
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <MobileFrame>
        <StatusBar />
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-3">
          <MagpieHappy size={84} />
          <p className="text-[17px] font-medium text-ink">고마워요!</p>
          <p className="text-[13px] text-ink-3 leading-relaxed">
            소중한 제보가 잘 전달됐어요.
            {"\n"}더 나은 샤뽕으로 보답할게요.
          </p>
          <button
            onClick={() => router.back()}
            className="mt-3 text-[14px] text-blue font-medium active:opacity-60"
          >
            돌아가기
          </button>
        </div>
      </MobileFrame>
    );
  }

  return (
    <MobileFrame>
      <StatusBar />

      <button
        onClick={() => router.back()}
        className="shrink-0 px-5 py-4 text-[22px] text-ink self-start"
        aria-label="뒤로"
      >
        ←
      </button>

      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <h1 className="text-[24px] font-medium text-ink leading-snug mb-1">
          개발자에게 제보하기
        </h1>
        <p className="text-[13px] text-ink-3 mb-6 leading-relaxed">
          버그, 잘못된 정보, 아이디어 무엇이든 좋아요. 로그인 없이도 보낼 수 있어요.
        </p>

        {/* 카테고리 */}
        <p className="text-[13px] font-medium text-ink mb-2">무엇에 대한 제보인가요?</p>
        <div className="grid grid-cols-4 gap-2 mb-6">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`py-2.5 rounded-[10px] text-[13px] border transition-colors ${
                category === c
                  ? "bg-ink text-white border-ink font-medium"
                  : "text-ink-3 border-hairline"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* 내용 */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-[13px] font-medium text-ink">내용</p>
          <span className="text-[11px] text-ink-3">
            {trimmed.length}/{MAX_LEN}
          </span>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, MAX_LEN))}
          placeholder="어떤 점이 불편했는지, 무엇을 바라는지 편하게 적어주세요."
          rows={7}
          className="w-full text-[14px] text-ink bg-surface-sub rounded-xl px-4 py-3 outline-none resize-none leading-relaxed placeholder:text-ink-3"
        />

        {/* 연락처 (선택) */}
        <p className="text-[13px] font-medium text-ink mt-6 mb-2">
          연락처 <span className="text-ink-3 font-normal">(선택)</span>
        </p>
        <input
          type="email"
          inputMode="email"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="답장을 원하면 이메일을 남겨주세요"
          className="w-full text-[14px] text-ink bg-surface-sub rounded-xl px-4 py-3 outline-none placeholder:text-ink-3"
        />

        {error && (
          <p className="text-[13px] text-red mt-4">{error}</p>
        )}
      </div>

      <div className="shrink-0 px-5 pb-7 pt-4 border-t border-hairline bg-surface">
        <PrimaryButton onClick={handleSubmit} disabled={!canSubmit}>
          {submitting ? "보내는 중…" : "제보 보내기"}
        </PrimaryButton>
      </div>
    </MobileFrame>
  );
}
