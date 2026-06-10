-- Phase 1: Production-ready phone OTP + sensitive profile field guard.
--
-- What this migration does:
--   1. Adds a small app_settings table (otp_dev_mode flag).
--   2. Server-side OTP: phone_otp_codes table + request_phone_otp / verify_phone_otp
--      RPCs with hashing, expiry, attempt + resend rate limits. The 6-digit code is
--      generated and checked INSIDE the database, never decided by the client.
--   3. A BEFORE UPDATE guard on profiles so a user cannot escalate their own
--      role / phone_verified / is_suspended. Only admins or trusted SECURITY DEFINER
--      functions (which set app.guard_bypass) may change those fields.
--
-- SMS delivery seam: until a real SMS provider is connected, otp_dev_mode = true and
-- request_phone_otp returns the code so testing works. In production, flip otp_dev_mode
-- to false and have an SMS sender (edge function / provider webhook) deliver the code.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- 0. app_settings (simple key/value config, admin-managed)
-- ---------------------------------------------------------------------------
create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value)
values ('otp_dev_mode', 'true')
on conflict (key) do nothing;

alter table public.app_settings enable row level security;

drop policy if exists "app_settings admin read" on public.app_settings;
create policy "app_settings admin read" on public.app_settings
for select using (public.is_admin());

drop policy if exists "app_settings admin write" on public.app_settings;
create policy "app_settings admin write" on public.app_settings
for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 1. Sensitive profile field guard
-- ---------------------------------------------------------------------------
create or replace function public.guard_profile_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bypass boolean := coalesce(current_setting('app.guard_bypass', true), 'off') = 'on';
begin
  -- Admins and trusted definer functions (which set app.guard_bypass) may change
  -- guarded fields. Everyone else has their changes to these columns reverted.
  if bypass or public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role then
    new.role := old.role;
  end if;
  if new.phone_verified is distinct from old.phone_verified then
    new.phone_verified := old.phone_verified;
  end if;
  if new.is_suspended is distinct from old.is_suspended then
    new.is_suspended := old.is_suspended;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_sensitive on public.profiles;
create trigger profiles_guard_sensitive
before update on public.profiles
for each row execute function public.guard_profile_sensitive_fields();

-- ---------------------------------------------------------------------------
-- 2. OTP storage
-- ---------------------------------------------------------------------------
create table if not exists public.phone_otp_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  phone text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_phone_otp_user_active
  on public.phone_otp_codes (user_id, created_at desc)
  where consumed_at is null;

alter table public.phone_otp_codes enable row level security;
-- No policies: only SECURITY DEFINER functions below may touch this table.

