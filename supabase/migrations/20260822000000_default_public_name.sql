-- Accounts created outside the sign-up form (for example directly in the Supabase dashboard)
-- carry no name metadata. hg_provision_confirmed_profile raised 22023 for them, so the browser
-- never received a learner profile, stayed unauthenticated, and every screen reported GUEST even
-- though the password sign-in had succeeded.
--
-- A confirmed account now always receives a public profile: the name from its metadata when that
-- is valid, otherwise a unique default derived from the email address, which the operator can
-- rename on the profile screen. Email confirmation remains a hard requirement.

begin;

-- Reduces an arbitrary string to the public-name charset. Pure, so the caller owns uniqueness.
create or replace function public.hg_sanitize_display_name(p_source text)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when length(trimmed) >= 2 then trimmed
    when length(trimmed) = 1 then trimmed || '_1'
    else 'operator'
  end
  from (
    select trim(left(trim(regexp_replace(
      split_part(coalesce(p_source, ''), '@', 1), '[^가-힣A-Za-z0-9 _-]', '_', 'g'
    )), 24)) as trimmed
  ) source;
$$;

create or replace function public.hg_provision_confirmed_profile(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_display_name text;
  v_confirmed_at timestamptz;
  v_email text;
  v_existing text;
  v_base text;
  v_candidate text;
  v_suffix integer := 1;
begin
  select
    nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
    u.email_confirmed_at,
    u.email
  into v_display_name, v_confirmed_at, v_email
  from auth.users u
  where u.id = p_user_id;

  if not found or v_confirmed_at is null then
    raise exception 'Email confirmation is required before creating a learner profile'
      using errcode = '42501';
  end if;

  -- An operator who already has a profile keeps the name they chose.
  select p.display_name into v_existing from public.hg_profiles p where p.id = p_user_id;
  if v_existing is not null then
    return v_existing;
  end if;

  if v_display_name is null or v_display_name !~ '^[가-힣A-Za-z0-9 _-]{2,24}$' then
    v_base := public.hg_sanitize_display_name(v_email);
    v_candidate := v_base;
    while exists (
      select 1 from public.hg_profiles p where lower(p.display_name) = lower(v_candidate)
    ) loop
      v_suffix := v_suffix + 1;
      if v_suffix > 99 then
        v_candidate := left(v_base, 15) || '_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
        exit;
      end if;
      v_candidate := left(v_base, 24 - (length(v_suffix::text) + 1)) || '_' || v_suffix::text;
    end loop;
    v_display_name := v_candidate;
  end if;

  begin
    insert into public.hg_profiles (id, display_name)
    values (p_user_id, v_display_name)
    returning display_name into v_display_name;
  exception
    when unique_violation then
      -- Either the profile appeared concurrently, or the generated name was taken in between.
      select p.display_name into v_existing from public.hg_profiles p where p.id = p_user_id;
      if v_existing is not null then
        return v_existing;
      end if;
      v_display_name := left(public.hg_sanitize_display_name(v_email), 15)
        || '_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
      insert into public.hg_profiles (id, display_name)
      values (p_user_id, v_display_name)
      returning display_name into v_display_name;
  end;

  return v_display_name;
end;
$$;

-- Both routines are Edge Function internals; browser roles must never call them directly.
revoke all on function public.hg_sanitize_display_name(text) from public, anon, authenticated;
grant execute on function public.hg_sanitize_display_name(text) to service_role;
revoke all on function public.hg_provision_confirmed_profile(uuid) from public, anon, authenticated;
grant execute on function public.hg_provision_confirmed_profile(uuid) to service_role;

commit;
