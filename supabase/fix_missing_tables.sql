-- Fix missing tables from Phase 3 migrations
-- Run this in Supabase SQL Editor if migrations don't apply

-- Ideas table
create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  industry text,
  status text not null default 'Draft',  -- Draft | Selected | In Campaign | Archived
  source text not null default 'Manual',  -- Manual | Assistant | Campaign Result
  favorite boolean not null default false,
  platforms text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ideas enable row level security;
create policy "Users see own ideas" on public.ideas for select using (auth.uid() = user_id);
create policy "Users manage own ideas" on public.ideas for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists ideas_user_idx on public.ideas (user_id, created_at desc);

-- Assistant threads
create table if not exists public.assistant_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now()
);
alter table public.assistant_threads enable row level security;
create policy "Users see own threads" on public.assistant_threads for select using (auth.uid() = user_id);
create policy "Users manage own threads" on public.assistant_threads for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Assistant messages
create table if not exists public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.assistant_threads(id) on delete cascade,
  role text not null,  -- user | assistant
  content text not null,
  structured_output jsonb,
  created_at timestamptz not null default now()
);
alter table public.assistant_messages enable row level security;
create policy "Users see own messages" on public.assistant_messages
  for select using (exists(select 1 from public.assistant_threads where id = assistant_messages.thread_id and user_id = auth.uid()));

-- Leads table
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid,
  name text not null default '',
  phone text not null default '',
  source text not null default '',
  interest_level text not null default 'Warm',
  status text not null default 'New',
  notes text not null default '',
  estimated_value numeric not null default 0,
  follow_up_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.leads enable row level security;
create policy "Users manage own leads" on public.leads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists leads_user_idx on public.leads (user_id, created_at desc);
create index if not exists leads_campaign_idx on public.leads (campaign_id);

-- Campaign shares
create table if not exists public.campaign_shares (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  share_token text not null unique,
  platform text not null,
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

-- Share events
create table if not exists public.share_events (
  id uuid primary key default gen_random_uuid(),
  share_id uuid not null references public.campaign_shares(id) on delete cascade,
  event_type text not null,
  ip_address text,
  user_agent text,
  referrer text,
  created_at timestamptz not null default now()
);
alter table public.share_events enable row level security;
create policy "Anyone can log events" on public.share_events for insert with check (true);
create index if not exists share_events_share_idx on public.share_events (share_id);
create index if not exists share_events_type_idx on public.share_events (event_type, created_at desc);

-- RPC: increment_share_counter
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

-- RPC: reserve_credit, commit_credit, refund_credit (if not exist)
create or replace function public.reserve_credit(p_user_id uuid, p_description text)
returns uuid as $$
declare
  v_tx_id uuid;
  v_balance integer;
begin
  select credits into v_balance from public.profiles where id = p_user_id;
  if v_balance < 1 then return null; end if;

  v_tx_id := gen_random_uuid();
  insert into public.credit_transactions (id, user_id, amount, description, status)
  values (v_tx_id, p_user_id, -1, p_description, 'reserved');

  update public.profiles set credits = credits - 1 where id = p_user_id;
  return v_tx_id;
end;
$$ language plpgsql security definer;

create or replace function public.commit_credit(p_tx_id uuid)
returns void as $$
begin
  update public.credit_transactions set status = 'spent' where id = p_tx_id and status = 'reserved';
end;
$$ language plpgsql security definer;

create or replace function public.refund_credit(p_tx_id uuid)
returns void as $$
declare
  v_user_id uuid;
begin
  select user_id into v_user_id from public.credit_transactions where id = p_tx_id;
  if found then
    update public.credit_transactions set status = 'refunded' where id = p_tx_id and status = 'reserved';
    update public.profiles set credits = credits + 1 where id = v_user_id;
  end if;
end;
$$ language plpgsql security definer;
