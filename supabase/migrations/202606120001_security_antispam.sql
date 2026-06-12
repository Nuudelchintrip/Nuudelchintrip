-- Security and anti-spam hardening.
--
-- Apply after the existing NuudelchinTrip migrations. This migration:
--   * records security events without exposing them to normal users;
--   * provides an atomic server-only rate limiter for Edge Functions;
--   * rate-limits booking, cargo, and report creation at the database boundary;
--   * moves report creation behind a validated RPC;
--   * closes direct-write policies that bypass validated RPCs;
--   * applies file size and MIME restrictions to Storage buckets.

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  severity text not null default 'warning'
    check (severity in ('info', 'warning', 'critical')),
  actor_user_id uuid references public.profiles(id) on delete set null,
  subject_hash text,
  ip_hash text,
  route text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_security_events_created_at
  on public.security_events (created_at desc);
create index if not exists idx_security_events_type_created_at
  on public.security_events (event_type, created_at desc);

alter table public.security_events enable row level security;

drop policy if exists "security events admin read" on public.security_events;
create policy "security events admin read" on public.security_events
for select to authenticated
using ((select public.is_admin()));

-- No client insert/update/delete policies. Trusted functions use service_role.
revoke insert, update, delete on public.security_events from anon, authenticated;

create table if not exists public.security_rate_limits (
  scope text not null,
  subject_hash text not null,
  request_count integer not null default 0,
  period_started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  blocked_until timestamptz,
  updated_at timestamptz not null default now(),
  primary key (scope, subject_hash)
);

create index if not exists idx_security_rate_limits_expires_at
  on public.security_rate_limits (expires_at);

alter table public.security_rate_limits enable row level security;
-- Deliberately no RLS policies. Only service_role functions may use this table.
revoke all on public.security_rate_limits from public, anon, authenticated;

create or replace function public.consume_security_rate_limit(
  p_scope text,
  p_subject_hash text,
  p_limit integer,
  p_window_seconds integer,
  p_block_seconds integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_row public.security_rate_limits%rowtype;
  v_retry_after integer := 0;
  v_block_until timestamptz;
begin
  if p_scope is null or p_scope !~ '^[a-z0-9:_-]{2,80}$' then
    raise exception 'invalid_rate_limit_scope';
  end if;
  if p_subject_hash is null or length(p_subject_hash) < 16 or length(p_subject_hash) > 160 then
    raise exception 'invalid_rate_limit_subject';
  end if;
  if p_limit < 1 or p_limit > 10000 then
    raise exception 'invalid_rate_limit_limit';
  end if;
  if p_window_seconds < 1 or p_window_seconds > 2592000 then
    raise exception 'invalid_rate_limit_window';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_scope || ':' || p_subject_hash, 0));

  select * into v_row
  from public.security_rate_limits
  where scope = p_scope and subject_hash = p_subject_hash
  for update;

  if not found or v_row.expires_at <= v_now then
    insert into public.security_rate_limits (
      scope, subject_hash, request_count, period_started_at, expires_at, blocked_until, updated_at
    )
    values (
      p_scope, p_subject_hash, 1, v_now,
      v_now + make_interval(secs => p_window_seconds), null, v_now
    )
    on conflict (scope, subject_hash) do update
      set request_count = 1,
          period_started_at = excluded.period_started_at,
          expires_at = excluded.expires_at,
          blocked_until = null,
          updated_at = excluded.updated_at;

    return jsonb_build_object(
      'allowed', true,
      'remaining', greatest(0, p_limit - 1),
      'retry_after_seconds', 0
    );
  end if;

  if v_row.blocked_until is not null and v_row.blocked_until > v_now then
    v_retry_after := greatest(1, ceil(extract(epoch from (v_row.blocked_until - v_now)))::integer);
    return jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'retry_after_seconds', v_retry_after
    );
  end if;

  if v_row.request_count >= p_limit then
    v_block_until := case
      when p_block_seconds > 0 then v_now + make_interval(secs => p_block_seconds)
      else v_row.expires_at
    end;

    update public.security_rate_limits
    set blocked_until = v_block_until,
        updated_at = v_now
    where scope = p_scope and subject_hash = p_subject_hash;

    v_retry_after := greatest(1, ceil(extract(epoch from (v_block_until - v_now)))::integer);
    return jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'retry_after_seconds', v_retry_after
    );
  end if;

  update public.security_rate_limits
  set request_count = request_count + 1,
      updated_at = v_now
  where scope = p_scope and subject_hash = p_subject_hash
  returning * into v_row;

  return jsonb_build_object(
    'allowed', true,
    'remaining', greatest(0, p_limit - v_row.request_count),
    'retry_after_seconds', 0
  );
end;
$$;

