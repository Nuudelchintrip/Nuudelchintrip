-- Gender-matched rides (#5): a driver can restrict a route to one gender.
--
--   1. trips.gender_preference ('any' | 'female' | 'male'), default 'any'.
--   2. create_driver_trip extended to capture the preference.
--   3. A BEFORE INSERT trigger on passenger_bookings enforces the match so BOTH
--      the seat-hold RPC and the legacy direct insert are covered — no need to
--      rewrite create_passenger_booking_with_seats.
--   4. complete_traveler_onboarding captures the traveler's gender (needed so the
--      match has something to compare against).
--
-- Depends on public.user_gender from 202606300001. Apply manually in SQL Editor.

-- ---------------------------------------------------------------------------
-- 1. Column + enum
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.trip_gender_preference as enum ('any', 'female', 'male');
exception when duplicate_object then null; end $$;

alter table public.trips
  add column if not exists gender_preference public.trip_gender_preference not null default 'any';

-- ---------------------------------------------------------------------------
-- 2. create_driver_trip with gender preference (new signature)
-- ---------------------------------------------------------------------------
create or replace function public.create_driver_trip(
  p_from_location text,
  p_to_location text,
  p_departure_at timestamptz,
  p_seats_total integer,
  p_available_seat_labels text[],
  p_price_per_seat integer,
  p_pickup_note text default null,
  p_dropoff_note text default null,
  p_allows_cargo boolean default false,
  p_cargo_capacity_kg numeric default null,
  p_allowed_cargo_types text[] default null,
  p_cargo_price_note text default null,
  p_gender_preference public.trip_gender_preference default 'any'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  created_trip_id uuid;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if not public.can_create_trip() then
    raise exception 'driver_not_ready';
  end if;

  if nullif(btrim(p_from_location), '') is null
    or nullif(btrim(p_to_location), '') is null then
    raise exception 'route_required';
  end if;
  if p_departure_at is null or p_departure_at <= now() then
    raise exception 'future_departure_required';
  end if;
  if p_seats_total is null or p_seats_total < 1 or p_seats_total > 12 then
    raise exception 'invalid_seat_count';
  end if;
  if p_price_per_seat is null or p_price_per_seat < 0 then
    raise exception 'invalid_price';
  end if;

  insert into public.trips (
    driver_id,
    from_location,
    to_location,
    departure_at,
    seats_total,
    seats_available,
    available_seat_labels,
    price_per_seat,
    pickup_note,
    dropoff_note,
    allows_cargo,
    cargo_capacity_kg,
    allowed_cargo_types,
    cargo_price_note,
    gender_preference,
    status
  )
  values (
    current_user_id,
    btrim(p_from_location),
    btrim(p_to_location),
    p_departure_at,
    p_seats_total,
    p_seats_total,
    coalesce(p_available_seat_labels, array[]::text[]),
    p_price_per_seat,
    nullif(btrim(p_pickup_note), ''),
    nullif(btrim(p_dropoff_note), ''),
    coalesce(p_allows_cargo, false),
    case when p_allows_cargo then p_cargo_capacity_kg else null end,
    case when p_allows_cargo then coalesce(p_allowed_cargo_types, array[]::text[]) else null end,
    case when p_allows_cargo then nullif(btrim(p_cargo_price_note), '') else null end,
    coalesce(p_gender_preference, 'any'),
    'active'
  )
  returning id into created_trip_id;

  return created_trip_id;
end;
$$;

-- Drop the previous 12-arg signature so callers pass the preference.
drop function if exists public.create_driver_trip(
  text, text, timestamptz, integer, text[], integer,
  text, text, boolean, numeric, text[], text
);

revoke all on function public.create_driver_trip(
  text, text, timestamptz, integer, text[], integer,
  text, text, boolean, numeric, text[], text, public.trip_gender_preference
) from public, anon;

grant execute on function public.create_driver_trip(
  text, text, timestamptz, integer, text[], integer,
  text, text, boolean, numeric, text[], text, public.trip_gender_preference
) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Enforce gender match on booking insert
-- ---------------------------------------------------------------------------
create or replace function public.enforce_trip_gender_preference()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pref public.trip_gender_preference;
  v_gender public.user_gender;
begin
  select gender_preference into v_pref from public.trips where id = new.trip_id;

  if v_pref is null or v_pref = 'any' then
    return new;
  end if;

  select gender into v_gender from public.profiles where id = new.traveler_id;

  if v_gender is null then
    raise exception 'gender_required_for_booking';
  end if;
  if v_gender::text <> v_pref::text then
    raise exception 'gender_not_allowed';
  end if;

  return new;
end;
$$;

drop trigger if exists passenger_bookings_gender_guard on public.passenger_bookings;
create trigger passenger_bookings_gender_guard
  before insert on public.passenger_bookings
  for each row execute function public.enforce_trip_gender_preference();

-- ---------------------------------------------------------------------------
-- 4. complete_traveler_onboarding captures gender
-- ---------------------------------------------------------------------------
create or replace function public.complete_traveler_onboarding(
  p_emergency_contact_name text default null,
  p_emergency_contact_phone text default null,
  p_gender public.user_gender default null
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
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select * into auth_user from auth.users where id = current_user_id;
  if auth_user.id is null then
    raise exception 'auth_user_not_found';
  end if;

  metadata_role := auth_user.raw_user_meta_data->>'role';

  select * into profile_row from public.profiles where id = current_user_id for update;

  if profile_row.id is null then
    if metadata_role <> 'traveler' then
      raise exception 'traveler_role_required';
    end if;

    insert into public.profiles (
      id, role, full_name, phone, email, phone_verified, onboarding_completed,
      emergency_contact_name, emergency_contact_phone, gender
    )
    values (
      auth_user.id,
      'traveler',
      coalesce(
        nullif(auth_user.raw_user_meta_data->>'full_name', ''),
        split_part(coalesce(auth_user.email, ''), '@', 1)
      ),
      coalesce(nullif(auth_user.raw_user_meta_data->>'phone', ''), auth_user.phone),
      auth_user.email,
      true,
      true,
      nullif(btrim(p_emergency_contact_name), ''),
      nullif(btrim(p_emergency_contact_phone), ''),
      p_gender
    )
    returning * into profile_row;
  else
    if profile_row.role <> 'traveler' then
      if profile_row.role = 'admin'
        or profile_row.onboarding_completed
        or metadata_role <> 'traveler'
      then
        raise exception 'traveler_role_required';
      end if;
    end if;

    if profile_row.is_suspended then
      raise exception 'account_suspended';
    end if;

    update public.profiles
    set role = 'traveler',
        phone_verified = true,
        emergency_contact_name = nullif(btrim(p_emergency_contact_name), ''),
        emergency_contact_phone = nullif(btrim(p_emergency_contact_phone), ''),
        gender = coalesce(p_gender, gender),
        onboarding_completed = true,
        updated_at = now()
    where id = current_user_id
    returning * into profile_row;
  end if;

  return jsonb_build_object(
    'role', profile_row.role,
    'full_name', profile_row.full_name,
    'phone', profile_row.phone,
    'email', profile_row.email,
    'phone_verified', profile_row.phone_verified,
    'onboarding_completed', profile_row.onboarding_completed,
    'cargo_policy_accepted', profile_row.cargo_policy_accepted,
    'verification_status', null
  );
end;
$$;

revoke all on function public.complete_traveler_onboarding(text, text, public.user_gender) from public;
grant execute on function public.complete_traveler_onboarding(text, text, public.user_gender) to authenticated;
