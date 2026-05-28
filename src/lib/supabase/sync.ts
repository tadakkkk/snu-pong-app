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
