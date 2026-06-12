-- Mark the authenticated user's phone as verified and return the current profile.
-- The real SMS webhook can call the same profile update later.

create or replace function public.complete_phone_verification()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  auth_user auth.users%rowtype;
  requested_role public.user_role := 'traveler';
  metadata_role text;
  profile_row public.profiles%rowtype;
  driver_status public.driver_verification_status;
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

  metadata_role := auth_user.raw_user_meta_data->>'role';
  if metadata_role in ('traveler', 'driver', 'cargo_sender') then
    requested_role := metadata_role::public.user_role;
  end if;

  insert into public.profiles (
    id,
    role,
    full_name,
    phone,
    email,
    phone_verified
  )
  values (
    auth_user.id,
    requested_role,
    coalesce(
      nullif(auth_user.raw_user_meta_data->>'full_name', ''),
      split_part(coalesce(auth_user.email, ''), '@', 1)
    ),
    coalesce(
      nullif(auth_user.raw_user_meta_data->>'phone', ''),
      auth_user.phone
    ),
    auth_user.email,
    true
  )
  on conflict (id) do update
    set phone_verified = true,
        email = coalesce(excluded.email, public.profiles.email),
        phone = coalesce(public.profiles.phone, excluded.phone),
        full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
        role = case
          when public.profiles.role = 'admin' or public.profiles.onboarding_completed
            then public.profiles.role
          else excluded.role
        end,
        updated_at = now()
  returning * into profile_row;

  if profile_row.role = 'driver' then
    select verification_status
    into driver_status
    from public.driver_profiles
    where user_id = current_user_id;
  end if;

  return jsonb_build_object(
    'role', profile_row.role,
    'full_name', profile_row.full_name,
    'phone', profile_row.phone,
    'email', profile_row.email,
    'phone_verified', profile_row.phone_verified,
    'onboarding_completed', profile_row.onboarding_completed,
    'cargo_policy_accepted', profile_row.cargo_policy_accepted,
    'verification_status', driver_status
  );
end;
$$;

revoke all on function public.complete_phone_verification() from public;
grant execute on function public.complete_phone_verification() to authenticated;
