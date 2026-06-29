-- Campaign analytics — track shares and clicks

-- ── campaign_shares — each time a user shares a campaign, record it ──
create table if not exists public.campaign_shares (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  share_token text not null unique,  -- unique tracking token
  platform text not null,             -- whatsapp | instagram | facebook | email | other
  shared_at timestamptz not null default now(),
  views integer not null default 0,
  clicks integer not null default 0,
  last_view_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.campaign_shares enable row level security;
create policy "Users manage own shares" on public.campaign_shares
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists campaign_shares_user_idx on public.campaign_shares (user_id, created_at desc);
create index if not exists campaign_shares_token_idx on public.campaign_shares (share_token);
create index if not exists campaign_shares_campaign_idx on public.campaign_shares (campaign_id);

-- ── share_events — log each view/click on a shared campaign ──
create table if not exists public.share_events (
  id uuid primary key default gen_random_uuid(),
  share_id uuid not null references public.campaign_shares(id) on delete cascade,
  event_type text not null,           -- view | click
  ip_address text,
  user_agent text,
  referrer text,
  created_at timestamptz not null default now()
);
alter table public.share_events enable row level security;
create policy "Anyone can log events" on public.share_events for insert with check (true);
create index if not exists share_events_share_idx on public.share_events (share_id);
create index if not exists share_events_type_idx on public.share_events (event_type, created_at desc);

-- ── RPC to increment share counters ──
create or replace function public.increment_share_counter(p_share_id uuid, p_field text)
returns void as $$
begin
  if p_field = 'views' then
    update public.campaign_shares
      set views = views + 1, last_view_at = now()
      where id = p_share_id;
  elsif p_field = 'clicks' then
    update public.campaign_shares
      set clicks = clicks + 1
      where id = p_share_id;
  end if;
end;
$$ language plpgsql security definer;
