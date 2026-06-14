-- ============================================================
-- NuudelchinTrip — FULL DATABASE RESTORE
-- Бүх migration-ийг дарааллаар нэгтгэв. SQL Editor-т нэг удаа Run.
-- Бүгд idempotent — дахин ажиллуулахад аюулгүй, устсаныг сэргээнэ.
-- ============================================================


-- ##################################################
-- 202605310000_initial_schema.sql
-- ##################################################

-- NuudelchinTrip MVP backend schema
-- Run this in Supabase Dashboard -> SQL Editor.
-- Core product: traveler <-> driver route booking.
-- Cargo is a route-based add-on through trips.allows_cargo.

create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('traveler', 'driver', 'cargo_sender', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.driver_verification_status as enum ('not_submitted', 'pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.booking_status as enum ('pending_request', 'accepted', 'rejected', 'waiting_payment', 'payment_review', 'confirmed', 'on_trip', 'completed', 'cancelled', 'disputed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.cargo_status as enum ('cargo_requested', 'cargo_accepted', 'rejected', 'waiting_payment', 'payment_review', 'picked_up', 'in_transit', 'delivered', 'completed', 'cancelled', 'disputed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('pending', 'proof_uploaded', 'approved', 'rejected', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.proof_type as enum ('payment', 'pickup', 'delivery', 'driver_license', 'vehicle_certificate', 'vehicle_photo', 'avatar');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_status as enum ('open', 'reviewing', 'resolved', 'rejected');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'traveler',
  full_name text not null default '',
  phone text,
  email text,
  phone_verified boolean not null default false,
  onboarding_completed boolean not null default false,
  avatar_url text,
  emergency_contact_name text,
  emergency_contact_phone text,
  cargo_policy_accepted boolean not null default false,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.driver_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  verification_status public.driver_verification_status not null default 'not_submitted',
  car_model text,
  plate_number text,
  seats integer check (seats is null or seats between 1 and 12),
  driver_license_url text,
  vehicle_certificate_url text,
  vehicle_photo_url text,
  allows_cargo boolean not null default false,
  cargo_permission_status public.driver_verification_status not null default 'not_submitted',
  rating numeric(2,1) not null default 0 check (rating between 0 and 5),
  completed_trips integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  aimag text not null,
  soum text,
  display_name text generated always as (
    case when soum is null or soum = '' then aimag else aimag || ' - ' || soum end
  ) stored,
  created_at timestamptz not null default now()
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles(id) on delete cascade,
  from_location text not null,
  to_location text not null,
  departure_at timestamptz not null,
  seats_total integer not null check (seats_total > 0),
  seats_available integer not null check (seats_available >= 0),
  price_per_seat integer not null check (price_per_seat >= 0),
  pickup_note text,
  dropoff_note text,
  allows_cargo boolean not null default false,
  cargo_capacity_kg numeric(8,2),
  allowed_cargo_types text[],
  cargo_price_note text,
  status text not null default 'active' check (status in ('draft', 'active', 'full', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seats_available_lte_total check (seats_available <= seats_total)
);

create table if not exists public.passenger_bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  traveler_id uuid not null references public.profiles(id) on delete cascade,
  seats_requested integer not null default 1 check (seats_requested > 0),
  status public.booking_status not null default 'pending_request',
  total_amount integer,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cargo_requests (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  cargo_name text not null,
  cargo_type text,
  size_note text,
  weight_kg numeric(8,2),
  receiver_name text not null,
  receiver_phone text not null,
  pickup_note text,
  status public.cargo_status not null default 'cargo_requested',
  delivery_code text not null default lpad((floor(random() * 1000000))::text, 6, '0'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  booking_id uuid references public.passenger_bookings(id) on delete cascade,
  cargo_request_id uuid references public.cargo_requests(id) on delete cascade,
  amount integer not null check (amount >= 0),
  status public.payment_status not null default 'pending',
  proof_url text,
  admin_note text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint payment_one_target check (
    (booking_id is not null and cargo_request_id is null)
    or (booking_id is null and cargo_request_id is not null)
  )
);

create table if not exists public.proofs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  booking_id uuid references public.passenger_bookings(id) on delete cascade,
  cargo_request_id uuid references public.cargo_requests(id) on delete cascade,
  proof_type public.proof_type not null,
  file_url text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  trip_id uuid references public.trips(id) on delete set null,
  booking_id uuid references public.passenger_bookings(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid references public.profiles(id) on delete set null,
  trip_id uuid references public.trips(id) on delete set null,
  booking_id uuid references public.passenger_bookings(id) on delete set null,
  cargo_request_id uuid references public.cargo_requests(id) on delete set null,
  reason text not null,
  details text,
  status public.report_status not null default 'open',
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.trip_status_logs (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references public.trips(id) on delete cascade,
  booking_id uuid references public.passenger_bookings(id) on delete cascade,
  cargo_request_id uuid references public.cargo_requests(id) on delete cascade,
  status text not null,
  changed_by uuid references public.profiles(id),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_trips_driver_id on public.trips(driver_id);
create index if not exists idx_trips_route_date on public.trips(from_location, to_location, departure_at);
create index if not exists idx_bookings_trip_id on public.passenger_bookings(trip_id);
create index if not exists idx_bookings_traveler_id on public.passenger_bookings(traveler_id);
create index if not exists idx_cargo_trip_id on public.cargo_requests(trip_id);
create index if not exists idx_cargo_sender_id on public.cargo_requests(sender_id);
create index if not exists idx_payments_user_id on public.payments(user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists driver_profiles_set_updated_at on public.driver_profiles;
create trigger driver_profiles_set_updated_at before update on public.driver_profiles
for each row execute function public.set_updated_at();

drop trigger if exists trips_set_updated_at on public.trips;
create trigger trips_set_updated_at before update on public.trips
for each row execute function public.set_updated_at();

drop trigger if exists bookings_set_updated_at on public.passenger_bookings;
create trigger bookings_set_updated_at before update on public.passenger_bookings
for each row execute function public.set_updated_at();

drop trigger if exists cargo_set_updated_at on public.cargo_requests;
create trigger cargo_set_updated_at before update on public.cargo_requests
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and is_suspended = false
  );
$$;

create or replace function public.can_create_trip()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.driver_profiles d on d.user_id = p.id
    where p.id = auth.uid()
      and p.role = 'driver'
      and p.phone_verified = true
      and p.onboarding_completed = true
      and p.is_suspended = false
      and d.verification_status = 'approved'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'traveler')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.driver_profiles enable row level security;
alter table public.locations enable row level security;
alter table public.trips enable row level security;
alter table public.passenger_bookings enable row level security;
alter table public.cargo_requests enable row level security;
alter table public.payments enable row level security;
alter table public.proofs enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;
alter table public.trip_status_logs enable row level security;

drop policy if exists "profiles read own or admin" on public.profiles;
create policy "profiles read own or admin" on public.profiles
for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles update own or admin" on public.profiles;
create policy "profiles update own or admin" on public.profiles
for update using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "driver profiles read public verified or own admin" on public.driver_profiles;
create policy "driver profiles read public verified or own admin" on public.driver_profiles
for select using (verification_status = 'approved' or user_id = auth.uid() or public.is_admin());

drop policy if exists "driver profiles upsert own" on public.driver_profiles;
create policy "driver profiles upsert own" on public.driver_profiles
for insert with check (user_id = auth.uid());

drop policy if exists "driver profiles update own pending or admin" on public.driver_profiles;
create policy "driver profiles update own pending or admin" on public.driver_profiles
for update using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "locations public read" on public.locations;
create policy "locations public read" on public.locations
for select using (true);

drop policy if exists "trips read active or participant admin" on public.trips;
create policy "trips read active or participant admin" on public.trips
for select using (
  status = 'active'
  or driver_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "drivers create approved trips" on public.trips;
create policy "drivers create approved trips" on public.trips
for insert with check (driver_id = auth.uid() and public.can_create_trip());

drop policy if exists "drivers update own trips or admin" on public.trips;
create policy "drivers update own trips or admin" on public.trips
for update using (driver_id = auth.uid() or public.is_admin())
with check (driver_id = auth.uid() or public.is_admin());

drop policy if exists "bookings read participant admin" on public.passenger_bookings;
create policy "bookings read participant admin" on public.passenger_bookings
for select using (
  traveler_id = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.trips t where t.id = trip_id and t.driver_id = auth.uid())
);

drop policy if exists "travelers create bookings" on public.passenger_bookings;
create policy "travelers create bookings" on public.passenger_bookings
for insert with check (
  traveler_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'traveler'
      and p.phone_verified = true
      and p.is_suspended = false
  )
);

drop policy if exists "bookings update participant admin" on public.passenger_bookings;
create policy "bookings update participant admin" on public.passenger_bookings
for update using (
  traveler_id = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.trips t where t.id = trip_id and t.driver_id = auth.uid())
)
with check (
  traveler_id = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.trips t where t.id = trip_id and t.driver_id = auth.uid())
);

drop policy if exists "cargo read participant admin" on public.cargo_requests;
create policy "cargo read participant admin" on public.cargo_requests
for select using (
  sender_id = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.trips t where t.id = trip_id and t.driver_id = auth.uid())
);

drop policy if exists "cargo senders create on cargo trips" on public.cargo_requests;
create policy "cargo senders create on cargo trips" on public.cargo_requests
for insert with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'cargo_sender'
      and p.phone_verified = true
      and p.cargo_policy_accepted = true
      and p.is_suspended = false
  )
  and exists (
    select 1 from public.trips t
    where t.id = trip_id
      and t.allows_cargo = true
      and t.status = 'active'
  )
);

drop policy if exists "cargo update participant admin" on public.cargo_requests;
create policy "cargo update participant admin" on public.cargo_requests
for update using (
  sender_id = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.trips t where t.id = trip_id and t.driver_id = auth.uid())
)
with check (
  sender_id = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.trips t where t.id = trip_id and t.driver_id = auth.uid())
);

drop policy if exists "payments read own participant admin" on public.payments;
create policy "payments read own participant admin" on public.payments
for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "payments create own" on public.payments;
create policy "payments create own" on public.payments
for insert with check (user_id = auth.uid());

drop policy if exists "payments update admin" on public.payments;
create policy "payments update admin" on public.payments
for update using (public.is_admin())
with check (public.is_admin());

drop policy if exists "proofs read owner participant admin" on public.proofs;
create policy "proofs read owner participant admin" on public.proofs
for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "proofs create own" on public.proofs;
create policy "proofs create own" on public.proofs
for insert with check (user_id = auth.uid());

drop policy if exists "reviews public read" on public.reviews;
create policy "reviews public read" on public.reviews
for select using (true);

drop policy if exists "reviews create own" on public.reviews;
create policy "reviews create own" on public.reviews
for insert with check (reviewer_id = auth.uid());

drop policy if exists "reports read own or admin" on public.reports;
create policy "reports read own or admin" on public.reports
for select using (reporter_id = auth.uid() or public.is_admin());

drop policy if exists "reports create own" on public.reports;
create policy "reports create own" on public.reports
for insert with check (reporter_id = auth.uid());

drop policy if exists "reports update admin" on public.reports;
create policy "reports update admin" on public.reports
for update using (public.is_admin())
with check (public.is_admin());

drop policy if exists "notifications read own" on public.notifications;
create policy "notifications read own" on public.notifications
for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "notifications update own" on public.notifications;
create policy "notifications update own" on public.notifications
for update using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "trip logs read participant admin" on public.trip_status_logs;
create policy "trip logs read participant admin" on public.trip_status_logs
for select using (
  public.is_admin()
  or changed_by = auth.uid()
  or exists (select 1 from public.trips t where t.id = trip_id and t.driver_id = auth.uid())
  or exists (select 1 from public.passenger_bookings b where b.id = booking_id and b.traveler_id = auth.uid())
  or exists (select 1 from public.cargo_requests c where c.id = cargo_request_id and c.sender_id = auth.uid())
);

drop policy if exists "trip logs create participant admin" on public.trip_status_logs;
create policy "trip logs create participant admin" on public.trip_status_logs
for insert with check (changed_by = auth.uid() or public.is_admin());

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('driver-documents', 'driver-documents', false),
  ('vehicle-documents', 'vehicle-documents', false),
  ('payment-proofs', 'payment-proofs', false),
  ('cargo-proofs', 'cargo-proofs', false)
on conflict (id) do nothing;

drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects
for select using (bucket_id = 'avatars');

