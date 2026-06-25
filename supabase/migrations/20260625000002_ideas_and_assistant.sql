-- Ideas Bank + Nia Creative Assistant data model

-- ── ideas ────────────────────────────────────────────────────────────
create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand_kit_id uuid,
  title text not null default '',
  industry text not null default '',
  angle text not null default '',
  target_audience text not null default '',
  offer text not null default '',
  platforms text[] not null default '{}',
  notes text not null default '',
  status text not null default 'Draft',        -- Draft | Selected | In Campaign | Archived
  source text not null default 'Manual',        -- Assistant | Manual | Campaign Result
  favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ideas enable row level security;
create policy "Users manage own ideas" on public.ideas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists ideas_user_idx on public.ideas (user_id, created_at desc);

-- ── assistant_threads ────────────────────────────────────────────────
create table if not exists public.assistant_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  context_type text not null default 'general',  -- general | campaign | idea | brand_kit
  related_campaign_id uuid,
  related_idea_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.assistant_threads enable row level security;
create policy "Users manage own threads" on public.assistant_threads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── assistant_messages ───────────────────────────────────────────────
create table if not exists public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.assistant_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,                            -- user | assistant
  content text not null default '',
  structured_output jsonb,
  created_at timestamptz not null default now()
);
alter table public.assistant_messages enable row level security;
create policy "Users manage own messages" on public.assistant_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists assistant_messages_thread_idx on public.assistant_messages (thread_id, created_at);
