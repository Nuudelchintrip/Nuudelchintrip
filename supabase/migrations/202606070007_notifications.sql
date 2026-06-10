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
