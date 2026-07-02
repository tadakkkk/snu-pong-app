import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PongRecord {
  id: string;
  semesterId: string;
  itemId: string;
  value: number;
  pongAt: string;
  // 뽕뽑는 시점의 항목 정보 스냅샷.
  // 크롤 항목이 마감/삭제로 목록에서 내려가도 기록이 스스로 렌더되도록 저장한다.
  // (구버전 기록에는 없을 수 있어 optional)
  itemName?: string;
  categoryLabel?: string;
}

interface PongState {
  records: PongRecord[];
  addRecord: (r: PongRecord) => void;
  removeRecord: (id: string) => void;
  getRecordsBySemester: (semesterId: string) => PongRecord[];
  getTotalBySemester: (semesterId: string) => number;
  hasRecordForItem: (semesterId: string, itemId: string) => boolean;
}

export const usePongStore = create<PongState>()(
  persist(
    (set, get) => ({
      records: [],
      addRecord: (r) => set((s) => ({ records: [...s.records, r] })),
      removeRecord: (id) =>
        set((s) => ({ records: s.records.filter((r) => r.id !== id) })),
      getRecordsBySemester: (semesterId) =>
        get().records.filter((r) => r.semesterId === semesterId),
      getTotalBySemester: (semesterId) =>
        get()
          .records.filter((r) => r.semesterId === semesterId)
          .reduce((sum, r) => sum + r.value, 0),
      hasRecordForItem: (semesterId, itemId) =>
        get().records.some(
          (r) => r.semesterId === semesterId && r.itemId === itemId
        ),
    }),
    { name: "snu-pong-records" }
  )
);
