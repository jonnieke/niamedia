create table if not exists public.client_intakes (
  id                    uuid primary key default gen_random_uuid(),
  token                 text unique not null default encode(extensions.gen_random_bytes(16), 'base64url'),
  created_at            timestamptz default now(),

  -- Contact
  business_name         text not null,
  contact_name          text not null,
  phone                 text not null,
  email                 text,
  industry              text,

  -- Video spec
  video_length          text not null,
  platforms             text[] not null default '{}',
  what_to_promote       text not null,
  delivery_speed        text not null default 'standard',
  include_poster        boolean default false,
  include_subtitles     boolean default false,

  -- Creative brief
  target_audience       text,
  offer_hook            text,
  call_to_action        text,
  tone                  text default 'Professional',
  reference_urls        text[] default '{}',
  extra_notes           text,

  -- Budget & timeline
  budget_range          text,  -- 'under-30k' | '30k-60k' | '60k-120k' | '120k+'
  timeline              text,  -- 'urgent' | 'standard' | 'relaxed'

  -- CRM
  status                text not null default 'new'
                        check (status in ('new', 'reviewed', 'converted', 'declined')),
  admin_notes           text,
  converted_to          uuid references public.proposals(id) on delete set null
);

alter table public.client_intakes enable row level security;

-- Anyone can submit an intake (public page)
drop policy if exists "intake_public_insert" on public.client_intakes;
create policy "intake_public_insert" on public.client_intakes
  for insert with check (true);

-- Admins can do everything
drop policy if exists "intake_admin_all" on public.client_intakes;
create policy "intake_admin_all" on public.client_intakes
  for all to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create index if not exists idx_intakes_status  on public.client_intakes(status, created_at desc);
create index if not exists idx_intakes_token   on public.client_intakes(token);
