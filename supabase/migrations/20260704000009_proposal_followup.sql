-- Track follow-up reminders on proposals
alter table public.proposals
  add column if not exists reminder_sent_at timestamptz,
  add column if not exists reminder_count    smallint not null default 0;
