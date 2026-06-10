-- Phase 7: Trip start / end — driver actions, 6-digit verify code, timestamps, audit.
--
--   1. passenger_bookings gains a per-booking 6-digit trip_code (shown to traveler)
--      plus started_at / completed_at timestamps.
--   2. start_passenger_trip()    — driver: confirmed → on_trip (+ started_at, audit).
--   3. complete_passenger_trip()  — driver enters the traveler's trip_code:
--      on_trip → completed (+ completed_at, audit, bumps driver completed_trips).
--
-- Transitions are validated inline (status guards) and logged via
-- log_booking_status_change(); seats stay consumed (no release on completion).

-- ---------------------------------------------------------------------------
-- 1. Columns
-- ---------------------------------------------------------------------------
alter table public.passenger_bookings
  add column if not exists trip_code text not null default lpad((floor(random() * 1000000))::int::text, 6, '0'),
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz;

-- ---------------------------------------------------------------------------
-- 2. Start a passenger's trip
-- ---------------------------------------------------------------------------
create or replace function public.start_passenger_trip(p_booking_id uuid)
returns table(id uuid, status public.booking_status)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_booking public.passenger_bookings%rowtype;
  v_trip public.trips%rowtype;
begin
  if v_actor is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_booking from public.passenger_bookings where id = p_booking_id for update;
  if not found then
    raise exception 'booking_not_found';
  end if;

  select * into v_trip from public.trips where id = v_booking.trip_id;
  if not (v_trip.driver_id = v_actor or public.is_admin()) then
    raise exception 'driver_or_admin_required';
  end if;
  if v_booking.status <> 'confirmed' then
    raise exception 'booking_not_confirmed';
  end if;

  update public.passenger_bookings
  set status = 'on_trip', started_at = now(), updated_at = now()
  where id = p_booking_id;

  perform public.log_booking_status_change(
    p_booking_id, v_booking.trip_id, v_booking.status::text, 'on_trip', 'Жолооч аялал эхлүүлэв.'
  );

  return query select p_booking_id, 'on_trip'::public.booking_status;
end;
$$;

revoke all on function public.start_passenger_trip(uuid) from public;
grant execute on function public.start_passenger_trip(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Complete a passenger's trip with their 6-digit code
-- ---------------------------------------------------------------------------
create or replace function public.complete_passenger_trip(p_booking_id uuid, p_code text)
returns table(id uuid, status public.booking_status)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_booking public.passenger_bookings%rowtype;
  v_trip public.trips%rowtype;
  v_code text := nullif(regexp_replace(coalesce(p_code, ''), '\D', '', 'g'), '');
begin
  if v_actor is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_booking from public.passenger_bookings where id = p_booking_id for update;
  if not found then
    raise exception 'booking_not_found';
  end if;

  select * into v_trip from public.trips where id = v_booking.trip_id;
  if not (v_trip.driver_id = v_actor or public.is_admin()) then
    raise exception 'driver_or_admin_required';
  end if;
  if v_booking.status <> 'on_trip' then
    raise exception 'booking_not_on_trip';
  end if;
  if v_code is null or v_code <> v_booking.trip_code then
    raise exception 'invalid_trip_code';
  end if;

  update public.passenger_bookings
  set status = 'completed', completed_at = now(), updated_at = now()
  where id = p_booking_id;

  -- Bump the driver's completed-trip counter (guarded column → bypass).
  perform set_config('app.guard_bypass', 'on', true);
  update public.driver_profiles
  set completed_trips = completed_trips + 1, updated_at = now()
  where user_id = v_trip.driver_id;
  perform set_config('app.guard_bypass', 'off', true);

  perform public.log_booking_status_change(
    p_booking_id, v_booking.trip_id, v_booking.status::text, 'completed', 'Аялал дуусч, код баталгаажлаа.'
  );

  return query select p_booking_id, 'completed'::public.booking_status;
end;
$$;

revoke all on function public.complete_passenger_trip(uuid, text) from public;
grant execute on function public.complete_passenger_trip(uuid, text) to authenticated;
