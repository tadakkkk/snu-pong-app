import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category } from "@/data/items";
import type {
  InterestTagVector,
} from "@/lib/personalization/buildInterestVector";

export type PersonalizationInputMethod = "questions" | "chat" | "file" | "skip";

interface UserState {
  nickname: string | null;
  interests: Category[];
  collegeId: string | null;
  trackId: string | null;
  grade: number | null;
  tuition: number | null;
  scholarship: number;
  netBurden: number | null;
  personalizationEnabled: boolean;
  personalizationInputMethod: PersonalizationInputMethod | null;
  personalizationConsentAt: string | null;
  interestTagVector: InterestTagVector;
  personalizationAnswers: Record<string, string | string[] | number | boolean>;
  personalizationSummary: string | null;
  personalizationUpdatedAt: string | null;
  onboardingDone: boolean;
  // 알림센터: 마지막으로 알림을 확인한 시각(ISO). cloud로 동기화됨.
  notificationsSeenAt: string | null;
  setProfile: (data: Partial<Omit<UserState, "setProfile" | "reset">>) => void;
  reset: () => void;
}

const initial: Omit<UserState, "setProfile" | "reset"> = {
  nickname: null,
  interests: [],
  collegeId: null,
  trackId: null,
  grade: null,
  tuition: null,
  scholarship: 0,
  netBurden: null,
  personalizationEnabled: false,
  personalizationInputMethod: null,
  personalizationConsentAt: null,
  interestTagVector: {},
  personalizationAnswers: {},
  personalizationSummary: null,
  personalizationUpdatedAt: null,
  onboardingDone: false,
  notificationsSeenAt: null,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...initial,
      setProfile: (data) => set((s) => ({ ...s, ...data })),
      reset: () => set(initial),
    }),
    {
      name: "snu-pong-user",
      // 함수(setProfile/reset)는 저장 대상에서 제외 — 상태 값만 영속화
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { setProfile: _a, reset: _b, ...rest } = state;
        return rest;
      },
    }
  )
);
