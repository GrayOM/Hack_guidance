-- The limiter answered with a bare boolean, so a deployment where the ceiling was in effect looked
-- identical on the wire to one where it was not: every call returned 200 and nothing said whether
-- the control existed. Confirming it meant sending more than 120 requests and inferring from the
-- absence of a rejection, which cannot distinguish "the limiter allowed it" from "no limiter ran".
--
-- The routine now returns the attempt count for the current minute. The Edge Function publishes it
-- as the standard X-RateLimit headers, so the control is observed from a single response instead of
-- inferred from a burst.
--
-- The ceiling moves to the caller, which already holds it as a constant, so p_limit is gone. The
-- return type and the signature both change and CREATE OR REPLACE FUNCTION can do neither (42P13),
-- so the previous routine is dropped first.

begin;

drop function if exists public.hg_consume_public_slot(text, integer);
drop function if exists public.hg_consume_public_slot(text);

create function public.hg_consume_public_slot(p_client_key text)
returns integer
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

  return v_attempts;
end;
$$;

revoke all on function public.hg_consume_public_slot(text) from public, anon, authenticated;
grant execute on function public.hg_consume_public_slot(text) to service_role;

commit;
