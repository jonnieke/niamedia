-- The role-escalation guard added in 20260706000001 fires on every
-- update regardless of caller, including trusted direct-SQL/service-role
-- sessions that have no auth.uid() (migrations, the Supabase SQL editor,
-- `supabase db query --linked`). Those are already outside the app's RLS
-- boundary, so only enforce the admin check when there is an actual
-- authenticated end-user session making the request.

create or replace function public.prevent_role_self_escalation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'Only admins can change role';
  end if;
  return new;
end;
$$;
