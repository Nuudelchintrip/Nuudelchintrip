-- ---------------------------------------------------------------------------
-- 202606130003_fix_booking_status_ambiguous
--
-- create_passenger_booking_with_seats RETURNS TABLE(..., status ...), so inside
-- the body the bare `status` in the trips UPDATE collided with that OUT column:
--   "column reference status is ambiguous" (42702) when booking a seat.
-- Fix: qualify the current-value reference as trips.status.
-- ---------------------------------------------------------------------------

create or replace function public.create_passenger_booking_with_seats(
  p_trip_id uuid,
  p_selected_seats text[],
  p_note text default null
)
returns table(id uuid, status public.booking_status)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_trip public.trips%rowtype;
  v_selected text[];
  v_remaining text[];
  v_booking_id uuid;
  v_requested integer;
begin
  if v_user_id is null then
    raise exception 'Нэвтэрсэн хэрэглэгч олдсонгүй.' using errcode = '28000';
  end if;

  -- Free up any expired holds on this trip before we read availability.
  perform public.expire_stale_seat_holds();

  select array_agg(distinct trim(seat))
    into v_selected
  from unnest(coalesce(p_selected_seats, array[]::text[])) as seat
  where trim(seat) <> '';

  v_selected := coalesce(v_selected, array[]::text[]);
  v_requested := coalesce(array_length(v_selected, 1), 0);

  if v_requested < 1 then
    raise exception 'Дор хаяж нэг суудал сонгоно уу.' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = v_user_id
      and p.role = 'traveler'
      and p.phone_verified = true
      and p.is_suspended = false
  ) then
    raise exception 'Зөвхөн утсаа баталгаажуулсан аялагч суудал захиална.' using errcode = '42501';
  end if;

  select * into v_trip
  from public.trips t
  where t.id = p_trip_id and t.status = 'active'
  for update;

  if not found then
    raise exception 'Идэвхтэй чиглэл олдсонгүй.' using errcode = 'P0002';
  end if;

  if v_trip.driver_id = v_user_id then
    raise exception 'Өөрийн чиглэл дээр суудал захиалах боломжгүй.' using errcode = '42501';
  end if;

  if coalesce(array_length(v_trip.available_seat_labels, 1), 0) = 0 then
    raise exception 'Энэ чиглэл дээр сонгож болох суудлын мэдээлэл алга.' using errcode = '22023';
  end if;

  if not v_selected <@ v_trip.available_seat_labels then
    raise exception 'Сонгосон суудлын зарим нь аль хэдийн захиалагдсан байна.' using errcode = '23514';
  end if;

  if v_trip.seats_available < v_requested then
    raise exception 'Сул суудлын тоо хүрэлцэхгүй байна.' using errcode = '23514';
  end if;

  insert into public.passenger_bookings (
    trip_id, traveler_id, seats_requested, selected_seats, status, total_amount, note, hold_expires_at
  )
  values (
    p_trip_id, v_user_id, v_requested, v_selected, 'pending_request',
    v_trip.price_per_seat * v_requested,
    nullif(trim(coalesce(p_note, '')), ''),
    now() + make_interval(mins => public.seat_hold_minutes())
  )
  returning passenger_bookings.id into v_booking_id;

  select coalesce(array_agg(seat order by ord), array[]::text[])
    into v_remaining
  from unnest(v_trip.available_seat_labels) with ordinality as current_seats(seat, ord)
  where not current_seats.seat = any(v_selected);

  update public.trips
  set available_seat_labels = v_remaining,
      seats_available = greatest(0, seats_available - v_requested),
      status = case when greatest(0, seats_available - v_requested) = 0 then 'full' else trips.status end,
      updated_at = now()
  where trips.id = p_trip_id;

  return query select v_booking_id, 'pending_request'::public.booking_status;
end;
$$;

revoke all on function public.create_passenger_booking_with_seats(uuid, text[], text) from public;
grant execute on function public.create_passenger_booking_with_seats(uuid, text[], text) to authenticated;
