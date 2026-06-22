-- Let travelers save an empty route search and get an in-app notification when
-- a matching driver trip is created.

create table if not exists public.saved_route_searches (
  id uuid primary key default gen_random_uuid(),
  traveler_id uuid not null references public.profiles(id) on delete cascade,
  from_location text not null,
  to_location text not null,
  departure_date date,
  seats_requested integer not null default 1,
  active boolean not null default true,
  last_notified_trip_id uuid references public.trips(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint saved_route_searches_seats_check check (seats_requested between 1 and 12),
  constraint saved_route_searches_from_check check (length(btrim(from_location)) > 0),
  constraint saved_route_searches_to_check check (length(btrim(to_location)) > 0)
);

create unique index if not exists idx_saved_route_searches_unique_active
  on public.saved_route_searches (
    traveler_id,
    lower(btrim(from_location)),
    lower(btrim(to_location)),
    coalesce(departure_date, date '1900-01-01'),
    seats_requested
  )
  where active = true;

create index if not exists idx_saved_route_searches_match
  on public.saved_route_searches (
    active,
    lower(btrim(from_location)),
    lower(btrim(to_location)),
    departure_date
  );

alter table public.saved_route_searches enable row level security;

drop policy if exists "saved route searches read own" on public.saved_route_searches;
create policy "saved route searches read own" on public.saved_route_searches
for select using (traveler_id = auth.uid() or public.is_admin());

drop policy if exists "saved route searches create own" on public.saved_route_searches;
create policy "saved route searches create own" on public.saved_route_searches
for insert with check (traveler_id = auth.uid());

drop policy if exists "saved route searches update own" on public.saved_route_searches;
create policy "saved route searches update own" on public.saved_route_searches
for update using (traveler_id = auth.uid() or public.is_admin())
with check (traveler_id = auth.uid() or public.is_admin());

create or replace function public.save_route_search(
  p_from_location text,
  p_to_location text,
  p_departure_date date default null,
  p_seats_requested integer default 1
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_search_id uuid;
  v_role public.user_role;
  v_is_suspended boolean;
  v_from text := nullif(btrim(p_from_location), '');
  v_to text := nullif(btrim(p_to_location), '');
  v_seats integer := coalesce(p_seats_requested, 1);
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select role, is_suspended
    into v_role, v_is_suspended
  from public.profiles
  where id = v_user_id;

  if v_role <> 'traveler' or coalesce(v_is_suspended, false) then
    raise exception 'traveler_required';
  end if;

  if v_from is null or v_to is null then
    raise exception 'route_required';
  end if;

  if v_seats < 1 or v_seats > 12 then
    raise exception 'invalid_seat_count';
  end if;

  insert into public.saved_route_searches (
    traveler_id,
    from_location,
    to_location,
    departure_date,
    seats_requested,
    active,
    updated_at
  )
  values (
    v_user_id,
    v_from,
    v_to,
    p_departure_date,
    v_seats,
    true,
    now()
  )
  on conflict (
    traveler_id,
    (lower(btrim(from_location))),
    (lower(btrim(to_location))),
    (coalesce(departure_date, date '1900-01-01')),
    seats_requested
  )
  where active = true
  do update set
    updated_at = now(),
    active = true
  returning id into v_search_id;

  return v_search_id;
end;
$$;

revoke all on function public.save_route_search(text, text, date, integer) from public, anon;
grant execute on function public.save_route_search(text, text, date, integer) to authenticated;

create or replace function public.notify_saved_route_searches_on_trip()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_search public.saved_route_searches%rowtype;
begin
  if new.status <> 'active' then
    return new;
  end if;

  for v_search in
    select *
    from public.saved_route_searches
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
      and (departure_date is null or departure_date = (new.departure_at at time zone 'Asia/Ulaanbaatar')::date)
      and seats_requested <= new.seats_available
      and (last_notified_trip_id is null or last_notified_trip_id <> new.id)
  loop
    perform public.create_notification(
      v_search.traveler_id,
      'Таны хайсан чиглэл гарлаа',
      new.from_location || ' → ' || new.to_location || ' чиглэлд жолооч нэмэгдлээ.',
      'saved_route_match',
      '/routes/' || new.id
    );

    update public.saved_route_searches
    set last_notified_trip_id = new.id,
        updated_at = now()
    where id = v_search.id;
  end loop;

  return new;
end;
$$;

drop trigger if exists notify_saved_route_searches_on_trip on public.trips;
create trigger notify_saved_route_searches_on_trip
after insert on public.trips
for each row
execute function public.notify_saved_route_searches_on_trip();
