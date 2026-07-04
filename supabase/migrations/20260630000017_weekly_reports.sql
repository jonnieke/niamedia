-- Weekly Reports: profile settings + report storage

alter table public.profiles
  add column if not exists weekly_report_enabled boolean not null default false,
  add column if not exists weekly_report_phone text;

create table if not exists public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_token text not null unique default encode(extensions.gen_random_bytes(18), 'base64'),
  period_start date not null,
  period_end date not null,
  stats jsonb not null default '{}',
  narrative text not null default '',
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.weekly_reports enable row level security;

drop policy if exists "Users manage own reports" on public.weekly_reports;
create policy "Users manage own reports" on public.weekly_reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Reports public by token" on public.weekly_reports;
create policy "Reports public by token" on public.weekly_reports
  for select using (true);

create index if not exists weekly_reports_user_idx on public.weekly_reports (user_id, created_at desc);
create index if not exists weekly_reports_token_idx on public.weekly_reports (report_token);

-- pg_cron: fire every Monday at 7 AM EAT (4 AM UTC)
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('send-weekly-reports');
  end if;
exception when others then null;
end;
$$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'send-weekly-reports',
      '0 4 * * 1',
      $cron$
        select net.http_post(
          url := current_setting('app.supabase_url', true) || '/functions/v1/send-weekly-reports',
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
