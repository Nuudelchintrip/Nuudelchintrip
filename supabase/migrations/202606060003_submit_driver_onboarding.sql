-- Save the driver's initial vehicle and verification data atomically.
-- The authenticated user can only submit onboarding for their own driver profile.

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
  current_role public.user_role;
  saved_driver public.driver_profiles%rowtype;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select role
  into current_role
  from public.profiles
  where id = current_user_id
    and is_suspended = false;

  if current_role is null then
    raise exception 'profile_not_found';
  end if;

  if current_role <> 'driver' then
    raise exception 'driver_role_required';
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