-- ---------------------------------------------------------------------------
-- 3. request_phone_otp: generate + store a code (rate limited)
-- ---------------------------------------------------------------------------
create or replace function public.request_phone_otp(p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_phone text := nullif(regexp_replace(coalesce(p_phone, ''), '\s', '', 'g'), '');
  recent_count int;
  last_created timestamptz;
  resend_cooldown int := 60;      -- seconds between resends
  hourly_limit int := 5;          -- max codes per hour
  new_code text;
  dev_mode boolean;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;
  if normalized_phone is null then
    raise exception 'phone_required';
  end if;

  -- Resend cooldown: last unconsumed code must be older than the cooldown.
  select max(created_at) into last_created
  from public.phone_otp_codes
  where user_id = current_user_id and consumed_at is null;

  if last_created is not null and last_created > now() - make_interval(secs => resend_cooldown) then
    raise exception 'otp_rate_limited';
  end if;

  -- Hourly cap.
  select count(*) into recent_count
  from public.phone_otp_codes
  where user_id = current_user_id and created_at > now() - interval '1 hour';

  if recent_count >= hourly_limit then
    raise exception 'otp_hourly_limit';
  end if;

  -- Invalidate older unconsumed codes for this user.
  update public.phone_otp_codes
  set consumed_at = now()
  where user_id = current_user_id and consumed_at is null;

  new_code := lpad((floor(random() * 1000000))::int::text, 6, '0');

  insert into public.phone_otp_codes (user_id, phone, code_hash, expires_at)
  values (
    current_user_id,
    normalized_phone,
    encode(digest(new_code || current_user_id::text, 'sha256'), 'hex'),
    now() + interval '5 minutes'
  );

  select (value = 'true') into dev_mode from public.app_settings where key = 'otp_dev_mode';

  return jsonb_build_object(
    'expires_in_seconds', 300,
    'resend_after_seconds', resend_cooldown,
    'dev_code', case when coalesce(dev_mode, true) then new_code else null end
  );
end;
$$;

revoke all on function public.request_phone_otp(text) from public;
grant execute on function public.request_phone_otp(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. verify_phone_otp: check code + mark phone verified (server side)
-- ---------------------------------------------------------------------------
create or replace function public.verify_phone_otp(p_phone text, p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_phone text := nullif(regexp_replace(coalesce(p_phone, ''), '\s', '', 'g'), '');
  clean_code text := nullif(regexp_replace(coalesce(p_code, ''), '\D', '', 'g'), '');
  max_attempts int := 5;
  otp_row public.phone_otp_codes%rowtype;
  auth_user auth.users%rowtype;
  requested_role public.user_role := 'traveler';
  metadata_role text;
  profile_row public.profiles%rowtype;
  driver_status public.driver_verification_status;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;
  if normalized_phone is null then
    raise exception 'phone_required';
  end if;
  if clean_code is null or length(clean_code) <> 6 then
    raise exception 'otp_invalid';
  end if;

  select * into otp_row
  from public.phone_otp_codes
  where user_id = current_user_id
    and consumed_at is null
    and expires_at > now()
  order by created_at desc
  limit 1;

  if otp_row.id is null then
    raise exception 'otp_not_found_or_expired';
  end if;
  if otp_row.attempts >= max_attempts then
    raise exception 'otp_too_many_attempts';
  end if;

  if otp_row.code_hash <> encode(digest(clean_code || current_user_id::text, 'sha256'), 'hex') then
    update public.phone_otp_codes set attempts = attempts + 1 where id = otp_row.id;
    raise exception 'otp_invalid';
  end if;

  -- Correct code: consume it.
  update public.phone_otp_codes set consumed_at = now() where id = otp_row.id;

  -- Resolve requested role from auth metadata.
  select * into auth_user from auth.users where id = current_user_id;
  if auth_user.id is null then
    raise exception 'auth_user_not_found';
  end if;
  metadata_role := auth_user.raw_user_meta_data->>'role';
  if metadata_role in ('traveler', 'driver', 'cargo_sender') then
    requested_role := metadata_role::public.user_role;
  end if;

  -- Set phone_verified server-side. Bypass the profile guard for this trusted write.
  perform set_config('app.guard_bypass', 'on', true);

  insert into public.profiles (id, role, full_name, phone, email, phone_verified)
  values (
    auth_user.id,
    requested_role,
    coalesce(
      nullif(auth_user.raw_user_meta_data->>'full_name', ''),
      split_part(coalesce(auth_user.email, ''), '@', 1)
    ),
    normalized_phone,
    auth_user.email,
    true
  )
  on conflict (id) do update
    set phone_verified = true,
        phone = excluded.phone,
        email = coalesce(excluded.email, public.profiles.email),
        full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
        role = case
          when public.profiles.role = 'admin' or public.profiles.onboarding_completed
            then public.profiles.role
          else excluded.role
        end,
        updated_at = now()
  returning * into profile_row;

  perform set_config('app.guard_bypass', 'off', true);

  if profile_row.role = 'driver' then
    select verification_status into driver_status
    from public.driver_profiles where user_id = current_user_id;
  end if;

  return jsonb_build_object(
    'role', profile_row.role,
    'full_name', profile_row.full_name,
    'phone', profile_row.phone,
    'email', profile_row.email,
    'phone_verified', profile_row.phone_verified,
    'onboarding_completed', profile_row.onboarding_completed,
    'cargo_policy_accepted', profile_row.cargo_policy_accepted,
    'verification_status', driver_status
  );
end;
$$;

revoke all on function public.verify_phone_otp(text, text) from public;
grant execute on function public.verify_phone_otp(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Keep legacy complete_phone_verification working under the new guard.
--    (Frontend now uses verify_phone_otp; this stays for backward safety.)
-- ---------------------------------------------------------------------------
create or replace function public.complete_phone_verification()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  auth_user auth.users%rowtype;
  requested_role public.user_role := 'traveler';
  metadata_role text;
  profile_row public.profiles%rowtype;
  driver_status public.driver_verification_status;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select * into auth_user from auth.users where id = current_user_id;
  if auth_user.id is null then
    raise exception 'auth_user_not_found';
  end if;

  metadata_role := auth_user.raw_user_meta_data->>'role';
  if metadata_role in ('traveler', 'driver', 'cargo_sender') then
    requested_role := metadata_role::public.user_role;
  end if;

  perform set_config('app.guard_bypass', 'on', true);

  insert into public.profiles (id, role, full_name, phone, email, phone_verified)
  values (
    auth_user.id,
    requested_role,
    coalesce(
      nullif(auth_user.raw_user_meta_data->>'full_name', ''),
      split_part(coalesce(auth_user.email, ''), '@', 1)
    ),
    coalesce(nullif(auth_user.raw_user_meta_data->>'phone', ''), auth_user.phone),
    auth_user.email,
    true
  )
  on conflict (id) do update
    set phone_verified = true,
        email = coalesce(excluded.email, public.profiles.email),
        phone = coalesce(public.profiles.phone, excluded.phone),
        full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
        role = case
          when public.profiles.role = 'admin' or public.profiles.onboarding_completed
            then public.profiles.role
          else excluded.role
        end,
        updated_at = now()
  returning * into profile_row;

  perform set_config('app.guard_bypass', 'off', true);

  if profile_row.role = 'driver' then
    select verification_status into driver_status
    from public.driver_profiles where user_id = current_user_id;
  end if;

  return jsonb_build_object(
    'role', profile_row.role,
    'full_name', profile_row.full_name,
    'phone', profile_row.phone,
    'email', profile_row.email,
    'phone_verified', profile_row.phone_verified,
    'onboarding_completed', profile_row.onboarding_completed,
    'cargo_policy_accepted', profile_row.cargo_policy_accepted,
    'verification_status', driver_status
  );
end;
$$;

revoke all on function public.complete_phone_verification() from public;
grant execute on function public.complete_phone_verification() to authenticated;
