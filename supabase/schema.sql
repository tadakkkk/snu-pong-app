-- ============================================================================
-- 샤뽕(snu-pong-app) — Supabase 스키마 (새 프로젝트 이전용)
-- ============================================================================
-- 코드에서 역으로 복원한 스키마. 런타임 DB 접근은 src/lib/supabase/sync.ts의
-- user_data 테이블 하나가 전부다 (그 외 .from()/.storage/.rpc 호출 없음).
--
-- 적용: Supabase 대시보드 → SQL Editor 에 이 파일 전체를 붙여넣고 RUN.
--       idempotent(멱등) 하므로 여러 번 실행해도 안전하다.
--
-- 사용처:
--   pushToCloud()  → upsert({ user_id, profile, semesters, active_semester_id,
--                             pong_records, updated_at }, { onConflict: "user_id" })
--   pullFromCloud()→ select("*").eq("user_id", uid).maybeSingle()
-- ============================================================================

-- ── 테이블 ──────────────────────────────────────────────────────────────────
-- user_id 를 PK 로 두어 유저당 1행. upsert 의 onConflict 대상이 곧 이 PK 다.
create table if not exists public.user_data (
  user_id            uuid primary key references auth.users (id) on delete cascade,

  -- profile: zustand useUserStore 상태(함수 제외)를 통째로 저장하는 객체.
  -- shape (src/store/user.ts UserState):
  --   nickname                    text|null
  --   interests                   text[]   (Category: learning|career|sports|welfare|
  --                                         culture|experience|facility|scholarship)
  --   collegeId                   text|null
  --   trackId                     text|null
  --   grade                       number|null
  --   tuition                     number|null
  --   scholarship                 number   (기본 0)
  --   netBurden                   number|null
  --   personalizationEnabled      boolean
  --   personalizationInputMethod  "questions"|"chat"|"file"|"skip"|null
  --   personalizationConsentAt    string(ISO)|null
  --   interestTagVector           object   (Record<string, number> 태그 가중치)
  --   personalizationAnswers      object   (Record<string, string|string[]|number|boolean>)
  --   personalizationSummary      text|null
  --   personalizationUpdatedAt    string(ISO)|null
  --   onboardingDone              boolean
  --   notificationsSeenAt         string(ISO)|null
  profile            jsonb       not null default '{}'::jsonb,

  -- semesters: Semester[] (src/store/semester.ts)
  --   { id:string(예 "2025-1"), year:number, term:1|2, tuition:number,
  --     scholarship:number, netBurden:number, isActive:boolean }
  semesters          jsonb       not null default '[]'::jsonb,

  -- active_semester_id: 현재 활성 학기 id (semesters[].id 와 동일한 "YYYY-T" 문자열). nullable.
  active_semester_id text,

  -- pong_records: PongRecord[] (src/store/pong.ts)
  --   { id:string, semesterId:string, itemId:string, value:number, pongAt:string(ISO),
  --     itemName?:string, categoryLabel?:string }
  pong_records       jsonb       not null default '[]'::jsonb,

  updated_at         timestamptz not null default now()
);

-- ── updated_at 자동 갱신 트리거 ─────────────────────────────────────────────
-- 클라이언트가 upsert 시 updated_at 을 직접 넣지만, UPDATE 경로에서 항상
-- 서버 시각으로 강제 갱신되도록 안전장치를 둔다. (신규 INSERT 는 컬럼 default now())
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_data_set_updated_at on public.user_data;
create trigger user_data_set_updated_at
  before update on public.user_data
  for each row
  execute function public.set_updated_at();

-- ── Row Level Security: 본인 행만 접근 ───────────────────────────────────────
alter table public.user_data enable row level security;

drop policy if exists "user_data_select_own" on public.user_data;
create policy "user_data_select_own"
  on public.user_data for select
  using (auth.uid() = user_id);

drop policy if exists "user_data_insert_own" on public.user_data;
create policy "user_data_insert_own"
  on public.user_data for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_data_update_own" on public.user_data;
create policy "user_data_update_own"
  on public.user_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_data_delete_own" on public.user_data;
create policy "user_data_delete_own"
  on public.user_data for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- ⚠️ 확인 필요 (코드만으로는 단정할 수 없는 지점)
-- ============================================================================
-- 1. interests 저장 형태: 코드상 Category[] (문자열 배열)이지만 profile JSONB
--    안에 통째로 들어가므로 별도 컬럼/제약 없음. 위 주석은 값 참고용일 뿐 스키마
--    강제는 아님. (JSONB 라 타입 강제 불가 — 의도된 설계)
-- 2. active_semester_id 를 text 로 뒀다. 실제 값은 "YYYY-T"(예 "2025-1"). 기존
--    운영 프로젝트에서 다른 타입/제약을 썼을 가능성은 낮지만 원본 미확인.
-- 3. updated_at 트리거는 기존 운영 프로젝트에 존재했는지 코드로 확인 불가.
--    동작상 무해(클라이언트도 값을 보냄)하여 안전장치로 추가함. 원본과 정확히
--    일치시켜야 한다면 제거해도 무방.
-- 4. 그 외 테이블(크롤/혜택 데이터 등)은 런타임에 Supabase 로 조회하지 않는다.
--    앱은 src/data/*.json(빌드 타임 번들)만 읽으므로 이 스키마에 불필요.
-- ============================================================================
