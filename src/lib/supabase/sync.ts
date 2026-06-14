import { createClient } from "./client";
import { useUserStore } from "@/store/user";
import { useSemesterStore } from "@/store/semester";
import { usePongStore } from "@/store/pong";

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
