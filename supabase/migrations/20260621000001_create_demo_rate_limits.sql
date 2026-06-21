create table if not exists demo_rate_limits (
  key text primary key,
  count integer not null default 1,
  last_used timestamptz not null default now()
);
