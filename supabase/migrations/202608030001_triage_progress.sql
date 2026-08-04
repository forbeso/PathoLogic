create table if not exists public.triage_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  run_id text not null,
  scenario_id text not null,
  simulation_mode text not null check (simulation_mode in ('learn', 'challenge')),
  outcome text not null check (outcome in ('completed', 'timed-out')),
  score integer not null check (score between -5000 and 5000),
  accuracy smallint not null check (accuracy between 0 and 100),
  correct_classifications smallint not null check (correct_classifications between 0 and 100),
  correct_interventions smallint not null check (correct_interventions between 0 and 100),
  over_triage smallint not null check (over_triage between 0 and 100),
  under_triage smallint not null check (under_triage between 0 and 100),
  untagged smallint not null check (untagged between 0 and 100),
  elapsed_seconds integer not null check (elapsed_seconds between 0 and 3600),
  patient_results jsonb not null default '[]'::jsonb,
  completed_at timestamptz not null default now(),
  unique (user_id, run_id)
);

create index if not exists triage_attempts_user_date_idx
  on public.triage_attempts (user_id, completed_at desc);

alter table public.triage_attempts enable row level security;

drop policy if exists "Users can read their own triage attempts"
  on public.triage_attempts;
create policy "Users can read their own triage attempts"
  on public.triage_attempts
  for select
  to authenticated
  using (auth.uid() = user_id);

alter table public.progression_awards
  drop constraint if exists progression_awards_event_type_check;
alter table public.progression_awards
  add constraint progression_awards_event_type_check
  check (event_type in (
    'scenario_objective',
    'scenario_complete',
    'exam_complete',
    'triage_complete'
  ));

create or replace function public.award_learner_progress(
  p_user_id uuid,
  p_award_id text,
  p_event_type text,
  p_xp integer,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  awarded boolean,
  total_xp integer,
  current_streak integer,
  longest_streak integer,
  last_active_date date
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer;
  v_awarded boolean;
  v_today date := (now() at time zone 'utc')::date;
begin
  if p_award_id is null or length(p_award_id) < 3 or length(p_award_id) > 180 then
    raise exception 'Invalid progression award id';
  end if;

  if p_event_type not in (
    'scenario_objective',
    'scenario_complete',
    'exam_complete',
    'triage_complete'
  ) then
    raise exception 'Invalid progression event type';
  end if;

  if p_xp < 1 or p_xp > 500 then
    raise exception 'Invalid progression XP amount';
  end if;

  insert into public.progression_awards (
    user_id,
    award_id,
    event_type,
    xp,
    metadata
  ) values (
    p_user_id,
    p_award_id,
    p_event_type,
    p_xp,
    coalesce(p_metadata, '{}'::jsonb)
  ) on conflict (user_id, award_id) do nothing;

  get diagnostics v_rows = row_count;
  v_awarded := v_rows = 1;

  insert into public.learner_progress (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  if v_awarded then
    update public.learner_progress as progress
    set
      total_xp = progress.total_xp + p_xp,
      current_streak = case
        when progress.last_active_date = v_today then progress.current_streak
        when progress.last_active_date = v_today - 1 then progress.current_streak + 1
        else 1
      end,
      longest_streak = greatest(
        progress.longest_streak,
        case
          when progress.last_active_date = v_today then progress.current_streak
          when progress.last_active_date = v_today - 1 then progress.current_streak + 1
          else 1
        end
      ),
      last_active_date = v_today,
      updated_at = now()
    where progress.user_id = p_user_id;
  end if;

  return query
  select
    v_awarded,
    progress.total_xp,
    progress.current_streak,
    progress.longest_streak,
    progress.last_active_date
  from public.learner_progress as progress
  where progress.user_id = p_user_id;
end;
$$;

revoke all on function public.award_learner_progress(
  uuid,
  text,
  text,
  integer,
  jsonb
) from public, anon, authenticated;
grant execute on function public.award_learner_progress(
  uuid,
  text,
  text,
  integer,
  jsonb
) to service_role;
