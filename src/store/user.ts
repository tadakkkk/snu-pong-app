import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserState {
  collegeId: string | null;
  trackId: string | null;
  grade: number | null;
  tuition: number | null;
  scholarship: number;
  netBurden: number | null;
  onboardingDone: boolean;
  setProfile: (data: Partial<Omit<UserState, "setProfile" | "reset">>) => void;
  reset: () => void;
}

const initial = {
  collegeId: null,
  trackId: null,
  grade: null,
  tuition: null,
  scholarship: 0,
  netBurden: null,
  onboardingDone: false,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...initial,
      setProfile: (data) => set((s) => ({ ...s, ...data })),
      reset: () => set(initial),
    }),
    { name: "snu-pong-user" }
  )
);
