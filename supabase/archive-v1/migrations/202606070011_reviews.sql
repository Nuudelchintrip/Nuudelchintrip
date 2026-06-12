-- Reviews: validated submission + driver rating recompute.
--
--   - One review per (booking, reviewer) enforced by a unique index.
--   - submit_review(): only a participant of a COMPLETED booking may review, and
--     only the other party is reviewed. Updates the driver's average rating.

create unique index if not exists uq_reviews_booking_reviewer
  on public.reviews (booking_id, reviewer_id)
  where booking_id is not null;

create or replace function public.submit_review(
  p_booking_id uuid,
  p_rating integer,
  p_comment text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_booking public.passenger_bookings%rowtype;
  v_trip public.trips%rowtype;
  v_reviewee uuid;
  v_review_id uuid;
  v_avg numeric(2,1);
begin
  if v_actor is null then raise exception 'not_authenticated'; end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then raise exception 'invalid_rating'; end if;

  select * into v_booking from public.passenger_bookings where id = p_booking_id;
  if not found then raise exception 'booking_not_found'; end if;
  if v_booking.status <> 'completed' then raise exception 'booking_not_completed'; end if;

  select * into v_trip from public.trips where id = v_booking.trip_id;

  if v_actor = v_booking.traveler_id then
    v_reviewee := v_trip.driver_id;
  elsif v_actor = v_trip.driver_id then
    v_reviewee := v_booking.traveler_id;
  else
    raise exception 'not_a_participant';
  end if;

  begin
    insert into public.reviews (reviewer_id, reviewee_id, trip_id, booking_id, rating, comment)
    values (v_actor, v_reviewee, v_booking.trip_id, p_booking_id, p_rating, nullif(btrim(coalesce(p_comment, '')), ''))
    returning id into v_review_id;
  exception when unique_violation then
    raise exception 'already_reviewed';
  end;

  -- If the reviewee is a driver, refresh their average rating.
  if exists (select 1 from public.driver_profiles where user_id = v_reviewee) then
    select round(avg(rating)::numeric, 1) into v_avg from public.reviews where reviewee_id = v_reviewee;
    perform set_config('app.guard_bypass', 'on', true);
    update public.driver_profiles set rating = coalesce(v_avg, 0), updated_at = now() where user_id = v_reviewee;
    perform set_config('app.guard_bypass', 'off', true);
  end if;

  return v_review_id;
end;
$$;

revoke all on function public.submit_review(uuid, integer, text) from public;
grant execute on function public.submit_review(uuid, integer, text) to authenticated;
