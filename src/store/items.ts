import { useMemo } from "react";
import { create } from "zustand";
import {
  buildItems,
  seedRawItems,
  selectItem,
  selectItemsByCategory,
  selectRecentNewItems,
  selectTagsForCategory,
  selectTodayNewCount,
  selectTotalClaimableValue,
  type Category,
  type PongItem,
} from "@/data/items";

interface ItemsState {
  items: PongItem[];
  /** 원본 배열을 받아 변환한 뒤 목록을 통째로 교체한다. */
  setRawItems: (raw: readonly unknown[]) => void;
  /** 원격 혜택 데이터를 받아온다. 다음 단계에서 채운다. */
  hydrate: () => Promise<void>;
}

/**
 * 혜택 목록 스토어.
 *
 * 번들된 시드로 **동기 초기화**하기 때문에 첫 렌더부터 목록이 존재한다.
 * 덕분에 소비처에 로딩 상태가 필요 없고, 나중에 원격 데이터가 도착하면
 * setRawItems로 조용히 교체되면서 구독 중인 화면만 다시 그려진다.
 */
export const useItemsStore = create<ItemsState>()((set) => ({
  items: buildItems(seedRawItems),

  setRawItems: (raw) => set({ items: buildItems(raw) }),

  // 아직 원격 소스가 없다. 네트워크 연결은 다음 단계 작업이다.
  hydrate: async () => {},
}));

// ── 훅 (컴포넌트용) ─────────────────────────────────────────────────────────
// 파생값은 반드시 selector 밖에서 useMemo로 계산한다. zustand v5는
// useSyncExternalStore 기반이라 selector가 매번 새 배열을 돌려주면
// 스냅샷이 불안정해져 무한 렌더로 이어진다.

/** 전체 혜택 목록. 참조가 안정적이라 useMemo 의존성으로 바로 쓸 수 있다. */
export function useItems(): PongItem[] {
  return useItemsStore((s) => s.items);
}

export function useTotalClaimableValue(): number {
  const items = useItems();
  return useMemo(() => selectTotalClaimableValue(items), [items]);
}

export function useItemsByCategory(category: Category): PongItem[] {
  const items = useItems();
  return useMemo(() => selectItemsByCategory(items, category), [items, category]);
}

export function useTodayNewCount(): number {
  const items = useItems();
  return useMemo(() => selectTodayNewCount(items), [items]);
}

export function useRecentNewItems(days = 7): PongItem[] {
  const items = useItems();
  return useMemo(() => selectRecentNewItems(items, days), [items, days]);
}

/** category가 null이면 빈 배열. 훅은 조건부로 호출할 수 없어서 null을 받아 처리한다. */
export function useTagsForCategory(
  category: Category | null
): { tag: string; count: number }[] {
  const items = useItems();
  return useMemo(
    () => (category ? selectTagsForCategory(items, category) : []),
    [items, category]
  );
}

/**
 * id로 아이템을 찾는 함수를 돌려준다.
 *
 * 훅은 반복문 안에서 호출할 수 없으므로, 목록을 map으로 돌며 여러 건을 조회해야
 * 하는 화면(기록 목록·공유 카드 등)은 useItem 대신 이걸 쓴다. 조회는 O(1)이다.
 */
export function useItemLookup(): (id: string) => PongItem | undefined {
  const items = useItems();
  return useMemo(() => {
    const byId = new Map(items.map((i) => [i.id, i]));
    return (id: string) => byId.get(id);
  }, [items]);
}

/** 단건 조회. 목록 변경에 반응한다. */
export function useItem(id: string): PongItem | undefined {
  const items = useItems();
  return useMemo(() => selectItem(items, id), [items, id]);
}

// ── 훅 밖에서 읽기 ──────────────────────────────────────────────────────────
// 일반 모듈·이벤트 핸들러처럼 훅을 쓸 수 없는 곳을 위한 1회성 스냅샷이다.
// 구독하지 않으므로 목록이 바뀌어도 다시 계산되지 않는다. 화면에 그리는 값이면
// 반드시 위의 훅을 쓸 것.

export function getItemsSnapshot(): PongItem[] {
  return useItemsStore.getState().items;
}

export function getItem(id: string): PongItem | undefined {
  return selectItem(getItemsSnapshot(), id);
}

export function getRecentNewItems(days = 7): PongItem[] {
  return selectRecentNewItems(getItemsSnapshot(), days);
}
