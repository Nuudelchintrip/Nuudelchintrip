-- Traveler "route request" ads (#3): a traveler posts the route they need;
-- drivers see active requests, and when a driver later publishes a matching
-- trip the request owner gets an in-app notification.
--
--   1. route_requests table + RLS (owner manages; any authenticated user reads
--      active ads so drivers can browse them).
--   2. create_route_request / close_route_request RPCs.
--   3. Trigger on trips insert → notify matching request owners (same matching
--      style as notify_saved_route_searches_on_trip).
--
-- Apply manually in Supabase SQL Editor.

-- ---------------------------------------------------------------------------
-- 1. Table + RLS
-- ---------------------------------------------------------------------------
create table if not exists public.route_requests (
  id uuid primary key default gen_random_uuid(),
  traveler_id uuid not null references public.profiles(id) on delete cascade,
  from_location text not null,
  to_location text not null,
  travel_date date not null,
  seats integer not null default 1,
  contact_phone text,
  note text,
  active boolean not null default true,
  last_notified_trip_id uuid references public.trips(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint route_requests_seats_check check (seats between 1 and 12),
  constraint route_requests_from_check check (length(btrim(from_location)) > 0),
  constraint route_requests_to_check check (length(btrim(to_location)) > 0)
);

create index if not exists idx_route_requests_active
  on public.route_requests (active, travel_date, created_at desc);

alter table public.route_requests enable row level security;

drop policy if exists "route requests read active or own" on public.route_requests;
create policy "route requests read active or own" on public.route_requests
for select using (
  active = true
  or traveler_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "route requests update own" on public.route_requests;
create policy "route requests update own" on public.route_requests
for update using (traveler_id = auth.uid() or public.is_admin())
with check (traveler_id = auth.uid() or public.is_admin());

drop policy if exists "route requests delete own" on public.route_requests;
create policy "route requests delete own" on public.route_requests
for delete using (traveler_id = auth.uid() or public.is_admin());

-- No INSERT policy: writes go through create_route_request only.

-- ---------------------------------------------------------------------------
-- 2. RPCs
-- ---------------------------------------------------------------------------
create or replace function public.create_route_request(
  p_from_location text,
  p_to_location text,
  p_travel_date date,
  p_seats integer default 1,
  p_contact_phone text default null,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_request_id uuid;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_profile from public.profiles where id = v_user_id;
  if v_profile.id is null then
    raise exception 'profile_not_found';
  end if;
  if v_profile.is_suspended then
    raise exception 'account_suspended';
  end if;

  if nullif(btrim(p_from_location), '') is null
    or nullif(btrim(p_to_location), '') is null then
    raise exception 'route_required';
  end if;
  if p_travel_date is null or p_travel_date < current_date then
    raise exception 'future_date_required';
  end if;
  if p_seats is null or p_seats < 1 or p_seats > 12 then
    raise exception 'invalid_seat_count';
  end if;

  -- Anti-spam: at most 5 active ads per traveler.
  if (select count(*) from public.route_requests where traveler_id = v_user_id and active = true) >= 5 then
    raise exception 'too_many_active_requests';
  end if;

  insert into public.route_requests (
    traveler_id, from_location, to_location, travel_date, seats, contact_phone, note
  )
  values (
    v_user_id,
    btrim(p_from_location),
    btrim(p_to_location),
    p_travel_date,
    p_seats,
    nullif(btrim(p_contact_phone), ''),
    nullif(btrim(p_note), '')
  )
  returning id into v_request_id;

  return v_request_id;
end;
$$;

revoke all on function public.create_route_request(text, text, date, integer, text, text) from public, anon;
grant execute on function public.create_route_request(text, text, date, integer, text, text) to authenticated;

create or replace function public.close_route_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  update public.route_requests
  set active = false, updated_at = now()
  where id = p_request_id
    and (traveler_id = v_user_id or public.is_admin());

  if not found then
    raise exception 'request_not_found';
  end if;
end;
$$;

revoke all on function public.close_route_request(uuid) from public, anon;
grant execute on function public.close_route_request(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Matching trip published → notify request owner
-- ---------------------------------------------------------------------------
create or replace function public.notify_route_requests_on_trip()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.route_requests%rowtype;
begin
  if new.status <> 'active' then
    return new;
  end if;

  for v_request in
    select *
    from public.route_requests
    where active = true
      and traveler_id <> new.driver_id
      and (
        lower(btrim(new.from_location)) = lower(btrim(from_location))
        or lower(btrim(new.from_location)) like lower(btrim(from_location)) || ' - %'
      )
      and (
        lower(btrim(new.to_location)) = lower(btrim(to_location))
        or lower(btrim(new.to_location)) like lower(btrim(to_location)) || ' - %'
      )
      and travel_date = (new.departure_at at time zone 'Asia/Ulaanbaatar')::date
      and seats <= new.seats_available
      and (last_notified_trip_id is null or last_notified_trip_id <> new.id)
  loop
    perform public.create_notification(
      v_request.traveler_id,
      'Таны хүссэн чиглэлээр жолооч гарлаа',
      new.from_location || ' → ' || new.to_location || ' чиглэлд шинэ маршрут нийтлэгдлээ.',
      'route_request_match',
      '/routes/' || new.id
    );

    update public.route_requests
    set last_notified_trip_id = new.id,
        updated_at = now()
    where id = v_request.id;
  end loop;

  return new;
end;
$$;

drop trigger if exists notify_route_requests_on_trip on public.trips;
create trigger notify_route_requests_on_trip
after insert on public.trips
for each row
execute function public.notify_route_requests_on_trip();
