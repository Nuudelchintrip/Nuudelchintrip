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
