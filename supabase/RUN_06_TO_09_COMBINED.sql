-- ============================================================
-- NuudelchinTrip — migrations 06 → 07 → 08 → 09 (нэг дор Run)
-- Бүгд idempotent: дахин ажиллуулж болно.
-- ============================================================


-- ========== 202606070006_trip_lifecycle.sql ==========

-- Phase 7: Trip start / end — driver actions, 6-digit verify code, timestamps, audit.
--
--   1. passenger_bookings gains a per-booking 6-digit trip_code (shown to traveler)
--      plus started_at / completed_at timestamps.
--   2. start_passenger_trip()    — driver: confirmed → on_trip (+ started_at, audit).
--   3. complete_passenger_trip()  — driver enters the traveler's trip_code:
--      on_trip → completed (+ completed_at, audit, bumps driver completed_trips).
--
-- Transitions are validated inline (status guards) and logged via
-- log_booking_status_change(); seats stay consumed (no release on completion).

-- ---------------------------------------------------------------------------
-- 1. Columns
-- ---------------------------------------------------------------------------
alter table public.passenger_bookings
  add column if not exists trip_code text not null default lpad((floor(random() * 1000000))::int::text, 6, '0'),
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz;

-- ---------------------------------------------------------------------------
-- 2. Start a passenger's trip
-- ---------------------------------------------------------------------------
create or replace function public.start_passenger_trip(p_booking_id uuid)
returns table(id uuid, status public.booking_status)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_booking public.passenger_bookings%rowtype;
  v_trip public.trips%rowtype;
begin
  if v_actor is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_booking from public.passenger_bookings where id = p_booking_id for update;
  if not found then
    raise exception 'booking_not_found';
  end if;

  select * into v_trip from public.trips where id = v_booking.trip_id;
  if not (v_trip.driver_id = v_actor or public.is_admin()) then
    raise exception 'driver_or_admin_required';
  end if;
  if v_booking.status <> 'confirmed' then
    raise exception 'booking_not_confirmed';
  end if;

  update public.passenger_bookings
  set status = 'on_trip', started_at = now(), updated_at = now()
  where id = p_booking_id;

  perform public.log_booking_status_change(
    p_booking_id, v_booking.trip_id, v_booking.status::text, 'on_trip', 'Жолооч аялал эхлүүлэв.'
  );

  return query select p_booking_id, 'on_trip'::public.booking_status;
end;
$$;

