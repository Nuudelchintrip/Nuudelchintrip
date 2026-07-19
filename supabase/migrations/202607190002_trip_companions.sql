-- Trip companions (#1): participants of the same trip can see each other.
--
-- get_trip_companions(trip_id) returns the travelers whose bookings on that trip
-- are accepted-or-later (i.e. actually riding). Callable only by the trip's
-- driver or a traveler with such a booking on the same trip. SECURITY DEFINER,
-- so no profiles RLS loosening is needed; only these basic fields leak.
--
-- Apply manually in Supabase SQL Editor. Independent of the identity/gender
-- migrations (does not reference profiles.gender).

create or replace function public.get_trip_companions(p_trip_id uuid)
returns table(
  user_id uuid,
  full_name text,
  avatar_url text,
  phone_verified boolean,
  seats_requested integer,
  booking_status public.booking_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_participant boolean;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select exists (
    select 1 from public.trips t
    where t.id = p_trip_id and t.driver_id = v_user_id
  ) or exists (
    select 1 from public.passenger_bookings b
    where b.trip_id = p_trip_id
      and b.traveler_id = v_user_id
      and b.status in ('accepted', 'waiting_payment', 'payment_review', 'confirmed', 'on_trip', 'completed')
  ) into v_is_participant;

  if not v_is_participant and not public.is_admin() then
    raise exception 'not_a_participant';
  end if;

  return query
  select
    p.id,
    p.full_name,
    p.avatar_url,
    p.phone_verified,
    b.seats_requested,
    b.status
  from public.passenger_bookings b
  join public.profiles p on p.id = b.traveler_id
  where b.trip_id = p_trip_id
    and b.status in ('accepted', 'waiting_payment', 'payment_review', 'confirmed', 'on_trip', 'completed')
  order by b.created_at;
end;
$$;

revoke all on function public.get_trip_companions(uuid) from public, anon;
grant execute on function public.get_trip_companions(uuid) to authenticated;
