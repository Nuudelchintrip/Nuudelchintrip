-- Driver verification identity fields (хүйс, овог, регистр, төрсөн огноо).
--
--   1. profiles gains identity columns shared across roles:
--        gender ('male' | 'female'), last_name (овог), register_number (РД),
--        birth_date (төрсөн огноо — нас үүнээс тооцоологдоно).
--      gender lives on profiles because gender-matched rides (#5) need it for
--      travelers AND drivers, not just verified drivers.
--   2. submit_driver_onboarding extended to capture these during verification.
--      The drifting-role self-heal from 202606120003 is preserved.
--
-- Apply manually in Supabase SQL Editor.

-- ---------------------------------------------------------------------------
-- 1. Identity columns on profiles
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_gender as enum ('male', 'female');
exception when duplicate_object then null; end $$;

alter table public.profiles
  add column if not exists gender public.user_gender,
  add column if not exists last_name text,
  add column if not exists register_number text,
  add column if not exists birth_date date;

-- ---------------------------------------------------------------------------
-- 2. submit_driver_onboarding with identity capture
-- ---------------------------------------------------------------------------
create or replace function public.submit_driver_onboarding(
  p_car_model text,
  p_plate_number text,
  p_seats integer,
  p_driver_license_url text default null,
  p_vehicle_certificate_url text default null,
  p_vehicle_photo_url text default null,
  p_gender public.user_gender default null,
  p_last_name text default null,
  p_register_number text default null,
  p_birth_date date default null
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

  -- Identity verification fields
  if p_gender is null then raise exception 'gender_required'; end if;
  if nullif(btrim(p_last_name), '') is null then raise exception 'last_name_required'; end if;
  if nullif(btrim(p_register_number), '') is null then raise exception 'register_number_required'; end if;
  if p_birth_date is null then raise exception 'birth_date_required'; end if;
  if p_birth_date > current_date then raise exception 'invalid_birth_date'; end if;
  -- Driver must be an adult.
  if p_birth_date > (current_date - interval '18 years')::date then raise exception 'driver_underage'; end if;

  perform set_config('app.guard_bypass', 'on', true);

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
  set onboarding_completed = true,
      gender = p_gender,
      last_name = btrim(p_last_name),
      register_number = upper(btrim(p_register_number)),
      birth_date = p_birth_date,
      updated_at = now()
  where id = current_user_id;

  perform set_config('app.guard_bypass', 'off', true);

  return jsonb_build_object(
    'verification_status', saved_driver.verification_status,
    'car_model', saved_driver.car_model,
    'plate_number', saved_driver.plate_number,
    'seats', saved_driver.seats,
    'gender', p_gender,
    'onboarding_completed', true
  );
end;
$$;

-- Drop the old 6-arg signature so callers must pass identity fields.
drop function if exists public.submit_driver_onboarding(text, text, integer, text, text, text);

revoke all on function public.submit_driver_onboarding(text, text, integer, text, text, text, public.user_gender, text, text, date) from public;
grant execute on function public.submit_driver_onboarding(text, text, integer, text, text, text, public.user_gender, text, text, date) to authenticated;
