import { useMemo } from "react";
import { create } from "zustand";
import { Capacitor } from "@capacitor/core";
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

/**
 * 배포된 웹의 출처. 네이티브가 최신 데이터를 받아올 곳이다.
 * 프리뷰·스테이징 빌드에서 갈아끼울 수 있게 환경변수로 덮을 수 있다.
 */
const REMOTE_ORIGIN =
  process.env.NEXT_PUBLIC_BENEFITS_ORIGIN ?? "https://snu-pong-app.vercel.app";

/** 1.96MB를 모바일 회선에서 받는다. 늘어지면 포기하고 시드를 유지한다. */
const FETCH_TIMEOUT_MS = 20_000;

/**
 * 혜택 데이터를 받아올 주소.
 *
 * 웹은 자기 배포본에서 받으므로 상대 경로면 된다.
 *
 * 네이티브는 상대 경로를 쓰면 안 된다. Capacitor가 fetch를 패치하지만, 요청 URL이
 * 웹뷰 로컬 서버(capacitor://localhost)로 시작하면 원본 fetch로 그대로 넘긴다
 * (native-bridge.js). 즉 "/data/benefits.json"은 네트워크가 아니라 **앱 번들에 박제된
 * 사본**을 읽게 되고, 그건 ipa를 만든 시점의 데이터라 영원히 갱신되지 않는다.
 * 배포된 웹의 절대 URL을 봐야 앱을 새로 깔지 않고도 최신 데이터를 받는다.
 *
 * 절대 URL GET은 createProxyUrl을 거쳐 네이티브가 중계하므로 CORS도 걸리지 않는다.
 */
function benefitsUrl(): string {
  return Capacitor.isNativePlatform()
    ? `${REMOTE_ORIGIN}/data/benefits.json`
    : "/data/benefits.json";
}

interface ItemsState {
  items: PongItem[];
  /** 원본 배열을 받아 변환한 뒤 목록을 통째로 교체한다. */
  setRawItems: (raw: readonly unknown[]) => void;
  /** 최신 혜택 데이터를 받아 목록을 교체한다. 실패하면 시드를 그대로 둔다. */
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

  hydrate: () => {
    // 앱 실행당 한 번만. StrictMode의 이펙트 중복 실행이나 화면 재마운트에도
    // 요청이 겹치지 않도록, 진행 중이거나 끝난 약속을 그대로 돌려준다.
    _hydratePromise ??= fetchAndApply();
    return _hydratePromise;
  },
}));

let _hydratePromise: Promise<void> | null = null;

/**
 * 최신 데이터를 받아 목록을 교체한다.
 *
 * 어떤 실패도 화면에 드러내지 않는다. 시드가 이미 렌더되어 있으므로 로딩 표시가
 * 필요 없고, 받아오지 못하면 그냥 시드로 계속 쓰면 된다. 비행기모드 콜드스타트가
 * 바로 이 경로다 — fetch가 던지고, catch가 삼키고, 화면은 시드 그대로 남는다.
 */
async function fetchAndApply(): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(benefitsUrl(), {
      // 매번 서버에 조건부로 물어본다. 바뀐 게 없으면 플랫폼 HTTP 캐시가 304를
      // 받아 캐시본을 돌려주므로 1.96MB를 다시 내려받지 않는다. ETag/If-None-Match를
      // 직접 들고 있지 않아도 되는 이유다(Vercel이 ETag를 붙여준다).
      cache: "no-cache",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) return;

    const raw: unknown = await res.json();
    if (!Array.isArray(raw)) return;

    // 빈 배열이나 형태가 깨진 응답으로 멀쩡한 시드를 덮어쓰지 않는다.
    // (배포 사고로 빈 파일이 올라가면 앱에서 혜택이 통째로 사라지는 걸 막는다.)
    const next = buildItems(raw);
    if (next.length === 0) return;

    useItemsStore.setState({ items: next });
  } catch {
    // 오프라인·타임아웃·JSON 파싱 실패 — 시드를 유지하고 조용히 넘어간다.
  } finally {
    clearTimeout(timer);
  }
}

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
