-- Enforce one public name per learner and expose profile operations only through
-- the server-side Edge Function service role.

begin;

create unique index if not exists hg_profiles_display_name_ci_unique
  on public.hg_profiles (lower(display_name));

create or replace function public.hg_display_name_available(
  p_display_name text,
  p_exclude_user_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    trim(coalesce(p_display_name, '')) ~ '^[가-힣A-Za-z0-9 _-]{2,24}$'
    and not exists (
      select 1
      from public.hg_profiles p
      where lower(p.display_name) = lower(trim(p_display_name))
        and (p_exclude_user_id is null or p.id <> p_exclude_user_id)
    );
$$;

revoke all on function public.hg_display_name_available(text, uuid) from public, anon, authenticated;
grant execute on function public.hg_display_name_available(text, uuid) to service_role;

commit;
