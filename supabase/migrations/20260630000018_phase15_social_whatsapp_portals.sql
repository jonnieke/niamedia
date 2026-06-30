-- Phase 15: Social Publisher, WhatsApp AI Responder, Client Portals

-- ── Social connections (OAuth tokens per platform / page) ────────
create table if not exists public.social_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('facebook', 'instagram')),
  page_id text not null,
  page_name text,
  instagram_account_id text,
  access_token text not null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, platform, page_id)
);
alter table public.social_connections enable row level security;
create policy "Users manage own connections" on public.social_connections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists social_connections_user_idx on public.social_connections (user_id);

-- ── Scheduled social posts ───────────────────────────────────────
create table if not exists public.scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  calendar_item_id uuid references public.content_calendar(id) on delete set null,
  connection_id uuid references public.social_connections(id) on delete set null,
  platform text not null,
  page_id text,
  content text not null,
  media_url text,
  scheduled_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'publishing', 'published', 'failed')),
  post_id text,
  error_message text,
  metrics jsonb not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.scheduled_posts enable row level security;
create policy "Users manage own scheduled posts" on public.scheduled_posts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists scheduled_posts_user_idx on public.scheduled_posts (user_id);
create index if not exists scheduled_posts_status_idx on public.scheduled_posts (status, scheduled_at);

-- ── WhatsApp AI Responder ────────────────────────────────────────
alter table public.profiles
  add column if not exists whatsapp_business_number text,
  add column if not exists ai_responder_enabled boolean not null default false,
  add column if not exists ai_responder_greeting text default 'Hi! Thanks for reaching out. I''d love to help. Could you tell me what you''re looking for?';

create table if not exists public.whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  lead_phone text not null,
  lead_name text,
  messages jsonb not null default '[]',
  ai_paused boolean not null default false,
  unread_count integer not null default 0,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  unique(user_id, lead_phone)
);
alter table public.whatsapp_conversations enable row level security;
create policy "Users manage own conversations" on public.whatsapp_conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists whatsapp_conv_user_idx on public.whatsapp_conversations (user_id, last_message_at desc);
create index if not exists whatsapp_conv_phone_idx on public.whatsapp_conversations (user_id, lead_phone);

-- ── Client Portals ───────────────────────────────────────────────
create table if not exists public.client_portals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null,
  client_email text,
  portal_token text not null unique default encode(extensions.gen_random_bytes(18), 'base64'),
  logo_url text,
  brand_color text not null default '#7c3aed',
  welcome_message text not null default '',
  hide_branding boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.client_portals enable row level security;
create policy "Owners manage own portals" on public.client_portals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Anyone can view active portals" on public.client_portals
  for select using (is_active = true);
create index if not exists client_portals_user_idx on public.client_portals (user_id);
create index if not exists client_portals_token_idx on public.client_portals (portal_token);

-- Portal → Campaign join
create table if not exists public.portal_campaigns (
  id uuid primary key default gen_random_uuid(),
  portal_id uuid not null references public.client_portals(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  added_at timestamptz not null default now(),
  unique(portal_id, campaign_id)
);
alter table public.portal_campaigns enable row level security;
create policy "Portal owner manages campaign links" on public.portal_campaigns
  for all using (
    exists (select 1 from public.client_portals p where p.id = portal_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.client_portals p where p.id = portal_id and p.user_id = auth.uid())
  );
create policy "Anyone can view portal campaign links" on public.portal_campaigns
  for select using (true);

-- Client comments on campaigns in portal
create table if not exists public.portal_comments (
  id uuid primary key default gen_random_uuid(),
  portal_id uuid not null references public.client_portals(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  author_name text not null,
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.portal_comments enable row level security;
create policy "Portal owner reads comments" on public.portal_comments
  for select using (
    exists (select 1 from public.client_portals p where p.id = portal_id and p.user_id = auth.uid())
  );
create policy "Anyone can post a comment" on public.portal_comments
  for insert with check (true);
create policy "Anyone can read portal comments" on public.portal_comments
  for select using (true);
create index if not exists portal_comments_portal_idx on public.portal_comments (portal_id, created_at desc);

-- pg_cron: publish scheduled social posts every 15 minutes
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'publish-scheduled-posts',
      '*/15 * * * *',
      $cron$
        select net.http_post(
          url := current_setting('app.supabase_url', true) || '/functions/v1/schedule-posts',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.cron_secret', true)
          ),
          body := '{}'::jsonb
        )
      $cron$
    );
  end if;
end;
$$;
