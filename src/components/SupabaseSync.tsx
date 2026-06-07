"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  pushToCloud,
  pullFromCloud,
  hydrateLegacyLocalStorage,
  clearLegacyLocalStorage,
} from "@/lib/supabase/sync";
import { useUserStore } from "@/store/user";
import { useSemesterStore } from "@/store/semester";
import { usePongStore } from "@/store/pong";

export default function SupabaseSync() {
  const isSyncing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hadLegacy = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    // 1) 과거 persist 데이터를 in-memory로 1회 복원 (마이그레이션 대상)
    hadLegacy.current = hydrateLegacyLocalStorage();

    async function syncOnLogin() {
      isSyncing.current = true;
      try {
        // pullFromCloud가 cloud empty 시 자동으로 pushToCloud 호출 → legacy 데이터가 cloud로 업로드됨
        await pullFromCloud();
        // legacy 데이터를 cloud에 반영했거나, cloud가 우선이라면 어쨌든 legacy 키는 제거
        if (hadLegacy.current) {
          clearLegacyLocalStorage();
          hadLegacy.current = false;
        }
      } finally {
        // pull이 실패해도 isSyncing이 true로 고착되지 않도록 보장.
        // 고착되면 이후 모든 schedulePush가 막혀 뽕뽑기 기록 등이 영영 저장 안 됨.
        setTimeout(() => {
          isSyncing.current = false;
        }, 300);
      }
    }

    function schedulePush() {
      if (isSyncing.current) return;
      clearTimeout(timer.current);
      timer.current = setTimeout(pushToCloud, 1500);
    }

    // 탭 숨김/닫힘 시 대기 중인 debounce 변경을 즉시 flush (1.5초 안에 닫으면 유실되는 것 방지)
    function flushOnHide() {
      if (document.visibilityState === "hidden") void pushToCloud();
    }
    document.addEventListener("visibilitychange", flushOnHide);

    // 앱 진입 시 로그인 상태면 즉시 sync (legacy 마이그레이션 포함)
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) syncOnLogin();
    });

    // 로그인 이벤트 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_IN") syncOnLogin();
      }
    );

    // 스토어 변경 감지 → debounce push (로그인 상태일 때만 의미가 있음, pushToCloud 내부에서 user 체크)
    const unsubUser = useUserStore.subscribe(schedulePush);
    const unsubSemester = useSemesterStore.subscribe(schedulePush);
    const unsubPong = usePongStore.subscribe(schedulePush);

    return () => {
      subscription.unsubscribe();
      unsubUser();
      unsubSemester();
      unsubPong();
      document.removeEventListener("visibilitychange", flushOnHide);
      clearTimeout(timer.current);
    };
  }, []);

  return null;
}
