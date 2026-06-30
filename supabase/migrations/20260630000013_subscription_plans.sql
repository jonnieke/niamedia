-- Phase 11: subscription plan label + auto top-up preference
alter table public.profiles
  add column if not exists subscription_plan text not null default 'free'
    check (subscription_plan in ('free', 'pro', 'agency')),
  add column if not exists auto_topup boolean not null default false;

-- Index for admin queries by plan
create index if not exists profiles_subscription_plan_idx on public.profiles (subscription_plan);
