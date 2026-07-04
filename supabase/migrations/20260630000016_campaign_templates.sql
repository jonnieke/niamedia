-- Campaign Template Library

create table if not exists public.campaign_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade, -- null = system template
  title text not null,
  industry text not null,
  objective text not null,
  tone text not null default 'Professional',
  description text not null default '',
  content jsonb,
  is_public boolean not null default false,
  use_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.campaign_templates enable row level security;

drop policy if exists "Public templates readable by all" on public.campaign_templates;
create policy "Public templates readable by all" on public.campaign_templates
  for select using (is_public = true or auth.uid() = user_id);

drop policy if exists "Users insert own templates" on public.campaign_templates;
create policy "Users insert own templates" on public.campaign_templates
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users update own templates" on public.campaign_templates;
create policy "Users update own templates" on public.campaign_templates
  for update using (auth.uid() = user_id);

drop policy if exists "Users delete own templates" on public.campaign_templates;
create policy "Users delete own templates" on public.campaign_templates
  for delete using (auth.uid() = user_id);

create index if not exists campaign_templates_industry_idx on public.campaign_templates (industry);
create index if not exists campaign_templates_user_idx on public.campaign_templates (user_id);
create index if not exists campaign_templates_public_idx on public.campaign_templates (is_public, use_count desc);

-- System templates (user_id = null so no RLS owner check applies; readable via is_public = true)
insert into public.campaign_templates
  (user_id, title, industry, objective, tone, description, is_public, content)
select null, 'Real Estate Listing', 'Real Estate', 'Generate property enquiries and site visit bookings', 'Professional',
   'Apartments, land, rentals, and property launches. Drives leads, site visits, and enquiries.', true,
   '{"productName":"[Property Name]","targetAudience":"Property buyers and investors in Nairobi","goal":"Generate site visit bookings and enquiries","tone":"professional","platforms":["Facebook","Instagram","WhatsApp"]}'
where not exists (select 1 from public.campaign_templates where title = 'Real Estate Listing' and user_id is null);

insert into public.campaign_templates
  (user_id, title, industry, objective, tone, description, is_public, content)
select null, 'Hotel Weekend Offer', 'Hospitality', 'Drive direct bookings and room enquiries', 'Warm',
   'Hotels, Airbnbs, resorts, and travel packages. Built to drive bookings and direct enquiries.', true,
   '{"productName":"[Hotel/Resort Name]","targetAudience":"Nairobi couples and families looking for a getaway","goal":"Drive direct bookings and WhatsApp enquiries","tone":"warm","platforms":["Instagram","Facebook","WhatsApp"]}'
where not exists (select 1 from public.campaign_templates where title = 'Hotel Weekend Offer' and user_id is null);

insert into public.campaign_templates
  (user_id, title, industry, objective, tone, description, is_public, content)
select null, 'School Admissions', 'Education', 'Generate parent enquiries and enrolment applications', 'Professional',
   'Schools, tutors, colleges, and edtech platforms. Drives enrolment and parent enquiries.', true,
   '{"productName":"[School Name]","targetAudience":"Parents of school-age children in Nairobi","goal":"Drive enrolment enquiries and open day visits","tone":"professional","platforms":["Facebook","WhatsApp","LinkedIn"]}'
where not exists (select 1 from public.campaign_templates where title = 'School Admissions' and user_id is null);

insert into public.campaign_templates
  (user_id, title, industry, objective, tone, description, is_public, content)
select null, 'SACCO / Loan Product', 'Fintech', 'Build trust and drive loan applications', 'Professional',
   'SACCOs, loans, insurance, savings, and mobile finance products. Builds trust and drives applications.', true,
   '{"productName":"[Product Name]","targetAudience":"Kenyans aged 25–45 seeking financial products","goal":"Drive loan applications and build financial trust","tone":"professional","platforms":["Facebook","LinkedIn","WhatsApp"]}'
