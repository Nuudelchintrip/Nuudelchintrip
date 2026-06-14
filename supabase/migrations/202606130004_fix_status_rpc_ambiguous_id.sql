-- ---------------------------------------------------------------------------
-- 202606130004_fix_status_rpc_ambiguous_id
--
-- set_passenger_booking_status and set_cargo_request_status both RETURN TABLE
-- with an `id` column, so every bare `id` in their bodies collided with that
-- OUT column: "column reference id is ambiguous" (42702) when a driver accepts
-- a seat request (and would do the same for cargo). Fix: qualify each `id`
-- (and the `status` reference) with its table name.
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

  select * into v_booking
  from public.passenger_bookings
  where passenger_bookings.id = p_booking_id
  for update;
  if not found then
    raise exception 'booking_not_found';
  end if;

  select * into v_trip from public.trips where trips.id = v_booking.trip_id;
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
      accepted_at  = case when p_status = 'accepted'  then now() else passenger_bookings.accepted_at  end,
      rejected_at  = case when p_status = 'rejected'  then now() else passenger_bookings.rejected_at  end,
      cancelled_at = case when p_status = 'cancelled' then now() else passenger_bookings.cancelled_at end,
      confirmed_at = case when p_status = 'confirmed' then now() else passenger_bookings.confirmed_at end,
      hold_expires_at = case
        when p_status in ('accepted', 'waiting_payment')
          then now() + make_interval(mins => public.seat_hold_minutes())
        else passenger_bookings.hold_expires_at
      end,
      updated_at = now()
  where passenger_bookings.id = p_booking_id;

  -- Release seats when the booking ends without travelling.
  if p_status in ('rejected', 'cancelled') then
    perform public.release_seats_for_booking(p_booking_id);
  end if;

  return query select p_booking_id, p_status;
end;
$$;

revoke all on function public.set_passenger_booking_status(uuid, public.booking_status) from public;
grant execute on function public.set_passenger_booking_status(uuid, public.booking_status) to authenticated;

-- ---------------------------------------------------------------------------
-- Same class of bug in the cargo status transition RPC.
-- ---------------------------------------------------------------------------
create or replace function public.set_cargo_request_status(
  p_cargo_id uuid,
  p_status public.cargo_status,
  p_note text default null
)
returns table(id uuid, status public.cargo_status)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_cargo public.cargo_requests%rowtype;
  v_trip public.trips%rowtype;
  v_is_driver boolean;
  v_is_sender boolean;
  v_is_admin boolean := public.is_admin();
begin
  if v_actor is null then raise exception 'not_authenticated'; end if;

  select * into v_cargo
  from public.cargo_requests
  where cargo_requests.id = p_cargo_id
  for update;

  if not found then raise exception 'cargo_not_found'; end if;
  if v_cargo.status = p_status then
    return query select v_cargo.id, v_cargo.status;
    return;
  end if;

  select * into v_trip from public.trips where trips.id = v_cargo.trip_id;
  v_is_driver := v_trip.driver_id = v_actor;
  v_is_sender := v_cargo.sender_id = v_actor;

  if p_status in ('cargo_accepted', 'rejected', 'waiting_payment', 'picked_up', 'in_transit') then
    if not (v_is_driver or v_is_admin) then raise exception 'driver_or_admin_required'; end if;
  elsif p_status = 'completed' then
    if not (v_is_sender or v_is_admin) then raise exception 'sender_or_admin_required'; end if;
  elsif p_status = 'payment_review' then
    if not (v_is_sender or v_is_admin) then raise exception 'sender_or_admin_required'; end if;
  elsif p_status in ('cancelled', 'disputed') then
    if not (v_is_driver or v_is_sender or v_is_admin) then raise exception 'not_authorized'; end if;
  else
    raise exception 'unsupported_status';
  end if;

  if not v_is_admin and not public.cargo_transition_allowed(v_cargo.status, p_status) then
    raise exception 'invalid_transition';
  end if;

  update public.cargo_requests
  set status = p_status, updated_at = now()
  where cargo_requests.id = p_cargo_id;

  perform public.log_cargo_status_change(
    p_cargo_id,
    v_cargo.trip_id,
    v_cargo.status::text,
    p_status::text,
    p_note
  );

  return query select p_cargo_id, p_status;
end;
$$;

revoke all on function public.set_cargo_request_status(uuid, public.cargo_status, text) from public;
grant execute on function public.set_cargo_request_status(uuid, public.cargo_status, text) to authenticated;
