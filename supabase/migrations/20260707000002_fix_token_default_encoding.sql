-- Postgres's encode() has no 'base64url' encoding (only 'base64', 'hex',
-- 'escape') — every insert into projects/retainers/client_intakes that
-- relied on the token column's default was failing outright with
-- "unrecognized encoding: base64url". This blocked admins from ever
-- creating a new project, retainer, or client intake through the app.
-- Hex is inherently URL-safe, so no further encoding work is needed.

alter table public.projects
  alter column token set default encode(extensions.gen_random_bytes(24), 'hex');

alter table public.retainers
  alter column token set default encode(extensions.gen_random_bytes(16), 'hex');

alter table public.client_intakes
  alter column token set default encode(extensions.gen_random_bytes(16), 'hex');
