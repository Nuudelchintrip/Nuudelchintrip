-- Trusted detail read for booking/payment screens.
-- Direct client joins can be blocked by trip status and RLS policy interactions.

create or replace function public.get_passenger_booking_detail(p_booking_id uuid)
returns table (
  id uuid,
  trip_id uuid,
  traveler_id uuid,
  seats_requested integer,
  selected_seats text[],
  status public.booking_status,
  total_amount integer,
  note text,
  created_at timestamptz,
  trip_code text,
  trip_driver_id uuid,
  trip_from_location text,
  trip_to_location text,
  trip_departure_at timestamptz,
  trip_pickup_note text,
  trip_dropoff_note text,
  trip_price_per_seat integer,
  trip_allows_cargo boolean,
  traveler_full_name text,
  traveler_phone text,
  traveler_email text,
  traveler_phone_verified boolean,
  driver_full_name text,
  driver_phone text,
  driver_email text,
  driver_car_model text,
  driver_rating numeric,
  driver_completed_trips integer,
  driver_verification_status public.driver_verification_status
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'not_authenticated';
  end if;

  if not exists (
    select 1
    from public.passenger_bookings b
    join public.trips t on t.id = b.trip_id
    where b.id = p_booking_id
      and (
        b.traveler_id = v_actor
        or t.driver_id = v_actor
        or public.is_admin()
      )
  ) then
    return;
  end if;

  return query
  select
    b.id,
    b.trip_id,
    b.traveler_id,
    b.seats_requested,
    b.selected_seats,
    b.status,
    b.total_amount,
    b.note,
    b.created_at,
    b.trip_code,
    t.driver_id,
    t.from_location,
    t.to_location,
    t.departure_at,
    t.pickup_note,
    t.dropoff_note,
    t.price_per_seat,
    t.allows_cargo,
    traveler.full_name,
    traveler.phone,
    traveler.email,
    traveler.phone_verified,
    driver.full_name,
    driver.phone,
    driver.email,
    dp.car_model,
    dp.rating,
    dp.completed_trips,
    dp.verification_status
  from public.passenger_bookings b
  join public.trips t on t.id = b.trip_id
  left join public.profiles traveler on traveler.id = b.traveler_id
  left join public.profiles driver on driver.id = t.driver_id
  left join public.driver_profiles dp on dp.user_id = t.driver_id
  where b.id = p_booking_id;
end;
$$;

revoke all on function public.get_passenger_booking_detail(uuid) from public, anon;
grant execute on function public.get_passenger_booking_detail(uuid) to authenticated;
