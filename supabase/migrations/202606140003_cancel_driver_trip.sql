-- Cancel a driver's route without deleting its history.

create or replace function public.cancel_driver_trip(p_trip_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  trip_owner_id uuid;
  trip_status text;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select driver_id, status
  into trip_owner_id, trip_status
  from public.trips
  where id = p_trip_id
  for update;

  if not found then
    raise exception 'trip_not_found';
  end if;

  if trip_owner_id <> current_user_id then
    raise exception 'not_trip_owner';
  end if;

  if trip_status = 'completed' then
    raise exception 'completed_trip_cannot_be_cancelled';
  end if;

  if trip_status <> 'cancelled' then
    update public.trips
    set status = 'cancelled',
        updated_at = now()
    where id = p_trip_id;
  end if;

  return 'cancelled';
end;
$$;

revoke all on function public.cancel_driver_trip(uuid) from public;
grant execute on function public.cancel_driver_trip(uuid) to authenticated;
