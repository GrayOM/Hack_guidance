-- The unauthenticated actions (ranking, display-name availability, certificate verification) had
-- no call ceiling at all. They are cheap individually, but nothing stopped a loop from running the
-- Edge Function and the database continuously, and display-name checks could be enumerated.
--
-- The submission limiter cannot be reused: its ledger keys on auth.users(id) with a foreign key,
-- and these callers have no session. This ledger keys on an opaque client key the Edge Function
-- derives by hashing the forwarded address, so no raw address is ever stored.

begin;

create table if not exists public.hg_public_rate_limits (
  client_key text not null,
  bucket_start timestamptz not null,
  attempts integer not null default 0 check (attempts >= 0),
  primary key (client_key, bucket_start)
);

alter table public.hg_public_rate_limits enable row level security;

-- Edge Function internal state: browser roles are explicitly denied every operation.
drop policy if exists "hg_public_rate_limit_browser_deny" on public.hg_public_rate_limits;
create policy "hg_public_rate_limit_browser_deny"
on public.hg_public_rate_limits
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

create or replace function public.hg_consume_public_slot(p_client_key text, p_limit integer default 120)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_attempts integer;
  v_bucket timestamptz := date_trunc('minute', now());
begin
  -- Spent buckets are pruned occasionally rather than on every call, so the ledger stays bounded
  -- without paying for a delete on each request.
  if random() < 0.01 then
    delete from public.hg_public_rate_limits where bucket_start < now() - interval '10 minutes';
  end if;

  insert into public.hg_public_rate_limits (client_key, bucket_start, attempts)
  values (p_client_key, v_bucket, 1)
  on conflict (client_key, bucket_start)
  do update set attempts = public.hg_public_rate_limits.attempts + 1
  returning attempts into v_attempts;

  return v_attempts <= p_limit;
end;
$$;

revoke all on function public.hg_consume_public_slot(text, integer) from public, anon, authenticated;
grant execute on function public.hg_consume_public_slot(text, integer) to service_role;

commit;
