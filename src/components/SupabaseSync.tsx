"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { pushToCloud, pullFromCloud } from "@/lib/supabase/sync";
import { useUserStore } from "@/store/user";
import { useSemesterStore } from "@/store/semester";
import { usePongStore } from "@/store/pong";

export default function SupabaseSync() {
  const isSyncing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();

    async function syncOnLogin() {
      isSyncing.current = true;
      await pullFromCloud();
      // 구독 콜백이 먼저 fire된 뒤 플래그 해제
      setTimeout(() => { isSyncing.current = false; }, 300); // allow subscriptions to fire first
    }

    function schedulePush() {
      if (isSyncing.current) return;
      clearTimeout(timer.current);
      timer.current = setTimeout(pushToCloud, 1500);
    }

    // 앱 진입 시 로그인 상태면 즉시 pull
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) syncOnLogin();
    });

    // 로그인 이벤트 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") syncOnLogin();
    });

    // 스토어 변경 감지 → debounce push
    const unsubUser = useUserStore.subscribe(schedulePush);
    const unsubSemester = useSemesterStore.subscribe(schedulePush);
    const unsubPong = usePongStore.subscribe(schedulePush);

    return () => {
      subscription.unsubscribe();
      unsubUser();
      unsubSemester();
      unsubPong();
      clearTimeout(timer.current);
    };
  }, []);

  return null;
}
