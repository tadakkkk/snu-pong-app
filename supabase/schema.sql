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


-- ============================================================================
-- reports 테이블 — "개발자에게 제보하기" (App Store 심사 대응)
-- ============================================================================
-- 사용처: src/app/report/page.tsx (insert)
-- ⚠️ 비로그인(anon) 사용자도 제보할 수 있어야 한다 (심사관이 로그인 없이 사용).
--    따라서 INSERT 는 anon+authenticated 모두 허용, SELECT 는 아무도 불가
--    (관리자는 Supabase 대시보드/Service Role 로만 조회).
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users (id) on delete set null,  -- 비로그인이면 null
  category    text,          -- 버그 / 정보오류 / 기능제안 / 기타
  content     text not null,
  contact     text,          -- 답장 원하면 이메일 (선택)
  app_version text,
  created_at  timestamptz not null default now(),

  -- 스팸/빈 제보 방지: 내용 길이 1~2000자
  constraint reports_content_len check (char_length(content) between 1 and 2000)
);

alter table public.reports enable row level security;

-- INSERT: 로그인 여부 무관 누구나 허용.
drop policy if exists "reports_insert_anyone" on public.reports;
create policy "reports_insert_anyone"
  on public.reports for insert
  to anon, authenticated
  with check (true);

-- SELECT/UPDATE/DELETE 정책은 두지 않는다 → RLS 활성 상태에서 정책 없음 =
-- anon/authenticated 는 조회·수정·삭제 전부 불가(본인 것도 불가). 관리자는
-- Service Role 키(대시보드)로만 접근. 이것이 의도된 동작이다.

-- ⚠️ 확인 필요(reports):
-- 5. category 값은 앱 UI에 고정("버그/정보오류/기능제안/기타")돼 있으나 DB 제약은
--    두지 않았다(추후 카테고리 추가 유연성). 필요하면 check 제약 추가 가능.
-- 6. 관리자 조회 UI가 필요하면 별도 admin 정책/뷰를 추가로 설계해야 한다.
-- ============================================================================
