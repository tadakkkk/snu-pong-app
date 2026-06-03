"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { pullFromCloud } from "@/lib/supabase/sync";
import { useUserStore } from "@/store/user";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
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
          router.replace("/onboarding");
        }
      } catch {
        if (!cancelled) router.replace("/onboarding");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
