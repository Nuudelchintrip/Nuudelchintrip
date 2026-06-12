-- Phase 5: Booking lifecycle — validated state machine + audit log.
--
--   1. log_booking_status_change() writes every transition to trip_status_logs
--      (previous/next status, actor, note, timestamp).
--   2. booking_transition_allowed() encodes the legal status graph.
--   3. set_passenger_booking_status() now: validates the transition, checks the
--      actor's role per target status, releases seats on reject/cancel, stamps the
--      matching timestamp, and logs the change. Accepts an optional note.
--
-- All passenger-booking status changes should go through this RPC so the audit
-- trail and the state machine stay authoritative (frontend updated to match).

-- ---------------------------------------------------------------------------
-- 1. Audit log helper
-- ---------------------------------------------------------------------------
create or replace function public.log_booking_status_change(
  p_booking_id uuid,
  p_trip_id uuid,
  p_old text,
  p_new text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.trip_status_logs (trip_id, booking_id, status, changed_by, note)
  values (
    p_trip_id,
    p_booking_id,
    p_new,
    auth.uid(),
    coalesce(nullif(btrim(p_note), ''), p_old || ' → ' || p_new)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Legal transition graph
-- ---------------------------------------------------------------------------
create or replace function public.booking_transition_allowed(
  p_from public.booking_status,
  p_to public.booking_status
)
returns boolean
language sql
immutable
as $$
  select case p_from
    when 'pending_request' then p_to in ('accepted', 'rejected', 'cancelled')
    when 'accepted'        then p_to in ('waiting_payment', 'payment_review', 'cancelled', 'disputed')
    when 'waiting_payment' then p_to in ('payment_review', 'cancelled', 'disputed')
    when 'payment_review'  then p_to in ('confirmed', 'waiting_payment', 'cancelled', 'disputed')
    when 'confirmed'       then p_to in ('on_trip', 'cancelled', 'disputed')
    when 'on_trip'         then p_to in ('completed', 'disputed')
    when 'completed'       then p_to in ('disputed')
    when 'disputed'        then p_to in ('confirmed', 'completed', 'cancelled')
    else false
  end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Validated + audited transition RPC
-- ---------------------------------------------------------------------------
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

  select * into v_booking from public.passenger_bookings where id = p_booking_id for update;
  if not found then
    raise exception 'booking_not_found';
  end if;

  -- No-op guard.
  if v_booking.status = p_status then
    return query select v_booking.id, v_booking.status;
    return;
  end if;

  select * into v_trip from public.trips where id = v_booking.trip_id;
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
      accepted_at  = case when p_status = 'accepted'  then now() else accepted_at  end,
      rejected_at  = case when p_status = 'rejected'  then now() else rejected_at  end,
      cancelled_at = case when p_status = 'cancelled' then now() else cancelled_at end,
      confirmed_at = case when p_status = 'confirmed' then now() else confirmed_at end,
      hold_expires_at = case
        when p_status in ('accepted', 'waiting_payment')
          then now() + make_interval(mins => public.seat_hold_minutes())
        else hold_expires_at
      end,
      updated_at = now()
  where id = p_booking_id;

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

-- Drop the previous 2-arg version so all callers use the audited one.
drop function if exists public.set_passenger_booking_status(uuid, public.booking_status);
