-- One trusted read path for driver and admin trip lists.

create or replace function public.list_my_driver_trips()
returns setof public.trips
language sql
security definer
set search_path = public
stable
as $$
  select t.*
  from public.trips t
  where auth.uid() is not null
    and t.driver_id = auth.uid()
  order by t.departure_at desc;
$$;

revoke all on function public.list_my_driver_trips() from public, anon;
grant execute on function public.list_my_driver_trips() to authenticated;

create or replace function public.list_active_marketplace_trips()
returns table (
  id uuid,
  driver_id uuid,
  from_location text,
  to_location text,
  departure_at timestamptz,
  seats_total integer,
  seats_available integer,
  available_seat_labels text[],
  price_per_seat integer,
  pickup_note text,
  dropoff_note text,
  allows_cargo boolean,
  cargo_capacity_kg numeric,
  allowed_cargo_types text[],
  cargo_price_note text,
  status text,
  driver_full_name text,
  driver_car_model text,
  driver_rating numeric,
  driver_completed_trips integer,
  driver_verification_status public.driver_verification_status
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
    t.seats_total,
    t.seats_available,
    t.available_seat_labels,
    t.price_per_seat,
    t.pickup_note,
    t.dropoff_note,
    t.allows_cargo,
    t.cargo_capacity_kg,
    t.allowed_cargo_types,
    t.cargo_price_note,
    t.status,
    p.full_name,
    dp.car_model,
    dp.rating,
    dp.completed_trips,
    dp.verification_status
  from public.trips t
  join public.profiles p on p.id = t.driver_id
  join public.driver_profiles dp on dp.user_id = t.driver_id
  where auth.uid() is not null
    and t.status = 'active'
    and t.departure_at > now()
    and t.seats_available > 0
    and p.is_suspended = false
    and dp.verification_status = 'approved'
  order by t.departure_at asc;
$$;

revoke all on function public.list_active_marketplace_trips() from public, anon;
grant execute on function public.list_active_marketplace_trips() to authenticated;

create or replace function public.admin_list_trips()
returns setof public.trips
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if not public.is_admin() then
    raise exception 'admin_required';
  end if;

  return query
  select t.*
  from public.trips t
  order by t.created_at desc
  limit 200;
end;
$$;

revoke all on function public.admin_list_trips() from public, anon;
grant execute on function public.admin_list_trips() to authenticated;
