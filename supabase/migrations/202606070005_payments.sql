-- Phase 6: Payments — atomic proof submit / review / refund + admin bank account.
--
--   1. Platform bank account stored in app_settings (admin-editable), exposed to
--      travelers via get_platform_payment_info().
--   2. submit_payment_proof()  — traveler: insert payment + proof + move booking to
--      payment_review, all in ONE transaction.
--   3. review_payment()        — admin: approve (→confirmed) or reject (→waiting_payment)
--      payment + booking in one transaction.
--   4. refund_payment()        — admin: mark refunded + cancel booking (releases seats).
--
-- Booking transitions reuse set_passenger_booking_status() so the state machine and
-- audit log stay authoritative.

-- ---------------------------------------------------------------------------
-- 1. Platform bank account (admin-configurable)
-- ---------------------------------------------------------------------------
insert into public.app_settings (key, value) values
  ('platform_bank_holder', 'NuudelchinTrip админ'),
  ('platform_bank_name', ''),
  ('platform_bank_account', '')
on conflict (key) do nothing;

create or replace function public.get_platform_payment_info()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'holder',  (select value from public.app_settings where key = 'platform_bank_holder'),
    'bank_name', (select value from public.app_settings where key = 'platform_bank_name'),
    'account', (select value from public.app_settings where key = 'platform_bank_account')
  );
$$;

grant execute on function public.get_platform_payment_info() to authenticated, anon;

-- ---------------------------------------------------------------------------
-- 2. Atomic payment-proof submission (traveler)
-- ---------------------------------------------------------------------------
create or replace function public.submit_payment_proof(
  p_booking_id uuid,
  p_amount integer,
  p_proof_url text,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_booking public.passenger_bookings%rowtype;
  v_payment_id uuid;
begin
  if v_actor is null then
    raise exception 'not_authenticated';
  end if;
  if nullif(btrim(coalesce(p_proof_url, '')), '') is null then
    raise exception 'proof_required';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'invalid_amount';
  end if;

  select * into v_booking from public.passenger_bookings where id = p_booking_id for update;
  if not found then
    raise exception 'booking_not_found';
  end if;
  if v_booking.traveler_id <> v_actor then
    raise exception 'not_your_booking';
  end if;
  if v_booking.status not in ('accepted', 'waiting_payment', 'payment_review') then
    raise exception 'booking_not_payable';
  end if;

  insert into public.payments (user_id, booking_id, amount, status, proof_url)
  values (v_actor, p_booking_id, p_amount, 'proof_uploaded', p_proof_url)
  returning id into v_payment_id;

  insert into public.proofs (user_id, booking_id, proof_type, file_url, note)
  values (v_actor, p_booking_id, 'payment', p_proof_url, nullif(btrim(coalesce(p_note, '')), ''));

  -- Move the booking forward (validated + audited) within the same transaction.
  if v_booking.status <> 'payment_review' then
    perform public.set_passenger_booking_status(p_booking_id, 'payment_review', 'Аялагч төлбөрийн баримт илгээв.');
  end if;

  return v_payment_id;
end;
$$;

revoke all on function public.submit_payment_proof(uuid, integer, text, text) from public;
grant execute on function public.submit_payment_proof(uuid, integer, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Atomic payment review (admin)
-- ---------------------------------------------------------------------------
create or replace function public.review_payment(
  p_payment_id uuid,
  p_approved boolean,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_payment public.payments%rowtype;
begin
  if v_actor is null then
    raise exception 'not_authenticated';
  end if;
  if not public.is_admin() then
    raise exception 'admin_required';
  end if;

  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'payment_not_found';
  end if;
  if v_payment.status not in ('proof_uploaded', 'pending') then
    raise exception 'payment_already_reviewed';
  end if;

  update public.payments
  set status = case when p_approved then 'approved' else 'rejected' end,
      reviewed_by = v_actor,
      reviewed_at = now(),
      admin_note = nullif(btrim(coalesce(p_note, '')), '')
  where id = p_payment_id;

  if v_payment.booking_id is not null then
    perform public.set_passenger_booking_status(
      v_payment.booking_id,
      case when p_approved then 'confirmed' else 'waiting_payment' end,
      case when p_approved then 'Админ төлбөрийг баталгаажуулав.' else 'Админ төлбөрийн баримтыг буцаав.' end
    );
  end if;

  return jsonb_build_object(
    'payment_id', p_payment_id,
    'status', case when p_approved then 'approved' else 'rejected' end
  );
end;
$$;

revoke all on function public.review_payment(uuid, boolean, text) from public;
grant execute on function public.review_payment(uuid, boolean, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Refund (admin)
-- ---------------------------------------------------------------------------
create or replace function public.refund_payment(
  p_payment_id uuid,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_payment public.payments%rowtype;
begin
  if v_actor is null then
    raise exception 'not_authenticated';
  end if;
  if not public.is_admin() then
    raise exception 'admin_required';
  end if;
  if nullif(btrim(coalesce(p_note, '')), '') is null then
    raise exception 'refund_reason_required';
  end if;

  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'payment_not_found';
  end if;
  if v_payment.status = 'refunded' then
    raise exception 'already_refunded';
  end if;

  update public.payments
  set status = 'refunded',
      reviewed_by = v_actor,
      reviewed_at = now(),
      admin_note = btrim(p_note)
  where id = p_payment_id;

  -- Cancel the booking (releases held seats + audit) in the same transaction.
  if v_payment.booking_id is not null then
    perform public.set_passenger_booking_status(v_payment.booking_id, 'cancelled', 'Төлбөр буцаагдсан: ' || btrim(p_note));
  end if;

  return jsonb_build_object('payment_id', p_payment_id, 'status', 'refunded');
end;
$$;

revoke all on function public.refund_payment(uuid, text) from public;
grant execute on function public.refund_payment(uuid, text) to authenticated;
