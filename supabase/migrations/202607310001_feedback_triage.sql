create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null
    check (category in ('friction', 'idea', 'content', 'bug')),
  rating smallint not null check (rating between 1 and 5),
  message text not null check (char_length(message) between 3 and 2000),
  route text not null check (char_length(route) between 1 and 160),
  created_at timestamptz not null default now()
);

create index if not exists beta_feedback_user_date_idx
  on public.beta_feedback (user_id, created_at desc);

create index if not exists beta_feedback_category_date_idx
  on public.beta_feedback (category, created_at desc);

alter table public.beta_feedback enable row level security;

revoke all on table public.beta_feedback from public, anon, authenticated;
grant all on table public.beta_feedback to service_role;

alter table public.beta_feedback
  add column if not exists status text not null default 'new',
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists resolved_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'beta_feedback_status_check'
      and conrelid = 'public.beta_feedback'::regclass
  ) then
    alter table public.beta_feedback
      add constraint beta_feedback_status_check
      check (status in ('new', 'reviewing', 'resolved'));
  end if;
end
$$;

create index if not exists beta_feedback_status_date_idx
  on public.beta_feedback (status, created_at desc);
