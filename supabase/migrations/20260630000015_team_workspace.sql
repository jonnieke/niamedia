-- Phase 12C: Team Workspace & Invites

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  member_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('admin', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  unique(owner_id, member_id)
);
alter table public.team_members enable row level security;
create policy "Owner manages team members" on public.team_members
  for all using (auth.uid() = owner_id);
create policy "Member sees own membership" on public.team_members
  for select using (auth.uid() = member_id);

create table if not exists public.team_invites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  owner_name text not null default '',
  email text not null,
  role text not null default 'editor' check (role in ('admin', 'editor', 'viewer')),
  token text not null unique default encode(extensions.gen_random_bytes(18), 'base64'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.team_invites enable row level security;
create policy "Owner manages own invites" on public.team_invites
  for all using (auth.uid() = owner_id);
-- Public read by token (for accept page — no auth needed)
create policy "Accept invite by token" on public.team_invites
  for select using (true);

-- Helper: is current user a team member of this owner?
create or replace function public.is_team_member_of(p_owner_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.team_members
    where owner_id = p_owner_id and member_id = auth.uid()
  )
$$;

-- Allow team members to read the owner's campaigns, leads, brand_kits
create policy "Team members view campaigns" on public.campaigns
  for select using (public.is_team_member_of(user_id));

create policy "Team members view leads" on public.leads
  for select using (public.is_team_member_of(user_id));

create policy "Team members view brand_kits" on public.brand_kits
  for select using (public.is_team_member_of(user_id));

-- Editors can also insert/update campaigns and leads
create policy "Team editors manage campaigns" on public.campaigns
  for all using (
    exists (select 1 from public.team_members where owner_id = campaigns.user_id and member_id = auth.uid() and role in ('admin', 'editor'))
  );

create policy "Team editors manage leads" on public.leads
  for all using (
    exists (select 1 from public.team_members where owner_id = leads.user_id and member_id = auth.uid() and role in ('admin', 'editor'))
  );