revoke all on function public.consume_security_rate_limit(text, text, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_security_rate_limit(text, text, integer, integer, integer)
  to service_role;

create or replace function public.log_security_event(
  p_event_type text,
  p_severity text default 'warning',
  p_actor_user_id uuid default null,
  p_subject_hash text default null,
  p_ip_hash text default null,
  p_route text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_event_type is null or length(btrim(p_event_type)) < 2 then
    raise exception 'event_type_required';
  end if;
  if p_severity not in ('info', 'warning', 'critical') then
    raise exception 'invalid_severity';
  end if;

  insert into public.security_events (
    event_type, severity, actor_user_id, subject_hash, ip_hash, route, metadata
  )
  values (
    left(btrim(p_event_type), 100),
    p_severity,
    p_actor_user_id,
    left(p_subject_hash, 160),
    left(p_ip_hash, 160),
    left(p_route, 240),
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.log_security_event(text, text, uuid, text, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.log_security_event(text, text, uuid, text, text, text, jsonb)
  to service_role;

-- Rate-limit successful marketplace requests by actor. Existing rows are the
-- durable counter, so failed transactions cannot reset or bypass the limit.
create or replace function public.guard_marketplace_request_rate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid;
  v_recent integer;
  v_daily integer;
  v_recent_limit integer;
  v_daily_limit integer;
begin
  if public.is_admin() then
    return new;
  end if;

  if tg_table_name = 'passenger_bookings' then
    v_actor := new.traveler_id;
    v_recent_limit := 6;
    v_daily_limit := 30;

    select count(*) into v_recent
    from public.passenger_bookings
    where traveler_id = v_actor and created_at > now() - interval '10 minutes';

    select count(*) into v_daily
    from public.passenger_bookings
    where traveler_id = v_actor and created_at > now() - interval '24 hours';
  elsif tg_table_name = 'cargo_requests' then
    v_actor := new.sender_id;
    v_recent_limit := 5;
    v_daily_limit := 20;

    select count(*) into v_recent
    from public.cargo_requests
    where sender_id = v_actor and created_at > now() - interval '10 minutes';

    select count(*) into v_daily
    from public.cargo_requests
    where sender_id = v_actor and created_at > now() - interval '24 hours';
  elsif tg_table_name = 'reports' then
    v_actor := new.reporter_id;
    v_recent_limit := 3;
    v_daily_limit := 10;

    select count(*) into v_recent
    from public.reports
    where reporter_id = v_actor and created_at > now() - interval '1 hour';

    select count(*) into v_daily
    from public.reports
    where reporter_id = v_actor and created_at > now() - interval '24 hours';
  else
    return new;
  end if;

  if v_recent >= v_recent_limit or v_daily >= v_daily_limit then
    raise exception 'request_rate_limited' using errcode = 'P0001';
  end if;

  if v_recent = v_recent_limit - 1 or v_daily = v_daily_limit - 1 then
    insert into public.security_events (
      event_type, severity, actor_user_id, route, metadata
    )
    values (
      tg_table_name || '_rate_threshold',
      'warning',
      v_actor,
      tg_table_name,
      jsonb_build_object(
        'recent_count_after_insert', v_recent + 1,
        'daily_count_after_insert', v_daily + 1
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists passenger_bookings_rate_guard on public.passenger_bookings;
create trigger passenger_bookings_rate_guard
before insert on public.passenger_bookings
for each row execute function public.guard_marketplace_request_rate();

drop trigger if exists cargo_requests_rate_guard on public.cargo_requests;
create trigger cargo_requests_rate_guard
before insert on public.cargo_requests
for each row execute function public.guard_marketplace_request_rate();

drop trigger if exists reports_rate_guard on public.reports;
create trigger reports_rate_guard
before insert on public.reports
for each row execute function public.guard_marketplace_request_rate();

create or replace function public.create_booking_report(
  p_booking_id uuid,
  p_reason text,
  p_details text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_booking public.passenger_bookings%rowtype;
  v_driver_id uuid;
  v_report_id uuid;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if v_actor is null then raise exception 'not_authenticated'; end if;
  if length(v_reason) < 5 then raise exception 'report_reason_too_short'; end if;
  if length(v_reason) > 500 then raise exception 'report_reason_too_long'; end if;
  if length(coalesce(p_details, '')) > 4000 then raise exception 'report_details_too_long'; end if;

  if not exists (
    select 1 from public.profiles
    where id = v_actor and is_suspended = false
  ) then
    raise exception 'account_not_active';
  end if;

  select * into v_booking
  from public.passenger_bookings
  where id = p_booking_id;

  if not found then raise exception 'booking_not_found'; end if;

  select driver_id into v_driver_id
  from public.trips
  where id = v_booking.trip_id;

  if v_actor <> v_booking.traveler_id and v_actor <> v_driver_id then
    raise exception 'not_a_booking_participant';
  end if;

  if exists (
    select 1 from public.reports
    where reporter_id = v_actor
      and booking_id = p_booking_id
      and status in ('open', 'reviewing')
  ) then
    raise exception 'report_already_open';
  end if;

  insert into public.reports (
    reporter_id, booking_id, trip_id, reason, details, status
  )
  values (
    v_actor, p_booking_id, v_booking.trip_id, v_reason,
    nullif(btrim(coalesce(p_details, '')), ''), 'open'
  )
  returning id into v_report_id;

  return v_report_id;
end;
$$;

revoke all on function public.create_booking_report(uuid, text, text) from public;
grant execute on function public.create_booking_report(uuid, text, text) to authenticated;

create or replace function public.submit_cargo_payment_proof(
  p_cargo_id uuid,
  p_amount integer,
  p_proof_url text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_cargo public.cargo_requests%rowtype;
  v_payment_id uuid;
  v_proof_id uuid;
begin
  if v_actor is null then raise exception 'not_authenticated'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'invalid_amount'; end if;
  if nullif(btrim(coalesce(p_proof_url, '')), '') is null then
    raise exception 'proof_required';
  end if;

  select * into v_cargo
  from public.cargo_requests
  where id = p_cargo_id
  for update;

  if not found then raise exception 'cargo_not_found'; end if;
  if v_cargo.sender_id <> v_actor then raise exception 'not_your_cargo'; end if;
  if v_cargo.status not in ('cargo_accepted', 'waiting_payment', 'payment_review') then
    raise exception 'cargo_not_payable';
  end if;

  insert into public.payments (user_id, cargo_request_id, amount, status, proof_url)
  values (v_actor, p_cargo_id, p_amount, 'proof_uploaded', btrim(p_proof_url))
  returning id into v_payment_id;

  insert into public.proofs (
    user_id, cargo_request_id, proof_type, file_url, note
  )
  values (
    v_actor, p_cargo_id, 'payment', btrim(p_proof_url),
    nullif(btrim(coalesce(p_note, '')), '')
  )
  returning id into v_proof_id;

  if v_cargo.status <> 'payment_review' then
    perform public.set_cargo_request_status(
      p_cargo_id,
      'payment_review',
      'Илгээгч төлбөрийн баримт илгээв.'
    );
  end if;

  return jsonb_build_object(
    'payment_id', v_payment_id,
    'proof_id', v_proof_id
  );
end;
$$;

revoke all on function public.submit_cargo_payment_proof(uuid, integer, text, text)
  from public;
grant execute on function public.submit_cargo_payment_proof(uuid, integer, text, text)
  to authenticated;

-- Validated RPCs are the only client write path for these records.
drop policy if exists "reports create own" on public.reports;
drop policy if exists "reviews create own" on public.reviews;
drop policy if exists "trip logs create participant admin" on public.trip_status_logs;
drop policy if exists "payments create own" on public.payments;
drop policy if exists "payments create own pending" on public.payments;
drop policy if exists "proofs create own" on public.proofs;

revoke insert on public.payments from anon, authenticated;
revoke insert on public.proofs from anon, authenticated;

drop policy if exists "trip logs insert admin only" on public.trip_status_logs;
create policy "trip logs insert admin only" on public.trip_status_logs
for insert to authenticated
with check ((select public.is_admin()));

drop policy if exists "support insert anyone" on public.support_requests;
revoke insert on public.support_requests from anon, authenticated;

-- Explicitly ensure RLS remains enabled for every table containing user data.
alter table public.profiles enable row level security;
alter table public.driver_profiles enable row level security;
alter table public.trips enable row level security;
alter table public.passenger_bookings enable row level security;
alter table public.cargo_requests enable row level security;
alter table public.payments enable row level security;
alter table public.proofs enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;
alter table public.trip_status_logs enable row level security;
alter table public.support_requests enable row level security;
alter table public.driver_payouts enable row level security;
alter table public.phone_otp_codes enable row level security;
alter table public.app_settings enable row level security;

-- Production OTP must only be generated by the authenticated send-otp Edge
-- Function. Remove legacy/demo bypasses that could return or skip the code.
update public.app_settings
set value = 'false', updated_at = now()
where key = 'otp_dev_mode';

revoke all on function public.request_phone_otp(text) from public, anon, authenticated;
revoke all on function public.complete_phone_verification() from public, anon, authenticated;

-- Bucket-level validation is enforced by Storage in addition to browser checks.
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'avatars';

update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
where id in ('driver-documents', 'vehicle-documents', 'payment-proofs', 'cargo-proofs');

-- Users may only alter objects in their own first-level folder.
drop policy if exists "users update own avatars" on storage.objects;
create policy "users update own avatars" on storage.objects
for update to authenticated
using (
  bucket_id = 'avatars'
  and (select auth.uid())::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'avatars'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

drop policy if exists "users delete own avatars" on storage.objects;
create policy "users delete own avatars" on storage.objects
for delete to authenticated
using (
  bucket_id = 'avatars'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);
