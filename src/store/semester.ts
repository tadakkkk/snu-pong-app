import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Semester {
  id: string;
  year: number;
  term: 1 | 2;
  tuition: number;
  scholarship: number;
  netBurden: number;
  isActive: boolean;
}

interface SemesterState {
  semesters: Semester[];
  activeSemesterId: string | null;
  addSemester: (s: Semester) => void;
  setActive: (id: string) => void;
  updateSemester: (id: string, data: Partial<Semester>) => void;
  removeSemester: (id: string) => void;
}

export const useSemesterStore = create<SemesterState>()(
  persist(
    (set) => ({
      semesters: [],
      activeSemesterId: null,
      addSemester: (s) =>
        set((state) => ({
          semesters: [...state.semesters, s],
          activeSemesterId: s.isActive ? s.id : state.activeSemesterId,
        })),
      setActive: (id) =>
        set((state) => ({
          activeSemesterId: id,
          semesters: state.semesters.map((s) => ({
            ...s,
            isActive: s.id === id,
          })),
        })),
      updateSemester: (id, data) =>
        set((state) => ({
          semesters: state.semesters.map((s) =>
            s.id === id ? { ...s, ...data } : s
          ),
        })),
      removeSemester: (id) =>
        set((state) => {
          const remaining = state.semesters.filter((s) => s.id !== id);
          const newActiveId =
            state.activeSemesterId === id
              ? (remaining[0]?.id ?? null)
              : state.activeSemesterId;
          return { semesters: remaining, activeSemesterId: newActiveId };
        }),
    }),
    { name: "snu-pong-semesters" }
  )
);
