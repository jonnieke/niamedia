-- Security fix: the "Users can update their own profile" RLS policy
-- (using auth.uid() = id) has no column restriction, so any authenticated
-- user could PATCH their own row's `role` column to 'admin' directly via
-- the REST API, bypassing the app UI entirely. A trigger is required
-- because a plain RLS "with check" cannot compare a row's old and new
-- values — only a trigger sees both.

create or replace function public.prevent_role_self_escalation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins can change role';
  end if;
  return new;
end;
$$;

drop trigger if exists on_profiles_role_change on public.profiles;
create trigger on_profiles_role_change
  before update on public.profiles
  for each row execute procedure public.prevent_role_self_escalation();
