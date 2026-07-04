-- Phase 22: Public Portfolio
create table if not exists public.portfolio_items (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),

  title         text not null,
  type          text not null default 'video',   -- video | poster | campaign
  client_name   text,
  industry      text,
  description   text,
  thumbnail_url text,
  video_url     text,
  tags          text[] default '{}',
  featured      boolean default false,
  sort_order    integer default 0,
  published     boolean default true
);

alter table public.portfolio_items enable row level security;

-- Public can read published items
drop policy if exists "portfolio_public_select" on public.portfolio_items;
create policy "portfolio_public_select"
  on public.portfolio_items for select
  to anon, authenticated
  using (published = true);

-- Admins can do everything
drop policy if exists "portfolio_admin_all" on public.portfolio_items;
create policy "portfolio_admin_all"
  on public.portfolio_items for all
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
