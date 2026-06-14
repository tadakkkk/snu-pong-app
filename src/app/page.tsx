"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { pullFromCloud } from "@/lib/supabase/sync";
import { useUserStore } from "@/store/user";

export default function RootPage() {
  const router = useRouter();

  // persist hydration이 끝나기 전엔 onboardingDone이 초기값(false)으로 읽혀서
  // 온보딩 완료 유저가 다시 온보딩으로 튕길 수 있으므로 하이드레이션 완료를 기다린다.
  // 주의: persist는 storage가 있을 때만 .persist를 붙이므로 SSR 중엔 undefined다.
  // render에서 접근하지 말고 effect(클라이언트)에서만 만진다.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (useUserStore.persist.hasHydrated()) setHydrated(true);
    const unsub = useUserStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          await pullFromCloud();
          if (cancelled) return;
          const done = useUserStore.getState().onboardingDone;
          router.replace(done ? "/home" : "/onboarding");
        } else {
          if (cancelled) return;
          // 로그아웃 유저도 persist로 온보딩 완료 상태가 남아있으면 /home으로.
          const done = useUserStore.getState().onboardingDone;
          router.replace(done ? "/home" : "/onboarding");
        }
      } catch {
        if (!cancelled) router.replace("/onboarding");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, router]);

  return null;
}
