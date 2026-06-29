-- Campaign review links for client/agency approval flow
create table if not exists public.campaign_reviews (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  review_token text not null unique default encode(extensions.gen_random_bytes(18), 'base64'),
  reviewer_name text not null default '',
  reviewer_email text not null default '',
  status text not null default 'pending',  -- pending | approved | changes_requested
  overall_comment text not null default '',
  section_feedback jsonb not null default '{}',
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.campaign_reviews enable row level security;

create policy "Users manage own reviews"
  on public.campaign_reviews for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists campaign_reviews_token_idx on public.campaign_reviews (review_token);
create index if not exists campaign_reviews_campaign_idx on public.campaign_reviews (campaign_id);
