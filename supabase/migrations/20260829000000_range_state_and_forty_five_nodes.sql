-- Chapter five opens the practice range: five nodes against a mock application that is wrong on
-- purpose. Two things follow from it.
--
-- One, the operation is forty five nodes now, so issuance has to count forty five or the
-- certificate goes out at seven eighths. The course code is left as it is, as always: it is an
-- opaque identifier, not a label, and changing it would orphan the certificates already issued.
--
-- Two, the race node needs somewhere to keep a counter. It gets a table of its own, holding one
-- small integer per operator and nothing else. No range data lives in the database: the orders,
-- the documents and the prices are fixtures inside the edge function, so a technique practised
-- against the range cannot reach a real row.

begin;

create table if not exists public.hg_range_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  coupon_applied integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.hg_range_state enable row level security;

-- An operator may read their own counter, so the range console can show the state it is working
-- against. Nobody writes it directly: the only writes go through the routine below and through the
-- range function's service role, which is what keeps the counter from being set to the value that
-- hands out the trace.
drop policy if exists hg_range_state_select_own on public.hg_range_state;
create policy hg_range_state_select_own on public.hg_range_state
  for select to authenticated using (user_id = auth.uid());

revoke all on table public.hg_range_state from public, anon;
grant select on table public.hg_range_state to authenticated;

-- The apply is atomic on purpose, even though the node is about a race. The defect the node teaches
-- is the non-atomic *check* in the edge function: it reads the counter, does other work, and only
-- then applies. Keeping the apply itself atomic is what makes the double-apply observable -- the
-- second request to land is told it is the second -- instead of one increment silently overwriting
-- the other and leaving nothing for the operator to see.
create or replace function public.hg_range_apply_coupon(p_user_id uuid)
returns integer
language sql
security definer set search_path = public
as $$
  insert into public.hg_range_state as s (user_id, coupon_applied, updated_at)
  values (p_user_id, 1, now())
  on conflict (user_id) do update
    set coupon_applied = s.coupon_applied + 1, updated_at = now()
  returning s.coupon_applied;
$$;

revoke all on function public.hg_range_apply_coupon(uuid) from public, anon, authenticated;
grant execute on function public.hg_range_apply_coupon(uuid) to service_role;

create or replace function public.hg_issue_clearance_certificate(p_user_id uuid)
returns table (issued boolean, certificate_code text, remaining_modules integer)
language plpgsql
security definer set search_path = public
as $$
declare
  v_course_code constant text := 'black-trace-10-node-clearance';
  v_required constant integer := 45;
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
