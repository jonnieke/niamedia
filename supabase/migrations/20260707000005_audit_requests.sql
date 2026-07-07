-- Homepage "free digital storefront audit" lead capture form.
create table if not exists public.audit_requests (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz default now(),
  name              text not null,
  business_name     text not null,
  whatsapp_number   text not null,
  website_or_social text,
  status            text not null default 'new',
  admin_notes       text
);

alter table public.audit_requests enable row level security;

drop policy if exists "Public can insert audit_requests" on public.audit_requests;
create policy "Public can insert audit_requests"
  on public.audit_requests for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Admins can view audit_requests" on public.audit_requests;
create policy "Admins can view audit_requests"
  on public.audit_requests for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "Admins can update audit_requests" on public.audit_requests;
create policy "Admins can update audit_requests"
  on public.audit_requests for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create index if not exists idx_audit_requests_created on public.audit_requests(created_at desc);
