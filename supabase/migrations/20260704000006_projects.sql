-- Projects table: tracks production lifecycle after proposal is accepted/paid
create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  token         text unique not null default encode(gen_random_bytes(24), 'base64url'),
  proposal_id   uuid references public.proposals(id) on delete set null,
  brief_id      uuid references public.video_briefs(id) on delete set null,

  -- Client info (denormalized for quick access)
  business_name text not null,
  contact_name  text,
  email         text,
  phone         text,

  -- Video spec
  video_length  text,
  platforms     text[],

  -- Production
  status        text not null default 'in_production'
                check (status in ('in_production','review','delivered','completed','cancelled')),
  editor_notes  text,
  deliverable_url text,       -- final video link (Google Drive, WeTransfer, Vimeo, etc.)
  deliverable_label text,     -- e.g. "Final Cut — 30s TikTok"
  thumbnail_url text,

  -- Payment
  final_price   numeric(12,2),
  deposit_paid  numeric(12,2),
  balance_due   numeric(12,2),
  pesapal_order_id text,
  balance_paid_at timestamptz,

  -- Timestamps
  due_date      date,
  delivered_at  timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Trigger: keep updated_at fresh
create or replace function public.set_projects_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_projects_updated_at();

-- RLS
alter table public.projects enable row level security;

-- Public: read project by token (delivery page)
create policy "public_read_project_by_token" on public.projects
  for select using (true);

-- Public: client can update status to 'completed' and set pesapal_order_id
create policy "client_update_project" on public.projects
  for update using (true)
  with check (status in ('completed') or pesapal_order_id is not null);

-- Admin: full access
create policy "admin_all_projects" on public.projects
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Index for token lookup (delivery page)
create index if not exists idx_projects_token on public.projects(token);
create index if not exists idx_projects_proposal on public.projects(proposal_id);
create index if not exists idx_projects_status on public.projects(status);
