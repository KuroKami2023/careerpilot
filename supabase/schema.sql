-- ============================================================
-- CareerPilot AI — Supabase PostgreSQL schema + RLS
-- SHARED-PROJECT SAFE: all 5 portfolio apps share ONE Supabase project.
-- Run in: Supabase Dashboard → SQL Editor (paste + Run).
-- Safe to run in ANY order alongside the other 4 app schemas:
--   - public.profiles is a SHARED superset table (see below)
--   - helper function public.set_updated_at() is identical everywhere
--   - trigger on_auth_user_created / handle_new_user() is identical everywhere
-- Then create the private `resumes` bucket and apply storage.sql
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- profiles (SHARED across all 5 apps — DO NOT diverge) ----------
-- Superset of every app's needs:
--   careerpilot: full_name, headline, updated_at
--   datapilot/doclens: display_name
--   flowforge/invoiceflow: id, email, created_at
-- App code only reads/writes its own columns; extra nullable columns are fine.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text default '',
  headline text default '',
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migrate a shared DB created by an older per-app schema:
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text default '';
alter table public.profiles add column if not exists headline text default '';
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- ---------- resumes ----------

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled resume',
  raw_text text not null default '',
  file_path text,
  original_filename text,
  -- Structured extraction (canonical shape, see API.md)
  parsed_name text default '',
  parsed_summary text default '',
  parsed_skills jsonb not null default '[]'::jsonb,
  parsed_experience jsonb not null default '[]'::jsonb,
  parsed_education jsonb not null default '[]'::jsonb,
  parsed_projects jsonb not null default '[]'::jsonb,
  parsed_certifications jsonb not null default '[]'::jsonb,
  parsed_technologies jsonb not null default '[]'::jsonb,
  extraction_confidence integer not null default 0 check (extraction_confidence >= 0 and extraction_confidence <= 100),
  extraction_source text not null default 'manual'
    check (extraction_source in ('ai', 'manual', 'demo', 'upload_ai')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_resumes_user on public.resumes(user_id);
create index if not exists idx_resumes_updated on public.resumes(updated_at desc);

-- ---------- jobs ----------

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  company text not null default '',
  source_url text,
  raw_description text not null default '',
  location text default '',
  salary_text text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_jobs_user on public.jobs(user_id);
create index if not exists idx_jobs_company on public.jobs(company);

-- ---------- job_analyses ----------

create table if not exists public.job_analyses (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  required_skills jsonb not null default '[]'::jsonb,
  preferred_skills jsonb not null default '[]'::jsonb,
  technologies jsonb not null default '[]'::jsonb,
  responsibilities jsonb not null default '[]'::jsonb,
  experience_requirements text default '',
  education_requirements text default '',
  keywords jsonb not null default '[]'::jsonb,
  seniority text default '',
  raw_ai jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_job_analyses_job on public.job_analyses(job_id);
create index if not exists idx_job_analyses_user on public.job_analyses(user_id);

-- ---------- applications ----------

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  resume_id uuid references public.resumes(id) on delete set null,
  company text not null default '',
  position text not null default '',
  job_url text,
  salary_text text default '',
  status text not null default 'Saved'
    check (status in ('Saved','Applied','Interview','Technical Interview','Offer','Rejected','Withdrawn')),
  date_applied date,
  interview_dates jsonb not null default '[]'::jsonb,
  follow_up_date date,
  notes text default '',
  -- Snapshot of the last computed compatibility (transparent, NOT a hiring probability)
  match_score integer check (match_score is null or (match_score >= 0 and match_score <= 100)),
  match_breakdown jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_applications_user on public.applications(user_id);
create index if not exists idx_applications_status on public.applications(status);
create index if not exists idx_applications_job on public.applications(job_id);

-- ---------- interview_sessions ----------

create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  resume_id uuid references public.resumes(id) on delete set null,
  title text not null default 'Interview prep',
  focus_areas jsonb not null default '[]'::jsonb,
  include_system_design boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_interview_sessions_user on public.interview_sessions(user_id);

-- ---------- interview_questions ----------

create table if not exists public.interview_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  category text not null default 'technical'
    check (category in ('technical','behavioral','system_design','missing_skill','role_specific')),
  question text not null default '',
  skill_tag text default '',
  sample_answer text default '',
  improvement_tips text default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_interview_questions_session on public.interview_questions(session_id);

-- ---------- updated_at trigger ----------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_resumes_updated_at on public.resumes;
create trigger trg_resumes_updated_at
  before update on public.resumes
  for each row execute function public.set_updated_at();

drop trigger if exists trg_jobs_updated_at on public.jobs;
create trigger trg_jobs_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

drop trigger if exists trg_applications_updated_at on public.applications;
create trigger trg_applications_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

-- ---------- auto-create profile on signup (SHARED — identical in all 5 schemas) ----------

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Row Level Security ----------

alter table public.profiles enable row level security;
alter table public.resumes enable row level security;
alter table public.jobs enable row level security;
alter table public.job_analyses enable row level security;
alter table public.applications enable row level security;
alter table public.interview_sessions enable row level security;
alter table public.interview_questions enable row level security;

-- profiles: own row only
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = id);

-- resumes: own rows only
drop policy if exists "resumes_select_own" on public.resumes;
create policy "resumes_select_own" on public.resumes
  for select using (auth.uid() = user_id);

drop policy if exists "resumes_insert_own" on public.resumes;
create policy "resumes_insert_own" on public.resumes
  for insert with check (auth.uid() = user_id);

drop policy if exists "resumes_update_own" on public.resumes;
create policy "resumes_update_own" on public.resumes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "resumes_delete_own" on public.resumes;
create policy "resumes_delete_own" on public.resumes
  for delete using (auth.uid() = user_id);

-- jobs: own rows only
drop policy if exists "jobs_select_own" on public.jobs;
create policy "jobs_select_own" on public.jobs
  for select using (auth.uid() = user_id);

drop policy if exists "jobs_insert_own" on public.jobs;
create policy "jobs_insert_own" on public.jobs
  for insert with check (auth.uid() = user_id);

drop policy if exists "jobs_update_own" on public.jobs;
create policy "jobs_update_own" on public.jobs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "jobs_delete_own" on public.jobs;
create policy "jobs_delete_own" on public.jobs
  for delete using (auth.uid() = user_id);

-- job_analyses: own rows only (plus must own parent job)
drop policy if exists "job_analyses_select_own" on public.job_analyses;
create policy "job_analyses_select_own" on public.job_analyses
  for select using (auth.uid() = user_id);

drop policy if exists "job_analyses_insert_own" on public.job_analyses;
create policy "job_analyses_insert_own" on public.job_analyses
  for insert with check (
    auth.uid() = user_id and
    exists (select 1 from public.jobs j where j.id = job_id and j.user_id = auth.uid())
  );

drop policy if exists "job_analyses_update_own" on public.job_analyses;
create policy "job_analyses_update_own" on public.job_analyses
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "job_analyses_delete_own" on public.job_analyses;
create policy "job_analyses_delete_own" on public.job_analyses
  for delete using (auth.uid() = user_id);

-- applications: own rows only
drop policy if exists "applications_select_own" on public.applications;
create policy "applications_select_own" on public.applications
  for select using (auth.uid() = user_id);

drop policy if exists "applications_insert_own" on public.applications;
create policy "applications_insert_own" on public.applications
  for insert with check (auth.uid() = user_id);

drop policy if exists "applications_update_own" on public.applications;
create policy "applications_update_own" on public.applications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "applications_delete_own" on public.applications;
create policy "applications_delete_own" on public.applications
  for delete using (auth.uid() = user_id);

-- interview_sessions: own rows only
drop policy if exists "interview_sessions_select_own" on public.interview_sessions;
create policy "interview_sessions_select_own" on public.interview_sessions
  for select using (auth.uid() = user_id);

drop policy if exists "interview_sessions_insert_own" on public.interview_sessions;
create policy "interview_sessions_insert_own" on public.interview_sessions
  for insert with check (auth.uid() = user_id);

drop policy if exists "interview_sessions_update_own" on public.interview_sessions;
create policy "interview_sessions_update_own" on public.interview_sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "interview_sessions_delete_own" on public.interview_sessions;
create policy "interview_sessions_delete_own" on public.interview_sessions
  for delete using (auth.uid() = user_id);

-- interview_questions: access follows parent session ownership
drop policy if exists "interview_questions_select_own" on public.interview_questions;
create policy "interview_questions_select_own" on public.interview_questions
  for select using (
    exists (select 1 from public.interview_sessions s where s.id = session_id and s.user_id = auth.uid())
  );

drop policy if exists "interview_questions_insert_own" on public.interview_questions;
create policy "interview_questions_insert_own" on public.interview_questions
  for insert with check (
    exists (select 1 from public.interview_sessions s where s.id = session_id and s.user_id = auth.uid())
  );

drop policy if exists "interview_questions_update_own" on public.interview_questions;
create policy "interview_questions_update_own" on public.interview_questions
  for update using (
    exists (select 1 from public.interview_sessions s where s.id = session_id and s.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.interview_sessions s where s.id = session_id and s.user_id = auth.uid())
  );

drop policy if exists "interview_questions_delete_own" on public.interview_questions;
create policy "interview_questions_delete_own" on public.interview_questions
  for delete using (
    exists (select 1 from public.interview_sessions s where s.id = session_id and s.user_id = auth.uid())
  );
