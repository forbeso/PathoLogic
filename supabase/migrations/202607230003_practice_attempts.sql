create table if not exists public.practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_id uuid not null,
  source text not null check (source in ('static', 'generated')),
  item_id uuid references public.items(id) on delete set null,
  generated_scenario_id bigint
    references public.generated_scenarios(id) on delete set null,
  domain text not null,
  topic text not null,
  selected_choice_id text not null,
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  unique (user_id, attempt_id),
  check (
    (source = 'static' and item_id is not null)
    or
    (source = 'generated' and generated_scenario_id is not null)
  )
);

create index if not exists practice_attempts_user_date_idx
  on public.practice_attempts (user_id, answered_at desc);

create index if not exists practice_attempts_user_topic_idx
  on public.practice_attempts (user_id, topic, answered_at desc);

alter table public.practice_attempts enable row level security;

drop policy if exists "Users can read their own practice attempts"
  on public.practice_attempts;
create policy "Users can read their own practice attempts"
  on public.practice_attempts
  for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.record_practice_attempt(
  p_user_id uuid,
  p_attempt_id uuid,
  p_source text,
  p_item_id uuid,
  p_generated_scenario_id bigint,
  p_domain text,
  p_topic text,
  p_selected_choice_id text,
  p_is_correct boolean
)
returns table (
  recorded boolean,
  accuracy double precision,
  attempts integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer;
  v_recorded boolean;
begin
  insert into public.practice_attempts (
    user_id,
    attempt_id,
    source,
    item_id,
    generated_scenario_id,
    domain,
    topic,
    selected_choice_id,
    is_correct
  )
  values (
    p_user_id,
    p_attempt_id,
    p_source,
    p_item_id,
    p_generated_scenario_id,
    p_domain,
    p_topic,
    p_selected_choice_id,
    p_is_correct
  )
  on conflict (user_id, attempt_id) do nothing;

  get diagnostics v_rows = row_count;
  v_recorded := v_rows = 1;

  if v_recorded then
    update public.performance as performance
    set
      accuracy = (
        (performance.accuracy * performance.attempts)
        + case when p_is_correct then 1 else 0 end
      ) / (performance.attempts + 1),
      attempts = performance.attempts + 1,
      last_practiced = now()
    where performance.user_id = p_user_id
      and performance.topic = p_topic;

    if not found then
      begin
        insert into public.performance (
          user_id,
          topic,
          accuracy,
          attempts,
          last_practiced
        )
        values (
          p_user_id,
          p_topic,
          case when p_is_correct then 1 else 0 end,
          1,
          now()
        );
      exception
        when unique_violation then
          update public.performance as performance
          set
            accuracy = (
              (performance.accuracy * performance.attempts)
              + case when p_is_correct then 1 else 0 end
            ) / (performance.attempts + 1),
            attempts = performance.attempts + 1,
            last_practiced = now()
          where performance.user_id = p_user_id
            and performance.topic = p_topic;
      end;
    end if;
  end if;

  return query
  select
    v_recorded,
    performance.accuracy::double precision,
    performance.attempts
  from public.performance as performance
  where performance.user_id = p_user_id
    and performance.topic = p_topic
  limit 1;
end;
$$;

revoke all on function public.record_practice_attempt(
  uuid,
  uuid,
  text,
  uuid,
  bigint,
  text,
  text,
  text,
  boolean
) from public, anon, authenticated;
grant execute on function public.record_practice_attempt(
  uuid,
  uuid,
  text,
  uuid,
  bigint,
  text,
  text,
  text,
  boolean
) to service_role;
