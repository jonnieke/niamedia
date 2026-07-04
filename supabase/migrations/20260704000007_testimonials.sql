create table if not exists public.testimonials (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid references public.projects(id) on delete set null,
  business_name text not null,
  contact_name  text,
  email         text,
  industry      text,
  rating        smallint not null check (rating between 1 and 5),
  body          text not null,
  video_length  text,
  approved      boolean not null default false,
  featured      boolean not null default false,
  created_at    timestamptz default now()
);

alter table public.testimonials enable row level security;

-- Public read: only approved testimonials
create policy "public_read_approved" on public.testimonials
  for select using (approved = true);

-- Anyone can insert (client submits from delivery page)
create policy "client_insert" on public.testimonials
  for insert with check (true);

-- Admin: full access
create policy "admin_all" on public.testimonials
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create index if not exists idx_testimonials_project on public.testimonials(project_id);
create index if not exists idx_testimonials_approved on public.testimonials(approved);
