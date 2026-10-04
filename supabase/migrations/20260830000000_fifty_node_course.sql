-- Chapter five's second half adds the injection nodes, taking the operation to fifty. Two things
-- follow.
--
-- One, the stored-payload node needs somewhere to keep the operator's own note between two
-- requests, so the range state table grows one text column. It holds what that operator typed and
-- nothing else, it is read back only for them, and it is rendered only inside a frame that has no
-- access to the page around it.
--
-- Two, issuance has to count fifty. The course code is left as it is, as always: it is an opaque
-- identifier, not a label, and changing it would orphan the certificates already issued.

begin;

alter table public.hg_range_state add column if not exists stored_note text not null default '';

-- Bounded in the database as well as in the function. The function caps the field before writing
-- it; this makes a write that skipped that cap fail rather than store an unbounded blob.
alter table public.hg_range_state drop constraint if exists hg_range_state_stored_note_length;
alter table public.hg_range_state add constraint hg_range_state_stored_note_length check (length(stored_note) <= 256);

create or replace function public.hg_issue_clearance_certificate(p_user_id uuid)
returns table (issued boolean, certificate_code text, remaining_modules integer)
language plpgsql
security definer set search_path = public
as $$
declare
  v_course_code constant text := 'black-trace-10-node-clearance';
  v_required constant integer := 50;
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

revoke all on function public.hg_issue_clearance_certificate(uuid) from public, anon, authenticated;
grant execute on function public.hg_issue_clearance_certificate(uuid) to service_role;

commit;
