-- Avoid PL/pgSQL output-column ambiguity during real certificate issuance.
create or replace function public.hg_issue_clearance_certificate(p_user_id uuid)
returns table (issued boolean, certificate_code text, remaining_modules integer)
language plpgsql
security definer set search_path = public
as $$
declare
  v_certificate_code text;
  v_completed integer;
begin
  select c.certificate_code into v_certificate_code
  from public.hg_course_certificates c
  where c.user_id = p_user_id and c.course_code = 'hack-guidance-50-node-clearance';

  if found then
    return query select true, v_certificate_code, 0;
    return;
  end if;

  select count(*) into v_completed
  from public.hg_learning_progress lp
  where lp.user_id = p_user_id and lp.completed_at is not null;

  if v_completed < 50 then
    return query select false, null::text, 50 - v_completed;
    return;
  end if;

  v_certificate_code := 'HG-WSF-' || to_char(now() at time zone 'UTC', 'YYYY') || '-' ||
    substring(upper(replace(gen_random_uuid()::text, '-', '')) from 1 for 18);

  insert into public.hg_course_certificates (user_id, certificate_code, completed_modules)
  values (p_user_id, v_certificate_code, 50)
  on conflict (user_id, course_code) do update
    set certificate_code = public.hg_course_certificates.certificate_code
  returning public.hg_course_certificates.certificate_code into v_certificate_code;

  return query select true, v_certificate_code, 0;
end;
$$;