drop policy if exists "users upload own avatars" on storage.objects;
create policy "users upload own avatars" on storage.objects
for insert with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "users manage own private uploads" on storage.objects;
create policy "users manage own private uploads" on storage.objects
for all using (
  bucket_id in ('driver-documents', 'vehicle-documents', 'payment-proofs', 'cargo-proofs')
  and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
)
with check (
  bucket_id in ('driver-documents', 'vehicle-documents', 'payment-proofs', 'cargo-proofs')
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "admins read private uploads" on storage.objects;
create policy "admins read private uploads" on storage.objects
for select using (
  bucket_id in ('driver-documents', 'vehicle-documents', 'payment-proofs', 'cargo-proofs')
  and public.is_admin()
);


-- ##################################################
-- 202605310001_admin_helpers.sql
-- ##################################################

-- Run this first if SQL Editor says: function public.is_admin() does not exist.
-- It is safe to run multiple times.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and is_suspended = false
  );
$$;

create or replace function public.can_create_trip()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.driver_profiles d on d.user_id = p.id
    where p.id = auth.uid()
      and p.role = 'driver'
      and p.phone_verified = true
      and p.onboarding_completed = true
      and p.is_suspended = false
      and d.verification_status = 'approved'
  );
$$;


-- ##################################################
-- 202605310002_repair_missing_tables.sql
-- ##################################################

-- Repair script for partial NuudelchinTrip schema installs.
-- Use when SQL Editor stops with:
-- relation "public.passenger_bookings" does not exist
--
-- This creates the tables that come after trips, enables RLS on every table,
-- and creates storage buckets. It is safe to run multiple times.

