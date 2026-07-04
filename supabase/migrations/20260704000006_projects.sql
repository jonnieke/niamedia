-- Projects table: tracks production lifecycle after proposal is accepted/paid
-- If the table already exists (older schema with project_status enum), migrate it.

do $$
begin
  -- Create fresh if not exists
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'projects') then
    create table public.projects (
      id               uuid primary key default gen_random_uuid(),
      token            text unique not null default encode(extensions.gen_random_bytes(24), 'base64url'),
      proposal_id      uuid,
      brief_id         uuid,
      business_name    text not null default '',
      contact_name     text,
      email            text,
      phone            text,
      video_length     text,
      platforms        text[],
      status           text not null default 'in_production',
      editor_notes     text,
      deliverable_url  text,
      deliverable_label text,
      thumbnail_url    text,
      final_price      numeric(12,2),
      deposit_paid     numeric(12,2),
      balance_due      numeric(12,2),
      pesapal_order_id text,
      balance_paid_at  timestamptz,
      due_date         date,
      delivered_at     timestamptz,
      completed_at     timestamptz,
      created_at       timestamptz default now(),
      updated_at       timestamptz default now()
    );
  end if;
end;
$$;

-- Convert status column from enum to text if needed
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'projects'
      and column_name = 'status' and data_type = 'USER-DEFINED'
  ) then
    -- Drop any check constraints on status first
    alter table public.projects
      alter column status type text using status::text;
  end if;
end;
$$;

-- Drop old check constraint (if any) and add the correct one
alter table public.projects
  drop constraint if exists projects_status_check;

alter table public.projects
  add constraint projects_status_check
  check (status in ('in_production','review','delivered','completed','cancelled'));

-- Add Phase 21 columns (all idempotent)
alter table public.projects
  add column if not exists token            text unique default encode(extensions.gen_random_bytes(24), 'base64url'),
  add column if not exists proposal_id      uuid,
  add column if not exists brief_id         uuid,
  add column if not exists business_name    text not null default '',
  add column if not exists contact_name     text,
  add column if not exists email            text,
  add column if not exists phone            text,
  add column if not exists video_length     text,
  add column if not exists platforms        text[],
  add column if not exists editor_notes     text,
  add column if not exists deliverable_url  text,
  add column if not exists deliverable_label text,
  add column if not exists thumbnail_url    text,
  add column if not exists final_price      numeric(12,2),
  add column if not exists deposit_paid     numeric(12,2),
  add column if not exists balance_due      numeric(12,2),
  add column if not exists pesapal_order_id text,
  add column if not exists balance_paid_at  timestamptz,
  add column if not exists due_date         date,
  add column if not exists delivered_at     timestamptz,
  add column if not exists completed_at     timestamptz,
  add column if not exists updated_at       timestamptz default now();

-- FK constraints (skip if already exist or referencing tables don't exist yet)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public' and table_name = 'projects'
      and constraint_name = 'projects_proposal_id_fkey'
  ) and exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'proposals'
  ) then
    alter table public.projects
      add constraint projects_proposal_id_fkey
      foreign key (proposal_id) references public.proposals(id) on delete set null;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public' and table_name = 'projects'
      and constraint_name = 'projects_brief_id_fkey'
  ) and exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'video_briefs'
  ) then
    alter table public.projects
      add constraint projects_brief_id_fkey
      foreign key (brief_id) references public.video_briefs(id) on delete set null;
  end if;
end;
$$;

-- Trigger: keep updated_at fresh
create or replace function public.set_projects_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

do $$
begin
  if not exists (
    select 1 from information_schema.triggers
    where event_object_schema = 'public'
      and event_object_table = 'projects'
      and trigger_name = 'trg_projects_updated_at'
  ) then
    create trigger trg_projects_updated_at
      before update on public.projects
      for each row execute function public.set_projects_updated_at();
  end if;
end;
$$;

-- RLS
alter table public.projects enable row level security;

drop policy if exists "public_read_project_by_token" on public.projects;
create policy "public_read_project_by_token" on public.projects
  for select using (true);

drop policy if exists "client_update_project" on public.projects;
create policy "client_update_project" on public.projects
  for update using (true)
  with check (status::text in ('completed') or pesapal_order_id is not null);

drop policy if exists "admin_all_projects" on public.projects;
create policy "admin_all_projects" on public.projects
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Drop enum type if no longer used
drop type if exists public.project_status cascade;

-- Indexes
create index if not exists idx_projects_token    on public.projects(token);
create index if not exists idx_projects_proposal on public.projects(proposal_id);
create index if not exists idx_projects_status   on public.projects(status);
