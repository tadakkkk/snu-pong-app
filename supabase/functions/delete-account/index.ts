// ============================================================================
// delete-account — 계정 삭제 Edge Function (App Store 심사 5.1.1(v) 필수)
// ============================================================================
// 흐름:
//   1. 클라이언트가 자기 access token을 Authorization: Bearer 로 전달
//   2. 토큰으로 유저 검증(getUser) — 없거나 무효면 401
//   3. service_role 키로 admin 클라이언트 생성 (SUPABASE_SERVICE_ROLE_KEY는
//      Edge Function 런타임이 자동 주입하는 예약 시크릿 — 하드코딩 금지)
//   4. public.user_data 에서 해당 user_id 행 삭제
//      (reports는 user_id on delete set null 이라 자동으로 익명화됨 — 의도된 동작)
//   5. Apple 로그인 유저면 Apple 토큰 revoke (환경변수 있을 때만, 실패해도 삭제는 성공)
//   6. admin.deleteUser(user_id)
//
// 배포: supabase functions deploy delete-account --no-verify-jwt
//   (게이트웨이 JWT 검증을 끄고 함수 내부에서 직접 검증한다. 함수는 토큰 주인의
//    계정만 삭제하므로 권한 상승 위험 없음. OPTIONS 프리플라이트도 통과시켜야 함.)
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

// ── CORS ────────────────────────────────────────────────────────────────────
// [0]을 기본 fallback으로 쓰므로 네이티브 스킴을 맨 앞에 둔다.
const ALLOWED_ORIGINS = [
  "capacitor://localhost",
  "ionic://localhost",
  "http://localhost",
  "http://localhost:3000",
  "https://snu-pong-app.vercel.app",
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allow =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(
  status: number,
  body: unknown,
  cors: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// ── Apple 토큰 revoke (best-effort) ──────────────────────────────────────────
// APPLE_* 시크릿이 모두 있을 때만 client_secret(JWT)을 즉석 생성해 revoke 호출.
// 하나라도 없으면 스킵 + 로그. 계정 삭제 자체는 이 함수 성패와 무관하게 진행된다.
async function importApplePrivateKey(pem: string): Promise<CryptoKey> {
  // 시크릿에 리터럴 "\n"으로 들어온 경우 실제 개행으로 복원
  const normalized = pem.replace(/\\n/g, "\n");
  const b64 = normalized
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    "pkcs8",
    der.buffer,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
}

async function makeAppleClientSecret(): Promise<
  { secret: string; serviceId: string } | null
> {
  const teamId = Deno.env.get("APPLE_TEAM_ID");
  const keyId = Deno.env.get("APPLE_KEY_ID");
  const serviceId = Deno.env.get("APPLE_SERVICE_ID");
  const privateKey = Deno.env.get("APPLE_PRIVATE_KEY");
  if (!teamId || !keyId || !serviceId || !privateKey) return null;

  const key = await importApplePrivateKey(privateKey);
  const secret = await create(
    { alg: "ES256", kid: keyId },
    {
      iss: teamId,
      iat: getNumericDate(0),
      exp: getNumericDate(60 * 5),
      aud: "https://appleid.apple.com",
      sub: serviceId,
    },
    key,
  );
  return { secret, serviceId };
}

async function maybeRevokeApple(
  appleToken: string | null,
): Promise<void> {
  const client = await makeAppleClientSecret();
  if (!client) {
    console.log(
      "[delete-account] APPLE_* 시크릿 미설정 → Apple revoke 스킵 (계정 삭제는 계속)",
    );
    return;
  }
  if (!appleToken) {
    // 로그인 시점의 provider_refresh_token/provider_token을 클라이언트가 넘겨줘야 revoke 가능.
    // 없으면 Apple 서버측 grant는 남지만 계정 삭제는 진행한다.
    console.log(
      "[delete-account] revoke할 Apple 토큰 없음(클라이언트 미전달) → revoke 스킵",
    );
    return;
  }

  const body = new URLSearchParams({
    client_id: client.serviceId,
    client_secret: client.secret,
    token: appleToken,
    token_type_hint: "refresh_token",
  });
  const res = await fetch("https://appleid.apple.com/auth/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[delete-account] Apple revoke 실패 ${res.status}: ${text}`);
  } else {
    console.log("[delete-account] Apple revoke 성공");
  }
}

// ── 핸들러 ────────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" }, cors);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error("[delete-account] SUPABASE_URL / SERVICE_ROLE 미주입");
    return json(500, { error: "Server misconfigured" }, cors);
  }

  const token = (req.headers.get("Authorization") ?? "").replace(
    /^Bearer\s+/i,
    "",
  );
  if (!token) return json(401, { error: "Missing token" }, cors);

  // (선택) 클라이언트가 Apple provider 토큰을 넘기면 revoke에 사용
  let appleToken: string | null = null;
  try {
    const parsed = await req.json();
    if (parsed && typeof parsed.apple_token === "string") {
      appleToken = parsed.apple_token;
    }
  } catch {
    // 바디 없음/JSON 아님 → 무시
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1) 토큰으로 유저 검증
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  const user = userData?.user;
  if (userErr || !user) {
    return json(401, { error: "Invalid or expired token" }, cors);
  }

  // 5) Apple 유저면 revoke (실패해도 삭제는 계속)
  try {
    const isApple = (user.identities ?? []).some(
      (i) => i.provider === "apple",
    );
    if (isApple) await maybeRevokeApple(appleToken);
  } catch (e) {
    console.error("[delete-account] Apple revoke 처리 중 오류(무시):", e);
  }

  // 4) user_data 행 삭제
  const { error: dataErr } = await admin
    .from("user_data")
    .delete()
    .eq("user_id", user.id);
  if (dataErr) {
    console.error("[delete-account] user_data 삭제 실패:", dataErr.message);
    return json(500, { error: "Failed to delete user data" }, cors);
  }

  // 6) auth 유저 삭제
  const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
  if (delErr) {
    console.error("[delete-account] deleteUser 실패:", delErr.message);
    return json(500, { error: "Failed to delete account" }, cors);
  }

  console.log(`[delete-account] 삭제 완료: ${user.id}`);
  return json(200, { ok: true }, cors);
});
