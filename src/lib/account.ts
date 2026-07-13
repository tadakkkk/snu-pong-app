import { createClient } from "@/lib/supabase/client";

// 계정 삭제: delete-account Edge Function 호출.
// 성공 시 로컬 세션까지 정리(signOut)한다. 실패 시 error 메시지를 돌려준다.
export async function deleteAccount(): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { ok: false, error: "로그인 세션이 없어요. 다시 로그인해 주세요." };

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!baseUrl || !anonKey) return { ok: false, error: "설정 오류(SUPABASE URL 없음)." };

  // Apple provider 토큰이 세션에 남아있으면 revoke용으로 함께 전달(best-effort).
  // (로그인 직후에만 존재할 수 있음 — 없으면 함수 쪽에서 revoke 스킵)
  const appleToken =
    session.provider_refresh_token ?? session.provider_token ?? null;

  try {
    const res = await fetch(`${baseUrl}/functions/v1/delete-account`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: anonKey,
      },
      body: JSON.stringify(appleToken ? { apple_token: appleToken } : {}),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: (body as { error?: string })?.error ?? `삭제 실패 (${res.status})` };
    }

    // 서버에서 유저가 삭제됐으므로 로컬 세션도 정리.
    await supabase.auth.signOut();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "네트워크 오류" };
  }
}
