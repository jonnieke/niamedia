-- The projects table originally required user_id (a project always
-- belonged to a registered platform user). The Phase 21 redesign moved
-- client delivery to public token-based links (/delivery/:token) so
-- admins can create a project for a client who has no account yet —
-- but the NOT NULL constraint was never relaxed, so every insert from
-- the Production board failed with "null value in column user_id
-- violates not-null constraint".

alter table public.projects
  alter column user_id drop not null;
