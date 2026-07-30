-- Fix: start_passenger_trip / complete_passenger_trip RETURN TABLE with an
-- `id` OUT column, so every bare `id` in their bodies collided with it:
-- "column reference id is ambiguous" (42702) when the driver started or
-- completed a trip. Same class of bug as 202606130004; fix the same way by
-- qualifying each column reference with its table name.

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

  select * into v_booking
  from public.passenger_bookings
  where passenger_bookings.id = p_booking_id
  for update;
  if not found then
    raise exception 'booking_not_found';
  end if;

  select * into v_trip from public.trips where trips.id = v_booking.trip_id;
  if not (v_trip.driver_id = v_actor or public.is_admin()) then
    raise exception 'driver_or_admin_required';
  end if;
  if v_booking.status <> 'confirmed' then
    raise exception 'booking_not_confirmed';
  end if;

  update public.passenger_bookings
  set status = 'on_trip', started_at = now(), updated_at = now()
  where passenger_bookings.id = p_booking_id;

  perform public.log_booking_status_change(
    p_booking_id, v_booking.trip_id, v_booking.status::text, 'on_trip', 'Жолооч аялал эхлүүлэв.'
  );

  return query select p_booking_id, 'on_trip'::public.booking_status;
end;
$$;

revoke all on function public.start_passenger_trip(uuid) from public;
grant execute on function public.start_passenger_trip(uuid) to authenticated;

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

  select * into v_booking
  from public.passenger_bookings
  where passenger_bookings.id = p_booking_id
  for update;
  if not found then
    raise exception 'booking_not_found';
  end if;

  select * into v_trip from public.trips where trips.id = v_booking.trip_id;
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
  where passenger_bookings.id = p_booking_id;

  -- Bump the driver's completed-trip counter (guarded column → bypass).
  perform set_config('app.guard_bypass', 'on', true);
  update public.driver_profiles
  set completed_trips = driver_profiles.completed_trips + 1, updated_at = now()
  where driver_profiles.user_id = v_trip.driver_id;
  perform set_config('app.guard_bypass', 'off', true);

  perform public.log_booking_status_change(
    p_booking_id, v_booking.trip_id, v_booking.status::text, 'completed', 'Аялал дуусч, код баталгаажлаа.'
  );

  return query select p_booking_id, 'completed'::public.booking_status;
end;
$$;

revoke all on function public.complete_passenger_trip(uuid, text) from public;
grant execute on function public.complete_passenger_trip(uuid, text) to authenticated;
