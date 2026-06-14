-- Fix ambiguous `id` references in cargo delivery confirmation.
create or replace function public.complete_cargo_delivery(p_cargo_id uuid, p_code text)
returns table(id uuid, status public.cargo_status)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_cargo public.cargo_requests%rowtype;
  v_trip public.trips%rowtype;
  v_code text := nullif(regexp_replace(coalesce(p_code, ''), '\D', '', 'g'), '');
begin
  if v_actor is null then
    raise exception 'not_authenticated';
  end if;

  select cr.*
  into v_cargo
  from public.cargo_requests as cr
  where cr.id = p_cargo_id
  for update;

  if not found then
    raise exception 'cargo_not_found';
  end if;

  select t.*
  into v_trip
  from public.trips as t
  where t.id = v_cargo.trip_id;

  if not (v_trip.driver_id = v_actor or public.is_admin()) then
    raise exception 'driver_or_admin_required';
  end if;

  if v_cargo.status <> 'in_transit' then
    raise exception 'cargo_not_in_transit';
  end if;

  if v_code is null or v_code <> v_cargo.delivery_code then
    raise exception 'invalid_delivery_code';
  end if;

  update public.cargo_requests as cr
  set status = 'delivered',
      updated_at = now()
  where cr.id = p_cargo_id;

  perform public.log_cargo_status_change(
    p_cargo_id,
    v_cargo.trip_id,
    v_cargo.status::text,
    'delivered',
    'Хүлээн авагчийн кодоор хүргэлт баталгаажлаа.'
  );

  return query
  select p_cargo_id, 'delivered'::public.cargo_status;
end;
$$;

revoke all on function public.complete_cargo_delivery(uuid, text) from public;
grant execute on function public.complete_cargo_delivery(uuid, text) to authenticated;
