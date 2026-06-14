-- ---------------------------------------------------------------------------
-- 202606130005_dedupe_booking_status_rpc
--
-- Two overloads of set_passenger_booking_status existed:
--   (uuid, booking_status)        -- older, from 202606070003
--   (uuid, booking_status, text)  -- richer, from 202606070004 (state machine
--                                    validation + status-change logging)
-- A 2-arg call from the client matched both -> PostgREST PGRST203 "could not
-- choose the best candidate function".
--
-- Keep ONLY the richer 3-arg version (p_note defaults to null, so 2-arg calls
-- still work), drop the 2-arg overload, and qualify the bare `id` references so
-- they no longer collide with the RETURNS TABLE `id` column (42702).
-- ---------------------------------------------------------------------------

drop function if exists public.set_passenger_booking_status(uuid, public.booking_status);

create or replace function public.set_passenger_booking_status(
  p_booking_id uuid,
  p_status public.booking_status,
  p_note text default null
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

  -- No-op guard.
  if v_booking.status = p_status then
    return query select v_booking.id, v_booking.status;
    return;
  end if;

  select * into v_trip from public.trips where trips.id = v_booking.trip_id;
  v_is_driver := v_trip.driver_id = v_actor;
  v_is_traveler := v_booking.traveler_id = v_actor;

  -- Authorisation per target status.
  if p_status in ('accepted', 'rejected', 'waiting_payment', 'on_trip', 'completed') then
    if not (v_is_driver or v_is_admin) then
      raise exception 'driver_or_admin_required';
    end if;
  elsif p_status = 'payment_review' then
    if not (v_is_traveler or v_is_admin) then
      raise exception 'traveler_or_admin_required';
    end if;
  elsif p_status = 'confirmed' then
    if not v_is_admin then
      raise exception 'admin_required';
    end if;
  elsif p_status in ('cancelled', 'disputed') then
    if not (v_is_driver or v_is_traveler or v_is_admin) then
      raise exception 'not_authorized';
    end if;
  else
    raise exception 'unsupported_status';
  end if;

  -- Transition validity (state machine). Admins may force transitions.
  if not v_is_admin and not public.booking_transition_allowed(v_booking.status, p_status) then
    raise exception 'invalid_transition';
  end if;

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

  if p_status in ('rejected', 'cancelled') then
    perform public.release_seats_for_booking(p_booking_id);
  end if;

  perform public.log_booking_status_change(
    p_booking_id, v_booking.trip_id, v_booking.status::text, p_status::text, p_note
  );

  return query select p_booking_id, p_status;
end;
$$;

revoke all on function public.set_passenger_booking_status(uuid, public.booking_status, text) from public;
grant execute on function public.set_passenger_booking_status(uuid, public.booking_status, text) to authenticated;
