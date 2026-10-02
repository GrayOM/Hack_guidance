-- The public rate-limit ledger was created without revoking the default table privileges, so a
-- browser role could still select from it and only row level security stood in the way. The
-- sibling submission ledger refuses the same request with a privilege error, and this one should
-- too: a single future policy mistake should not be all that separates the ledger from the world.

begin;

revoke all on table public.hg_public_rate_limits from public, anon, authenticated;
grant all on table public.hg_public_rate_limits to service_role;

commit;
