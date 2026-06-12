-- Fix: driver onboarding rejected with driver_role_required when the profile role
-- drifted out of sync (e.g. profiles.role = 'traveler' even though the account
-- registered as a driver). Make submit_driver_onboarding self-heal: if the auth
-- metadata says 'driver', repair profiles.role and proceed so the verification
-- actually reaches the admin queue.

create or replace function public.submit_driver_onboarding(
  p_car_model text,
  p_plate_number text,
  p_seats integer,
  p_driver_license_url text default null,
  p_vehicle_certificate_url text default null,
  p_vehicle_photo_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_meta_role text;
  saved_driver public.driver_profiles%rowtype;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_profile from public.profiles where id = current_user_id;
  if v_profile.id is null then
    raise exception 'profile_not_found';
  end if;
  if v_profile.is_suspended then
    raise exception 'account_suspended';
  end if;

  select raw_user_meta_data->>'role' into v_meta_role
  from auth.users where id = current_user_id;

  -- Admins never onboard as drivers; otherwise allow if the profile is a driver
  -- OR the account registered as a driver (metadata) — repairing drifted roles.
  if v_profile.role = 'admin' then
    raise exception 'driver_role_required';
  end if;
  if v_profile.role <> 'driver' and coalesce(v_meta_role, '') <> 'driver' then
    raise exception 'driver_role_required';
  end if;

  if nullif(btrim(p_car_model), '') is null then raise exception 'car_model_required'; end if;
  if nullif(btrim(p_plate_number), '') is null then raise exception 'plate_number_required'; end if;
  if p_seats is null or p_seats < 1 or p_seats > 12 then raise exception 'invalid_seat_count'; end if;
  if nullif(btrim(p_driver_license_url), '') is null then raise exception 'driver_license_required'; end if;
  if nullif(btrim(p_vehicle_certificate_url), '') is null then raise exception 'vehicle_certificate_required'; end if;
  if nullif(btrim(p_vehicle_photo_url), '') is null then raise exception 'vehicle_photo_required'; end if;

  perform set_config('app.guard_bypass', 'on', true);

  -- Repair a drifted role so the rest of the app treats this account as a driver.
  if v_profile.role <> 'driver' then
    update public.profiles set role = 'driver', updated_at = now() where id = current_user_id;
  end if;

  insert into public.driver_profiles (
    user_id, verification_status, car_model, plate_number, seats,
    driver_license_url, vehicle_certificate_url, vehicle_photo_url,
    reviewed_by, reviewed_at, rejection_reason
  )
  values (
    current_user_id, 'pending', btrim(p_car_model), upper(btrim(p_plate_number)), p_seats,
    btrim(p_driver_license_url), btrim(p_vehicle_certificate_url), btrim(p_vehicle_photo_url),
    null, null, null
  )
  on conflict (user_id) do update
    set verification_status = 'pending',
        car_model = excluded.car_model,
        plate_number = excluded.plate_number,
        seats = excluded.seats,
        driver_license_url = excluded.driver_license_url,
        vehicle_certificate_url = excluded.vehicle_certificate_url,
        vehicle_photo_url = excluded.vehicle_photo_url,
        reviewed_by = null,
        reviewed_at = null,
        rejection_reason = null,
        updated_at = now()
  returning * into saved_driver;

  update public.profiles
  set onboarding_completed = true, updated_at = now()
  where id = current_user_id;

  perform set_config('app.guard_bypass', 'off', true);

  return jsonb_build_object(
    'verification_status', saved_driver.verification_status,
    'car_model', saved_driver.car_model,
    'plate_number', saved_driver.plate_number,
    'seats', saved_driver.seats,
    'onboarding_completed', true
  );
end;
$$;

revoke all on function public.submit_driver_onboarding(text, text, integer, text, text, text) from public;
grant execute on function public.submit_driver_onboarding(text, text, integer, text, text, text) to authenticated;
