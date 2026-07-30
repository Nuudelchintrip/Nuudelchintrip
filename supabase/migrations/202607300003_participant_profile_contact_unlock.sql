-- Fix: contact info stayed locked on participant profiles even after a
-- booking was confirmed. Recreate get_participant_public_profile so it is
-- guaranteed to exist on the live DB, and improve the unlock gate:
--
--   * contact unlocks once the OTHER SIDE HAS ACCEPTED (accepted →
--     completed for seat bookings) — not for pending/rejected/cancelled;
--   * cargo relationships (sender ↔ driver) now unlock contact too, which
--     the old version ignored entirely.
--
-- Apply manually in the Supabase SQL Editor.

create or replace function public.get_participant_public_profile(p_user_id uuid)
returns table (
  id uuid,
  role public.user_role,
  full_name text,
  phone text,
  email text,
  phone_verified boolean,
  avatar_url text,
  driver_verification_status public.driver_verification_status,
  car_model text,
  plate_number text,
  seats integer,
  rating numeric,
  completed_trips integer
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_actor uuid := auth.uid();
  v_linked boolean;
begin
  if v_actor is null then
    raise exception 'not_authenticated';
  end if;

  if p_user_id = v_actor or public.is_admin() then
    return query
    select p.id, p.role, p.full_name, p.phone, p.email, p.phone_verified, p.avatar_url,
      dp.verification_status, dp.car_model, dp.plate_number, dp.seats, dp.rating, dp.completed_trips
    from public.profiles p
    left join public.driver_profiles dp on dp.user_id = p.id
    where p.id = p_user_id and p.is_suspended = false;
    return;
  end if;

  select
    exists (
      select 1
      from public.passenger_bookings b
      join public.trips t on t.id = b.trip_id
      where b.status in ('accepted', 'waiting_payment', 'payment_review', 'confirmed', 'on_trip', 'completed')
        and (
          (b.traveler_id = v_actor and t.driver_id = p_user_id)
          or (t.driver_id = v_actor and b.traveler_id = p_user_id)
        )
    )
    or exists (
      select 1
      from public.cargo_requests c
      join public.trips t on t.id = c.trip_id
      where c.status in ('cargo_accepted', 'waiting_payment', 'payment_review', 'picked_up', 'in_transit', 'delivered', 'completed')
        and (
          (c.sender_id = v_actor and t.driver_id = p_user_id)
          or (t.driver_id = v_actor and c.sender_id = p_user_id)
        )
    )
  into v_linked;

  if not v_linked then
    return;
  end if;

  return query
  select p.id, p.role, p.full_name, p.phone, p.email, p.phone_verified, p.avatar_url,
    dp.verification_status, dp.car_model, dp.plate_number, dp.seats, dp.rating, dp.completed_trips
  from public.profiles p
  left join public.driver_profiles dp on dp.user_id = p.id
  where p.id = p_user_id and p.is_suspended = false;
end;
$$;

revoke all on function public.get_participant_public_profile(uuid) from public, anon;
grant execute on function public.get_participant_public_profile(uuid) to authenticated;

notify pgrst, 'reload schema';
