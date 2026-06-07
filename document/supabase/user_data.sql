-- ============================================================================
-- user_data 테이블 + RLS 정책
-- ============================================================================
-- 목적: 로그인 사용자의 프로필/학기/뽕뽑기 기록을 cloud에 저장(동기화)한다.
--       이 테이블이 없으면 push/pull이 전부 실패하여, 재로그인 시 온보딩으로
--       되돌아가는 버그가 발생한다. (PGRST205: Could not find table)
--
-- 적용 방법: Supabase 대시보드 → SQL Editor 에 아래 전체를 붙여넣고 RUN.
--           (idempotent 하므로 여러 번 실행해도 안전)
--
-- 사용처: src/lib/supabase/sync.ts (pushToCloud / pullFromCloud)
-- ============================================================================

create table if not exists public.user_data (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  profile            jsonb       not null default '{}'::jsonb,
  semesters          jsonb       not null default '[]'::jsonb,
  active_semester_id text,
  pong_records       jsonb       not null default '[]'::jsonb,
  updated_at         timestamptz not null default now()
);

-- Row Level Security: 본인 행만 읽고/쓰기 가능
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
