-- Repair a missing or stale profile role while submitting driver onboarding.
-- Only the authenticated user's non-privileged signup metadata can be used.

create or replace function public.submit_driver_onboarding(
  p_car_model text,
  p_plate_number text,
  p_seats integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  auth_user auth.users%rowtype;
  profile_row public.profiles%rowtype;
  metadata_role text;
  saved_driver public.driver_profiles%rowtype;
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

  select *
  into profile_row
  from public.profiles
  where id = current_user_id
  for update;

  if profile_row.id is null then
    if metadata_role <> 'driver' then
      raise exception 'driver_role_required';
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
      'driver',
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
    returning * into profile_row;
  elsif profile_row.role <> 'driver' then
    if profile_row.role = 'admin'
      or profile_row.onboarding_completed
      or metadata_role <> 'driver'
    then
      raise exception 'driver_role_required';
    end if;

    update public.profiles
    set role = 'driver',
        updated_at = now()
    where id = current_user_id
    returning * into profile_row;
  end if;

  if profile_row.is_suspended then
    raise exception 'account_suspended';
  end if;

  if nullif(btrim(p_car_model), '') is null then
    raise exception 'car_model_required';
  end if;

  if nullif(btrim(p_plate_number), '') is null then
    raise exception 'plate_number_required';
  end if;

  if p_seats is null or p_seats < 1 or p_seats > 12 then
    raise exception 'invalid_seat_count';
  end if;

  insert into public.driver_profiles (
    user_id,
    verification_status,
    car_model,
    plate_number,
    seats
  )
  values (
    current_user_id,
    'pending',
    btrim(p_car_model),
    upper(btrim(p_plate_number)),
    p_seats
  )
  on conflict (user_id) do update
    set verification_status = 'pending',
        car_model = excluded.car_model,
        plate_number = excluded.plate_number,
        seats = excluded.seats,
        updated_at = now()
  returning * into saved_driver;

  update public.profiles
  set onboarding_completed = true,
      updated_at = now()
  where id = current_user_id;

  return jsonb_build_object(
    'verification_status', saved_driver.verification_status,
    'car_model', saved_driver.car_model,
    'plate_number', saved_driver.plate_number,
    'seats', saved_driver.seats,
    'onboarding_completed', true
  );
end;
$$;

revoke all on function public.submit_driver_onboarding(text, text, integer) from public;
grant execute on function public.submit_driver_onboarding(text, text, integer) to authenticated;
