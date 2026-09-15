"use client";

import { useEffect } from "react";
import { useItemsStore } from "@/store/items";

/**
 * 앱이 뜨면 최신 혜택 데이터를 한 번 받아온다.
 *
 * 화면에 아무것도 그리지 않는다. 목록은 이미 번들된 시드로 렌더되어 있고,
 * 받아오는 데 성공하면 스토어가 조용히 교체되면서 구독 중인 화면만 다시 그려진다.
 * 실패해도 아무 일도 일어나지 않는다(시드 유지).
 */
export default function ItemsHydrator() {
  useEffect(() => {
    void useItemsStore.getState().hydrate();
  }, []);

  return null;
}
