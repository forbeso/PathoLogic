create table if not exists public.learner_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_xp integer not null default 0 check (total_xp >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_active_date date,
  legacy_imported_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.progression_awards (
  user_id uuid not null references auth.users(id) on delete cascade,
  award_id text not null,
  event_type text not null
    check (event_type in ('scenario_objective', 'scenario_complete', 'exam_complete')),
  xp integer not null check (xp between 1 and 500),
  metadata jsonb not null default '{}'::jsonb,
  awarded_at timestamptz not null default now(),
  primary key (user_id, award_id)
);

create index if not exists progression_awards_user_date_idx
  on public.progression_awards (user_id, awarded_at desc);

alter table public.learner_progress enable row level security;
alter table public.progression_awards enable row level security;

drop policy if exists "Users can read their own learner progress"
  on public.learner_progress;
create policy "Users can read their own learner progress"
  on public.learner_progress
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can read their own progression awards"
  on public.progression_awards;
create policy "Users can read their own progression awards"
  on public.progression_awards
  for select
  to authenticated
  using (auth.uid() = user_id);

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

  if p_event_type not in ('scenario_objective', 'scenario_complete', 'exam_complete') then
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
  )
  values (
    p_user_id,
    p_award_id,
    p_event_type,
    p_xp,
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (user_id, award_id) do nothing;

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

create or replace function public.import_legacy_learner_progress(
  p_user_id uuid,
  p_total_xp integer,
  p_current_streak integer,
  p_longest_streak integer,
  p_last_active_date date
)
returns table (
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
  v_today date := (now() at time zone 'utc')::date;
  v_current_streak integer;
begin
  v_current_streak := case
    when p_last_active_date is null or p_last_active_date < v_today - 1 then 0
    else least(greatest(coalesce(p_current_streak, 0), 0), 3650)
  end;

  insert into public.learner_progress (
    user_id,
    total_xp,
    current_streak,
    longest_streak,
    last_active_date,
    legacy_imported_at,
    updated_at
  )
  values (
    p_user_id,
    least(greatest(coalesce(p_total_xp, 0), 0), 50000),
    v_current_streak,
    least(
      greatest(coalesce(p_longest_streak, 0), v_current_streak),
      3650
    ),
    p_last_active_date,
    now(),
    now()
  )
  on conflict (user_id) do update
  set
    total_xp = greatest(
      learner_progress.total_xp,
      excluded.total_xp
    ),
    current_streak = greatest(
      learner_progress.current_streak,
      excluded.current_streak
    ),
    longest_streak = greatest(
      learner_progress.longest_streak,
      excluded.longest_streak
    ),
    last_active_date = greatest(
      learner_progress.last_active_date,
      excluded.last_active_date
    ),
    legacy_imported_at = now(),
    updated_at = now()
  where learner_progress.legacy_imported_at is null;

  return query
  select
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

revoke all on function public.import_legacy_learner_progress(
  uuid,
  integer,
  integer,
  integer,
  date
) from public, anon, authenticated;
grant execute on function public.import_legacy_learner_progress(
  uuid,
  integer,
  integer,
  integer,
  date
) to service_role;
