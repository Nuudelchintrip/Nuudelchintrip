-- Fix: review_payment() failed with 42804 ("column status is of type
-- payment_status but expression is of type text") because the CASE
-- expressions resolve to text when every branch is a bare string literal.
-- Cast the CASE results to the target enum types explicitly.

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
  set status = case when p_approved
        then 'approved'::public.payment_status
        else 'rejected'::public.payment_status
      end,
      reviewed_by = v_actor,
      reviewed_at = now(),
      admin_note = nullif(btrim(coalesce(p_note, '')), '')
  where id = p_payment_id;

  if v_payment.booking_id is not null then
    perform public.set_passenger_booking_status(
      v_payment.booking_id,
      case when p_approved
        then 'confirmed'::public.booking_status
        else 'waiting_payment'::public.booking_status
      end,
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
