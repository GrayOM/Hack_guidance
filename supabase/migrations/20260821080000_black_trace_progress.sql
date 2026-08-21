create table if not exists public.hg_black_trace_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  stage smallint not null check (stage between 1 and 10),
  hint_count smallint not null default 0 check (hint_count between 0 and 2),
  completed_at timestamptz not null default timezone('utc'::text, now()),
  primary key (user_id, stage)
);

alter table public.hg_black_trace_progress enable row level security;

create index if not exists hg_black_trace_progress_user_stage_idx
  on public.hg_black_trace_progress (user_id, stage);
