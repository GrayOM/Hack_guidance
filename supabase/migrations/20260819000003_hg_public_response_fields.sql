-- Add only the identifiers needed by the Edge Function to normalize public UI responses.
create or replace view public.hg_public_ranking with (security_invoker = true) as
select
  dense_rank() over (order by count(lp.problem_id) desc, max(lp.completed_at) asc nulls last) as rank,
  p.display_name,
  count(lp.problem_id)::integer as solved_count,
  max(lp.completed_at) as last_solved_at,
  p.id as user_id
from public.hg_profiles p
left join public.hg_learning_progress lp on lp.user_id = p.id and lp.completed_at is not null
group by p.id, p.display_name
order by solved_count desc, last_solved_at asc nulls last;

create or replace view public.hg_public_certificate_verification with (security_invoker = true) as
select
  c.certificate_code,
  c.course_code,
  c.completed_modules,
  c.issued_at,
  p.display_name,
  c.user_id
from public.hg_course_certificates c
join public.hg_profiles p on p.id = c.user_id;

revoke all on table public.hg_public_ranking from public, anon, authenticated;
revoke all on table public.hg_public_certificate_verification from public, anon, authenticated;
grant select on table public.hg_public_ranking to service_role;
grant select on table public.hg_public_certificate_verification to service_role;
