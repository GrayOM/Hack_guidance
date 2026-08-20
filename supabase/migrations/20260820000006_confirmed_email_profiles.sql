-- Keep private Auth identities for email confirmation, but create public learner
-- profiles only after Supabase reports a confirmed email address.

begin;

drop trigger if exists hg_on_auth_user_created on auth.users;

-- Remove legacy public profiles for identities that have not completed email confirmation.
delete from public.hg_profiles p
using auth.users u
where p.id = u.id
  and u.email_confirmed_at is null;

create or replace function public.hg_provision_confirmed_profile(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_display_name text;
  v_confirmed_at timestamptz;
begin
  select
    nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
    u.email_confirmed_at
  into v_display_name, v_confirmed_at
  from auth.users u
  where u.id = p_user_id;

  if not found or v_confirmed_at is null then
    raise exception 'Email confirmation is required before creating a learner profile'
      using errcode = '42501';
  end if;

  if v_display_name is null or v_display_name !~ '^[가-힣A-Za-z0-9 _-]{2,24}$' then
    raise exception 'A valid public name is required before creating a learner profile'
      using errcode = '22023';
  end if;

  insert into public.hg_profiles as p (id, display_name)
  values (p_user_id, v_display_name)
  on conflict (id) do update
    set display_name = p.display_name,
        updated_at = p.updated_at
  returning p.display_name into v_display_name;

  return v_display_name;
end;
$$;

revoke all on function public.hg_provision_confirmed_profile(uuid) from public, anon, authenticated;
grant execute on function public.hg_provision_confirmed_profile(uuid) to service_role;

commit;
