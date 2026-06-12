-- Persist account notification/privacy settings and let the cargo sender
-- confirm the final delivered -> completed transition.

alter table public.profiles
  add column if not exists notification_preferences jsonb not null default
    '{
      "bookingRequests": true,
      "driverResponses": true,
      "paymentUpdates": true,
      "tripReminders": true,
      "reviewReminders": true,
      "cargoUpdates": true
    }'::jsonb,
  add column if not exists privacy_preferences jsonb not null default
    '{
      "phoneVisibility": "accepted",
      "requestVisibility": "matched",
      "reviewsPublic": true,
      "reportsPrivate": true
    }'::jsonb;

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
declare
  v_preferences jsonb;
  v_preference_key text;
begin
  if p_user_id is null then
    return;
  end if;

  select notification_preferences
    into v_preferences
  from public.profiles
  where id = p_user_id;

  v_preference_key := case
    when p_event_type = 'booking_request' then 'bookingRequests'
    when p_event_type in ('booking_accepted', 'booking_rejected', 'booking_cancelled') then 'driverResponses'
    when p_event_type in ('booking_confirmed', 'payment_approved') then 'paymentUpdates'
    when p_event_type = 'trip_started' then 'tripReminders'
    when p_event_type = 'trip_completed' then 'reviewReminders'
    when p_event_type like 'cargo_%' then 'cargoUpdates'
    else null
  end;

  if v_preference_key is not null
    and coalesce((v_preferences ->> v_preference_key)::boolean, true) = false then
    return;
  end if;

  insert into public.notifications (user_id, title, body, event_type, deeplink)
  values (p_user_id, p_title, p_body, p_event_type, p_deeplink);
end;
$$;

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
  where id = p_cargo_id
  for update;

  if not found then raise exception 'cargo_not_found'; end if;
  if v_cargo.status = p_status then
    return query select v_cargo.id, v_cargo.status;
    return;
  end if;

  select * into v_trip from public.trips where id = v_cargo.trip_id;
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
  where id = p_cargo_id;

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

create or replace function public.notify_on_cargo_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender uuid := new.sender_id;
  v_driver uuid;
  v_route text;
  v_link text := '/cargo/' || new.id;
begin
  if new.status is not distinct from old.status then return new; end if;

  select driver_id, from_location || ' → ' || to_location
    into v_driver, v_route
  from public.trips
  where id = new.trip_id;

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
    perform public.create_notification(v_sender, 'Ачаа хүргэгдлээ', v_route || ': ачаагаа хүлээн авснаа баталгаажуулна уу.', 'cargo_delivered', v_link);
  elsif new.status = 'completed' then
    perform public.create_notification(v_driver, 'Ачаа хүлээн авсан нь баталгаажлаа', v_route || ': илгээгч ачаагаа хүлээн авснаа баталгаажууллаа.', 'cargo_completed', '/dashboard/driver/cargo-requests');
  elsif new.status = 'cancelled' then
    perform public.create_notification(v_sender, 'Ачааны захиалга цуцлагдлаа', v_route || ': захиалга цуцлагдлаа.', 'cargo_cancelled', v_link);
  end if;

  return new;
end;
$$;
