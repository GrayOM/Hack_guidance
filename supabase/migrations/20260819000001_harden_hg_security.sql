-- Harden Hack Guidance resources only. This migration changes no existing data.
-- The Edge Function uses the service_role; browser roles must never call these routines directly.

revoke all on function public.hg_create_profile_for_new_user() from public, anon, authenticated;
revoke all on function public.hg_consume_submission_slot(uuid) from public, anon, authenticated;
revoke all on function public.hg_record_problem_completion(uuid, integer, integer, integer) from public, anon, authenticated;
revoke all on function public.hg_mark_defense_reviewed(uuid, integer) from public, anon, authenticated;
revoke all on function public.hg_issue_clearance_certificate(uuid) from public, anon, authenticated;

grant execute on function public.hg_create_profile_for_new_user() to service_role;
grant execute on function public.hg_consume_submission_slot(uuid) to service_role;
grant execute on function public.hg_record_problem_completion(uuid, integer, integer, integer) to service_role;
grant execute on function public.hg_mark_defense_reviewed(uuid, integer) to service_role;
grant execute on function public.hg_issue_clearance_certificate(uuid) to service_role;

-- Views are consumed only by the service-role Edge Function. Security invoker avoids
-- definer semantics if permissions are ever granted in the future.
alter view public.hg_public_ranking set (security_invoker = true);
alter view public.hg_public_certificate_verification set (security_invoker = true);
revoke all on table public.hg_public_ranking from public, anon, authenticated;
revoke all on table public.hg_public_certificate_verification from public, anon, authenticated;
grant select on table public.hg_public_ranking to service_role;
grant select on table public.hg_public_certificate_verification to service_role;
