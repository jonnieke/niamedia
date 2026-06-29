-- Lead follow-up drip table
create table if not exists public.lead_follow_ups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  campaign_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  sequence_number int not null,     -- 1, 2, or 3
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  status text not null default 'pending', -- pending | sent | failed | skipped
  created_at timestamptz not null default now()
);

create index if not exists lead_follow_ups_pending_idx
  on public.lead_follow_ups (scheduled_at)
  where status = 'pending';

create index if not exists lead_follow_ups_lead_idx
  on public.lead_follow_ups (lead_id);

alter table public.lead_follow_ups enable row level security;

create policy "Users see own follow-ups"
  on public.lead_follow_ups for select
  using (auth.uid() = user_id);

-- Schedule process-follow-ups every 15 minutes via pg_cron + pg_net.
-- If cron extension is not available (Free plan), schedule manually from
-- Supabase dashboard → Edge Functions → process-follow-ups → Schedule.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'process-lead-followups',
      '*/15 * * * *',
      $cron$
        select net.http_post(
          url := 'https://toeanytckprebwuxgkcd.supabase.co/functions/v1/process-follow-ups',
          headers := '{"Content-Type": "application/json", "x-cron-secret": "nia-cron-2026"}'::jsonb,
          body := '{}'::jsonb
        )
      $cron$
    );
  end if;
end $$;
