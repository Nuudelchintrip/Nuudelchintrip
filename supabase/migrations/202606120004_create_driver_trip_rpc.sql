-- Create driver trips through one trusted transaction instead of relying on a
-- browser-side insert that can disagree with the current RLS policy state.

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
  p_cargo_price_note text default null
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
    'active'
  )
  returning id into created_trip_id;

  return created_trip_id;
end;
$$;

revoke all on function public.create_driver_trip(
  text, text, timestamptz, integer, text[], integer,
  text, text, boolean, numeric, text[], text
) from public, anon;

grant execute on function public.create_driver_trip(
  text, text, timestamptz, integer, text[], integer,
  text, text, boolean, numeric, text[], text
) to authenticated;
