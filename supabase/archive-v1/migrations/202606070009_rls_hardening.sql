-- Phase 11: Security hardening — close direct-write holes in RLS.
--
-- Problem: the original policies let a traveler/driver/sender directly UPDATE
-- passenger_bookings / cargo_requests (any column → bypass the validated state
-- machine, e.g. set status='confirmed' without paying) and directly INSERT rows
-- with an arbitrary status/code. All legitimate writes now go through SECURITY
-- DEFINER RPCs (which run as table owner and bypass RLS), so we can safely lock
-- direct client writes down to admin-only.

-- ---------------------------------------------------------------------------
-- passenger_bookings: no direct client INSERT/UPDATE (RPC-only)
-- ---------------------------------------------------------------------------
drop policy if exists "travelers create bookings" on public.passenger_bookings;
-- (creation only via create_passenger_booking_with_seats)

drop policy if exists "bookings update participant admin" on public.passenger_bookings;
drop policy if exists "bookings update admin only" on public.passenger_bookings;
create policy "bookings update admin only" on public.passenger_bookings
for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- cargo_requests: creation via RPC, no direct client INSERT/UPDATE
-- ---------------------------------------------------------------------------
create or replace function public.create_cargo_request(
  p_trip_id uuid,
  p_cargo_name text,
  p_cargo_type text default null,
  p_size_note text default null,
  p_weight_kg numeric default null,
  p_receiver_name text default null,
  p_receiver_phone text default null,
  p_pickup_note text default null
)
returns table(id uuid, status public.cargo_status, delivery_code text)
language plpgsql security definer set search_path = public
as $$
declare
  v_sender uuid := auth.uid();
  v_new_id uuid;
begin
  if v_sender is null then raise exception 'not_authenticated'; end if;
  if nullif(btrim(coalesce(p_cargo_name, '')), '') is null then raise exception 'cargo_name_required'; end if;
  if nullif(btrim(coalesce(p_receiver_name, '')), '') is null then raise exception 'receiver_required'; end if;
  if nullif(btrim(coalesce(p_receiver_phone, '')), '') is null then raise exception 'receiver_phone_required'; end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = v_sender and p.role = 'cargo_sender'
      and p.phone_verified = true and p.cargo_policy_accepted = true and p.is_suspended = false
  ) then
    raise exception 'cargo_sender_required';
  end if;

  if not exists (
    select 1 from public.trips t where t.id = p_trip_id and t.allows_cargo = true and t.status = 'active'
  ) then
    raise exception 'trip_not_cargo_enabled';
  end if;

  insert into public.cargo_requests (
    trip_id, sender_id, cargo_name, cargo_type, size_note, weight_kg,
    receiver_name, receiver_phone, pickup_note, status
  )
  values (
    p_trip_id, v_sender, btrim(p_cargo_name), nullif(btrim(coalesce(p_cargo_type, '')), ''),
    nullif(btrim(coalesce(p_size_note, '')), ''), p_weight_kg,
    btrim(p_receiver_name), btrim(p_receiver_phone), nullif(btrim(coalesce(p_pickup_note, '')), ''),
    'cargo_requested'
  )
  returning cargo_requests.id into v_new_id;

  return query
    select c.id, c.status, c.delivery_code from public.cargo_requests c where c.id = v_new_id;
end;
$$;

revoke all on function public.create_cargo_request(uuid, text, text, text, numeric, text, text, text) from public;
grant execute on function public.create_cargo_request(uuid, text, text, text, numeric, text, text, text) to authenticated;

drop policy if exists "cargo senders create on cargo trips" on public.cargo_requests;
-- (creation only via create_cargo_request)

drop policy if exists "cargo update participant admin" on public.cargo_requests;
drop policy if exists "cargo update admin only" on public.cargo_requests;
create policy "cargo update admin only" on public.cargo_requests
for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- payments: clients may only insert an unreviewed proof row (not approved/refunded)
-- ---------------------------------------------------------------------------
drop policy if exists "payments create own" on public.payments;
drop policy if exists "payments create own pending" on public.payments;
create policy "payments create own pending" on public.payments
for insert with check (
  user_id = auth.uid()
  and status in ('pending', 'proof_uploaded')
);
