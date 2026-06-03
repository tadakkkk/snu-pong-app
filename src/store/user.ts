import { create } from "zustand";
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
};

export const useUserStore = create<UserState>()((set) => ({
  ...initial,
  setProfile: (data) => set((s) => ({ ...s, ...data })),
  reset: () => set(initial),
}));
