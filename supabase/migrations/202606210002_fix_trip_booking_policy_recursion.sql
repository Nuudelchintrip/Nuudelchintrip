-- Avoid RLS recursion between trips and passenger_bookings policies.

create or replace function public.current_user_drives_trip(p_trip_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.trips t
    where t.id = p_trip_id
      and t.driver_id = auth.uid()
  );
$$;

create or replace function public.current_user_booked_trip(p_trip_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.passenger_bookings b
    where b.trip_id = p_trip_id
      and b.traveler_id = auth.uid()
  );
$$;

revoke all on function public.current_user_drives_trip(uuid) from public, anon;
revoke all on function public.current_user_booked_trip(uuid) from public, anon;
grant execute on function public.current_user_drives_trip(uuid) to authenticated;
grant execute on function public.current_user_booked_trip(uuid) to authenticated;

drop policy if exists "trips read active or participant admin" on public.trips;
create policy "trips read active or participant admin" on public.trips
for select using (
  status = 'active'
  or driver_id = auth.uid()
  or public.is_admin()
  or public.current_user_booked_trip(id)
);

drop policy if exists "bookings read participant admin" on public.passenger_bookings;
create policy "bookings read participant admin" on public.passenger_bookings
for select using (
  traveler_id = auth.uid()
  or public.is_admin()
  or public.current_user_drives_trip(trip_id)
);
