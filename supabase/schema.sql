-- ============================================================
-- Nia Media — Supabase Database Schema  (idempotent — safe to re-run)
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── PROFILES ───────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  name        text not null default '',
  role        text not null default 'user' check (role in ('user', 'admin')),
  created_at  timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Security definer function for admin check — avoids RLS infinite recursion
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

alter table public.profiles enable row level security;
drop policy if exists "Users can view their own profile"   on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Admins can view all profiles"       on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles"
  on public.profiles for select using (public.is_admin());

-- ─── BRAND KITS ─────────────────────────────────────────────
create table if not exists public.brand_kits (
  id                   uuid primary key default uuid_generate_v4(),
  user_id              uuid not null references public.profiles(id) on delete cascade,
  business_name        text not null default '',
  tagline              text default '',
  primary_color        text default '#8b5cf6',
  secondary_color      text default '#3b82f6',
  accent_color         text default '#10b981',
  font                 text default 'inter',
  phone                text default '',
  whatsapp             text default '',
  website              text default '',
  instagram            text default '',
  facebook             text default '',
  tiktok               text default '',
  youtube              text default '',
  preferred_tone       text default '',
  target_customer      text default '',
  business_description text default '',
  logo_url             text,
  updated_at           timestamptz not null default now(),
  constraint brand_kits_user_unique unique (user_id)
);

alter table public.brand_kits enable row level security;
drop policy if exists "Users manage their own brand kit"  on public.brand_kits;
drop policy if exists "Admins can view all brand kits"    on public.brand_kits;
create policy "Users manage their own brand kit"
  on public.brand_kits for all using (auth.uid() = user_id);
create policy "Admins can view all brand kits"
  on public.brand_kits for select
  using (public.is_admin());

-- ─── CAMPAIGNS ──────────────────────────────────────────────
create table if not exists public.campaigns (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  type        text not null,
  content     text,
  metadata    jsonb default '{}',
  created_at  timestamptz not null default now()
);

alter table public.campaigns enable row level security;
drop policy if exists "Users manage their own campaigns" on public.campaigns;
drop policy if exists "Admins view all campaigns"        on public.campaigns;
create policy "Users manage their own campaigns"
  on public.campaigns for all using (auth.uid() = user_id);
create policy "Admins view all campaigns"
  on public.campaigns for select
  using (public.is_admin());