where not exists (select 1 from public.campaign_templates where title = 'SACCO / Loan Product' and user_id is null);

insert into public.campaign_templates
  (user_id, title, industry, objective, tone, description, is_public, content)
select null, 'Restaurant Daily Offer', 'Restaurant', 'Drive foot traffic, orders, and reservations', 'Friendly',
   'Food promos, delivery, and lunch specials. High-conversion copy for local food businesses.', true,
   '{"productName":"[Restaurant Name]","targetAudience":"Nairobi lunch crowd and food lovers","goal":"Drive orders, deliveries, and dine-in reservations","tone":"friendly","platforms":["Instagram","TikTok","WhatsApp"]}'
where not exists (select 1 from public.campaign_templates where title = 'Restaurant Daily Offer' and user_id is null);

insert into public.campaign_templates
  (user_id, title, industry, objective, tone, description, is_public, content)
select null, 'Event / Concert Promo', 'Events', 'Sell tickets and drive event registrations', 'Exciting',
   'Launches, concerts, conferences, and community events. Urgency-driven copy for fast sales.', true,
   '{"productName":"[Event Name]","targetAudience":"Nairobi event-goers aged 20–40","goal":"Sell tickets and drive registrations","tone":"bold","platforms":["Instagram","Facebook","WhatsApp"]}'
where not exists (select 1 from public.campaign_templates where title = 'Event / Concert Promo' and user_id is null);

insert into public.campaign_templates
  (user_id, title, industry, objective, tone, description, is_public, content)
select null, 'Health & Wellness Clinic', 'Health', 'Generate client bookings and product enquiries', 'Warm',
   'Clinics, gyms, supplement brands, and wellness services. Trust-first copy that converts.', true,
   '{"productName":"[Clinic/Brand Name]","targetAudience":"Health-conscious Kenyans aged 25–50","goal":"Drive appointment bookings and product enquiries","tone":"warm","platforms":["Instagram","Facebook","WhatsApp"]}'
where not exists (select 1 from public.campaign_templates where title = 'Health & Wellness Clinic' and user_id is null);

insert into public.campaign_templates
  (user_id, title, industry, objective, tone, description, is_public, content)
select null, 'Retail Product Launch', 'Retail', 'Drive sales and create urgency around the launch offer', 'Bold',
   'New arrivals, seasonal offers, and clearance sales. Urgency-driven copy for fast results.', true,
   '{"productName":"[Product Name]","targetAudience":"Kenyan shoppers on Instagram and TikTok","goal":"Drive online and in-store product sales","tone":"bold","platforms":["Instagram","TikTok","WhatsApp"]}'
where not exists (select 1 from public.campaign_templates where title = 'Retail Product Launch' and user_id is null);

insert into public.campaign_templates
  (user_id, title, industry, objective, tone, description, is_public, content)
select null, 'Sunday Service Invite', 'Faith & Community', 'Drive attendance and community engagement', 'Warm',
   'Warm, welcoming copy for weekly services, special Sundays, and sermon series.', true,
   '{"productName":"[Church Name]","targetAudience":"Church community and seekers in Nairobi","goal":"Drive Sunday attendance and community growth","tone":"warm","platforms":["WhatsApp","Facebook","Instagram"]}'
where not exists (select 1 from public.campaign_templates where title = 'Sunday Service Invite' and user_id is null);

insert into public.campaign_templates
  (user_id, title, industry, objective, tone, description, is_public, content)
select null, 'Professional Services Firm', 'Services', 'Generate enquiries and position as the expert', 'Professional',
   'Law firms, accountants, consultants, and agencies. Credibility-first copy for B2B audiences.', true,
   '{"productName":"[Firm/Agency Name]","targetAudience":"Business owners and professionals in Nairobi","goal":"Generate service enquiries and establish authority","tone":"professional","platforms":["LinkedIn","Facebook","WhatsApp"]}'
where not exists (select 1 from public.campaign_templates where title = 'Professional Services Firm' and user_id is null);
