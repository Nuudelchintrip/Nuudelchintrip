-- Restore authenticated marketplace reads without exposing private profile rows.

create or replace function public.admin_list_users()
returns table (
  id uuid,
  full_name text,
  phone text,
  email text,
  role text,
  phone_verified boolean,
  onboarding_completed boolean,
  is_suspended boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if not public.is_admin() then
    raise exception 'admin_required';
  end if;

  return query
  select
    p.id,
    p.full_name,
    p.phone,
    p.email,
    p.role::text,
    p.phone_verified,
    p.onboarding_completed,
    p.is_suspended,
    p.created_at
  from public.profiles p
  order by p.created_at desc
  limit 200;
end;
$$;

revoke all on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;

create or replace function public.list_active_marketplace_trips()
returns table (
  id uuid,
  driver_id uuid,
  from_location text,
  to_location text,
  departure_at timestamptz,
  seats_total integer,
  seats_available integer,
  available_seat_labels text[],
  price_per_seat integer,
  pickup_note text,
  dropoff_note text,
  allows_cargo boolean,
  cargo_capacity_kg numeric,
  allowed_cargo_types text[],
  cargo_price_note text,
  status text,
  driver_full_name text,
  driver_car_model text,
  driver_rating numeric,
  driver_completed_trips integer,
  driver_verification_status text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  return query
  select
    t.id,
    t.driver_id,
    t.from_location,
    t.to_location,
    t.departure_at,
    t.seats_total,
    t.seats_available,
    t.available_seat_labels,
    t.price_per_seat,
    t.pickup_note,
    t.dropoff_note,
    t.allows_cargo,
    t.cargo_capacity_kg,
    t.allowed_cargo_types,
    t.cargo_price_note,
    t.status,
    p.full_name,
    d.car_model,
    d.rating,
    d.completed_trips,
    d.verification_status::text
  from public.trips t
  join public.profiles p on p.id = t.driver_id
  join public.driver_profiles d on d.user_id = t.driver_id
  where t.status = 'active'
    and t.seats_available > 0
    and p.is_suspended = false
    and d.verification_status = 'approved'
  order by t.departure_at asc;
end;
$$;

revoke all on function public.list_active_marketplace_trips() from public, anon;
grant execute on function public.list_active_marketplace_trips() to authenticated;

create or replace function public.complete_cargo_onboarding()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  auth_user auth.users%rowtype;
  profile_row public.profiles%rowtype;
  metadata_role text;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select * into auth_user
  from auth.users
  where id = current_user_id;

  if auth_user.id is null then
    raise exception 'auth_user_not_found';
  end if;

  metadata_role := auth_user.raw_user_meta_data->>'role';
  if metadata_role <> 'cargo_sender' then
    raise exception 'cargo_sender_role_required';
  end if;

  perform set_config('app.guard_bypass', 'on', true);

  insert into public.profiles (
    id,
    role,
    full_name,
    phone,
    email,
    phone_verified,
    onboarding_completed,
    cargo_policy_accepted
  )
  values (
    auth_user.id,
    'cargo_sender',
    coalesce(
      nullif(auth_user.raw_user_meta_data->>'full_name', ''),
      split_part(coalesce(auth_user.email, ''), '@', 1)
    ),
    coalesce(nullif(auth_user.raw_user_meta_data->>'phone', ''), auth_user.phone),
    auth_user.email,
    true,
    true,
    true
  )
  on conflict (id) do update
    set role = 'cargo_sender',
        phone_verified = true,
        onboarding_completed = true,
        cargo_policy_accepted = true,
        updated_at = now()
  returning * into profile_row;

  if profile_row.is_suspended then
    raise exception 'account_suspended';
  end if;

  return jsonb_build_object(
    'role', profile_row.role,
    'full_name', profile_row.full_name,
    'phone', profile_row.phone,
    'email', profile_row.email,
    'phone_verified', profile_row.phone_verified,
    'onboarding_completed', profile_row.onboarding_completed,
    'cargo_policy_accepted', profile_row.cargo_policy_accepted,
    'verification_status', null
  );
end;
$$;

revoke all on function public.complete_cargo_onboarding() from public, anon;
grant execute on function public.complete_cargo_onboarding() to authenticated;
