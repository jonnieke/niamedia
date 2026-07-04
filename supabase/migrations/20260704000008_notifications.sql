create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  type       text not null default 'info'
             check (type in ('info','success','action','warning')),
  title      text not null,
  body       text not null default '',
  action_url text,
  read       boolean not null default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

-- Users can only see and update their own notifications
drop policy if exists "own_read" on public.notifications;
create policy "own_read" on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists "own_update" on public.notifications;
create policy "own_update" on public.notifications
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role inserts (edge functions)
drop policy if exists "service_insert" on public.notifications;
create policy "service_insert" on public.notifications
  for insert with check (true);

-- Index for fast per-user queries
create index if not exists idx_notifications_user_read
  on public.notifications(user_id, read, created_at desc);

-- Helper: insert a notification for every admin user
create or replace function public.notify_admins(
  p_type       text,
  p_title      text,
  p_body       text,
  p_action_url text default null
) returns void
language plpgsql
security definer
as $$
begin
  insert into public.notifications (user_id, type, title, body, action_url)
  select id, p_type, p_title, p_body, p_action_url
  from public.profiles
  where role = 'admin';
end;
$$;
