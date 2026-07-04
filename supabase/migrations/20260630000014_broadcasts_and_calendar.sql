-- Phase 12A: WhatsApp Broadcasts
create table if not exists public.broadcasts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  title text not null default '',
  message text not null,
  status text not null default 'draft' check (status in ('draft', 'sending', 'sent', 'failed')),
  recipient_count integer not null default 0,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
alter table public.broadcasts enable row level security;
drop policy if exists "Users manage own broadcasts" on public.broadcasts;
create policy "Users manage own broadcasts" on public.broadcasts
  for all using (auth.uid() = user_id);

create table if not exists public.broadcast_recipients (
  id uuid primary key default gen_random_uuid(),
  broadcast_id uuid not null references public.broadcasts(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  phone text not null,
  name text not null default '',
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  error_message text,
  sent_at timestamptz
);
alter table public.broadcast_recipients enable row level security;
drop policy if exists "Users read own broadcast recipients" on public.broadcast_recipients;
create policy "Users read own broadcast recipients" on public.broadcast_recipients
  for select using (
    exists (select 1 from public.broadcasts b where b.id = broadcast_recipients.broadcast_id and b.user_id = auth.uid())
  );

-- Phase 12B: Content Calendar
create table if not exists public.content_calendar (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scheduled_date date not null,
  content_type text not null default 'caption' check (content_type in ('caption', 'whatsapp', 'story', 'idea')),
  content text not null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  status text not null default 'idea' check (status in ('idea', 'scheduled', 'posted')),
  created_at timestamptz not null default now()
);
alter table public.content_calendar enable row level security;
drop policy if exists "Users manage own calendar" on public.content_calendar;
create policy "Users manage own calendar" on public.content_calendar
  for all using (auth.uid() = user_id);

create index if not exists content_calendar_user_date_idx on public.content_calendar (user_id, scheduled_date);
