-- The progress table has carried `check (stage between 1 and 10)` since the operation had ten
-- nodes. The course went to twenty, thirty, forty, forty five and fifty without this moving, so
-- every node above ten has been impossible to record: the operator submits the correct trace, the
-- function accepts it, and the insert is refused by the database. What they see is a 500 on a
-- right answer.
--
-- It went unnoticed because no account had reached node eleven -- the furthest anyone had gone was
-- three. The chapter migrations raised the certificate requirement each time and never this.
--
-- The bound stays rather than being dropped: the function already refuses a node it has no key
-- for, so this is the second line, and a column with no upper bound would accept a stage number a
-- future bug invented. A regression test now reads the newest bound and fails if it is below the
-- node count, which is what should have caught this four chapters ago.

begin;

alter table public.hg_black_trace_progress drop constraint if exists hg_black_trace_progress_stage_check;
alter table public.hg_black_trace_progress add constraint hg_black_trace_progress_stage_check check (stage between 1 and 50);

commit;
