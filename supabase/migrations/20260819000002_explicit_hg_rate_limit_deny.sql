-- The rate-limit ledger is Edge Function internal state. This policy documents
-- that anon/authenticated browser roles are explicitly denied every operation.
create policy "hg_rate_limit_browser_deny"
on public.hg_submission_rate_limits
as restrictive
for all
to anon, authenticated
using (false)
with check (false);