do $$ begin
  create type public.booking_status as enum ('pending_request', 'accepted', 'rejected', 'waiting_payment', 'payment_review', 'confirmed', 'on_trip', 'completed', 'cancelled', 'disputed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.cargo_status as enum ('cargo_requested', 'cargo_accepted', 'rejected', 'waiting_payment', 'payment_review', 'picked_up', 'in_transit', 'delivered', 'completed', 'cancelled', 'disputed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('pending', 'proof_uploaded', 'approved', 'rejected', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.proof_type as enum ('payment', 'pickup', 'delivery', 'driver_license', 'vehicle_certificate', 'vehicle_photo', 'avatar');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_status as enum ('open', 'reviewing', 'resolved', 'rejected');
exception when duplicate_object then null; end $$;

create table if not exists public.passenger_bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  traveler_id uuid not null references public.profiles(id) on delete cascade,
  seats_requested integer not null default 1 check (seats_requested > 0),
  status public.booking_status not null default 'pending_request',
  total_amount integer,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cargo_requests (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  cargo_name text not null,
  cargo_type text,
  size_note text,
  weight_kg numeric(8,2),
  receiver_name text not null,
  receiver_phone text not null,
  pickup_note text,
  status public.cargo_status not null default 'cargo_requested',
  delivery_code text not null default lpad((floor(random() * 1000000))::text, 6, '0'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  booking_id uuid references public.passenger_bookings(id) on delete cascade,
  cargo_request_id uuid references public.cargo_requests(id) on delete cascade,
  amount integer not null check (amount >= 0),
  status public.payment_status not null default 'pending',
  proof_url text,
  admin_note text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint payment_one_target check (
    (booking_id is not null and cargo_request_id is null)
    or (booking_id is null and cargo_request_id is not null)
  )
);

create table if not exists public.proofs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  booking_id uuid references public.passenger_bookings(id) on delete cascade,
  cargo_request_id uuid references public.cargo_requests(id) on delete cascade,
  proof_type public.proof_type not null,
  file_url text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  trip_id uuid references public.trips(id) on delete set null,
  booking_id uuid references public.passenger_bookings(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid references public.profiles(id) on delete set null,
  trip_id uuid references public.trips(id) on delete set null,
  booking_id uuid references public.passenger_bookings(id) on delete set null,
  cargo_request_id uuid references public.cargo_requests(id) on delete set null,
  reason text not null,
  details text,
  status public.report_status not null default 'open',
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.trip_status_logs (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references public.trips(id) on delete cascade,
  booking_id uuid references public.passenger_bookings(id) on delete cascade,
  cargo_request_id uuid references public.cargo_requests(id) on delete cascade,
  status text not null,
  changed_by uuid references public.profiles(id),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_bookings_trip_id on public.passenger_bookings(trip_id);
create index if not exists idx_bookings_traveler_id on public.passenger_bookings(traveler_id);
create index if not exists idx_cargo_trip_id on public.cargo_requests(trip_id);
create index if not exists idx_cargo_sender_id on public.cargo_requests(sender_id);
create index if not exists idx_payments_user_id on public.payments(user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bookings_set_updated_at on public.passenger_bookings;
create trigger bookings_set_updated_at before update on public.passenger_bookings
for each row execute function public.set_updated_at();

drop trigger if exists cargo_set_updated_at on public.cargo_requests;
create trigger cargo_set_updated_at before update on public.cargo_requests
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.driver_profiles enable row level security;
alter table public.locations enable row level security;
alter table public.trips enable row level security;
alter table public.passenger_bookings enable row level security;
alter table public.cargo_requests enable row level security;
alter table public.payments enable row level security;
alter table public.proofs enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;
alter table public.trip_status_logs enable row level security;

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('driver-documents', 'driver-documents', false),
  ('vehicle-documents', 'vehicle-documents', false),
  ('payment-proofs', 'payment-proofs', false),
  ('cargo-proofs', 'cargo-proofs', false)
on conflict (id) do nothing;


-- ##################################################
-- 202605310003_repair_auth_profile_trigger.sql
-- ##################################################

-- Repair missing auth profile trigger.
-- Use when verification shows missing helper function: handle_new_user.
-- Safe to run multiple times.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.user_role;
begin
  begin
    requested_role := coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'traveler');
  exception when others then
    requested_role := 'traveler';
  end;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    requested_role
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
        role = public.profiles.role,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();


-- ##################################################
-- 202605310004_auth_profile_phone_metadata.sql
-- ##################################################

-- Update auth profile trigger to persist phone from Supabase Auth metadata.
-- Safe to run multiple times.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.user_role;
begin
  begin
    requested_role := coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'traveler');
  exception when others then
    requested_role := 'traveler';
  end;

  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone',
    requested_role
  )
  on conflict (id) do update
    set email = excluded.email,
        phone = coalesce(public.profiles.phone, excluded.phone),
        full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
        role = public.profiles.role,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();


-- ##################################################
-- 202606050001_seat_selection.sql
-- ##################################################

-- Seat selection support for passenger-driver booking.
-- Driver publishes exact available seats; traveler selects exact seats.

alter table public.trips
  add column if not exists available_seat_labels text[] not null default array[]::text[];

alter table public.passenger_bookings
  add column if not exists selected_seats text[] not null default array[]::text[];

create index if not exists idx_bookings_selected_seats on public.passenger_bookings using gin (selected_seats);

create or replace function public.create_passenger_booking_with_seats(
  p_trip_id uuid,
  p_selected_seats text[],
  p_note text default null
)
returns table(id uuid, status public.booking_status)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_trip public.trips%rowtype;
  v_selected text[];
  v_remaining text[];
  v_booking_id uuid;
  v_requested integer;
begin
  if v_user_id is null then
    raise exception 'Нэвтэрсэн хэрэглэгч олдсонгүй.' using errcode = '28000';
  end if;

  select array_agg(distinct trim(seat))
    into v_selected
  from unnest(coalesce(p_selected_seats, array[]::text[])) as seat
  where trim(seat) <> '';

  v_selected := coalesce(v_selected, array[]::text[]);
  v_requested := coalesce(array_length(v_selected, 1), 0);

  if v_requested < 1 then
    raise exception 'Дор хаяж нэг суудал сонгоно уу.' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = v_user_id
      and p.role = 'traveler'
      and p.phone_verified = true
      and p.is_suspended = false
  ) then
    raise exception 'Зөвхөн утсаа баталгаажуулсан аялагч суудал захиална.' using errcode = '42501';
  end if;

  select *
    into v_trip
  from public.trips t
  where t.id = p_trip_id
    and t.status = 'active'
  for update;

  if not found then
    raise exception 'Идэвхтэй чиглэл олдсонгүй.' using errcode = 'P0002';
  end if;

  if v_trip.driver_id = v_user_id then
    raise exception 'Өөрийн чиглэл дээр суудал захиалах боломжгүй.' using errcode = '42501';
  end if;

  if coalesce(array_length(v_trip.available_seat_labels, 1), 0) = 0 then
    raise exception 'Энэ чиглэл дээр сонгож болох суудлын мэдээлэл алга.' using errcode = '22023';
  end if;

  if not v_selected <@ v_trip.available_seat_labels then
    raise exception 'Сонгосон суудлын зарим нь аль хэдийн захиалагдсан байна.' using errcode = '23514';
  end if;

  if v_trip.seats_available < v_requested then
    raise exception 'Сул суудлын тоо хүрэлцэхгүй байна.' using errcode = '23514';
  end if;

  insert into public.passenger_bookings (
    trip_id,
    traveler_id,
    seats_requested,
    selected_seats,
    status,
    total_amount,
    note
  )
  values (
    p_trip_id,
    v_user_id,
    v_requested,
    v_selected,
    'pending_request',
    v_trip.price_per_seat * v_requested,
    nullif(trim(coalesce(p_note, '')), '')
  )
  returning passenger_bookings.id into v_booking_id;

  select coalesce(array_agg(seat order by ord), array[]::text[])
    into v_remaining
  from unnest(v_trip.available_seat_labels) with ordinality as current_seats(seat, ord)
  where not current_seats.seat = any(v_selected);

  update public.trips
  set available_seat_labels = v_remaining,
      seats_available = greatest(0, seats_available - v_requested),
      status = case when greatest(0, seats_available - v_requested) = 0 then 'full' else status end,
      updated_at = now()
  where trips.id = p_trip_id;

  return query select v_booking_id, 'pending_request'::public.booking_status;
end;
$$;

grant execute on function public.create_passenger_booking_with_seats(uuid, text[], text) to authenticated;


-- ##################################################
-- 202606050002_ensure_current_profile.sql
-- ##################################################

-- Repair helper for existing Auth users that do not have a matching public.profiles row.
-- Safe to run multiple times.

create or replace function public.ensure_current_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  auth_user auth.users%rowtype;
  requested_role public.user_role;
  profile_row public.profiles%rowtype;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select *
  into auth_user
  from auth.users
  where id = current_user_id;

  if auth_user.id is null then
    raise exception 'auth_user_not_found';
  end if;

  begin
    requested_role := coalesce((auth_user.raw_user_meta_data->>'role')::public.user_role, 'traveler');
  exception when others then
    requested_role := 'traveler';
  end;

  insert into public.profiles (id, email, full_name, phone, role)
  values (
    auth_user.id,
    auth_user.email,
    coalesce(auth_user.raw_user_meta_data->>'full_name', ''),
    auth_user.raw_user_meta_data->>'phone',
    requested_role
  )
  on conflict (id) do update
    set email = coalesce(public.profiles.email, excluded.email),
        phone = coalesce(public.profiles.phone, excluded.phone),
        full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
        updated_at = now()
  returning * into profile_row;

  return profile_row;
end;
$$;

grant execute on function public.ensure_current_profile() to authenticated;


-- ##################################################
-- 202606060001_sync_current_profile.sql
-- ##################################################

-- Keep the signed-in Auth user and public profile in sync, then return the
-- effective marketplace role without requiring a second RLS-protected query.
-- Safe to run multiple times.

create or replace function public.sync_current_profile()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  auth_user auth.users%rowtype;
  requested_role public.user_role := 'traveler';
  profile_row public.profiles%rowtype;
  driver_status public.driver_verification_status;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select *
  into auth_user
  from auth.users
  where id = current_user_id;

  if auth_user.id is null then
    raise exception 'auth_user_not_found';
  end if;

  begin
    requested_role := coalesce(
      (auth_user.raw_user_meta_data->>'role')::public.user_role,
      'traveler'
    );
  exception when others then
    requested_role := 'traveler';
  end;

  insert into public.profiles (id, role, full_name, phone, email)
  values (
    auth_user.id,
    requested_role,
    coalesce(
      nullif(auth_user.raw_user_meta_data->>'full_name', ''),
      split_part(coalesce(auth_user.email, ''), '@', 1)
    ),
    coalesce(
      nullif(auth_user.raw_user_meta_data->>'phone', ''),
      auth_user.phone
    ),
    auth_user.email
  )
  on conflict (id) do update
    set email = coalesce(excluded.email, public.profiles.email),
        phone = coalesce(public.profiles.phone, excluded.phone),
        full_name = coalesce(
          nullif(public.profiles.full_name, ''),
          excluded.full_name
        ),
        updated_at = now()
  returning * into profile_row;

  if profile_row.role = 'driver' then
    select verification_status
    into driver_status
    from public.driver_profiles
    where user_id = current_user_id;
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

revoke all on function public.sync_current_profile() from public;
grant execute on function public.sync_current_profile() to authenticated;


-- ##################################################
-- 202606060002_registration_role_sync.sql
-- ##################################################

-- Keep registration role metadata and public.profiles aligned.
-- Admin can never be granted from user-controlled signup metadata.
-- Safe to run multiple times.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.user_role := 'traveler';
  metadata_role text := new.raw_user_meta_data->>'role';
begin
  if metadata_role in ('traveler', 'driver', 'cargo_sender') then
    requested_role := metadata_role::public.user_role;
  end if;

  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', new.phone),
    requested_role
  )
  on conflict (id) do update
    set email = excluded.email,
        phone = coalesce(public.profiles.phone, excluded.phone),
        full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
        role = case
          when public.profiles.role = 'admin' or public.profiles.onboarding_completed
            then public.profiles.role
          else excluded.role
        end,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.sync_current_profile()
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

  select *
  into auth_user
  from auth.users
  where id = current_user_id;

  if auth_user.id is null then
    raise exception 'auth_user_not_found';
  end if;

  metadata_role := auth_user.raw_user_meta_data->>'role';
  if metadata_role in ('traveler', 'driver', 'cargo_sender') then
    requested_role := metadata_role::public.user_role;
  end if;

  insert into public.profiles (id, role, full_name, phone, email)
  values (
    auth_user.id,
    requested_role,
    coalesce(
      nullif(auth_user.raw_user_meta_data->>'full_name', ''),
      split_part(coalesce(auth_user.email, ''), '@', 1)
    ),
    coalesce(
      nullif(auth_user.raw_user_meta_data->>'phone', ''),
      auth_user.phone
    ),
    auth_user.email
  )
  on conflict (id) do update
    set email = coalesce(excluded.email, public.profiles.email),
        phone = coalesce(public.profiles.phone, excluded.phone),
        full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
        role = case
          when public.profiles.role = 'admin' or public.profiles.onboarding_completed
            then public.profiles.role
          else excluded.role
        end,
        updated_at = now()
  returning * into profile_row;

  if profile_row.role = 'driver' then
    select verification_status
    into driver_status
    from public.driver_profiles
    where user_id = current_user_id;
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

revoke all on function public.sync_current_profile() from public;
grant execute on function public.sync_current_profile() to authenticated;


-- ##################################################
-- 202606060003_submit_driver_onboarding.sql
-- ##################################################

-- Save the driver's initial vehicle and verification data atomically.
-- The authenticated user can only submit onboarding for their own driver profile.

create or replace function public.submit_driver_onboarding(
  p_car_model text,
  p_plate_number text,
  p_seats integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_role public.user_role;
  saved_driver public.driver_profiles%rowtype;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select role
  into current_role
  from public.profiles
  where id = current_user_id
    and is_suspended = false;

  if current_role is null then
    raise exception 'profile_not_found';
  end if;

  if current_role <> 'driver' then
    raise exception 'driver_role_required';
  end if;

  if nullif(btrim(p_car_model), '') is null then
    raise exception 'car_model_required';
  end if;

  if nullif(btrim(p_plate_number), '') is null then
    raise exception 'plate_number_required';
  end if;

  if p_seats is null or p_seats < 1 or p_seats > 12 then
    raise exception 'invalid_seat_count';
  end if;

  insert into public.driver_profiles (
    user_id,
    verification_status,
    car_model,
    plate_number,
    seats
  )
  values (
    current_user_id,
    'pending',
    btrim(p_car_model),
    upper(btrim(p_plate_number)),
    p_seats
  )
  on conflict (user_id) do update
    set verification_status = 'pending',
        car_model = excluded.car_model,
        plate_number = excluded.plate_number,
        seats = excluded.seats,
        updated_at = now()
  returning * into saved_driver;

  update public.profiles
  set onboarding_completed = true,
      updated_at = now()
  where id = current_user_id;

  return jsonb_build_object(
    'verification_status', saved_driver.verification_status,
    'car_model', saved_driver.car_model,
    'plate_number', saved_driver.plate_number,
    'seats', saved_driver.seats,
    'onboarding_completed', true
  );
end;
$$;

revoke all on function public.submit_driver_onboarding(text, text, integer) from public;
grant execute on function public.submit_driver_onboarding(text, text, integer) to authenticated;


-- ##################################################
-- 202606060004_repair_driver_onboarding_profile.sql
-- ##################################################

-- Repair a missing or stale profile role while submitting driver onboarding.
-- Only the authenticated user's non-privileged signup metadata can be used.

create or replace function public.submit_driver_onboarding(
  p_car_model text,
  p_plate_number text,
  p_seats integer
)
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
  saved_driver public.driver_profiles%rowtype;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select *
  into auth_user
  from auth.users
  where id = current_user_id;

  if auth_user.id is null then
    raise exception 'auth_user_not_found';
  end if;

  metadata_role := auth_user.raw_user_meta_data->>'role';

  select *
  into profile_row
  from public.profiles
  where id = current_user_id
  for update;

  if profile_row.id is null then
    if metadata_role <> 'driver' then
      raise exception 'driver_role_required';
    end if;

    insert into public.profiles (
      id,
      role,
      full_name,
      phone,
      email,
      phone_verified
    )
    values (
      auth_user.id,
      'driver',
      coalesce(
        nullif(auth_user.raw_user_meta_data->>'full_name', ''),
        split_part(coalesce(auth_user.email, ''), '@', 1)
      ),
      coalesce(
        nullif(auth_user.raw_user_meta_data->>'phone', ''),
        auth_user.phone
      ),
      auth_user.email,
      true
    )
    returning * into profile_row;
  elsif profile_row.role <> 'driver' then
    if profile_row.role = 'admin'
      or profile_row.onboarding_completed
      or metadata_role <> 'driver'
    then
      raise exception 'driver_role_required';
    end if;

    update public.profiles
    set role = 'driver',
        updated_at = now()
    where id = current_user_id
    returning * into profile_row;
  end if;

  if profile_row.is_suspended then
    raise exception 'account_suspended';
  end if;

  if nullif(btrim(p_car_model), '') is null then
    raise exception 'car_model_required';
  end if;

  if nullif(btrim(p_plate_number), '') is null then
    raise exception 'plate_number_required';
  end if;

  if p_seats is null or p_seats < 1 or p_seats > 12 then
    raise exception 'invalid_seat_count';
  end if;

  insert into public.driver_profiles (
    user_id,
    verification_status,
    car_model,
    plate_number,
    seats
  )
  values (
    current_user_id,
    'pending',
    btrim(p_car_model),
    upper(btrim(p_plate_number)),
    p_seats
  )
  on conflict (user_id) do update
    set verification_status = 'pending',
        car_model = excluded.car_model,
        plate_number = excluded.plate_number,
        seats = excluded.seats,
        updated_at = now()
  returning * into saved_driver;

  update public.profiles
  set onboarding_completed = true,
      updated_at = now()
  where id = current_user_id;

  return jsonb_build_object(
    'verification_status', saved_driver.verification_status,
    'car_model', saved_driver.car_model,
    'plate_number', saved_driver.plate_number,
    'seats', saved_driver.seats,
    'onboarding_completed', true
  );
end;
$$;

revoke all on function public.submit_driver_onboarding(text, text, integer) from public;
grant execute on function public.submit_driver_onboarding(text, text, integer) to authenticated;


-- ##################################################
-- 202606060005_complete_phone_verification.sql
-- ##################################################

-- Mark the authenticated user's phone as verified and return the current profile.
-- The real SMS webhook can call the same profile update later.

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

  select *
  into auth_user
  from auth.users
  where id = current_user_id;

  if auth_user.id is null then
    raise exception 'auth_user_not_found';
  end if;

  metadata_role := auth_user.raw_user_meta_data->>'role';
  if metadata_role in ('traveler', 'driver', 'cargo_sender') then
    requested_role := metadata_role::public.user_role;
  end if;

  insert into public.profiles (
    id,
    role,
    full_name,
    phone,
    email,
    phone_verified
  )
  values (
    auth_user.id,
    requested_role,
    coalesce(
      nullif(auth_user.raw_user_meta_data->>'full_name', ''),
      split_part(coalesce(auth_user.email, ''), '@', 1)
    ),
    coalesce(
      nullif(auth_user.raw_user_meta_data->>'phone', ''),
      auth_user.phone
    ),
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

  if profile_row.role = 'driver' then
    select verification_status
    into driver_status
    from public.driver_profiles
    where user_id = current_user_id;
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


-- ##################################################
-- 202606060006_complete_traveler_onboarding.sql
-- ##################################################

-- Complete traveler onboarding atomically and repair a missing traveler profile.

alter table public.profiles
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text;

create or replace function public.complete_traveler_onboarding(
  p_emergency_contact_name text default null,
  p_emergency_contact_phone text default null
)
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

  select *
  into auth_user
  from auth.users
  where id = current_user_id;

  if auth_user.id is null then
    raise exception 'auth_user_not_found';
  end if;

  metadata_role := auth_user.raw_user_meta_data->>'role';

  select *
  into profile_row
  from public.profiles
  where id = current_user_id
  for update;

  if profile_row.id is null then
    if metadata_role <> 'traveler' then
      raise exception 'traveler_role_required';
    end if;

    insert into public.profiles (
      id,
      role,
      full_name,
      phone,
      email,
      phone_verified,
      onboarding_completed,
      emergency_contact_name,
      emergency_contact_phone
    )
    values (
      auth_user.id,
      'traveler',
      coalesce(
        nullif(auth_user.raw_user_meta_data->>'full_name', ''),
        split_part(coalesce(auth_user.email, ''), '@', 1)
      ),
      coalesce(
        nullif(auth_user.raw_user_meta_data->>'phone', ''),
        auth_user.phone
      ),
      auth_user.email,
      true,
      true,
      nullif(btrim(p_emergency_contact_name), ''),
      nullif(btrim(p_emergency_contact_phone), '')
    )
    returning * into profile_row;
  else
    if profile_row.role <> 'traveler' then
      if profile_row.role = 'admin'
        or profile_row.onboarding_completed
        or metadata_role <> 'traveler'
      then
        raise exception 'traveler_role_required';
      end if;
    end if;

    if profile_row.is_suspended then
      raise exception 'account_suspended';
    end if;

    update public.profiles
    set role = 'traveler',
        phone_verified = true,
        emergency_contact_name = nullif(btrim(p_emergency_contact_name), ''),
        emergency_contact_phone = nullif(btrim(p_emergency_contact_phone), ''),
        onboarding_completed = true,
        updated_at = now()
    where id = current_user_id
    returning * into profile_row;
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

revoke all on function public.complete_traveler_onboarding(text, text) from public;
grant execute on function public.complete_traveler_onboarding(text, text) to authenticated;


-- ##################################################
-- 202606070001_phone_otp_and_profile_guard.sql
-- ##################################################

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


-- ##################################################
-- 202606070002_driver_verification.sql
-- ##################################################

-- Phase 2: Driver verification — documents, admin review, and status guard.
--
--   1. Reviewer columns on driver_profiles (reviewed_by, reviewed_at, rejection_reason).
--   2. Guard trigger so a driver cannot change their own verification_status /
--      cargo_permission_status / reviewer fields / rating / completed_trips.
--      (Drivers may still edit car_model / plate / seats / document URLs.)
--   3. submit_driver_onboarding extended to store the three required document paths.
--   4. review_driver_verification(user_id, status, reason) — admin-only RPC that sets
--      status + reviewer + reviewed_at + rejection_reason in one trusted call.
--
-- Storage: the private `driver-documents` bucket and its owner/admin policies already
-- exist (see 202605310001_initial_schema.sql), so no bucket changes are needed here.

-- ---------------------------------------------------------------------------
-- 1. Reviewer columns
-- ---------------------------------------------------------------------------
alter table public.driver_profiles
  add column if not exists reviewed_by uuid references public.profiles(id),
  add column if not exists reviewed_at timestamptz,
  add column if not exists rejection_reason text;

-- ---------------------------------------------------------------------------
-- 2. Guard trigger: drivers cannot self-approve
-- ---------------------------------------------------------------------------
create or replace function public.guard_driver_verification_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bypass boolean := coalesce(current_setting('app.guard_bypass', true), 'off') = 'on';
begin
  if bypass or public.is_admin() then
    return new;
  end if;

  if new.verification_status is distinct from old.verification_status then
    new.verification_status := old.verification_status;
  end if;
  if new.cargo_permission_status is distinct from old.cargo_permission_status then
    new.cargo_permission_status := old.cargo_permission_status;
  end if;
  if new.reviewed_by is distinct from old.reviewed_by then
    new.reviewed_by := old.reviewed_by;
  end if;
  if new.reviewed_at is distinct from old.reviewed_at then
    new.reviewed_at := old.reviewed_at;
  end if;
  if new.rejection_reason is distinct from old.rejection_reason then
    new.rejection_reason := old.rejection_reason;
  end if;
  if new.rating is distinct from old.rating then
    new.rating := old.rating;
  end if;
  if new.completed_trips is distinct from old.completed_trips then
    new.completed_trips := old.completed_trips;
  end if;

  return new;
end;
$$;

drop trigger if exists driver_profiles_guard_verification on public.driver_profiles;
create trigger driver_profiles_guard_verification
before update on public.driver_profiles
for each row execute function public.guard_driver_verification_fields();

-- ---------------------------------------------------------------------------
-- 3. submit_driver_onboarding with required documents
-- ---------------------------------------------------------------------------
create or replace function public.submit_driver_onboarding(
  p_car_model text,
  p_plate_number text,
  p_seats integer,
  p_driver_license_url text default null,
  p_vehicle_certificate_url text default null,
  p_vehicle_photo_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_role public.user_role;
  saved_driver public.driver_profiles%rowtype;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select role into current_role
  from public.profiles
  where id = current_user_id and is_suspended = false;

  if current_role is null then
    raise exception 'profile_not_found';
  end if;
  if current_role <> 'driver' then
    raise exception 'driver_role_required';
  end if;
  if nullif(btrim(p_car_model), '') is null then
    raise exception 'car_model_required';
  end if;
  if nullif(btrim(p_plate_number), '') is null then
    raise exception 'plate_number_required';
  end if;
  if p_seats is null or p_seats < 1 or p_seats > 12 then
    raise exception 'invalid_seat_count';
  end if;
  if nullif(btrim(p_driver_license_url), '') is null then
    raise exception 'driver_license_required';
  end if;
  if nullif(btrim(p_vehicle_certificate_url), '') is null then
    raise exception 'vehicle_certificate_required';
  end if;
  if nullif(btrim(p_vehicle_photo_url), '') is null then
    raise exception 'vehicle_photo_required';
  end if;

  perform set_config('app.guard_bypass', 'on', true);

  insert into public.driver_profiles (
    user_id, verification_status, car_model, plate_number, seats,
    driver_license_url, vehicle_certificate_url, vehicle_photo_url,
    reviewed_by, reviewed_at, rejection_reason
  )
  values (
    current_user_id, 'pending', btrim(p_car_model), upper(btrim(p_plate_number)), p_seats,
    btrim(p_driver_license_url), btrim(p_vehicle_certificate_url), btrim(p_vehicle_photo_url),
    null, null, null
  )
  on conflict (user_id) do update
    set verification_status = 'pending',
        car_model = excluded.car_model,
        plate_number = excluded.plate_number,
        seats = excluded.seats,
        driver_license_url = excluded.driver_license_url,
        vehicle_certificate_url = excluded.vehicle_certificate_url,
        vehicle_photo_url = excluded.vehicle_photo_url,
        reviewed_by = null,
        reviewed_at = null,
        rejection_reason = null,
        updated_at = now()
  returning * into saved_driver;

  perform set_config('app.guard_bypass', 'off', true);

  update public.profiles
  set onboarding_completed = true, updated_at = now()
  where id = current_user_id;

  return jsonb_build_object(
    'verification_status', saved_driver.verification_status,
    'car_model', saved_driver.car_model,
    'plate_number', saved_driver.plate_number,
    'seats', saved_driver.seats,
    'onboarding_completed', true
  );
end;
$$;

revoke all on function public.submit_driver_onboarding(text, text, integer, text, text, text) from public;
grant execute on function public.submit_driver_onboarding(text, text, integer, text, text, text) to authenticated;

-- Drop the old 3-arg signature so callers must pass documents.
drop function if exists public.submit_driver_onboarding(text, text, integer);

-- ---------------------------------------------------------------------------
-- 4. Admin review RPC
-- ---------------------------------------------------------------------------
create or replace function public.review_driver_verification(
  p_user_id uuid,
  p_status public.driver_verification_status,
  p_rejection_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_id uuid := auth.uid();
  saved public.driver_profiles%rowtype;
begin
  if admin_id is null then
    raise exception 'not_authenticated';
  end if;
  if not public.is_admin() then
    raise exception 'admin_required';
  end if;
  if p_status not in ('approved', 'rejected', 'pending') then
    raise exception 'invalid_status';
  end if;
  if p_status = 'rejected' and nullif(btrim(p_rejection_reason), '') is null then
    raise exception 'rejection_reason_required';
  end if;

  perform set_config('app.guard_bypass', 'on', true);

  update public.driver_profiles
  set verification_status = p_status,
      cargo_permission_status = case when p_status = 'approved' then 'approved' else p_status end,
      reviewed_by = admin_id,
      reviewed_at = now(),
      rejection_reason = case when p_status = 'rejected' then btrim(p_rejection_reason) else null end,
      updated_at = now()
  where user_id = p_user_id
  returning * into saved;

  perform set_config('app.guard_bypass', 'off', true);

  if saved.user_id is null then
    raise exception 'driver_not_found';
  end if;

  return jsonb_build_object(
    'user_id', saved.user_id,
    'verification_status', saved.verification_status,
    'reviewed_at', saved.reviewed_at,
    'rejection_reason', saved.rejection_reason
  );
end;
$$;

revoke all on function public.review_driver_verification(uuid, public.driver_verification_status, text) from public;
grant execute on function public.review_driver_verification(uuid, public.driver_verification_status, text) to authenticated;


-- ##################################################
-- 202606070003_seat_management.sql
-- ##################################################

-- Phase 4: Seat management — timed holds + automatic release.
--
--   1. passenger_bookings gains hold_expires_at + state-transition timestamps
--      (accepted_at / rejected_at / cancelled_at / confirmed_at / seats_released_at).
--   2. release_seats_for_booking() puts a booking's seats back on the trip (once).
--   3. create_passenger_booking_with_seats now stamps hold_expires_at and lazily
--      expires stale holds before taking new seats.
--   4. set_passenger_booking_status() — role-validated transition RPC that releases
--      seats on reject/cancel and records timestamps (replaces the raw client update).
--   5. expire_stale_seat_holds() — sweeper that releases + cancels holds past expiry.
--
-- Hold window is configurable via app_settings('seat_hold_minutes'), default 720 (12h).

insert into public.app_settings (key, value)
values ('seat_hold_minutes', '720')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 1. Columns
-- ---------------------------------------------------------------------------
alter table public.passenger_bookings
  add column if not exists hold_expires_at timestamptz,
  add column if not exists accepted_at timestamptz,
  add column if not exists rejected_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists confirmed_at timestamptz,
  add column if not exists seats_released_at timestamptz;

create index if not exists idx_bookings_hold_expiry
  on public.passenger_bookings (hold_expires_at)
  where seats_released_at is null;

-- ---------------------------------------------------------------------------
-- Helper: hold window in minutes
-- ---------------------------------------------------------------------------
create or replace function public.seat_hold_minutes()
returns integer
language sql
stable
set search_path = public
as $$
  select coalesce((select value::int from public.app_settings where key = 'seat_hold_minutes'), 720);
$$;

-- ---------------------------------------------------------------------------
-- 2. Release a booking's seats back to its trip (idempotent)
-- ---------------------------------------------------------------------------
create or replace function public.release_seats_for_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.passenger_bookings%rowtype;
  v_trip public.trips%rowtype;
  v_merged text[];
begin
  select * into v_booking
  from public.passenger_bookings
  where id = p_booking_id
  for update;

  if not found or v_booking.seats_released_at is not null then
    return; -- nothing to release or already released
  end if;

  select * into v_trip from public.trips where id = v_booking.trip_id for update;
  if found then
    -- Merge the released seats back, de-duplicated and naturally sorted.
    select coalesce(array_agg(seat order by length(seat), seat), array[]::text[])
      into v_merged
    from (
      select distinct seat
      from unnest(coalesce(v_trip.available_seat_labels, array[]::text[])
                  || coalesce(v_booking.selected_seats, array[]::text[])) as seat
      where trim(seat) <> ''
    ) s;

    update public.trips
    set available_seat_labels = v_merged,
        seats_available = least(seats_total, seats_available + coalesce(v_booking.seats_requested, 0)),
        status = case
          when status = 'full' and least(seats_total, seats_available + coalesce(v_booking.seats_requested, 0)) > 0
            then 'active'
          else status
        end,
        updated_at = now()
    where id = v_trip.id;
  end if;

  update public.passenger_bookings
  set seats_released_at = now(), updated_at = now()
  where id = p_booking_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Expire stale holds (pending / awaiting payment past hold_expires_at)
-- ---------------------------------------------------------------------------
create or replace function public.expire_stale_seat_holds()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  n integer := 0;
begin
  for r in
    select id from public.passenger_bookings
    where status in ('pending_request', 'accepted', 'waiting_payment')
      and seats_released_at is null
      and hold_expires_at is not null
      and hold_expires_at < now()
    for update skip locked
  loop
    perform public.release_seats_for_booking(r.id);
    update public.passenger_bookings
    set status = 'cancelled', cancelled_at = now(), updated_at = now()
    where id = r.id;
    n := n + 1;
  end loop;
  return n;
end;
$$;

grant execute on function public.expire_stale_seat_holds() to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Booking creation: stamp hold_expires_at + lazily expire stale holds first
-- ---------------------------------------------------------------------------
create or replace function public.create_passenger_booking_with_seats(
  p_trip_id uuid,
  p_selected_seats text[],
  p_note text default null
)
returns table(id uuid, status public.booking_status)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_trip public.trips%rowtype;
  v_selected text[];
  v_remaining text[];
  v_booking_id uuid;
  v_requested integer;
begin
  if v_user_id is null then
    raise exception 'Нэвтэрсэн хэрэглэгч олдсонгүй.' using errcode = '28000';
  end if;

  -- Free up any expired holds on this trip before we read availability.
  perform public.expire_stale_seat_holds();

  select array_agg(distinct trim(seat))
    into v_selected
  from unnest(coalesce(p_selected_seats, array[]::text[])) as seat
  where trim(seat) <> '';

  v_selected := coalesce(v_selected, array[]::text[]);
  v_requested := coalesce(array_length(v_selected, 1), 0);

  if v_requested < 1 then
    raise exception 'Дор хаяж нэг суудал сонгоно уу.' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = v_user_id
      and p.role = 'traveler'
      and p.phone_verified = true
      and p.is_suspended = false
  ) then
    raise exception 'Зөвхөн утсаа баталгаажуулсан аялагч суудал захиална.' using errcode = '42501';
  end if;

  select * into v_trip
  from public.trips t
  where t.id = p_trip_id and t.status = 'active'
  for update;

  if not found then
    raise exception 'Идэвхтэй чиглэл олдсонгүй.' using errcode = 'P0002';
  end if;

  if v_trip.driver_id = v_user_id then
    raise exception 'Өөрийн чиглэл дээр суудал захиалах боломжгүй.' using errcode = '42501';
  end if;

  if coalesce(array_length(v_trip.available_seat_labels, 1), 0) = 0 then
    raise exception 'Энэ чиглэл дээр сонгож болох суудлын мэдээлэл алга.' using errcode = '22023';
  end if;

  if not v_selected <@ v_trip.available_seat_labels then
    raise exception 'Сонгосон суудлын зарим нь аль хэдийн захиалагдсан байна.' using errcode = '23514';
  end if;

  if v_trip.seats_available < v_requested then
    raise exception 'Сул суудлын тоо хүрэлцэхгүй байна.' using errcode = '23514';
  end if;

  insert into public.passenger_bookings (
    trip_id, traveler_id, seats_requested, selected_seats, status, total_amount, note, hold_expires_at
  )
  values (
    p_trip_id, v_user_id, v_requested, v_selected, 'pending_request',
    v_trip.price_per_seat * v_requested,
    nullif(trim(coalesce(p_note, '')), ''),
    now() + make_interval(mins => public.seat_hold_minutes())
  )
  returning passenger_bookings.id into v_booking_id;

  select coalesce(array_agg(seat order by ord), array[]::text[])
    into v_remaining
  from unnest(v_trip.available_seat_labels) with ordinality as current_seats(seat, ord)
  where not current_seats.seat = any(v_selected);

  update public.trips
  set available_seat_labels = v_remaining,
      seats_available = greatest(0, seats_available - v_requested),
      status = case when greatest(0, seats_available - v_requested) = 0 then 'full' else status end,
      updated_at = now()
  where trips.id = p_trip_id;

  return query select v_booking_id, 'pending_request'::public.booking_status;
end;
$$;

grant execute on function public.create_passenger_booking_with_seats(uuid, text[], text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Role-validated status transition with seat release
-- ---------------------------------------------------------------------------
create or replace function public.set_passenger_booking_status(
  p_booking_id uuid,
  p_status public.booking_status
)
returns table(id uuid, status public.booking_status)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_booking public.passenger_bookings%rowtype;
  v_trip public.trips%rowtype;
  v_is_driver boolean;
  v_is_traveler boolean;
  v_is_admin boolean := public.is_admin();
begin
  if v_actor is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_booking from public.passenger_bookings where id = p_booking_id for update;
  if not found then
    raise exception 'booking_not_found';
  end if;

  select * into v_trip from public.trips where id = v_booking.trip_id;
  v_is_driver := v_trip.driver_id = v_actor;
  v_is_traveler := v_booking.traveler_id = v_actor;

  -- Authorisation per target status.
  if p_status in ('accepted', 'rejected', 'waiting_payment', 'confirmed') then
    if not (v_is_driver or v_is_admin) then
      raise exception 'driver_or_admin_required';
    end if;
  elsif p_status = 'cancelled' then
    if not (v_is_driver or v_is_traveler or v_is_admin) then
      raise exception 'not_authorized';
    end if;
  else
    raise exception 'unsupported_status';
  end if;

  -- Apply status + matching timestamp.
  update public.passenger_bookings
  set status = p_status,
      accepted_at  = case when p_status = 'accepted'  then now() else accepted_at  end,
      rejected_at  = case when p_status = 'rejected'  then now() else rejected_at  end,
      cancelled_at = case when p_status = 'cancelled' then now() else cancelled_at end,
      confirmed_at = case when p_status = 'confirmed' then now() else confirmed_at end,
      -- Extend the hold when the driver accepts so the traveler has time to pay.
      hold_expires_at = case
        when p_status in ('accepted', 'waiting_payment')
          then now() + make_interval(mins => public.seat_hold_minutes())
        else hold_expires_at
      end,
      updated_at = now()
  where id = p_booking_id;

  -- Release seats when the booking ends without travelling.
  if p_status in ('rejected', 'cancelled') then
    perform public.release_seats_for_booking(p_booking_id);
  end if;

  return query select p_booking_id, p_status;
end;
$$;

revoke all on function public.set_passenger_booking_status(uuid, public.booking_status) from public;
grant execute on function public.set_passenger_booking_status(uuid, public.booking_status) to authenticated;


-- ##################################################
-- 202606070004_booking_lifecycle.sql
-- ##################################################

-- Phase 5: Booking lifecycle — validated state machine + audit log.
--
--   1. log_booking_status_change() writes every transition to trip_status_logs
--      (previous/next status, actor, note, timestamp).
--   2. booking_transition_allowed() encodes the legal status graph.
--   3. set_passenger_booking_status() now: validates the transition, checks the
--      actor's role per target status, releases seats on reject/cancel, stamps the
--      matching timestamp, and logs the change. Accepts an optional note.
--
-- All passenger-booking status changes should go through this RPC so the audit
-- trail and the state machine stay authoritative (frontend updated to match).

-- ---------------------------------------------------------------------------
-- 1. Audit log helper
-- ---------------------------------------------------------------------------
create or replace function public.log_booking_status_change(
  p_booking_id uuid,
  p_trip_id uuid,
  p_old text,
  p_new text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.trip_status_logs (trip_id, booking_id, status, changed_by, note)
  values (
    p_trip_id,
    p_booking_id,
    p_new,
    auth.uid(),
    coalesce(nullif(btrim(p_note), ''), p_old || ' → ' || p_new)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Legal transition graph
-- ---------------------------------------------------------------------------
create or replace function public.booking_transition_allowed(
  p_from public.booking_status,
  p_to public.booking_status
)
returns boolean
language sql
immutable
as $$
  select case p_from
    when 'pending_request' then p_to in ('accepted', 'rejected', 'cancelled')
    when 'accepted'        then p_to in ('waiting_payment', 'payment_review', 'cancelled', 'disputed')
    when 'waiting_payment' then p_to in ('payment_review', 'cancelled', 'disputed')
    when 'payment_review'  then p_to in ('confirmed', 'waiting_payment', 'cancelled', 'disputed')
    when 'confirmed'       then p_to in ('on_trip', 'cancelled', 'disputed')
    when 'on_trip'         then p_to in ('completed', 'disputed')
    when 'completed'       then p_to in ('disputed')
    when 'disputed'        then p_to in ('confirmed', 'completed', 'cancelled')
    else false
  end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Validated + audited transition RPC
-- ---------------------------------------------------------------------------
create or replace function public.set_passenger_booking_status(
  p_booking_id uuid,
  p_status public.booking_status,
  p_note text default null
)
returns table(id uuid, status public.booking_status)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_booking public.passenger_bookings%rowtype;
  v_trip public.trips%rowtype;
  v_is_driver boolean;
  v_is_traveler boolean;
  v_is_admin boolean := public.is_admin();
begin
  if v_actor is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_booking from public.passenger_bookings where id = p_booking_id for update;
  if not found then
    raise exception 'booking_not_found';
  end if;

  -- No-op guard.
  if v_booking.status = p_status then
    return query select v_booking.id, v_booking.status;
    return;
  end if;

  select * into v_trip from public.trips where id = v_booking.trip_id;
  v_is_driver := v_trip.driver_id = v_actor;
  v_is_traveler := v_booking.traveler_id = v_actor;

  -- Authorisation per target status.
  if p_status in ('accepted', 'rejected', 'waiting_payment', 'on_trip', 'completed') then
    if not (v_is_driver or v_is_admin) then
      raise exception 'driver_or_admin_required';
    end if;
  elsif p_status = 'payment_review' then
    if not (v_is_traveler or v_is_admin) then
      raise exception 'traveler_or_admin_required';
    end if;
  elsif p_status = 'confirmed' then
    if not v_is_admin then
      raise exception 'admin_required';
    end if;
  elsif p_status in ('cancelled', 'disputed') then
    if not (v_is_driver or v_is_traveler or v_is_admin) then
      raise exception 'not_authorized';
    end if;
  else
    raise exception 'unsupported_status';
  end if;

  -- Transition validity (state machine). Admins may force transitions.
  if not v_is_admin and not public.booking_transition_allowed(v_booking.status, p_status) then
    raise exception 'invalid_transition';
  end if;

  update public.passenger_bookings
  set status = p_status,
      accepted_at  = case when p_status = 'accepted'  then now() else accepted_at  end,
      rejected_at  = case when p_status = 'rejected'  then now() else rejected_at  end,
      cancelled_at = case when p_status = 'cancelled' then now() else cancelled_at end,
      confirmed_at = case when p_status = 'confirmed' then now() else confirmed_at end,
      hold_expires_at = case
        when p_status in ('accepted', 'waiting_payment')
          then now() + make_interval(mins => public.seat_hold_minutes())
        else hold_expires_at
      end,
      updated_at = now()
  where id = p_booking_id;

  if p_status in ('rejected', 'cancelled') then
    perform public.release_seats_for_booking(p_booking_id);
  end if;

  perform public.log_booking_status_change(
    p_booking_id, v_booking.trip_id, v_booking.status::text, p_status::text, p_note
  );

  return query select p_booking_id, p_status;
end;
$$;

revoke all on function public.set_passenger_booking_status(uuid, public.booking_status, text) from public;
grant execute on function public.set_passenger_booking_status(uuid, public.booking_status, text) to authenticated;

-- Drop the previous 2-arg version so all callers use the audited one.
drop function if exists public.set_passenger_booking_status(uuid, public.booking_status);


-- ##################################################
-- 202606070005_payments.sql
-- ##################################################

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


-- ##################################################
-- 202606070006_trip_lifecycle.sql
-- ##################################################

-- Phase 7: Trip start / end — driver actions, 6-digit verify code, timestamps, audit.
--
--   1. passenger_bookings gains a per-booking 6-digit trip_code (shown to traveler)
--      plus started_at / completed_at timestamps.
--   2. start_passenger_trip()    — driver: confirmed → on_trip (+ started_at, audit).
--   3. complete_passenger_trip()  — driver enters the traveler's trip_code:
--      on_trip → completed (+ completed_at, audit, bumps driver completed_trips).
--
-- Transitions are validated inline (status guards) and logged via
-- log_booking_status_change(); seats stay consumed (no release on completion).

-- ---------------------------------------------------------------------------
-- 1. Columns
-- ---------------------------------------------------------------------------
alter table public.passenger_bookings
  add column if not exists trip_code text not null default lpad((floor(random() * 1000000))::int::text, 6, '0'),
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz;

-- ---------------------------------------------------------------------------
-- 2. Start a passenger's trip
-- ---------------------------------------------------------------------------
create or replace function public.start_passenger_trip(p_booking_id uuid)
returns table(id uuid, status public.booking_status)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_booking public.passenger_bookings%rowtype;
  v_trip public.trips%rowtype;
begin
  if v_actor is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_booking from public.passenger_bookings where id = p_booking_id for update;
  if not found then
    raise exception 'booking_not_found';
  end if;

  select * into v_trip from public.trips where id = v_booking.trip_id;
  if not (v_trip.driver_id = v_actor or public.is_admin()) then
    raise exception 'driver_or_admin_required';
  end if;
  if v_booking.status <> 'confirmed' then
    raise exception 'booking_not_confirmed';
  end if;

  update public.passenger_bookings
  set status = 'on_trip', started_at = now(), updated_at = now()
  where id = p_booking_id;

  perform public.log_booking_status_change(
    p_booking_id, v_booking.trip_id, v_booking.status::text, 'on_trip', 'Жолооч аялал эхлүүлэв.'
  );

  return query select p_booking_id, 'on_trip'::public.booking_status;
end;
$$;

revoke all on function public.start_passenger_trip(uuid) from public;
grant execute on function public.start_passenger_trip(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Complete a passenger's trip with their 6-digit code
-- ---------------------------------------------------------------------------
create or replace function public.complete_passenger_trip(p_booking_id uuid, p_code text)
returns table(id uuid, status public.booking_status)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_booking public.passenger_bookings%rowtype;
  v_trip public.trips%rowtype;
  v_code text := nullif(regexp_replace(coalesce(p_code, ''), '\D', '', 'g'), '');
begin
  if v_actor is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_booking from public.passenger_bookings where id = p_booking_id for update;
  if not found then
    raise exception 'booking_not_found';
  end if;

  select * into v_trip from public.trips where id = v_booking.trip_id;
  if not (v_trip.driver_id = v_actor or public.is_admin()) then
    raise exception 'driver_or_admin_required';
  end if;
  if v_booking.status <> 'on_trip' then
    raise exception 'booking_not_on_trip';
  end if;
  if v_code is null or v_code <> v_booking.trip_code then
    raise exception 'invalid_trip_code';
  end if;

  update public.passenger_bookings
  set status = 'completed', completed_at = now(), updated_at = now()
  where id = p_booking_id;

  -- Bump the driver's completed-trip counter (guarded column → bypass).
  perform set_config('app.guard_bypass', 'on', true);
  update public.driver_profiles
  set completed_trips = completed_trips + 1, updated_at = now()
  where user_id = v_trip.driver_id;
  perform set_config('app.guard_bypass', 'off', true);

  perform public.log_booking_status_change(
    p_booking_id, v_booking.trip_id, v_booking.status::text, 'completed', 'Аялал дуусч, код баталгаажлаа.'
  );

  return query select p_booking_id, 'completed'::public.booking_status;
end;
$$;

revoke all on function public.complete_passenger_trip(uuid, text) from public;
grant execute on function public.complete_passenger_trip(uuid, text) to authenticated;


-- ##################################################
-- 202606070007_notifications.sql
-- ##################################################

-- Phase 8: Notifications & logs — in-app notifications + admin alerts.
--
--   1. notifications gains event_type + deeplink (recipient/read_at already exist).
--   2. create_notification() / notify_admins() helpers (SECURITY DEFINER; the table
--      has no INSERT policy so only these trusted functions can write).
--   3. Triggers auto-create notifications on the events that already flow through the
--      DB: new seat request, booking status changes (accept/reject/payment/confirm/
--      trip start/end/cancel), and driver verification decisions.
--
-- Audit history (trip_status_logs) was wired in Phase 5; this adds the user-facing
-- "what happened / what's next" layer on top.

-- ---------------------------------------------------------------------------
-- 1. Columns
-- ---------------------------------------------------------------------------
alter table public.notifications
  add column if not exists event_type text,
  add column if not exists deeplink text;

create index if not exists idx_notifications_user_unread
  on public.notifications (user_id, created_at desc)
  where read_at is null;

-- ---------------------------------------------------------------------------
-- 2. Helpers
-- ---------------------------------------------------------------------------
create or replace function public.create_notification(
  p_user_id uuid,
  p_title text,
  p_body text,
  p_event_type text default null,
  p_deeplink text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    return;
  end if;
  insert into public.notifications (user_id, title, body, event_type, deeplink)
  values (p_user_id, p_title, p_body, p_event_type, p_deeplink);
end;
$$;

create or replace function public.notify_admins(
  p_title text,
  p_body text,
  p_event_type text default null,
  p_deeplink text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, title, body, event_type, deeplink)
  select id, p_title, p_body, p_event_type, p_deeplink
  from public.profiles
  where role = 'admin' and is_suspended = false;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3a. New seat request → notify driver
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_booking_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_driver uuid;
  v_route text;
begin
  select driver_id, from_location || ' → ' || to_location
    into v_driver, v_route
  from public.trips where id = new.trip_id;

  perform public.create_notification(
    v_driver,
    'Шинэ суудлын хүсэлт',
    v_route || ' чиглэлд ' || new.seats_requested || ' суудлын хүсэлт ирлээ.',
    'booking_request',
    '/driver/requests'
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_booking_insert on public.passenger_bookings;
create trigger trg_notify_booking_insert
after insert on public.passenger_bookings
for each row execute function public.notify_on_booking_insert();

-- ---------------------------------------------------------------------------
-- 3b. Booking status change → notify traveler / driver / admins
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_booking_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_traveler uuid := new.traveler_id;
  v_driver uuid;
  v_route text;
  v_link text := '/dashboard/bookings/' || new.id;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  select driver_id, from_location || ' → ' || to_location
    into v_driver, v_route
  from public.trips where id = new.trip_id;

  if new.status = 'accepted' then
    perform public.create_notification(v_traveler, 'Хүсэлт зөвшөөрөгдлөө',
      v_route || ': жолооч зөвшөөрлөө. Төлбөрийн баримтаа илгээнэ үү.', 'booking_accepted', v_link);
  elsif new.status = 'rejected' then
    perform public.create_notification(v_traveler, 'Хүсэлт татгалзагдлаа',
      v_route || ': жолооч хүсэлтийг татгалзлаа.', 'booking_rejected', v_link);
  elsif new.status = 'payment_review' then
    perform public.notify_admins('Шинэ төлбөрийн баримт',
      v_route || ' захиалгын төлбөрийн баримт шалгуулахаар ирлээ.', 'payment_review', '/admin/payments');
  elsif new.status = 'confirmed' then
    perform public.create_notification(v_traveler, 'Захиалга баталгаажлаа',
      v_route || ': төлбөр баталгаажиж, аялал баталгаажлаа.', 'booking_confirmed', v_link);
  elsif new.status = 'on_trip' then
    perform public.create_notification(v_traveler, 'Аялал эхэллээ',
      v_route || ': аялал эхэллээ. Дуусахад 6 оронтой кодоо жолоочид өгнө үү.', 'trip_started', v_link);
  elsif new.status = 'completed' then
    perform public.create_notification(v_traveler, 'Аялал дууслаа',
      v_route || ': аялал амжилттай дууслаа. Үнэлгээ өгөөрэй.', 'trip_completed', v_link);
  elsif new.status = 'cancelled' then
    perform public.create_notification(v_traveler, 'Захиалга цуцлагдлаа', v_route || ': захиалга цуцлагдлаа.', 'booking_cancelled', v_link);
    perform public.create_notification(v_driver, 'Захиалга цуцлагдлаа', v_route || ': нэг захиалга цуцлагдаж суудал чөлөөлөгдлөө.', 'booking_cancelled', '/driver/requests');
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_booking_status on public.passenger_bookings;
create trigger trg_notify_booking_status
after update on public.passenger_bookings
for each row execute function public.notify_on_booking_status();

-- ---------------------------------------------------------------------------
-- 3c. Driver verification decision → notify driver
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_driver_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.verification_status is not distinct from old.verification_status then
    return new;
  end if;

  if new.verification_status = 'approved' then
    perform public.create_notification(new.user_id, 'Баталгаажуулалт зөвшөөрөгдлөө',
      'Таны жолоочийн бүртгэл баталгаажлаа. Одоо чиглэл нийтлэх боломжтой.', 'driver_approved', '/dashboard/driver');
  elsif new.verification_status = 'rejected' then
    perform public.create_notification(new.user_id, 'Баталгаажуулалт буцаагдлаа',
      coalesce('Шалтгаан: ' || new.rejection_reason, 'Бичиг баримтаа засаад дахин илгээнэ үү.'), 'driver_rejected', '/onboarding/driver');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_driver_verification on public.driver_profiles;
create trigger trg_notify_driver_verification
after update on public.driver_profiles
for each row execute function public.notify_on_driver_verification();


-- ##################################################
-- 202606070008_cargo_lifecycle.sql
-- ##################################################

-- Phase 9: Cargo lifecycle — validated state machine, delivery-code completion,
-- audit log, and notifications (mirrors the passenger-booking lifecycle).
--
--   1. log_cargo_status_change() → trip_status_logs (cargo_request_id).
--   2. cargo_transition_allowed() state graph.
--   3. set_cargo_request_status() — role-validated transition + audit.
--   4. complete_cargo_delivery() — driver enters the receiver's delivery_code:
--      in_transit → delivered.
--   5. cargo notification triggers (new request → driver; status change → sender).

-- ---------------------------------------------------------------------------
-- 1. Audit helper
-- ---------------------------------------------------------------------------
create or replace function public.log_cargo_status_change(
  p_cargo_id uuid, p_trip_id uuid, p_old text, p_new text, p_note text default null
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.trip_status_logs (trip_id, cargo_request_id, status, changed_by, note)
  values (p_trip_id, p_cargo_id, p_new, auth.uid(), coalesce(nullif(btrim(p_note), ''), p_old || ' → ' || p_new));
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Transition graph
-- ---------------------------------------------------------------------------
create or replace function public.cargo_transition_allowed(
  p_from public.cargo_status, p_to public.cargo_status
)
returns boolean language sql immutable as $$
  select case p_from
    when 'cargo_requested' then p_to in ('cargo_accepted', 'rejected', 'cancelled')
    when 'cargo_accepted'  then p_to in ('waiting_payment', 'payment_review', 'cancelled')
    when 'waiting_payment' then p_to in ('payment_review', 'cancelled')
    when 'payment_review'  then p_to in ('picked_up', 'waiting_payment', 'cancelled')
    when 'picked_up'       then p_to in ('in_transit', 'cancelled', 'disputed')
    when 'in_transit'      then p_to in ('delivered', 'disputed')
    when 'delivered'       then p_to in ('completed', 'disputed')
    when 'completed'       then p_to in ('disputed')
    when 'disputed'        then p_to in ('completed', 'cancelled')
    else false
  end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Validated transition RPC
-- ---------------------------------------------------------------------------
create or replace function public.set_cargo_request_status(
  p_cargo_id uuid, p_status public.cargo_status, p_note text default null
)
returns table(id uuid, status public.cargo_status)
language plpgsql security definer set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_cargo public.cargo_requests%rowtype;
  v_trip public.trips%rowtype;
  v_is_driver boolean;
  v_is_sender boolean;
  v_is_admin boolean := public.is_admin();
begin
  if v_actor is null then raise exception 'not_authenticated'; end if;

  select * into v_cargo from public.cargo_requests where id = p_cargo_id for update;
  if not found then raise exception 'cargo_not_found'; end if;
  if v_cargo.status = p_status then
    return query select v_cargo.id, v_cargo.status; return;
  end if;

  select * into v_trip from public.trips where id = v_cargo.trip_id;
  v_is_driver := v_trip.driver_id = v_actor;
  v_is_sender := v_cargo.sender_id = v_actor;

  if p_status in ('cargo_accepted', 'rejected', 'waiting_payment', 'picked_up', 'in_transit', 'completed') then
    if not (v_is_driver or v_is_admin) then raise exception 'driver_or_admin_required'; end if;
  elsif p_status = 'payment_review' then
    if not (v_is_sender or v_is_admin) then raise exception 'sender_or_admin_required'; end if;
  elsif p_status in ('cancelled', 'disputed') then
    if not (v_is_driver or v_is_sender or v_is_admin) then raise exception 'not_authorized'; end if;
  else
    raise exception 'unsupported_status';
  end if;

  if not v_is_admin and not public.cargo_transition_allowed(v_cargo.status, p_status) then
    raise exception 'invalid_transition';
  end if;

  update public.cargo_requests set status = p_status, updated_at = now() where id = p_cargo_id;
  perform public.log_cargo_status_change(p_cargo_id, v_cargo.trip_id, v_cargo.status::text, p_status::text, p_note);

  return query select p_cargo_id, p_status;
end;
$$;

revoke all on function public.set_cargo_request_status(uuid, public.cargo_status, text) from public;
grant execute on function public.set_cargo_request_status(uuid, public.cargo_status, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Delivery completion with receiver's code
-- ---------------------------------------------------------------------------
create or replace function public.complete_cargo_delivery(p_cargo_id uuid, p_code text)
returns table(id uuid, status public.cargo_status)
language plpgsql security definer set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_cargo public.cargo_requests%rowtype;
  v_trip public.trips%rowtype;
  v_code text := nullif(regexp_replace(coalesce(p_code, ''), '\D', '', 'g'), '');
begin
  if v_actor is null then raise exception 'not_authenticated'; end if;

  select * into v_cargo from public.cargo_requests where id = p_cargo_id for update;
  if not found then raise exception 'cargo_not_found'; end if;

  select * into v_trip from public.trips where id = v_cargo.trip_id;
  if not (v_trip.driver_id = v_actor or public.is_admin()) then raise exception 'driver_or_admin_required'; end if;
  if v_cargo.status <> 'in_transit' then raise exception 'cargo_not_in_transit'; end if;
  if v_code is null or v_code <> v_cargo.delivery_code then raise exception 'invalid_delivery_code'; end if;

  update public.cargo_requests set status = 'delivered', updated_at = now() where id = p_cargo_id;
  perform public.log_cargo_status_change(p_cargo_id, v_cargo.trip_id, v_cargo.status::text, 'delivered', 'Хүргэлт код баталгаажлаа.');

  return query select p_cargo_id, 'delivered'::public.cargo_status;
end;
$$;

revoke all on function public.complete_cargo_delivery(uuid, text) from public;
grant execute on function public.complete_cargo_delivery(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Notifications
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_cargo_insert()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_driver uuid; v_route text;
begin
  select driver_id, from_location || ' → ' || to_location into v_driver, v_route
  from public.trips where id = new.trip_id;
  perform public.create_notification(v_driver, 'Шинэ дайвар ачааны хүсэлт',
    v_route || ': ' || new.cargo_name || ' ачаа дайх хүсэлт ирлээ.', 'cargo_request', '/dashboard/driver/cargo-requests');
  return new;
end;
$$;

drop trigger if exists trg_notify_cargo_insert on public.cargo_requests;
create trigger trg_notify_cargo_insert
after insert on public.cargo_requests
for each row execute function public.notify_on_cargo_insert();

create or replace function public.notify_on_cargo_status()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_sender uuid := new.sender_id;
  v_route text;
  v_link text := '/dashboard/cargo/requests';
begin
  if new.status is not distinct from old.status then return new; end if;
  select from_location || ' → ' || to_location into v_route from public.trips where id = new.trip_id;

  if new.status = 'cargo_accepted' then
    perform public.create_notification(v_sender, 'Ачааны хүсэлт зөвшөөрөгдлөө', v_route || ': жолооч зөвшөөрлөө. Төлбөрөө илгээнэ үү.', 'cargo_accepted', v_link);
  elsif new.status = 'rejected' then
    perform public.create_notification(v_sender, 'Ачааны хүсэлт татгалзагдлаа', v_route || ': жолооч татгалзлаа.', 'cargo_rejected', v_link);
  elsif new.status = 'payment_review' then
    perform public.notify_admins('Шинэ ачааны төлбөрийн баримт', v_route || ' ачааны төлбөр шалгуулахаар ирлээ.', 'payment_review', '/admin/payments');
  elsif new.status = 'picked_up' then
    perform public.create_notification(v_sender, 'Ачаа авлаа', v_route || ': төлбөр баталгаажиж, жолооч ачааг авлаа.', 'cargo_picked_up', v_link);
  elsif new.status = 'in_transit' then
    perform public.create_notification(v_sender, 'Ачаа замдаа гарлаа', v_route || ': ачаа тээвэрлэгдэж байна.', 'cargo_in_transit', v_link);
  elsif new.status = 'delivered' then
    perform public.create_notification(v_sender, 'Ачаа хүргэгдлээ', v_route || ': ачаа хүлээн авагчид амжилттай хүргэгдлээ.', 'cargo_delivered', v_link);
  elsif new.status = 'cancelled' then
    perform public.create_notification(v_sender, 'Ачааны захиалга цуцлагдлаа', v_route || ': захиалга цуцлагдлаа.', 'cargo_cancelled', v_link);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_cargo_status on public.cargo_requests;
create trigger trg_notify_cargo_status
after update on public.cargo_requests
for each row execute function public.notify_on_cargo_status();


-- ##################################################
-- 202606070009_rls_hardening.sql
-- ##################################################

-- Phase 11: Security hardening — close direct-write holes in RLS.
--
-- Problem: the original policies let a traveler/driver/sender directly UPDATE
-- passenger_bookings / cargo_requests (any column → bypass the validated state
-- machine, e.g. set status='confirmed' without paying) and directly INSERT rows
-- with an arbitrary status/code. All legitimate writes now go through SECURITY
-- DEFINER RPCs (which run as table owner and bypass RLS), so we can safely lock
-- direct client writes down to admin-only.

-- ---------------------------------------------------------------------------
-- passenger_bookings: no direct client INSERT/UPDATE (RPC-only)
-- ---------------------------------------------------------------------------
drop policy if exists "travelers create bookings" on public.passenger_bookings;
-- (creation only via create_passenger_booking_with_seats)

drop policy if exists "bookings update participant admin" on public.passenger_bookings;
drop policy if exists "bookings update admin only" on public.passenger_bookings;
create policy "bookings update admin only" on public.passenger_bookings
for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- cargo_requests: creation via RPC, no direct client INSERT/UPDATE
-- ---------------------------------------------------------------------------
create or replace function public.create_cargo_request(
  p_trip_id uuid,
  p_cargo_name text,
  p_cargo_type text default null,
  p_size_note text default null,
  p_weight_kg numeric default null,
  p_receiver_name text default null,
  p_receiver_phone text default null,
  p_pickup_note text default null
)
returns table(id uuid, status public.cargo_status, delivery_code text)
language plpgsql security definer set search_path = public
as $$
declare
  v_sender uuid := auth.uid();
  v_new_id uuid;
begin
  if v_sender is null then raise exception 'not_authenticated'; end if;
  if nullif(btrim(coalesce(p_cargo_name, '')), '') is null then raise exception 'cargo_name_required'; end if;
  if nullif(btrim(coalesce(p_receiver_name, '')), '') is null then raise exception 'receiver_required'; end if;
  if nullif(btrim(coalesce(p_receiver_phone, '')), '') is null then raise exception 'receiver_phone_required'; end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = v_sender and p.role = 'cargo_sender'
      and p.phone_verified = true and p.cargo_policy_accepted = true and p.is_suspended = false
  ) then
    raise exception 'cargo_sender_required';
  end if;

  if not exists (
    select 1 from public.trips t where t.id = p_trip_id and t.allows_cargo = true and t.status = 'active'
  ) then
    raise exception 'trip_not_cargo_enabled';
  end if;

  insert into public.cargo_requests (
    trip_id, sender_id, cargo_name, cargo_type, size_note, weight_kg,
    receiver_name, receiver_phone, pickup_note, status
  )
  values (
    p_trip_id, v_sender, btrim(p_cargo_name), nullif(btrim(coalesce(p_cargo_type, '')), ''),
    nullif(btrim(coalesce(p_size_note, '')), ''), p_weight_kg,
    btrim(p_receiver_name), btrim(p_receiver_phone), nullif(btrim(coalesce(p_pickup_note, '')), ''),
    'cargo_requested'
  )
  returning cargo_requests.id into v_new_id;

  return query
    select c.id, c.status, c.delivery_code from public.cargo_requests c where c.id = v_new_id;
end;
$$;

revoke all on function public.create_cargo_request(uuid, text, text, text, numeric, text, text, text) from public;
grant execute on function public.create_cargo_request(uuid, text, text, text, numeric, text, text, text) to authenticated;

drop policy if exists "cargo senders create on cargo trips" on public.cargo_requests;
-- (creation only via create_cargo_request)

drop policy if exists "cargo update participant admin" on public.cargo_requests;
drop policy if exists "cargo update admin only" on public.cargo_requests;
create policy "cargo update admin only" on public.cargo_requests
for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- payments: clients may only insert an unreviewed proof row (not approved/refunded)
-- ---------------------------------------------------------------------------
drop policy if exists "payments create own" on public.payments;
drop policy if exists "payments create own pending" on public.payments;
create policy "payments create own pending" on public.payments
for insert with check (
  user_id = auth.uid()
  and status in ('pending', 'proof_uploaded')
);


-- ##################################################
-- 202606070010_otp_send_support.sql
-- ##################################################

-- Phase 1 (production SMS): server-side OTP generator for the SMS edge function.
--
-- generate_otp_for_user() is like request_phone_otp but: takes an explicit user id,
-- ALWAYS returns the plaintext code, and is granted ONLY to service_role. The
-- `send-otp` edge function (which runs with the service role) calls this to get the
-- code, then delivers it via the SMS provider (Mocean). The browser never sees it.

create or replace function public.generate_otp_for_user(p_user_id uuid, p_phone text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  normalized_phone text := nullif(regexp_replace(coalesce(p_phone, ''), '\s', '', 'g'), '');
  last_created timestamptz;
  recent_count int;
  resend_cooldown int := 60;
  hourly_limit int := 5;
  new_code text;
begin
  if p_user_id is null then raise exception 'user_required'; end if;
  if normalized_phone is null then raise exception 'phone_required'; end if;

  select max(created_at) into last_created
  from public.phone_otp_codes
  where user_id = p_user_id and consumed_at is null;
  if last_created is not null and last_created > now() - make_interval(secs => resend_cooldown) then
    raise exception 'otp_rate_limited';
  end if;

  select count(*) into recent_count
  from public.phone_otp_codes
  where user_id = p_user_id and created_at > now() - interval '1 hour';
  if recent_count >= hourly_limit then
    raise exception 'otp_hourly_limit';
  end if;

  update public.phone_otp_codes set consumed_at = now()
  where user_id = p_user_id and consumed_at is null;

  new_code := lpad((floor(random() * 1000000))::int::text, 6, '0');

  insert into public.phone_otp_codes (user_id, phone, code_hash, expires_at)
  values (
    p_user_id,
    normalized_phone,
    encode(digest(new_code || p_user_id::text, 'sha256'), 'hex'),
    now() + interval '5 minutes'
  );

  return new_code;
end;
$$;

revoke all on function public.generate_otp_for_user(uuid, text) from public, anon, authenticated;
grant execute on function public.generate_otp_for_user(uuid, text) to service_role;


-- ##################################################
-- 202606070011_reviews.sql
-- ##################################################

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


-- ##################################################
-- 202606070012_support_requests.sql
-- ##################################################

-- Support requests: public support form saved to DB + surfaced to admins.

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  name text,
  phone text,
  booking_ref text,
  category text,
  message text not null,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved')),
  created_at timestamptz not null default now()
);

create index if not exists idx_support_requests_status on public.support_requests (status, created_at desc);

alter table public.support_requests enable row level security;

-- Anyone (even logged-out visitors) may submit a support request, but cannot
-- spoof another user's id.
drop policy if exists "support insert anyone" on public.support_requests;
create policy "support insert anyone" on public.support_requests
for insert to anon, authenticated
with check (user_id is null or user_id = auth.uid());

drop policy if exists "support read admin" on public.support_requests;
create policy "support read admin" on public.support_requests
for select using (public.is_admin());

drop policy if exists "support update admin" on public.support_requests;
create policy "support update admin" on public.support_requests
for update using (public.is_admin()) with check (public.is_admin());


-- ##################################################
-- 202606070013_payouts.sql
-- ##################################################

-- Driver payouts + platform commission.
--
-- Model: the traveler pays the fare (booking total_amount). The platform keeps a
-- commission (default 10%) and the driver is owed the rest (90%). Payouts are made
-- manually by an admin (bank transfer) and recorded in driver_payouts.

insert into public.app_settings (key, value)
values ('commission_percent', '10')
on conflict (key) do nothing;

create table if not exists public.driver_payouts (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null check (amount > 0),
  note text,
  paid_by uuid references public.profiles(id),
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_driver_payouts_driver on public.driver_payouts (driver_id, paid_at desc);

alter table public.driver_payouts enable row level security;

drop policy if exists "payouts read own or admin" on public.driver_payouts;
create policy "payouts read own or admin" on public.driver_payouts
for select using (driver_id = auth.uid() or public.is_admin());

drop policy if exists "payouts insert admin" on public.driver_payouts;
create policy "payouts insert admin" on public.driver_payouts
for insert with check (public.is_admin());

-- Admin records a payout to a driver.
create or replace function public.record_driver_payout(p_driver_id uuid, p_amount integer, p_note text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then raise exception 'admin_required'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'invalid_amount'; end if;

  insert into public.driver_payouts (driver_id, amount, note, paid_by)
  values (p_driver_id, p_amount, nullif(btrim(coalesce(p_note, '')), ''), auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.record_driver_payout(uuid, integer, text) from public;
grant execute on function public.record_driver_payout(uuid, integer, text) to authenticated;


-- ##################################################
-- 202606110001_preferences_and_cargo_completion.sql
-- ##################################################

-- Persist account notification/privacy settings and let the cargo sender
-- confirm the final delivered -> completed transition.

alter table public.profiles
  add column if not exists notification_preferences jsonb not null default
    '{
      "bookingRequests": true,
      "driverResponses": true,
      "paymentUpdates": true,
      "tripReminders": true,
      "reviewReminders": true,
      "cargoUpdates": true
    }'::jsonb,
  add column if not exists privacy_preferences jsonb not null default
    '{
      "phoneVisibility": "accepted",
      "requestVisibility": "matched",
      "reviewsPublic": true,
      "reportsPrivate": true
    }'::jsonb;

create or replace function public.create_notification(
  p_user_id uuid,
  p_title text,
  p_body text,
  p_event_type text default null,
  p_deeplink text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_preferences jsonb;
  v_preference_key text;
begin
  if p_user_id is null then
    return;
  end if;

  select notification_preferences
    into v_preferences
  from public.profiles
  where id = p_user_id;

  v_preference_key := case
    when p_event_type = 'booking_request' then 'bookingRequests'
    when p_event_type in ('booking_accepted', 'booking_rejected', 'booking_cancelled') then 'driverResponses'
    when p_event_type in ('booking_confirmed', 'payment_approved') then 'paymentUpdates'
    when p_event_type = 'trip_started' then 'tripReminders'
    when p_event_type = 'trip_completed' then 'reviewReminders'
    when p_event_type like 'cargo_%' then 'cargoUpdates'
    else null
  end;

  if v_preference_key is not null
    and coalesce((v_preferences ->> v_preference_key)::boolean, true) = false then
    return;
  end if;

  insert into public.notifications (user_id, title, body, event_type, deeplink)
  values (p_user_id, p_title, p_body, p_event_type, p_deeplink);
end;
$$;

create or replace function public.set_cargo_request_status(
  p_cargo_id uuid,
  p_status public.cargo_status,
  p_note text default null
)
returns table(id uuid, status public.cargo_status)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_cargo public.cargo_requests%rowtype;
  v_trip public.trips%rowtype;
  v_is_driver boolean;
  v_is_sender boolean;
  v_is_admin boolean := public.is_admin();
begin
  if v_actor is null then raise exception 'not_authenticated'; end if;

  select * into v_cargo
  from public.cargo_requests
  where id = p_cargo_id
  for update;

  if not found then raise exception 'cargo_not_found'; end if;
  if v_cargo.status = p_status then
    return query select v_cargo.id, v_cargo.status;
    return;
  end if;

  select * into v_trip from public.trips where id = v_cargo.trip_id;
  v_is_driver := v_trip.driver_id = v_actor;
  v_is_sender := v_cargo.sender_id = v_actor;

  if p_status in ('cargo_accepted', 'rejected', 'waiting_payment', 'picked_up', 'in_transit') then
    if not (v_is_driver or v_is_admin) then raise exception 'driver_or_admin_required'; end if;
  elsif p_status = 'completed' then
    if not (v_is_sender or v_is_admin) then raise exception 'sender_or_admin_required'; end if;
  elsif p_status = 'payment_review' then
    if not (v_is_sender or v_is_admin) then raise exception 'sender_or_admin_required'; end if;
  elsif p_status in ('cancelled', 'disputed') then
    if not (v_is_driver or v_is_sender or v_is_admin) then raise exception 'not_authorized'; end if;
  else
    raise exception 'unsupported_status';
  end if;

  if not v_is_admin and not public.cargo_transition_allowed(v_cargo.status, p_status) then
    raise exception 'invalid_transition';
  end if;

  update public.cargo_requests
  set status = p_status, updated_at = now()
  where id = p_cargo_id;

  perform public.log_cargo_status_change(
    p_cargo_id,
    v_cargo.trip_id,
    v_cargo.status::text,
    p_status::text,
    p_note
  );

  return query select p_cargo_id, p_status;
end;
$$;

revoke all on function public.set_cargo_request_status(uuid, public.cargo_status, text) from public;
grant execute on function public.set_cargo_request_status(uuid, public.cargo_status, text) to authenticated;

create or replace function public.notify_on_cargo_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender uuid := new.sender_id;
  v_driver uuid;
  v_route text;
  v_link text := '/cargo/' || new.id;
begin
  if new.status is not distinct from old.status then return new; end if;

  select driver_id, from_location || ' → ' || to_location
    into v_driver, v_route
  from public.trips
  where id = new.trip_id;

  if new.status = 'cargo_accepted' then
    perform public.create_notification(v_sender, 'Ачааны хүсэлт зөвшөөрөгдлөө', v_route || ': жолооч зөвшөөрлөө. Төлбөрөө илгээнэ үү.', 'cargo_accepted', v_link);
  elsif new.status = 'rejected' then
    perform public.create_notification(v_sender, 'Ачааны хүсэлт татгалзагдлаа', v_route || ': жолооч татгалзлаа.', 'cargo_rejected', v_link);
  elsif new.status = 'payment_review' then
    perform public.notify_admins('Шинэ ачааны төлбөрийн баримт', v_route || ' ачааны төлбөр шалгуулахаар ирлээ.', 'payment_review', '/admin/payments');
  elsif new.status = 'picked_up' then
    perform public.create_notification(v_sender, 'Ачаа авлаа', v_route || ': төлбөр баталгаажиж, жолооч ачааг авлаа.', 'cargo_picked_up', v_link);
  elsif new.status = 'in_transit' then
    perform public.create_notification(v_sender, 'Ачаа замдаа гарлаа', v_route || ': ачаа тээвэрлэгдэж байна.', 'cargo_in_transit', v_link);
  elsif new.status = 'delivered' then
    perform public.create_notification(v_sender, 'Ачаа хүргэгдлээ', v_route || ': ачаагаа хүлээн авснаа баталгаажуулна уу.', 'cargo_delivered', v_link);
  elsif new.status = 'completed' then
    perform public.create_notification(v_driver, 'Ачаа хүлээн авсан нь баталгаажлаа', v_route || ': илгээгч ачаагаа хүлээн авснаа баталгаажууллаа.', 'cargo_completed', '/dashboard/driver/cargo-requests');
  elsif new.status = 'cancelled' then
    perform public.create_notification(v_sender, 'Ачааны захиалга цуцлагдлаа', v_route || ': захиалга цуцлагдлаа.', 'cargo_cancelled', v_link);
  end if;

  return new;
end;
$$;


-- ##################################################
-- 202606120001_security_antispam.sql
-- ##################################################

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


-- ##################################################
-- 202606120002_marketplace_read_and_cargo_onboarding.sql
-- ##################################################



-- ##################################################
-- 202606120003_fix_driver_onboarding_role.sql
-- ##################################################

-- Fix: driver onboarding rejected with driver_role_required when the profile role
-- drifted out of sync (e.g. profiles.role = 'traveler' even though the account
-- registered as a driver). Make submit_driver_onboarding self-heal: if the auth
-- metadata says 'driver', repair profiles.role and proceed so the verification
-- actually reaches the admin queue.

create or replace function public.submit_driver_onboarding(
  p_car_model text,
  p_plate_number text,
  p_seats integer,
  p_driver_license_url text default null,
  p_vehicle_certificate_url text default null,
  p_vehicle_photo_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_meta_role text;
  saved_driver public.driver_profiles%rowtype;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_profile from public.profiles where id = current_user_id;
  if v_profile.id is null then
    raise exception 'profile_not_found';
  end if;
  if v_profile.is_suspended then
    raise exception 'account_suspended';
  end if;

  select raw_user_meta_data->>'role' into v_meta_role
  from auth.users where id = current_user_id;

  -- Admins never onboard as drivers; otherwise allow if the profile is a driver
  -- OR the account registered as a driver (metadata) — repairing drifted roles.
  if v_profile.role = 'admin' then
    raise exception 'driver_role_required';
  end if;
  if v_profile.role <> 'driver' and coalesce(v_meta_role, '') <> 'driver' then
    raise exception 'driver_role_required';
  end if;

  if nullif(btrim(p_car_model), '') is null then raise exception 'car_model_required'; end if;
  if nullif(btrim(p_plate_number), '') is null then raise exception 'plate_number_required'; end if;
  if p_seats is null or p_seats < 1 or p_seats > 12 then raise exception 'invalid_seat_count'; end if;
  if nullif(btrim(p_driver_license_url), '') is null then raise exception 'driver_license_required'; end if;
  if nullif(btrim(p_vehicle_certificate_url), '') is null then raise exception 'vehicle_certificate_required'; end if;
  if nullif(btrim(p_vehicle_photo_url), '') is null then raise exception 'vehicle_photo_required'; end if;

  perform set_config('app.guard_bypass', 'on', true);

  -- Repair a drifted role so the rest of the app treats this account as a driver.
  if v_profile.role <> 'driver' then
    update public.profiles set role = 'driver', updated_at = now() where id = current_user_id;
  end if;

  insert into public.driver_profiles (
    user_id, verification_status, car_model, plate_number, seats,
    driver_license_url, vehicle_certificate_url, vehicle_photo_url,
    reviewed_by, reviewed_at, rejection_reason
  )
  values (
    current_user_id, 'pending', btrim(p_car_model), upper(btrim(p_plate_number)), p_seats,
    btrim(p_driver_license_url), btrim(p_vehicle_certificate_url), btrim(p_vehicle_photo_url),
    null, null, null
  )
  on conflict (user_id) do update
    set verification_status = 'pending',
        car_model = excluded.car_model,
        plate_number = excluded.plate_number,
        seats = excluded.seats,
        driver_license_url = excluded.driver_license_url,
        vehicle_certificate_url = excluded.vehicle_certificate_url,
        vehicle_photo_url = excluded.vehicle_photo_url,
        reviewed_by = null,
        reviewed_at = null,
        rejection_reason = null,
        updated_at = now()
  returning * into saved_driver;

  update public.profiles
  set onboarding_completed = true, updated_at = now()
  where id = current_user_id;

  perform set_config('app.guard_bypass', 'off', true);

  return jsonb_build_object(
    'verification_status', saved_driver.verification_status,
    'car_model', saved_driver.car_model,
    'plate_number', saved_driver.plate_number,
    'seats', saved_driver.seats,
    'onboarding_completed', true
  );
end;
$$;

revoke all on function public.submit_driver_onboarding(text, text, integer, text, text, text) from public;
grant execute on function public.submit_driver_onboarding(text, text, integer, text, text, text) to authenticated;


-- ##################################################
-- 202606120004_create_driver_trip_rpc.sql
-- ##################################################

-- Create driver trips through one trusted transaction instead of relying on a
-- browser-side insert that can disagree with the current RLS policy state.

create or replace function public.create_driver_trip(
  p_from_location text,
  p_to_location text,
  p_departure_at timestamptz,
  p_seats_total integer,
  p_available_seat_labels text[],
  p_price_per_seat integer,
  p_pickup_note text default null,
  p_dropoff_note text default null,
  p_allows_cargo boolean default false,
  p_cargo_capacity_kg numeric default null,
  p_allowed_cargo_types text[] default null,
  p_cargo_price_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  created_trip_id uuid;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if not public.can_create_trip() then
    raise exception 'driver_not_ready';
  end if;

  if nullif(btrim(p_from_location), '') is null
    or nullif(btrim(p_to_location), '') is null then
    raise exception 'route_required';
  end if;
  if p_departure_at is null or p_departure_at <= now() then
    raise exception 'future_departure_required';
  end if;
  if p_seats_total is null or p_seats_total < 1 or p_seats_total > 12 then
    raise exception 'invalid_seat_count';
  end if;
  if p_price_per_seat is null or p_price_per_seat < 0 then
    raise exception 'invalid_price';
  end if;

  insert into public.trips (
    driver_id,
    from_location,
    to_location,
    departure_at,
    seats_total,
    seats_available,
    available_seat_labels,
    price_per_seat,
    pickup_note,
    dropoff_note,
    allows_cargo,
    cargo_capacity_kg,
    allowed_cargo_types,
    cargo_price_note,
    status
  )
  values (
    current_user_id,
    btrim(p_from_location),
    btrim(p_to_location),
    p_departure_at,
    p_seats_total,
    p_seats_total,
    coalesce(p_available_seat_labels, array[]::text[]),
    p_price_per_seat,
    nullif(btrim(p_pickup_note), ''),
    nullif(btrim(p_dropoff_note), ''),
    coalesce(p_allows_cargo, false),
    case when p_allows_cargo then p_cargo_capacity_kg else null end,
    case when p_allows_cargo then coalesce(p_allowed_cargo_types, array[]::text[]) else null end,
    case when p_allows_cargo then nullif(btrim(p_cargo_price_note), '') else null end,
    'active'
  )
  returning id into created_trip_id;

  return created_trip_id;
end;
$$;

revoke all on function public.create_driver_trip(
  text, text, timestamptz, integer, text[], integer,
  text, text, boolean, numeric, text[], text
) from public, anon;

grant execute on function public.create_driver_trip(
  text, text, timestamptz, integer, text[], integer,
  text, text, boolean, numeric, text[], text
) to authenticated;


-- ##################################################
-- 202606120005_trip_visibility.sql
-- ##################################################

-- One trusted read path for driver and admin trip lists.

create or replace function public.list_my_driver_trips()
returns setof public.trips
language sql
security definer
set search_path = public
stable
as $$
  select t.*
  from public.trips t
  where auth.uid() is not null
    and t.driver_id = auth.uid()
  order by t.departure_at desc;
$$;

revoke all on function public.list_my_driver_trips() from public, anon;
grant execute on function public.list_my_driver_trips() to authenticated;

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
  driver_verification_status public.driver_verification_status
)
language sql
security definer
set search_path = public
stable
as $$
  select
    t.id,
    t.driver_id,
    t.from_location,
    t.to_location,
    t.departure_at,
    t.seats_total,
    t.seats_available,
    null::text[] as available_seat_labels,
    t.price_per_seat,
    t.pickup_note,
    t.dropoff_note,
    t.allows_cargo,
    t.cargo_capacity_kg,
    t.allowed_cargo_types,
    t.cargo_price_note,
    t.status,
    p.full_name,
    dp.car_model,
    dp.rating,
    dp.completed_trips,
    dp.verification_status
  from public.trips t
  join public.profiles p on p.id = t.driver_id
  join public.driver_profiles dp on dp.user_id = t.driver_id
  where auth.uid() is not null
    and t.status = 'active'
    and t.departure_at > now()
    and t.seats_available > 0
    and p.is_suspended = false
    and dp.verification_status = 'approved'
  order by t.departure_at asc;
$$;

revoke all on function public.list_active_marketplace_trips() from public, anon;
grant execute on function public.list_active_marketplace_trips() to authenticated;

create or replace function public.admin_list_trips()
returns setof public.trips
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if not public.is_admin() then
    raise exception 'admin_required';
  end if;

  return query
  select t.*
  from public.trips t
  order by t.created_at desc
  limit 200;
end;
$$;

revoke all on function public.admin_list_trips() from public, anon;
grant execute on function public.admin_list_trips() to authenticated;

