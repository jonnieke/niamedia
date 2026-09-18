-- Migration: 20260708000001_market_surveys.sql
-- Description: Customer survey & star ratings to identify gaps in the SME marketing landscape

create table if not exists public.market_surveys (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete set null,
  rating            smallint not null check (rating between 1 and 5),
  primary_challenge text,
  desired_services  text[] default '{}',
  budget_range      text,
  feedback_text     text,
  business_name     text,
  contact_name      text,
  email             text,
  phone             text,
  source_page       text default 'web',
  created_at        timestamptz default now()
);

alter table public.market_surveys enable row level security;

-- Public insert policy: any prospect or authenticated user can submit feedback
drop policy if exists "anyone_can_submit_survey" on public.market_surveys;
create policy "anyone_can_submit_survey" on public.market_surveys
  for insert with check (true);

-- Admin read policy: only admins can view all market survey responses
drop policy if exists "admin_read_market_surveys" on public.market_surveys;
create policy "admin_read_market_surveys" on public.market_surveys
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create index if not exists idx_market_surveys_rating on public.market_surveys(rating);
create index if not exists idx_market_surveys_created_at on public.market_surveys(created_at desc);