revoke all on function public.start_passenger_trip(uuid) from public;
grant execute on function public.start_passenger_trip(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Complete a passenger's trip with their 6-digit code
-- ---------------------------------------------------------------------------
create or replace function public.complete_passenger_trip(p_booking_id uuid, p_code text)
returns table(id uuid, status public.booking_status)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_booking public.passenger_bookings%rowtype;
  v_trip public.trips%rowtype;
  v_code text := nullif(regexp_replace(coalesce(p_code, ''), '\D', '', 'g'), '');
begin
  if v_actor is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_booking from public.passenger_bookings where id = p_booking_id for update;
  if not found then
    raise exception 'booking_not_found';
  end if;

  select * into v_trip from public.trips where id = v_booking.trip_id;
  if not (v_trip.driver_id = v_actor or public.is_admin()) then
    raise exception 'driver_or_admin_required';
  end if;
  if v_booking.status <> 'on_trip' then
    raise exception 'booking_not_on_trip';
  end if;
  if v_code is null or v_code <> v_booking.trip_code then
    raise exception 'invalid_trip_code';
  end if;

  update public.passenger_bookings
  set status = 'completed', completed_at = now(), updated_at = now()
  where id = p_booking_id;

  -- Bump the driver's completed-trip counter (guarded column → bypass).
  perform set_config('app.guard_bypass', 'on', true);
  update public.driver_profiles
  set completed_trips = completed_trips + 1, updated_at = now()
  where user_id = v_trip.driver_id;
  perform set_config('app.guard_bypass', 'off', true);

  perform public.log_booking_status_change(
    p_booking_id, v_booking.trip_id, v_booking.status::text, 'completed', 'Аялал дуусч, код баталгаажлаа.'
  );

  return query select p_booking_id, 'completed'::public.booking_status;
end;
$$;

revoke all on function public.complete_passenger_trip(uuid, text) from public;
grant execute on function public.complete_passenger_trip(uuid, text) to authenticated;


-- ========== 202606070007_notifications.sql ==========

-- Phase 8: Notifications & logs — in-app notifications + admin alerts.
--
--   1. notifications gains event_type + deeplink (recipient/read_at already exist).
--   2. create_notification() / notify_admins() helpers (SECURITY DEFINER; the table
--      has no INSERT policy so only these trusted functions can write).
--   3. Triggers auto-create notifications on the events that already flow through the
--      DB: new seat request, booking status changes (accept/reject/payment/confirm/
--      trip start/end/cancel), and driver verification decisions.
--
-- Audit history (trip_status_logs) was wired in Phase 5; this adds the user-facing
-- "what happened / what's next" layer on top.

-- ---------------------------------------------------------------------------
-- 1. Columns
-- ---------------------------------------------------------------------------
alter table public.notifications
  add column if not exists event_type text,
  add column if not exists deeplink text;

create index if not exists idx_notifications_user_unread
  on public.notifications (user_id, created_at desc)
  where read_at is null;

-- ---------------------------------------------------------------------------
-- 2. Helpers
-- ---------------------------------------------------------------------------
create or replace function public.create_notification(
  p_user_id uuid,
  p_title text,
  p_body text,
  p_event_type text default null,
  p_deeplink text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    return;
  end if;
  insert into public.notifications (user_id, title, body, event_type, deeplink)
  values (p_user_id, p_title, p_body, p_event_type, p_deeplink);
end;
$$;

create or replace function public.notify_admins(
  p_title text,
  p_body text,
  p_event_type text default null,
  p_deeplink text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, title, body, event_type, deeplink)
  select id, p_title, p_body, p_event_type, p_deeplink
  from public.profiles
  where role = 'admin' and is_suspended = false;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3a. New seat request → notify driver
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_booking_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_driver uuid;
  v_route text;
begin
  select driver_id, from_location || ' → ' || to_location
    into v_driver, v_route
  from public.trips where id = new.trip_id;

  perform public.create_notification(
    v_driver,
    'Шинэ суудлын хүсэлт',
    v_route || ' чиглэлд ' || new.seats_requested || ' суудлын хүсэлт ирлээ.',
    'booking_request',
    '/driver/requests'
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_booking_insert on public.passenger_bookings;
create trigger trg_notify_booking_insert
after insert on public.passenger_bookings
for each row execute function public.notify_on_booking_insert();

-- ---------------------------------------------------------------------------
-- 3b. Booking status change → notify traveler / driver / admins
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_booking_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_traveler uuid := new.traveler_id;
  v_driver uuid;
  v_route text;
  v_link text := '/dashboard/bookings/' || new.id;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  select driver_id, from_location || ' → ' || to_location
    into v_driver, v_route
  from public.trips where id = new.trip_id;

  if new.status = 'accepted' then
    perform public.create_notification(v_traveler, 'Хүсэлт зөвшөөрөгдлөө',
      v_route || ': жолооч зөвшөөрлөө. Төлбөрийн баримтаа илгээнэ үү.', 'booking_accepted', v_link);
  elsif new.status = 'rejected' then
    perform public.create_notification(v_traveler, 'Хүсэлт татгалзагдлаа',
      v_route || ': жолооч хүсэлтийг татгалзлаа.', 'booking_rejected', v_link);
  elsif new.status = 'payment_review' then
    perform public.notify_admins('Шинэ төлбөрийн баримт',
      v_route || ' захиалгын төлбөрийн баримт шалгуулахаар ирлээ.', 'payment_review', '/admin/payments');
  elsif new.status = 'confirmed' then
    perform public.create_notification(v_traveler, 'Захиалга баталгаажлаа',
      v_route || ': төлбөр баталгаажиж, аялал баталгаажлаа.', 'booking_confirmed', v_link);
  elsif new.status = 'on_trip' then
    perform public.create_notification(v_traveler, 'Аялал эхэллээ',
      v_route || ': аялал эхэллээ. Дуусахад 6 оронтой кодоо жолоочид өгнө үү.', 'trip_started', v_link);
  elsif new.status = 'completed' then
    perform public.create_notification(v_traveler, 'Аялал дууслаа',
      v_route || ': аялал амжилттай дууслаа. Үнэлгээ өгөөрэй.', 'trip_completed', v_link);
  elsif new.status = 'cancelled' then
    perform public.create_notification(v_traveler, 'Захиалга цуцлагдлаа', v_route || ': захиалга цуцлагдлаа.', 'booking_cancelled', v_link);
    perform public.create_notification(v_driver, 'Захиалга цуцлагдлаа', v_route || ': нэг захиалга цуцлагдаж суудал чөлөөлөгдлөө.', 'booking_cancelled', '/driver/requests');
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_booking_status on public.passenger_bookings;
create trigger trg_notify_booking_status
after update on public.passenger_bookings
for each row execute function public.notify_on_booking_status();

-- ---------------------------------------------------------------------------
-- 3c. Driver verification decision → notify driver
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_driver_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.verification_status is not distinct from old.verification_status then
    return new;
  end if;

  if new.verification_status = 'approved' then
    perform public.create_notification(new.user_id, 'Баталгаажуулалт зөвшөөрөгдлөө',
      'Таны жолоочийн бүртгэл баталгаажлаа. Одоо чиглэл нийтлэх боломжтой.', 'driver_approved', '/dashboard/driver');
  elsif new.verification_status = 'rejected' then
    perform public.create_notification(new.user_id, 'Баталгаажуулалт буцаагдлаа',
      coalesce('Шалтгаан: ' || new.rejection_reason, 'Бичиг баримтаа засаад дахин илгээнэ үү.'), 'driver_rejected', '/onboarding/driver');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_driver_verification on public.driver_profiles;
create trigger trg_notify_driver_verification
after update on public.driver_profiles
for each row execute function public.notify_on_driver_verification();


-- ========== 202606070008_cargo_lifecycle.sql ==========

-- Phase 9: Cargo lifecycle — validated state machine, delivery-code completion,
-- audit log, and notifications (mirrors the passenger-booking lifecycle).
--
--   1. log_cargo_status_change() → trip_status_logs (cargo_request_id).
--   2. cargo_transition_allowed() state graph.
--   3. set_cargo_request_status() — role-validated transition + audit.
--   4. complete_cargo_delivery() — driver enters the receiver's delivery_code:
--      in_transit → delivered.
--   5. cargo notification triggers (new request → driver; status change → sender).

-- ---------------------------------------------------------------------------
-- 1. Audit helper
-- ---------------------------------------------------------------------------
create or replace function public.log_cargo_status_change(
  p_cargo_id uuid, p_trip_id uuid, p_old text, p_new text, p_note text default null
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.trip_status_logs (trip_id, cargo_request_id, status, changed_by, note)
  values (p_trip_id, p_cargo_id, p_new, auth.uid(), coalesce(nullif(btrim(p_note), ''), p_old || ' → ' || p_new));
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Transition graph
-- ---------------------------------------------------------------------------
create or replace function public.cargo_transition_allowed(
  p_from public.cargo_status, p_to public.cargo_status
)
returns boolean language sql immutable as $$
  select case p_from
    when 'cargo_requested' then p_to in ('cargo_accepted', 'rejected', 'cancelled')
    when 'cargo_accepted'  then p_to in ('waiting_payment', 'payment_review', 'cancelled')
    when 'waiting_payment' then p_to in ('payment_review', 'cancelled')
    when 'payment_review'  then p_to in ('picked_up', 'waiting_payment', 'cancelled')
    when 'picked_up'       then p_to in ('in_transit', 'cancelled', 'disputed')
    when 'in_transit'      then p_to in ('delivered', 'disputed')
    when 'delivered'       then p_to in ('completed', 'disputed')
    when 'completed'       then p_to in ('disputed')
    when 'disputed'        then p_to in ('completed', 'cancelled')
    else false
  end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Validated transition RPC
-- ---------------------------------------------------------------------------
create or replace function public.set_cargo_request_status(
  p_cargo_id uuid, p_status public.cargo_status, p_note text default null
)
returns table(id uuid, status public.cargo_status)
language plpgsql security definer set search_path = public
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

  select * into v_cargo from public.cargo_requests where id = p_cargo_id for update;
  if not found then raise exception 'cargo_not_found'; end if;
  if v_cargo.status = p_status then
    return query select v_cargo.id, v_cargo.status; return;
  end if;

  select * into v_trip from public.trips where id = v_cargo.trip_id;
  v_is_driver := v_trip.driver_id = v_actor;
  v_is_sender := v_cargo.sender_id = v_actor;

  if p_status in ('cargo_accepted', 'rejected', 'waiting_payment', 'picked_up', 'in_transit', 'completed') then
    if not (v_is_driver or v_is_admin) then raise exception 'driver_or_admin_required'; end if;
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

  update public.cargo_requests set status = p_status, updated_at = now() where id = p_cargo_id;
  perform public.log_cargo_status_change(p_cargo_id, v_cargo.trip_id, v_cargo.status::text, p_status::text, p_note);

  return query select p_cargo_id, p_status;
end;
$$;

revoke all on function public.set_cargo_request_status(uuid, public.cargo_status, text) from public;
grant execute on function public.set_cargo_request_status(uuid, public.cargo_status, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Delivery completion with receiver's code
-- ---------------------------------------------------------------------------
create or replace function public.complete_cargo_delivery(p_cargo_id uuid, p_code text)
returns table(id uuid, status public.cargo_status)
language plpgsql security definer set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_cargo public.cargo_requests%rowtype;
  v_trip public.trips%rowtype;
  v_code text := nullif(regexp_replace(coalesce(p_code, ''), '\D', '', 'g'), '');
begin
  if v_actor is null then raise exception 'not_authenticated'; end if;

  select * into v_cargo from public.cargo_requests where id = p_cargo_id for update;
  if not found then raise exception 'cargo_not_found'; end if;

  select * into v_trip from public.trips where id = v_cargo.trip_id;
  if not (v_trip.driver_id = v_actor or public.is_admin()) then raise exception 'driver_or_admin_required'; end if;
  if v_cargo.status <> 'in_transit' then raise exception 'cargo_not_in_transit'; end if;
  if v_code is null or v_code <> v_cargo.delivery_code then raise exception 'invalid_delivery_code'; end if;

  update public.cargo_requests set status = 'delivered', updated_at = now() where id = p_cargo_id;
  perform public.log_cargo_status_change(p_cargo_id, v_cargo.trip_id, v_cargo.status::text, 'delivered', 'Хүргэлт код баталгаажлаа.');

  return query select p_cargo_id, 'delivered'::public.cargo_status;
end;
$$;

revoke all on function public.complete_cargo_delivery(uuid, text) from public;
grant execute on function public.complete_cargo_delivery(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Notifications
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_cargo_insert()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_driver uuid; v_route text;
begin
  select driver_id, from_location || ' → ' || to_location into v_driver, v_route
  from public.trips where id = new.trip_id;
  perform public.create_notification(v_driver, 'Шинэ дайвар ачааны хүсэлт',
    v_route || ': ' || new.cargo_name || ' ачаа дайх хүсэлт ирлээ.', 'cargo_request', '/dashboard/driver/cargo-requests');
  return new;
end;
$$;

drop trigger if exists trg_notify_cargo_insert on public.cargo_requests;
create trigger trg_notify_cargo_insert
after insert on public.cargo_requests
for each row execute function public.notify_on_cargo_insert();

create or replace function public.notify_on_cargo_status()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_sender uuid := new.sender_id;
  v_route text;
  v_link text := '/dashboard/cargo/requests';
begin
  if new.status is not distinct from old.status then return new; end if;
  select from_location || ' → ' || to_location into v_route from public.trips where id = new.trip_id;

  if new.status = 'cargo_accepted' then
    perform public.create_notification(v_sender, 'Ачааны хүсэлт зөвшөөрөгдлөө', v_route || ': жолооч зөвшөөрлөө. Төлбөрөө илгээнэ үү.', 'cargo_accepted', v_link);
  elsif new.status = 'rejected' then
    perform public.create_notification(v_sender, 'Ачааны хүсэлт татгалзагдлаа', v_route || ': жолооч татгалзлаа.', 'cargo_rejected', v_link);
  elsif new.status = 'payment_review' then
    perform public.notify_admins('Шинэ ачааны төлбөрийн баримт', v_route || ' ачааны төлбөр шалгуулахаар ирлээ.', 'payment_review', '/admin/payments');
  elsif new.status = 'picked_up' then
    perform public.create_notification(v_sender, 'Ачаа авлаа', v_route || ': төлбөр баталгаажиж, жолооч ачааг авлаа.', 'cargo_picked_up', v_link);
  elsif new.status = 'in_transit' then
    perform public.create_notification(v_sender, 'Ачаа замдаа гарлаа', v_route || ': ачаа тээвэрлэгдэж байна.', 'cargo_in_transit', v_link);
  elsif new.status = 'delivered' then
    perform public.create_notification(v_sender, 'Ачаа хүргэгдлээ', v_route || ': ачаа хүлээн авагчид амжилттай хүргэгдлээ.', 'cargo_delivered', v_link);
  elsif new.status = 'cancelled' then
    perform public.create_notification(v_sender, 'Ачааны захиалга цуцлагдлаа', v_route || ': захиалга цуцлагдлаа.', 'cargo_cancelled', v_link);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_cargo_status on public.cargo_requests;
create trigger trg_notify_cargo_status
after update on public.cargo_requests
for each row execute function public.notify_on_cargo_status();


-- ========== 202606070009_rls_hardening.sql ==========

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

