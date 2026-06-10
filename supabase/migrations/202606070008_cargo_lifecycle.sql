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
