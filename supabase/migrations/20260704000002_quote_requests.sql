-- Phase 18: Public video quote requests
create table if not exists public.quote_requests (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz default now(),

  -- Contact
  business_name    text not null,
  contact_name     text,
  phone            text not null,
  email            text,
  industry         text,

  -- Video spec
  video_length     text not null,
  platforms        text[] not null default '{}',
  what_to_promote  text,
  delivery_speed   text not null default 'standard',
  include_poster   boolean default true,
  include_subtitles boolean default false,

  -- Calculated quote
  price_min        integer not null,
  price_max        integer not null,

  -- CRM
  status           text not null default 'new',
  admin_notes      text
);

alter table public.quote_requests enable row level security;

-- Anyone (anon or signed-in) can submit a quote
drop policy if exists "Public can insert quote_requests" on public.quote_requests;
create policy "Public can insert quote_requests"
  on public.quote_requests for insert
  to anon, authenticated
  with check (true);

-- Only admins can read quotes
drop policy if exists "Admins can view quote_requests" on public.quote_requests;
create policy "Admins can view quote_requests"
  on public.quote_requests for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Only admins can update status / notes
drop policy if exists "Admins can update quote_requests" on public.quote_requests;
create policy "Admins can update quote_requests"
  on public.quote_requests for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
