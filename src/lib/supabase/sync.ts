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

export async function pushToCloud() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const snap = getSnapshot();
  await supabase.from("user_data").upsert(
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
}

export async function pullFromCloud(): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("user_data")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

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
