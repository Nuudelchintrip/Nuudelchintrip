-- ---------------------------------------------------------------------------
-- 202606130006_driver_trip_update_delete
--
-- Drivers could create routes but not edit or remove them. Add owner-scoped
-- RPCs:
--   update_driver_trip  - edit a route's fields (blocked once it has live
--                         bookings, so seat state cannot be corrupted).
--   delete_driver_trip  - remove a route; soft-cancels instead of deleting when
--                         bookings/cargo already reference it (FK-safe).
-- ---------------------------------------------------------------------------

create or replace function public.update_driver_trip(
  p_trip_id uuid,
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
  p_cargo_price_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  v_trip public.trips%rowtype;
  v_live_bookings integer;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_trip from public.trips where trips.id = p_trip_id for update;
  if not found then
    raise exception 'trip_not_found';
  end if;
  if v_trip.driver_id <> current_user_id then
    raise exception 'not_trip_owner';
  end if;

  -- Editing a route that people already booked would desync seat state.
  select count(*) into v_live_bookings
  from public.passenger_bookings b
  where b.trip_id = p_trip_id
    and b.status not in ('rejected', 'cancelled');
  if v_live_bookings > 0 then
    raise exception 'trip_has_bookings';
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

  update public.trips
  set from_location = btrim(p_from_location),
      to_location = btrim(p_to_location),
      departure_at = p_departure_at,
      seats_total = p_seats_total,
      seats_available = p_seats_total,
      available_seat_labels = coalesce(p_available_seat_labels, array[]::text[]),
      price_per_seat = p_price_per_seat,
      pickup_note = nullif(btrim(p_pickup_note), ''),
      dropoff_note = nullif(btrim(p_dropoff_note), ''),
      allows_cargo = coalesce(p_allows_cargo, false),
      cargo_capacity_kg = case when p_allows_cargo then p_cargo_capacity_kg else null end,
      allowed_cargo_types = case when p_allows_cargo then coalesce(p_allowed_cargo_types, array[]::text[]) else null end,
      cargo_price_note = case when p_allows_cargo then nullif(btrim(p_cargo_price_note), '') else null end,
      status = case when v_trip.status = 'cancelled' then 'active' else v_trip.status end,
      updated_at = now()
  where trips.id = p_trip_id;

  return p_trip_id;
end;
$$;

revoke all on function public.update_driver_trip(uuid, text, text, timestamptz, integer, text[], integer, text, text, boolean, numeric, text[], text) from public;
grant execute on function public.update_driver_trip(uuid, text, text, timestamptz, integer, text[], integer, text, text, boolean, numeric, text[], text) to authenticated;

-- ---------------------------------------------------------------------------
-- Delete (or soft-cancel) the driver's own route.
-- ---------------------------------------------------------------------------
create or replace function public.delete_driver_trip(p_trip_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  v_trip public.trips%rowtype;
  v_refs integer;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_trip from public.trips where trips.id = p_trip_id for update;
  if not found then
    raise exception 'trip_not_found';
  end if;
  if v_trip.driver_id <> current_user_id then
    raise exception 'not_trip_owner';
  end if;

  -- Any booking or cargo row referencing this trip => soft-cancel (FK-safe).
  select
    (select count(*) from public.passenger_bookings b where b.trip_id = p_trip_id)
    + (select count(*) from public.cargo_requests c where c.trip_id = p_trip_id)
  into v_refs;

  if v_refs > 0 then
    update public.trips
    set status = 'cancelled', updated_at = now()
    where trips.id = p_trip_id;
    return 'cancelled';
  end if;

  delete from public.trips where trips.id = p_trip_id;
  return 'deleted';
end;
$$;

revoke all on function public.delete_driver_trip(uuid) from public;
grant execute on function public.delete_driver_trip(uuid) to authenticated;
