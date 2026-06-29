-- Free tier tracking + WhatsApp onboarding

alter table public.profiles
  add column if not exists is_free_tier boolean not null default true,
  add column if not exists free_campaigns_used integer not null default 0,
  add column if not exists free_campaigns_reset_at timestamptz not null default now();

-- WhatsApp bot sessions (temporary state for multi-turn brief collection)
create table if not exists public.whatsapp_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  phone text not null,
  step text not null default 'business_name',  -- business_name, product, audience, objective, tone
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.whatsapp_sessions enable row level security;
create policy "Own whatsapp sessions" on public.whatsapp_sessions
  for all using (true) with check (true);  -- Anonymous access OK during signup
create index if not exists whatsapp_sessions_phone_idx on public.whatsapp_sessions (phone);
