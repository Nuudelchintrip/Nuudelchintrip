-- Cross-role profile visibility (two tiers).
--
-- Problem: get_participant_public_profile only reveals a profile once a booking
-- relationship already exists, so a traveler browsing trips could not see a
-- driver they liked (and the same gap hit every role pair). This adds the
-- PUBLIC TRUST TIER:
--
--   get_public_user_card(user_id): any authenticated user may see another user's
--   trust signals — name, avatar, role, phone_verified, driver verification,
--   car model, seats, rating, completed trips. Deliberately EXCLUDES phone,
--   email and plate_number; those stay in get_participant_public_profile and
--   only appear once a real booking/cargo relationship exists.
--
-- Also exposes trips.driver_id through the public trip RPCs so the "view driver
-- profile" button works while browsing (a bare UUID is not sensitive).
--
-- Apply manually in Supabase SQL Editor (after 202607190003).

-- ---------------------------------------------------------------------------
-- 1. Public trust card
-- ---------------------------------------------------------------------------
create or replace function public.get_public_user_card(p_user_id uuid)
returns table (
  id uuid,
  role public.user_role,
  full_name text,
  phone_verified boolean,
  avatar_url text,
  driver_verification_status public.driver_verification_status,
  car_model text,
  seats integer,
  rating numeric,
  completed_trips integer
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  return query
  select p.id, p.role, p.full_name, p.phone_verified, p.avatar_url,
    dp.verification_status, dp.car_model, dp.seats, dp.rating, dp.completed_trips
  from public.profiles p
  left join public.driver_profiles dp on dp.user_id = p.id
  where p.id = p_user_id and p.is_suspended = false;
end;
$$;

revoke all on function public.get_public_user_card(uuid) from public, anon;
grant execute on function public.get_public_user_card(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Add driver_id to the public trip RPCs (drop first — return type changes)
-- ---------------------------------------------------------------------------
drop function if exists public.list_public_trips(text, text, date);
create function public.list_public_trips(
  p_from text default null,
  p_to text default null,
  p_date date default null
)
returns table (
  id uuid,
  driver_id uuid,
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
    t.driver_id,
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

drop function if exists public.get_public_trip(uuid);
create function public.get_public_trip(p_trip_id uuid)
returns table (
  id uuid,
  driver_id uuid,
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
    t.driver_id,
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

notify pgrst, 'reload schema';
