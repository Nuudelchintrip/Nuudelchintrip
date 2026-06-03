-- NuudelchinTrip Supabase install verification.
-- Run in Supabase SQL Editor after the initial schema migration.

select
  'tables' as check_group,
  count(*) as found,
  array_agg(tablename order by tablename) as names
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles',
    'driver_profiles',
    'locations',
    'trips',
    'passenger_bookings',
    'cargo_requests',
    'payments',
    'proofs',
    'reviews',
    'reports',
    'notifications',
    'trip_status_logs'
  );

select
  'storage_buckets' as check_group,
  count(*) as found,
  array_agg(id order by id) as names
from storage.buckets
where id in (
  'avatars',
  'driver-documents',
  'vehicle-documents',
  'payment-proofs',
  'cargo-proofs'
);

select
  'helper_functions' as check_group,
  count(*) as found,
  array_agg(proname order by proname) as names
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('is_admin', 'can_create_trip', 'handle_new_user', 'set_updated_at');

select
  'rls_enabled_tables' as check_group,
  count(*) as found,
  array_agg(relname order by relname) as names
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in (
    'profiles',
    'driver_profiles',
    'locations',
    'trips',
    'passenger_bookings',
    'cargo_requests',
    'payments',
    'proofs',
    'reviews',
    'reports',
    'notifications',
    'trip_status_logs'
  )
  and relrowsecurity = true;
