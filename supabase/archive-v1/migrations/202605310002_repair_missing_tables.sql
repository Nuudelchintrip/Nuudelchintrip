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
