-- Public (anonymous) trip browsing for /routes.
--
-- UX fix: every "Жолооч хайх" CTA led to a locked info page, so visitors never
-- saw any real trips before registering. These two RPCs expose ONLY the
-- non-sensitive slice of active trips to everyone (anon included):
--   route, departure, seats left, price, cargo flag, gender preference,
--   driver first name / rating / completed trips / car model / verified status.
-- Explicitly EXCLUDED: phone numbers, pickup/dropoff notes, plate number,
-- driver_id, seat labels. Booking still requires login.
--
-- Apply manually in Supabase SQL Editor (after 202606300002 — uses
-- trips.gender_preference).

create or replace function public.list_public_trips(
  p_from text default null,
  p_to text default null,
  p_date date default null
)
returns table (
  id uuid,
  from_location text,
  to_location text,
  departure_at timestamptz,
  seats_available integer,
  price_per_seat integer,
  allows_cargo boolean,
  gender_preference public.trip_gender_preference,
  driver_full_name text,
  driver_rating numeric,
  driver_completed_trips integer,
  driver_car_model text,
  driver_verified boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    t.id,
    t.from_location,
    t.to_location,
    t.departure_at,
    t.seats_available,
    t.price_per_seat,
    t.allows_cargo,
    t.gender_preference,
    p.full_name,
    dp.rating,
    dp.completed_trips,
    dp.car_model,
    (dp.verification_status = 'approved')
  from public.trips t
  join public.profiles p on p.id = t.driver_id
  join public.driver_profiles dp on dp.user_id = t.driver_id
  where t.status = 'active'
    and t.departure_at > now()
    and t.seats_available > 0
    and p.is_suspended = false
    and dp.verification_status = 'approved'
    and (
      p_from is null
      or lower(btrim(t.from_location)) = lower(btrim(p_from))
      or lower(btrim(t.from_location)) like lower(btrim(p_from)) || ' - %'
    )
    and (
      p_to is null
      or lower(btrim(t.to_location)) = lower(btrim(p_to))
      or lower(btrim(t.to_location)) like lower(btrim(p_to)) || ' - %'
    )
    and (
      p_date is null
      or (t.departure_at at time zone 'Asia/Ulaanbaatar')::date = p_date
    )
  order by t.departure_at asc
  limit 100;
$$;

grant execute on function public.list_public_trips(text, text, date) to anon, authenticated;

create or replace function public.get_public_trip(p_trip_id uuid)
returns table (
  id uuid,
  from_location text,
  to_location text,
  departure_at timestamptz,
  seats_available integer,
  price_per_seat integer,
  allows_cargo boolean,
  cargo_price_note text,
  gender_preference public.trip_gender_preference,
  driver_full_name text,
  driver_rating numeric,
  driver_completed_trips integer,
  driver_car_model text,
  driver_verified boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    t.id,
    t.from_location,
    t.to_location,
    t.departure_at,
    t.seats_available,
    t.price_per_seat,
    t.allows_cargo,
    t.cargo_price_note,
    t.gender_preference,
    p.full_name,
    dp.rating,
    dp.completed_trips,
    dp.car_model,
    (dp.verification_status = 'approved')
  from public.trips t
  join public.profiles p on p.id = t.driver_id
  join public.driver_profiles dp on dp.user_id = t.driver_id
  where t.id = p_trip_id
    and t.status = 'active'
    and p.is_suspended = false;
$$;

grant execute on function public.get_public_trip(uuid) to anon, authenticated;
