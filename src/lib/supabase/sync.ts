import { createClient } from "./client";
import { useUserStore } from "@/store/user";
import { useSemesterStore } from "@/store/semester";
import { usePongStore } from "@/store/pong";

const LEGACY_KEYS = [
  "snu-pong-user",
  "snu-pong-semesters",
  "snu-pong-records",
] as const;

function getSnapshot() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { setProfile: _a, reset: _b, ...profile } = useUserStore.getState();
  const { semesters, activeSemesterId } = useSemesterStore.getState();
  const { records } = usePongStore.getState();
  return { profile, semesters, activeSemesterId, pongRecords: records };
}

export async function pushToCloud(): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const snap = getSnapshot();
  const { error } = await supabase.from("user_data").upsert(
    {
      user_id: user.id,
      profile: snap.profile,
      semesters: snap.semesters,
      active_semester_id: snap.activeSemesterId,
      pong_records: snap.pongRecords,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    // 조용히 삼키면 "저장이 안 되는데 원인을 모르는" 상황이 된다.
    // 대표적으로 user_data 테이블/RLS 미설정(PGRST205) 시 여기로 온다.
    // → document/supabase/user_data.sql 을 Supabase SQL Editor에서 실행할 것.
    console.error("[sync] pushToCloud 실패:", error.message, error);
    return false;
  }
  console.debug(
    `[sync] push ok — records=${snap.pongRecords.length}, semesters=${snap.semesters.length}, onboardingDone=${(snap.profile as { onboardingDone?: boolean }).onboardingDone}`
  );
  return true;
}

export async function pullFromCloud(): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("user_data")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    // 테이블 없음/RLS 거부 등. data가 null이라고 해서 "cloud가 비었다"로
    // 오해하면 안 된다(아래의 빈 데이터 push로 cloud를 덮어쓸 위험).
    console.error("[sync] pullFromCloud 실패:", error.message, error);
    return false;
  }

  if (!data) {
    await pushToCloud();
    return false;
  }

  if (data.profile && typeof data.profile === "object") {
    useUserStore.getState().setProfile(data.profile as never);
  }
  if (Array.isArray(data.semesters)) {
    useSemesterStore.setState({
      semesters: data.semesters,
      activeSemesterId: data.active_semester_id ?? null,
    });
  }
  if (Array.isArray(data.pong_records)) {
    usePongStore.setState({ records: data.pong_records });
  }
  console.debug(
    `[sync] pull ok — records=${Array.isArray(data.pong_records) ? data.pong_records.length : 0}, semesters=${Array.isArray(data.semesters) ? data.semesters.length : 0}`
  );
  return true;
}

/**
 * 과거 zustand persist 키에서 데이터를 읽어 in-memory 스토어로 1회 복원한다.
 * 이후 cloud sync 흐름에서 자연스럽게 cloud로 푸시되도록 함.
 * @returns 마이그레이션 대상 데이터가 있었는지 여부
 */
export function hydrateLegacyLocalStorage(): boolean {
  if (typeof window === "undefined") return false;

  let found = false;

  try {
    const raw = localStorage.getItem("snu-pong-user");
    if (raw) {
      const parsed = JSON.parse(raw);
      const state = parsed?.state;
      if (state && typeof state === "object") {
        const { setProfile: _a, reset: _b, ...rest } = state;
        useUserStore.getState().setProfile(rest);
        found = true;
      }
    }
  } catch {
    // ignore
  }

  try {
    const raw = localStorage.getItem("snu-pong-semesters");
    if (raw) {
      const parsed = JSON.parse(raw);
      const state = parsed?.state;
      if (state && Array.isArray(state.semesters)) {
        useSemesterStore.setState({
          semesters: state.semesters,
          activeSemesterId: state.activeSemesterId ?? null,
        });
        found = true;
      }
    }
  } catch {
    // ignore
  }

  try {
    const raw = localStorage.getItem("snu-pong-records");
    if (raw) {
      const parsed = JSON.parse(raw);
      const state = parsed?.state;
      if (state && Array.isArray(state.records)) {
        usePongStore.setState({ records: state.records });
        found = true;
      }
    }
  } catch {
    // ignore
  }

  return found;
}

export function clearLegacyLocalStorage() {
  if (typeof window === "undefined") return;
  for (const key of LEGACY_KEYS) {
    localStorage.removeItem(key);
  }
}
