create table if not exists public.scenario_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  run_id text not null,
  scenario_id text not null
    check (scenario_id in ('anaphylaxis', 'car-accident')),
  simulation_mode text not null
    check (simulation_mode in ('guided', 'scenario', 'exam')),
  status text not null default 'active'
    check (status in ('active', 'completed', 'abandoned')),
  completed_objectives smallint not null default 0
    check (completed_objectives >= 0),
  total_objectives smallint not null
    check (total_objectives between 1 and 100),
  score_percent smallint
    check (score_percent between 0 and 100),
  score_breakdown jsonb not null default '{}'::jsonb,
  elapsed_seconds integer not null default 0
    check (elapsed_seconds between 0 and 86400),
  hints_used smallint not null default 0
    check (hints_used between 0 and 100),
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  abandoned_at timestamptz,
  unique (user_id, run_id)
);

create index if not exists scenario_attempts_user_date_idx
  on public.scenario_attempts (user_id, updated_at desc);

create index if not exists scenario_attempts_user_scenario_idx
  on public.scenario_attempts (user_id, scenario_id, updated_at desc);

alter table public.scenario_attempts enable row level security;

drop policy if exists "Users can read their own scenario attempts"
  on public.scenario_attempts;
create policy "Users can read their own scenario attempts"
  on public.scenario_attempts
  for select
  to authenticated
  using (auth.uid() = user_id);
