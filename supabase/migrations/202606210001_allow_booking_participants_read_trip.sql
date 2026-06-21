-- Let a traveler keep reading the route tied to their own booking even after
-- the route is no longer active, for example when the last seat makes it full.

drop policy if exists "trips read active or participant admin" on public.trips;
create policy "trips read active or participant admin" on public.trips
for select using (
  status = 'active'
  or driver_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1
    from public.passenger_bookings b
    where b.trip_id = trips.id
      and b.traveler_id = auth.uid()
  )
);
