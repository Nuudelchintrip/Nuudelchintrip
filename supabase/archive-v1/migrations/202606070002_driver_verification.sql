-- Phase 2: Driver verification — documents, admin review, and status guard.
--
--   1. Reviewer columns on driver_profiles (reviewed_by, reviewed_at, rejection_reason).
--   2. Guard trigger so a driver cannot change their own verification_status /
--      cargo_permission_status / reviewer fields / rating / completed_trips.
--      (Drivers may still edit car_model / plate / seats / document URLs.)
--   3. submit_driver_onboarding extended to store the three required document paths.
--   4. review_driver_verification(user_id, status, reason) — admin-only RPC that sets
--      status + reviewer + reviewed_at + rejection_reason in one trusted call.
--
-- Storage: the private `driver-documents` bucket and its owner/admin policies already
-- exist (see 202605310001_initial_schema.sql), so no bucket changes are needed here.

-- ---------------------------------------------------------------------------
-- 1. Reviewer columns
-- ---------------------------------------------------------------------------
alter table public.driver_profiles
  add column if not exists reviewed_by uuid references public.profiles(id),
  add column if not exists reviewed_at timestamptz,
  add column if not exists rejection_reason text;

-- ---------------------------------------------------------------------------
-- 2. Guard trigger: drivers cannot self-approve
-- ---------------------------------------------------------------------------
create or replace function public.guard_driver_verification_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bypass boolean := coalesce(current_setting('app.guard_bypass', true), 'off') = 'on';
begin
  if bypass or public.is_admin() then
    return new;
  end if;

  if new.verification_status is distinct from old.verification_status then
    new.verification_status := old.verification_status;
  end if;
  if new.cargo_permission_status is distinct from old.cargo_permission_status then
    new.cargo_permission_status := old.cargo_permission_status;
  end if;
  if new.reviewed_by is distinct from old.reviewed_by then
    new.reviewed_by := old.reviewed_by;
  end if;
  if new.reviewed_at is distinct from old.reviewed_at then
    new.reviewed_at := old.reviewed_at;
  end if;
  if new.rejection_reason is distinct from old.rejection_reason then
    new.rejection_reason := old.rejection_reason;
  end if;
  if new.rating is distinct from old.rating then
    new.rating := old.rating;
  end if;
  if new.completed_trips is distinct from old.completed_trips then
    new.completed_trips := old.completed_trips;
  end if;

  return new;
end;
$$;

drop trigger if exists driver_profiles_guard_verification on public.driver_profiles;
create trigger driver_profiles_guard_verification
before update on public.driver_profiles
for each row execute function public.guard_driver_verification_fields();

-- ---------------------------------------------------------------------------
-- 3. submit_driver_onboarding with required documents
-- ---------------------------------------------------------------------------
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
  current_role public.user_role;
  saved_driver public.driver_profiles%rowtype;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select role into current_role
  from public.profiles
  where id = current_user_id and is_suspended = false;

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
  if nullif(btrim(p_driver_license_url), '') is null then
    raise exception 'driver_license_required';
  end if;
  if nullif(btrim(p_vehicle_certificate_url), '') is null then
    raise exception 'vehicle_certificate_required';
  end if;
  if nullif(btrim(p_vehicle_photo_url), '') is null then
    raise exception 'vehicle_photo_required';
  end if;

  perform set_config('app.guard_bypass', 'on', true);

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

  perform set_config('app.guard_bypass', 'off', true);

  update public.profiles
  set onboarding_completed = true, updated_at = now()
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

revoke all on function public.submit_driver_onboarding(text, text, integer, text, text, text) from public;
grant execute on function public.submit_driver_onboarding(text, text, integer, text, text, text) to authenticated;

-- Drop the old 3-arg signature so callers must pass documents.
drop function if exists public.submit_driver_onboarding(text, text, integer);

-- ---------------------------------------------------------------------------
-- 4. Admin review RPC
-- ---------------------------------------------------------------------------
create or replace function public.review_driver_verification(
  p_user_id uuid,
  p_status public.driver_verification_status,
  p_rejection_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_id uuid := auth.uid();
  saved public.driver_profiles%rowtype;
begin
  if admin_id is null then
    raise exception 'not_authenticated';
  end if;
  if not public.is_admin() then
    raise exception 'admin_required';
  end if;
  if p_status not in ('approved', 'rejected', 'pending') then
    raise exception 'invalid_status';
  end if;
  if p_status = 'rejected' and nullif(btrim(p_rejection_reason), '') is null then
    raise exception 'rejection_reason_required';
  end if;

  perform set_config('app.guard_bypass', 'on', true);

  update public.driver_profiles
  set verification_status = p_status,
      cargo_permission_status = case when p_status = 'approved' then 'approved' else p_status end,
      reviewed_by = admin_id,
      reviewed_at = now(),
      rejection_reason = case when p_status = 'rejected' then btrim(p_rejection_reason) else null end,
      updated_at = now()
  where user_id = p_user_id
  returning * into saved;

  perform set_config('app.guard_bypass', 'off', true);

  if saved.user_id is null then
    raise exception 'driver_not_found';
  end if;

  return jsonb_build_object(
    'user_id', saved.user_id,
    'verification_status', saved.verification_status,
    'reviewed_at', saved.reviewed_at,
    'rejection_reason', saved.rejection_reason
  );
end;
$$;

revoke all on function public.review_driver_verification(uuid, public.driver_verification_status, text) from public;
grant execute on function public.review_driver_verification(uuid, public.driver_verification_status, text) to authenticated;
