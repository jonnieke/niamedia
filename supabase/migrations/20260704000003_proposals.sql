-- Phase 19: Smart Proposal + Deposit Collection
create table if not exists public.proposals (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),
  token             text unique not null default encode(extensions.gen_random_bytes(16), 'hex'),

  -- Link to quote request (optional)
  quote_request_id  uuid references public.quote_requests(id) on delete set null,

  -- Client info
  business_name     text not null,
  contact_name      text,
  phone             text not null,
  email             text,
  industry          text,

  -- Video spec
  video_length      text not null,
  platforms         text[] default '{}',
  what_to_promote   text,
  delivery_speed    text default 'standard',
  include_poster    boolean default true,
  include_subtitles boolean default false,

  -- Pricing
  final_price       integer not null,
  deposit_percent   integer default 50,
  deposit_amount    integer not null,

  -- Proposal content
  deliverables      text[] default '{}',
  timeline_days     integer default 7,
  valid_until       date,

  -- Status: draft | sent | accepted | paid | declined | expired
  status            text not null default 'sent',

  -- Admin
  admin_notes       text,
  created_by        uuid references public.profiles(id) on delete set null,

  -- Payment
  pesapal_order_id  text,
  paid_at           timestamptz
);

alter table public.proposals enable row level security;

-- Anyone can view proposals (token-gated at app level)
drop policy if exists "proposals_public_select" on public.proposals;
create policy "proposals_public_select"
  on public.proposals for select
  to anon, authenticated
  using (true);

-- Anon clients can respond (accept/decline/paid only)
drop policy if exists "proposals_client_update" on public.proposals;
create policy "proposals_client_update"
  on public.proposals for update
  to anon
  using (true)
  with check (status in ('accepted', 'declined', 'paid'));

-- Authenticated admins can insert
drop policy if exists "proposals_admin_insert" on public.proposals;
create policy "proposals_admin_insert"
  on public.proposals for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Authenticated admins can update anything
drop policy if exists "proposals_admin_update" on public.proposals;
create policy "proposals_admin_update"
  on public.proposals for update
  to authenticated
  using (true);

-- Admins can delete
drop policy if exists "proposals_admin_delete" on public.proposals;
create policy "proposals_admin_delete"
  on public.proposals for delete
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
