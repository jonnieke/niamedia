-- Email marketing opt-out flag on profiles
-- When false, skip day2_nudge and day5_social_proof emails
alter table public.profiles
  add column if not exists email_marketing_opt_out boolean not null default false;
