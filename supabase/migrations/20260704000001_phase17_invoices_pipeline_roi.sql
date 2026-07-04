-- Phase 17: Invoices, Video Pipeline, Campaign ROI

-- Invoices
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  invoice_number text not null,
  client_name text not null,
  client_email text,
  client_phone text,
  items jsonb not null default '[]',
  subtotal numeric(12,2) not null default 0,
  tax_rate numeric(5,2) not null default 16,
  tax_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  currency text not null default 'KES',
  status text not null default 'draft' check (status in ('draft','sent','paid','overdue','cancelled')),
  due_date date,
  paid_at timestamptz,
  mpesa_ref text,
  notes text,
  created_at timestamptz default now()
);
alter table public.invoices enable row level security;
drop policy if exists "invoices_owner" on public.invoices;
create policy "invoices_owner" on public.invoices for all using (user_id = auth.uid());

-- Auto-generate invoice number per user
create sequence if not exists public.invoice_seq start 1000;

-- Video production jobs
create table if not exists public.video_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  client_name text,
  client_email text,
  stage text not null default 'brief' check (stage in ('brief','preproduction','filming','editing','review','delivered')),
  brief jsonb default '{}',
  budget numeric(12,2),
  currency text default 'KES',
  due_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.video_jobs enable row level security;
drop policy if exists "video_jobs_owner" on public.video_jobs;
create policy "video_jobs_owner" on public.video_jobs for all using (user_id = auth.uid());

-- Stage history / approvals
create table if not exists public.video_job_stages (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.video_jobs(id) on delete cascade not null,
  stage text not null,
  status text not null default 'pending' check (status in ('pending','in_progress','awaiting_approval','approved','rejected')),
  notes text,
  approved_at timestamptz,
  created_at timestamptz default now()
);
alter table public.video_job_stages enable row level security;
drop policy if exists "video_stages_owner" on public.video_job_stages;
create policy "video_stages_owner" on public.video_job_stages for all
  using (job_id in (select id from public.video_jobs where user_id = auth.uid()));

-- Campaign ROI / results
create table if not exists public.campaign_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  platform text not null default 'All Platforms',
  spend numeric(12,2) default 0,
  impressions integer default 0,
  clicks integer default 0,
  leads integer default 0,
  conversions integer default 0,
  revenue numeric(12,2) default 0,
  notes text,
  date_from date,
  date_to date,
  created_at timestamptz default now()
);
alter table public.campaign_results enable row level security;
drop policy if exists "campaign_results_owner" on public.campaign_results;
create policy "campaign_results_owner" on public.campaign_results for all using (user_id = auth.uid());
