-- Referrals table: tracks who referred whom and credits earned
create table if not exists public.referrals (
  id               uuid primary key default gen_random_uuid(),
  referrer_id      uuid not null references public.profiles(id) on delete cascade,
  referred_user_id uuid references public.profiles(id) on delete set null,
  referee_email    text,
  status           text not null default 'pending', -- pending | active | rewarded
  credit_kes       integer not null default 0,
  created_at       timestamptz not null default now(),
  unique (referrer_id, referred_user_id)
);

-- Referrer can see their own outbound referrals
alter table public.referrals enable row level security;
drop policy if exists "Referrer sees own rows" on public.referrals;
create policy "Referrer sees own rows" on public.referrals
  for select using (referrer_id = auth.uid());
