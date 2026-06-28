create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  email text,
  created_at timestamptz not null default now(),
  last_login_at timestamptz,
  avatar_color text
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, email, avatar_color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'avatar_color', '#3b82f6')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, display_name, email, avatar_color)
select
  users.id,
  coalesce(users.raw_user_meta_data ->> 'display_name', split_part(users.email, '@', 1), 'ExamForge User'),
  users.email,
  coalesce(users.raw_user_meta_data ->> 'avatar_color', '#3b82f6')
from auth.users
on conflict (id) do nothing;

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  provider text,
  created_by uuid references public.profiles(id) on delete set null,
  is_preloaded boolean not null default false,
  exam_config jsonb not null default '{"totalQuestions": 10, "timeLimit": 30, "passingScore": 70}'::jsonb,
  domains jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  question_text text not null,
  options jsonb not null,
  correct jsonb not null,
  explanation text,
  domain text,
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reference_notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  note_type text check (note_type in ('markdown', 'pdf', 'text')),
  exam_id uuid references public.exams(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  file_size int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exam_id uuid not null references public.exams(id) on delete cascade,
  config_snapshot jsonb not null,
  score numeric not null,
  passed boolean not null,
  total_questions int not null,
  correct_count int not null,
  time_taken_seconds int not null,
  violations jsonb not null default '{"tabSwitches": 0, "fullscreenExits": 0}'::jsonb,
  domain_breakdown jsonb not null default '[]'::jsonb,
  difficulty_breakdown jsonb not null default '[]'::jsonb,
  answers jsonb not null default '{}'::jsonb,
  flagged_questions jsonb not null default '[]'::jsonb,
  question_snapshot jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.exam_stats (
  user_id uuid not null references public.profiles(id) on delete cascade,
  exam_id uuid not null references public.exams(id) on delete cascade,
  attempt_count int not null default 0,
  avg_score numeric not null default 0,
  best_score numeric not null default 0,
  last_attempt_at timestamptz,
  total_questions_answered int not null default 0,
  primary key (user_id, exam_id)
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists exams_touch_updated_at on public.exams;
create trigger exams_touch_updated_at before update on public.exams
for each row execute function public.touch_updated_at();

drop trigger if exists questions_touch_updated_at on public.questions;
create trigger questions_touch_updated_at before update on public.questions
for each row execute function public.touch_updated_at();

drop trigger if exists reference_notes_touch_updated_at on public.reference_notes;
create trigger reference_notes_touch_updated_at before update on public.reference_notes
for each row execute function public.touch_updated_at();

create or replace function public.recompute_exam_stats(target_user uuid, target_exam uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.exam_stats (user_id, exam_id, attempt_count, avg_score, best_score, last_attempt_at, total_questions_answered)
  select
    target_user,
    target_exam,
    count(*)::int,
    coalesce(avg(score), 0),
    coalesce(max(score), 0),
    max(completed_at),
    coalesce(sum(total_questions), 0)::int
  from public.exam_attempts
  where user_id = target_user and exam_id = target_exam
  on conflict (user_id, exam_id) do update set
    attempt_count = excluded.attempt_count,
    avg_score = excluded.avg_score,
    best_score = excluded.best_score,
    last_attempt_at = excluded.last_attempt_at,
    total_questions_answered = excluded.total_questions_answered;
end;
$$;

create or replace function public.exam_attempt_stats_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  affected_user uuid;
  affected_exam uuid;
begin
  affected_user := case when tg_op = 'DELETE' then old.user_id else new.user_id end;
  affected_exam := case when tg_op = 'DELETE' then old.exam_id else new.exam_id end;
  perform public.recompute_exam_stats(affected_user, affected_exam);
  return coalesce(new, old);
end;
$$;

drop trigger if exists exam_attempt_stats_after_change on public.exam_attempts;
create trigger exam_attempt_stats_after_change
after insert or update or delete on public.exam_attempts
for each row execute function public.exam_attempt_stats_trigger();

alter table public.profiles enable row level security;
alter table public.exams enable row level security;
alter table public.questions enable row level security;
alter table public.reference_notes enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.exam_stats enable row level security;

drop policy if exists "profiles read authenticated" on public.profiles;
create policy "profiles read authenticated" on public.profiles for select to authenticated using (true);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles for insert to authenticated with check (id = auth.uid());

drop policy if exists "exams read authenticated" on public.exams;
create policy "exams read authenticated" on public.exams for select to authenticated using (true);
drop policy if exists "exams insert creator" on public.exams;
create policy "exams insert creator" on public.exams for insert to authenticated with check (created_by = auth.uid());
drop policy if exists "exams update creator" on public.exams;
create policy "exams update creator" on public.exams for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());
drop policy if exists "exams delete creator nonpreloaded" on public.exams;
create policy "exams delete creator nonpreloaded" on public.exams for delete to authenticated using (created_by = auth.uid() and is_preloaded = false);

drop policy if exists "questions read authenticated" on public.questions;
create policy "questions read authenticated" on public.questions for select to authenticated using (true);
drop policy if exists "questions insert own" on public.questions;
create policy "questions insert own" on public.questions for insert to authenticated with check (created_by = auth.uid());
drop policy if exists "questions update own" on public.questions;
create policy "questions update own" on public.questions for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());
drop policy if exists "questions delete own" on public.questions;
create policy "questions delete own" on public.questions for delete to authenticated using (created_by = auth.uid());

drop policy if exists "notes read authenticated" on public.reference_notes;
create policy "notes read authenticated" on public.reference_notes for select to authenticated using (true);
drop policy if exists "notes insert own" on public.reference_notes;
create policy "notes insert own" on public.reference_notes for insert to authenticated with check (created_by = auth.uid());
drop policy if exists "notes update own" on public.reference_notes;
create policy "notes update own" on public.reference_notes for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());
drop policy if exists "notes delete own" on public.reference_notes;
create policy "notes delete own" on public.reference_notes for delete to authenticated using (created_by = auth.uid());

drop policy if exists "attempts private all" on public.exam_attempts;
create policy "attempts private all" on public.exam_attempts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "stats private read" on public.exam_stats;
create policy "stats private read" on public.exam_stats for select to authenticated using (user_id = auth.uid());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'exams'
  ) then
    alter publication supabase_realtime add table public.exams;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'questions'
  ) then
    alter publication supabase_realtime add table public.questions;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reference_notes'
  ) then
    alter publication supabase_realtime add table public.reference_notes;
  end if;
end $$;

notify pgrst, 'reload schema';
