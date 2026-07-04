-- Phase 20: AI Video Brief + Client Approval
create table if not exists public.video_briefs (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  token               text unique not null default encode(extensions.gen_random_bytes(16), 'hex'),

  -- Source
  proposal_id         uuid references public.proposals(id) on delete cascade,

  -- Brief snapshot (denormalized for speed)
  business_name       text not null,
  video_length        text not null,
  platforms           text[] default '{}',
  what_to_promote     text,
  delivery_speed      text default 'standard',

  -- AI-generated content
  script              text,
  shot_list           jsonb default '[]',
  music_mood          text,
  voiceover_notes     text,
  visual_style        text,

  -- Status: generating | ready | approved | revision_requested
  status              text not null default 'generating',

  -- Client response
  client_feedback     text,
  approved_at         timestamptz,

  -- Admin
  admin_notes         text,
  created_by          uuid references public.profiles(id) on delete set null
);

alter table public.video_briefs enable row level security;

-- Public can view briefs (token-gated at app level)
drop policy if exists "briefs_public_select" on public.video_briefs;
create policy "briefs_public_select"
  on public.video_briefs for select
  to anon, authenticated
  using (true);

-- Anon clients can respond (approve / request changes)
drop policy if exists "briefs_client_update" on public.video_briefs;
create policy "briefs_client_update"
  on public.video_briefs for update
  to anon
  using (true)
  with check (status in ('approved', 'revision_requested'));

-- Admins can insert and update anything
drop policy if exists "briefs_admin_insert" on public.video_briefs;
create policy "briefs_admin_insert"
  on public.video_briefs for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "briefs_admin_update" on public.video_briefs;
create policy "briefs_admin_update"
  on public.video_briefs for update
  to authenticated
  using (true);

drop policy if exists "briefs_admin_delete" on public.video_briefs;
create policy "briefs_admin_delete"
  on public.video_briefs for delete
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