-- ─── PROJECTS ───────────────────────────────────────────────
do $$ begin
  create type project_status as enum (
    'queued', 'in-production', 'ready-for-review',
    'revision-requested', 'accepted', 'delivered'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.projects (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  title             text not null,
  type              text not null,
  package           text not null,
  status            project_status not null default 'queued',
  creator_name      text default 'Nia Media Team',
  deliverable_thumb text,
  deliverable_url   text,
  brief             text,
  rights            text default 'All rights transfer to you upon acceptance and payment confirmation.',
  max_iterations    int not null default 3,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.projects enable row level security;
drop policy if exists "Users view their own projects" on public.projects;
drop policy if exists "Admins manage all projects"    on public.projects;
create policy "Users view their own projects"
  on public.projects for select using (auth.uid() = user_id);
create policy "Admins manage all projects"
  on public.projects for all
  using (public.is_admin());

-- ─── PROJECT REVISIONS ──────────────────────────────────────
create table if not exists public.project_revisions (
  id           uuid primary key default uuid_generate_v4(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  iteration    int not null,
  notes        text,
  file_url     text,
  requested_at timestamptz not null default now()
);

alter table public.project_revisions enable row level security;
drop policy if exists "Users view their own revisions" on public.project_revisions;
drop policy if exists "Admins manage all revisions"    on public.project_revisions;
create policy "Users view their own revisions"
  on public.project_revisions for select
  using (exists (select 1 from public.projects where id = project_id and user_id = auth.uid()));
create policy "Admins manage all revisions"
  on public.project_revisions for all
  using (public.is_admin());

-- ─── AUDIO ORDERS ───────────────────────────────────────────
do $$ begin
  create type audio_status as enum ('queued', 'in-production', 'ready-for-review', 'accepted', 'delivered');
exception when duplicate_object then null;
end $$;

create table if not exists public.audio_orders (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  title           text not null,
  audio_type      text not null,
  package         text not null,
  status          audio_status not null default 'queued',
  rush            boolean not null default false,
  brief           jsonb default '{}',
  price_kes       int,
  deliverable_url text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.audio_orders enable row level security;
drop policy if exists "Users view their own audio orders"   on public.audio_orders;
drop policy if exists "Users insert their own audio orders" on public.audio_orders;
drop policy if exists "Admins manage all audio orders"      on public.audio_orders;
create policy "Users view their own audio orders"
  on public.audio_orders for select using (auth.uid() = user_id);
create policy "Users insert their own audio orders"
  on public.audio_orders for insert with check (auth.uid() = user_id);
create policy "Admins manage all audio orders"
  on public.audio_orders for all
  using (public.is_admin());

-- ─── NOTIFICATIONS ──────────────────────────────────────────
create table if not exists public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  body        text not null,
  type        text default 'info',
  read        boolean not null default false,
  action_url  text,
  created_at  timestamptz not null default now()
);

alter table public.notifications enable row level security;
drop policy if exists "Users manage their own notifications"      on public.notifications;
drop policy if exists "Admins insert notifications for any user"  on public.notifications;
create policy "Users manage their own notifications"
  on public.notifications for all using (auth.uid() = user_id);
create policy "Admins insert notifications for any user"
  on public.notifications for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ─── PACKAGE REQUESTS ───────────────────────────────────────
create table if not exists public.package_requests (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references public.profiles(id) on delete set null,
  name       text not null,
  business   text not null,
  phone      text not null,
  email      text not null,
  industry   text not null default '',
  service    text not null,
  brief      jsonb not null default '{}',
  timeline   text default '',
  budget     text default '',
  status     text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.package_requests enable row level security;
drop policy if exists "Anyone can submit a package request"  on public.package_requests;
drop policy if exists "Users view their own requests"        on public.package_requests;
drop policy if exists "Admins manage all package requests"   on public.package_requests;
create policy "Anyone can submit a package request"
  on public.package_requests for insert with check (true);
create policy "Users view their own requests"
  on public.package_requests for select using (auth.uid() = user_id);
create policy "Admins manage all package requests"
  on public.package_requests for all using (public.is_admin());

-- ─── REFERRALS ──────────────────────────────────────────────
create table if not exists public.referrals (
  id            uuid primary key default uuid_generate_v4(),
  referrer_id   uuid not null references public.profiles(id) on delete cascade,
  referee_email text not null,
  referee_id    uuid references public.profiles(id) on delete set null,
  status        text not null default 'pending' check (status in ('pending', 'active', 'rewarded')),
  credit_kes    int not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.referrals enable row level security;
drop policy if exists "Users view their own referrals"  on public.referrals;
drop policy if exists "Admins manage all referrals"     on public.referrals;
create policy "Users view their own referrals"
  on public.referrals for select using (auth.uid() = referrer_id);
create policy "Admins manage all referrals"
  on public.referrals for all using (public.is_admin());

-- ─── Storage bucket: brand-assets ───────────────────────────
insert into storage.buckets (id, name, public)
values ('brand-assets', 'brand-assets', true)
on conflict (id) do nothing;

drop policy if exists "Users upload to their own folder" on storage.objects;
drop policy if exists "Users can update their own logo"  on storage.objects;
drop policy if exists "Anyone can read brand assets"     on storage.objects;
create policy "Users upload to their own folder"
  on storage.objects for insert
  with check (bucket_id = 'brand-assets' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can update their own logo"
  on storage.objects for update
  using (bucket_id = 'brand-assets' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Anyone can read brand assets"
  on storage.objects for select
  using (bucket_id = 'brand-assets');

-- ─── updated_at triggers ────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists brand_kits_updated_at   on public.brand_kits;
drop trigger if exists projects_updated_at     on public.projects;
drop trigger if exists audio_orders_updated_at on public.audio_orders;
create trigger brand_kits_updated_at   before update on public.brand_kits   for each row execute procedure public.set_updated_at();
create trigger projects_updated_at     before update on public.projects     for each row execute procedure public.set_updated_at();
create trigger audio_orders_updated_at before update on public.audio_orders for each row execute procedure public.set_updated_at();
