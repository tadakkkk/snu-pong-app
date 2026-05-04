"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("snu-pong-user");
      if (raw) {
        const data = JSON.parse(raw);
        if (data?.state?.onboardingDone) {
          router.replace("/home");
          return;
        }
      }
    } catch {
      // ignore parse errors
    }
    router.replace("/onboarding");
  }, [router]);

  return null;
}
