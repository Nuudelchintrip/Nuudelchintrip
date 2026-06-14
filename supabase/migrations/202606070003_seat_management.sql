-- Phase 4: Seat management — timed holds + automatic release.
--
--   1. passenger_bookings gains hold_expires_at + state-transition timestamps
--      (accepted_at / rejected_at / cancelled_at / confirmed_at / seats_released_at).
--   2. release_seats_for_booking() puts a booking's seats back on the trip (once).
--   3. create_passenger_booking_with_seats now stamps hold_expires_at and lazily
--      expires stale holds before taking new seats.
--   4. set_passenger_booking_status() — role-validated transition RPC that releases
--      seats on reject/cancel and records timestamps (replaces the raw client update).
--   5. expire_stale_seat_holds() — sweeper that releases + cancels holds past expiry.
--
-- Hold window is configurable via app_settings('seat_hold_minutes'), default 720 (12h).

insert into public.app_settings (key, value)
values ('seat_hold_minutes', '720')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 1. Columns
-- ---------------------------------------------------------------------------
alter table public.passenger_bookings
  add column if not exists hold_expires_at timestamptz,
  add column if not exists accepted_at timestamptz,
  add column if not exists rejected_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists confirmed_at timestamptz,
  add column if not exists seats_released_at timestamptz;

create index if not exists idx_bookings_hold_expiry
  on public.passenger_bookings (hold_expires_at)
  where seats_released_at is null;

-- ---------------------------------------------------------------------------
-- Helper: hold window in minutes
-- ---------------------------------------------------------------------------
create or replace function public.seat_hold_minutes()
returns integer
language sql
stable
set search_path = public
as $$
  select coalesce((select value::int from public.app_settings where key = 'seat_hold_minutes'), 720);
$$;

-- ---------------------------------------------------------------------------
-- 2. Release a booking's seats back to its trip (idempotent)
-- ---------------------------------------------------------------------------
create or replace function public.release_seats_for_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.passenger_bookings%rowtype;
  v_trip public.trips%rowtype;
  v_merged text[];
begin
  select * into v_booking
  from public.passenger_bookings
  where id = p_booking_id
  for update;

  if not found or v_booking.seats_released_at is not null then
    return; -- nothing to release or already released
  end if;

  select * into v_trip from public.trips where id = v_booking.trip_id for update;
  if found then
    -- Merge the released seats back, de-duplicated and naturally sorted.
    select coalesce(array_agg(seat order by length(seat), seat), array[]::text[])
      into v_merged
    from (
      select distinct seat
      from unnest(coalesce(v_trip.available_seat_labels, array[]::text[])
                  || coalesce(v_booking.selected_seats, array[]::text[])) as seat
      where trim(seat) <> ''
    ) s;

    update public.trips
    set available_seat_labels = v_merged,
        seats_available = least(seats_total, seats_available + coalesce(v_booking.seats_requested, 0)),
        status = case
          when status = 'full' and least(seats_total, seats_available + coalesce(v_booking.seats_requested, 0)) > 0
            then 'active'
          else status
        end,
        updated_at = now()
    where id = v_trip.id;
  end if;

  update public.passenger_bookings
  set seats_released_at = now(), updated_at = now()
  where id = p_booking_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Expire stale holds (pending / awaiting payment past hold_expires_at)
-- ---------------------------------------------------------------------------
create or replace function public.expire_stale_seat_holds()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  n integer := 0;
begin
  for r in
    select id from public.passenger_bookings
    where status in ('pending_request', 'accepted', 'waiting_payment')
      and seats_released_at is null
      and hold_expires_at is not null
      and hold_expires_at < now()
    for update skip locked
  loop
    perform public.release_seats_for_booking(r.id);
    update public.passenger_bookings
    set status = 'cancelled', cancelled_at = now(), updated_at = now()
    where id = r.id;
    n := n + 1;
  end loop;
  return n;
end;
$$;

grant execute on function public.expire_stale_seat_holds() to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Booking creation: stamp hold_expires_at + lazily expire stale holds first
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
      status = case when greatest(0, seats_available - v_requested) = 0 then 'full' else status end,
      updated_at = now()
  where trips.id = p_trip_id;

  return query select v_booking_id, 'pending_request'::public.booking_status;
end;
$$;

grant execute on function public.create_passenger_booking_with_seats(uuid, text[], text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Role-validated status transition with seat release
-- ---------------------------------------------------------------------------
create or replace function public.set_passenger_booking_status(
  p_booking_id uuid,
  p_status public.booking_status
)
returns table(id uuid, status public.booking_status)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_booking public.passenger_bookings%rowtype;
  v_trip public.trips%rowtype;
  v_is_driver boolean;
  v_is_traveler boolean;
  v_is_admin boolean := public.is_admin();
begin
  if v_actor is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_booking from public.passenger_bookings where id = p_booking_id for update;
  if not found then
    raise exception 'booking_not_found';
  end if;

  select * into v_trip from public.trips where id = v_booking.trip_id;
  v_is_driver := v_trip.driver_id = v_actor;
  v_is_traveler := v_booking.traveler_id = v_actor;

  -- Authorisation per target status.
  if p_status in ('accepted', 'rejected', 'waiting_payment', 'confirmed') then
    if not (v_is_driver or v_is_admin) then
      raise exception 'driver_or_admin_required';
    end if;
  elsif p_status = 'cancelled' then
    if not (v_is_driver or v_is_traveler or v_is_admin) then
      raise exception 'not_authorized';
    end if;
  else
    raise exception 'unsupported_status';
  end if;

  -- Apply status + matching timestamp.
  update public.passenger_bookings
  set status = p_status,
      accepted_at  = case when p_status = 'accepted'  then now() else accepted_at  end,
      rejected_at  = case when p_status = 'rejected'  then now() else rejected_at  end,
      cancelled_at = case when p_status = 'cancelled' then now() else cancelled_at end,
      confirmed_at = case when p_status = 'confirmed' then now() else confirmed_at end,
      -- Extend the hold when the driver accepts so the traveler has time to pay.
      hold_expires_at = case
        when p_status in ('accepted', 'waiting_payment')
          then now() + make_interval(mins => public.seat_hold_minutes())
        else hold_expires_at
      end,
      updated_at = now()
  where id = p_booking_id;

  -- Release seats when the booking ends without travelling.
  if p_status in ('rejected', 'cancelled') then
    perform public.release_seats_for_booking(p_booking_id);
  end if;

  return query select p_booking_id, p_status;
end;
$$;

revoke all on function public.set_passenger_booking_status(uuid, public.booking_status) from public;
grant execute on function public.set_passenger_booking_status(uuid, public.booking_status) to authenticated;
