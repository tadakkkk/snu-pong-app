"use client";

import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";

interface Props {
  title?: string;
  message?: string;
  onClose: () => void;
}

export default function LoginRequiredModal({ title, message, onClose }: Props) {
  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center px-5">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative bg-surface rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <p className="text-[17px] font-medium text-ink mb-2">
          {title ?? "로그인이 필요해"}
        </p>
        <p className="text-[13px] text-ink-3 mb-5 leading-relaxed">
          {message ??
            "데이터를 저장하고 다른 기기에서도 이어 쓰려면 로그인이 필요해."}
        </p>
        <div className="mb-2">
          <SocialLoginButtons />
        </div>
        <button
          onClick={onClose}
          className="w-full py-2 text-[13px] text-ink-3 active:opacity-60"
        >
          나중에
        </button>
      </div>
    </div>
  );
}
