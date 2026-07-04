create table if not exists public.retainers (
  id                uuid primary key default gen_random_uuid(),
  token             text unique not null default encode(extensions.gen_random_bytes(16), 'base64url'),

  -- Client
  business_name     text not null,
  contact_name      text,
  phone             text,
  email             text,
  industry          text,

  -- Package
  monthly_videos    smallint not null default 0,
  monthly_posters   smallint not null default 0,
  campaign_credits  smallint not null default 0,
  monthly_price     numeric(12,2) not null,
  currency          text not null default 'KES',

  -- Billing
  start_date        date not null default current_date,
  next_billing_date date not null default (current_date + interval '1 month')::date,
  billing_day       smallint not null default 1 check (billing_day between 1 and 28),

  -- Status
  status            text not null default 'active'
                    check (status in ('active','paused','cancelled')),
  notes             text,

  -- Tracking
  months_billed     smallint not null default 0,
  total_billed      numeric(12,2) not null default 0,
  last_billed_at    timestamptz,

  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create or replace function public.set_retainers_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_retainers_updated_at
  before update on public.retainers
  for each row execute function public.set_retainers_updated_at();

alter table public.retainers enable row level security;

drop policy if exists "admin_all_retainers" on public.retainers;
create policy "admin_all_retainers" on public.retainers
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create index if not exists idx_retainers_status on public.retainers(status);
create index if not exists idx_retainers_billing on public.retainers(next_billing_date) where status = 'active';
