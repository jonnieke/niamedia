-- Brand Memory (feeds AI generation) + Lead Tracker

-- ── Brand Memory columns on brand_kits ───────────────────────────────
alter table public.brand_kits
  add column if not exists location text not null default '',
  add column if not exists common_offers text not null default '',
  add column if not exists customer_objections text not null default '',
  add column if not exists competitors text not null default '',
  add column if not exists words_to_use text not null default '',
  add column if not exists words_to_avoid text not null default '',
  add column if not exists common_questions text not null default '',
  add column if not exists selling_points text not null default '',
  add column if not exists brand_memory text not null default '';

-- ── leads ────────────────────────────────────────────────────────────
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid,
  name text not null default '',
  phone text not null default '',
  source text not null default '',          -- WhatsApp | Instagram | Facebook | Call | Walk-in | Referral | Other
  interest_level text not null default 'Warm', -- Hot | Warm | Cold
  status text not null default 'New',        -- New | Contacted | Interested | Converted | Lost
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
