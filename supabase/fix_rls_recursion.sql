-- ─── Fix: RLS infinite recursion ────────────────────────────────────────────
-- The admin check (exists select from profiles) caused infinite recursion
-- because querying profiles triggers its own RLS policy which queries profiles…
-- Fix: wrap the check in a SECURITY DEFINER function that bypasses RLS.

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
$$;

-- profiles
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select using (public.is_admin());

-- brand_kits
drop policy if exists "Admins can view all brand kits" on public.brand_kits;
create policy "Admins can view all brand kits"
  on public.brand_kits for select using (public.is_admin());

-- campaigns
drop policy if exists "Admins view all campaigns" on public.campaigns;
create policy "Admins view all campaigns"
  on public.campaigns for select using (public.is_admin());

-- projects
drop policy if exists "Admins manage all projects" on public.projects;
create policy "Admins manage all projects"
  on public.projects for all using (public.is_admin());

-- project_revisions
drop policy if exists "Admins manage all revisions" on public.project_revisions;
create policy "Admins manage all revisions"
  on public.project_revisions for all using (public.is_admin());

-- audio_orders
drop policy if exists "Admins manage all audio orders" on public.audio_orders;
create policy "Admins manage all audio orders"
  on public.audio_orders for all using (public.is_admin());

-- notifications
drop policy if exists "Admins insert notifications for any user" on public.notifications;
create policy "Admins insert notifications for any user"
  on public.notifications for insert with check (public.is_admin());

-- Force PostgREST to reload its schema cache
notify pgrst, 'reload schema';
