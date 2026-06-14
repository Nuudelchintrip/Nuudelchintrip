-- Repair helper for existing Auth users that do not have a matching public.profiles row.
-- Safe to run multiple times.

create or replace function public.ensure_current_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  auth_user auth.users%rowtype;
  requested_role public.user_role;
  profile_row public.profiles%rowtype;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select *
  into auth_user
  from auth.users
  where id = current_user_id;

  if auth_user.id is null then
    raise exception 'auth_user_not_found';
  end if;

  begin
    requested_role := coalesce((auth_user.raw_user_meta_data->>'role')::public.user_role, 'traveler');
  exception when others then
    requested_role := 'traveler';
  end;

  insert into public.profiles (id, email, full_name, phone, role)
  values (
    auth_user.id,
    auth_user.email,
    coalesce(auth_user.raw_user_meta_data->>'full_name', ''),
    auth_user.raw_user_meta_data->>'phone',
    requested_role
  )
  on conflict (id) do update
    set email = coalesce(public.profiles.email, excluded.email),
        phone = coalesce(public.profiles.phone, excluded.phone),
        full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
        updated_at = now()
  returning * into profile_row;

  return profile_row;
end;
$$;

grant execute on function public.ensure_current_profile() to authenticated;
