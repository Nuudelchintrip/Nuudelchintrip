-- ---------------------------------------------------------------------------
-- 202606130007_cargo_reviews
--
-- The review system only covered passenger bookings. Let a cargo sender rate
-- the driver once their cargo is completed, reusing the reviews table and the
-- driver average-rating refresh.
-- ---------------------------------------------------------------------------

alter table public.reviews
  add column if not exists cargo_request_id uuid references public.cargo_requests(id) on delete set null;

create unique index if not exists ux_reviews_cargo_reviewer
  on public.reviews (cargo_request_id, reviewer_id)
  where cargo_request_id is not null;

create or replace function public.submit_cargo_review(
  p_cargo_id uuid,
  p_rating integer,
  p_comment text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_cargo public.cargo_requests%rowtype;
  v_driver uuid;
  v_avg numeric;
begin
  if v_actor is null then
    raise exception 'not_authenticated';
  end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'invalid_rating';
  end if;

  select * into v_cargo from public.cargo_requests where id = p_cargo_id;
  if not found then
    raise exception 'cargo_not_found';
  end if;
  if v_cargo.sender_id <> v_actor then
    raise exception 'not_authorized';
  end if;
  if v_cargo.status <> 'completed' then
    raise exception 'cargo_not_completed';
  end if;

  select driver_id into v_driver from public.trips where id = v_cargo.trip_id;
  if v_driver is null then
    raise exception 'driver_not_found';
  end if;

  if exists (
    select 1 from public.reviews
    where cargo_request_id = p_cargo_id and reviewer_id = v_actor
  ) then
    update public.reviews
    set rating = p_rating,
        comment = nullif(btrim(coalesce(p_comment, '')), ''),
        created_at = now()
    where cargo_request_id = p_cargo_id and reviewer_id = v_actor;
  else
    insert into public.reviews (reviewer_id, reviewee_id, trip_id, cargo_request_id, rating, comment)
    values (v_actor, v_driver, v_cargo.trip_id, p_cargo_id, p_rating, nullif(btrim(coalesce(p_comment, '')), ''));
  end if;

  -- Refresh the driver's average rating across all their reviews.
  select round(avg(rating)::numeric, 1) into v_avg from public.reviews where reviewee_id = v_driver;
  update public.driver_profiles set rating = coalesce(v_avg, 0), updated_at = now() where user_id = v_driver;
end;
$$;

revoke all on function public.submit_cargo_review(uuid, integer, text) from public;
grant execute on function public.submit_cargo_review(uuid, integer, text) to authenticated;
