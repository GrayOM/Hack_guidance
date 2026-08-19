-- Hack Guidance external deployment schema for Supabase Postgres.
-- Apply with `supabase db push`. Every object uses an hg_ prefix so pre-existing
-- project resources are not replaced, altered, deleted, or initialized.

create extension if not exists pgcrypto;

create table if not exists public.hg_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hg_learning_progress (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id integer not null check (problem_id between 1 and 50),
  level integer not null check (level between 1 and 5),
  hint_count integer not null default 0 check (hint_count between 0 and 3),
  defense_reviewed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, problem_id)
);

create index if not exists hg_learning_progress_solved_index
  on public.hg_learning_progress (user_id, completed_at)
  where completed_at is not null;

create table if not exists public.hg_course_certificates (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  course_code text not null default 'hack-guidance-50-node-clearance',
  certificate_code text not null unique check (certificate_code ~ '^HG-WSF-[0-9]{4}-[A-F0-9]{18}$'),
  completed_modules integer not null check (completed_modules = 50),
  issued_at timestamptz not null default now(),
  unique (user_id, course_code)
);

-- Stateless Edge Functions store the per-user, per-minute counter in Postgres.
create table if not exists public.hg_submission_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket_start timestamptz not null,
  attempts integer not null default 0 check (attempts >= 0),
  primary key (user_id, bucket_start)
);

create or replace function public.hg_create_profile_for_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.hg_profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Operator'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger hg_on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.hg_create_profile_for_new_user();

-- These functions are callable only by the Edge Function service role.
create or replace function public.hg_consume_submission_slot(p_user_id uuid)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_attempts integer;
  v_bucket timestamptz := date_trunc('minute', now());
begin
  insert into public.hg_submission_rate_limits (user_id, bucket_start, attempts)
  values (p_user_id, v_bucket, 1)
  on conflict (user_id, bucket_start)
  do update set attempts = public.hg_submission_rate_limits.attempts + 1
  returning attempts into v_attempts;
  return v_attempts <= 12;
end;
$$;

create or replace function public.hg_record_problem_completion(
  p_user_id uuid,
  p_problem_id integer,
  p_level integer,
  p_hint_count integer
)
returns table (solved_at timestamptz, already_completed boolean)
language plpgsql
security definer set search_path = public
as $$
declare
  v_existing timestamptz;
begin
  select completed_at into v_existing
  from public.hg_learning_progress
  where user_id = p_user_id and problem_id = p_problem_id and completed_at is not null
  for update;

  if found then
    update public.hg_learning_progress
    set updated_at = now()
    where user_id = p_user_id and problem_id = p_problem_id;
    return query select v_existing, true;
    return;
  end if;

  insert into public.hg_learning_progress (user_id, problem_id, level, hint_count, completed_at)
  values (p_user_id, p_problem_id, p_level, p_hint_count, now())
  on conflict (user_id, problem_id) do update
    set updated_at = now(), hint_count = greatest(public.hg_learning_progress.hint_count, excluded.hint_count)
  returning completed_at into v_existing;

  return query select v_existing, false;
end;
$$;

create or replace function public.hg_mark_defense_reviewed(p_user_id uuid, p_problem_id integer)
returns boolean
language plpgsql
security definer set search_path = public
as $$
begin
  update public.hg_learning_progress
  set defense_reviewed = true, updated_at = now()
  where user_id = p_user_id and problem_id = p_problem_id and completed_at is not null;
  return found;
end;
$$;

create or replace function public.hg_issue_clearance_certificate(p_user_id uuid)
returns table (issued boolean, certificate_code text, remaining_modules integer)
language plpgsql
security definer set search_path = public
as $$
declare
  v_code text;
  v_completed integer;
begin
  select certificate_code into v_code
  from public.hg_course_certificates
  where user_id = p_user_id and course_code = 'hack-guidance-50-node-clearance';

  if found then
    return query select true, v_code, 0;
    return;
  end if;

  select count(*) into v_completed
  from public.hg_learning_progress
  where user_id = p_user_id and completed_at is not null;

  if v_completed < 50 then
    return query select false, null::text, 50 - v_completed;
    return;
  end if;

  v_code := 'HG-WSF-' || to_char(now() at time zone 'UTC', 'YYYY') || '-' ||
    substring(upper(replace(gen_random_uuid()::text, '-', '')) from 1 for 18);

  insert into public.hg_course_certificates (user_id, certificate_code, completed_modules)
  values (p_user_id, v_code, 50)
  on conflict (user_id, course_code) do update set certificate_code = public.hg_course_certificates.certificate_code
  returning certificate_code into v_code;

  return query select true, v_code, 0;
end;
$$;

-- These public views expose only the limited fields intended for ranking and certificate verification.
create or replace view public.hg_public_ranking as
select
  dense_rank() over (order by count(lp.problem_id) desc, max(lp.completed_at) asc nulls last) as rank,
  p.display_name,
  count(lp.problem_id)::integer as solved_count,
  max(lp.completed_at) as last_solved_at
from public.hg_profiles p
left join public.hg_learning_progress lp on lp.user_id = p.id and lp.completed_at is not null
group by p.id, p.display_name
order by solved_count desc, last_solved_at asc nulls last;

create or replace view public.hg_public_certificate_verification as
select
  c.certificate_code,
  c.course_code,
  c.completed_modules,
  c.issued_at,
  p.display_name
from public.hg_course_certificates c
join public.hg_profiles p on p.id = c.user_id;

alter table public.hg_profiles enable row level security;
alter table public.hg_learning_progress enable row level security;
alter table public.hg_course_certificates enable row level security;
alter table public.hg_submission_rate_limits enable row level security;

create policy "hg_profiles_read_self" on public.hg_profiles for select using (auth.uid() = id);
create policy "hg_progress_read_self" on public.hg_learning_progress for select using (auth.uid() = user_id);
create policy "hg_certificates_read_self" on public.hg_course_certificates for select using (auth.uid() = user_id);

-- Browser clients receive no direct write policy: only the server-side Edge Function mutates state.
revoke all on public.hg_submission_rate_limits from anon, authenticated;
revoke all on function public.hg_consume_submission_slot(uuid) from public;
revoke all on function public.hg_record_problem_completion(uuid, integer, integer, integer) from public;
revoke all on function public.hg_mark_defense_reviewed(uuid, integer) from public;
revoke all on function public.hg_issue_clearance_certificate(uuid) from public;
grant select on public.hg_public_ranking to anon, authenticated;
grant select on public.hg_public_certificate_verification to anon, authenticated;
