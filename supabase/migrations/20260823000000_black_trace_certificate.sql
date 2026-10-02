-- The clearance certificate was built for the retired 50-problem curriculum: the issuing routine
-- counted hg_learning_progress and the table required completed_modules = 50. After the inventory
-- was replaced by BLACK TRACE's ten nodes, nothing could satisfy it, so the Edge Function returned
-- a permanent "not issued" and the certificate screens showed empty state for everyone.
--
-- Issuance now counts recovered BLACK TRACE nodes and requires all ten. Existing rows from the old
-- course keep their code: the course_code column separates the two.

begin;

-- The retired course fixed this at 50; the BLACK TRACE course completes at 10.
alter table public.hg_course_certificates
  drop constraint if exists hg_course_certificates_completed_modules_check;
alter table public.hg_course_certificates
  add constraint hg_course_certificates_completed_modules_check check (completed_modules > 0);

create or replace function public.hg_issue_clearance_certificate(p_user_id uuid)
returns table (issued boolean, certificate_code text, remaining_modules integer)
language plpgsql
security definer set search_path = public
as $$
declare
  v_course_code constant text := 'black-trace-10-node-clearance';
  v_required constant integer := 10;
  v_certificate_code text;
  v_completed integer;
begin
  -- Issuance is idempotent: an operator who already holds the certificate gets the same code.
  select c.certificate_code into v_certificate_code
  from public.hg_course_certificates c
  where c.user_id = p_user_id and c.course_code = v_course_code;

  if found then
    return query select true, v_certificate_code, 0;
    return;
  end if;

  select count(*) into v_completed
  from public.hg_black_trace_progress p
  where p.user_id = p_user_id;

  if v_completed < v_required then
    return query select false, null::text, v_required - v_completed;
    return;
  end if;

  v_certificate_code := 'HG-WSF-' || to_char(now() at time zone 'UTC', 'YYYY') || '-' ||
    substring(upper(replace(gen_random_uuid()::text, '-', '')) from 1 for 18);

  insert into public.hg_course_certificates (user_id, course_code, certificate_code, completed_modules)
  values (p_user_id, v_course_code, v_certificate_code, v_required)
  on conflict (user_id, course_code) do update
    set certificate_code = public.hg_course_certificates.certificate_code
  returning public.hg_course_certificates.certificate_code into v_certificate_code;

  return query select true, v_certificate_code, 0;
end;
$$;

-- Public verification exposes only what the printed sheet shows. No email, no user identifier.
-- The previous view carried user_id, and CREATE OR REPLACE VIEW cannot drop a column (42P16),
-- so the view is dropped first. Nothing depends on it: the Edge Function queries it directly.
drop view if exists public.hg_public_certificate_verification;
create view public.hg_public_certificate_verification with (security_invoker = true) as
select
  c.certificate_code,
  c.course_code,
  c.completed_modules,
  c.issued_at,
  p.display_name
from public.hg_course_certificates c
join public.hg_profiles p on p.id = c.user_id;

revoke all on function public.hg_issue_clearance_certificate(uuid) from public, anon, authenticated;
grant execute on function public.hg_issue_clearance_certificate(uuid) to service_role;
revoke all on table public.hg_public_certificate_verification from public, anon, authenticated;
grant select on table public.hg_public_certificate_verification to service_role;

commit;
