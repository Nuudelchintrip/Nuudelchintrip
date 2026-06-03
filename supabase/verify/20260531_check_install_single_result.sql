-- Single-result NuudelchinTrip install verification.
-- Supabase SQL Editor may show only the last result when several SELECTs are run.
-- This version returns all checks in one table.

with expected_tables(name) as (
  values
    ('profiles'),
    ('driver_profiles'),
    ('locations'),
    ('trips'),
    ('passenger_bookings'),
    ('cargo_requests'),
    ('payments'),
    ('proofs'),
    ('reviews'),
    ('reports'),
    ('notifications'),
    ('trip_status_logs')
),
expected_buckets(name) as (
  values
    ('avatars'),
    ('driver-documents'),
    ('vehicle-documents'),
    ('payment-proofs'),
    ('cargo-proofs')
),
expected_functions(name) as (
  values
    ('is_admin'),
    ('can_create_trip'),
    ('handle_new_user'),
    ('set_updated_at')
)
select
  'tables' as check_group,
  12 as expected,
  count(t.tablename)::int as found,
  coalesce(array_agg(e.name order by e.name) filter (where t.tablename is not null), '{}') as found_names,
  coalesce(array_agg(e.name order by e.name) filter (where t.tablename is null), '{}') as missing_names
from expected_tables e
left join pg_tables t
  on t.schemaname = 'public'
 and t.tablename = e.name

union all

select
  'storage_buckets' as check_group,
  5 as expected,
  count(b.id)::int as found,
  coalesce(array_agg(e.name order by e.name) filter (where b.id is not null), '{}') as found_names,
  coalesce(array_agg(e.name order by e.name) filter (where b.id is null), '{}') as missing_names
from expected_buckets e
left join storage.buckets b
  on b.id = e.name

union all

select
  'helper_functions' as check_group,
  4 as expected,
  count(p.proname)::int as found,
  coalesce(array_agg(e.name order by e.name) filter (where p.proname is not null), '{}') as found_names,
  coalesce(array_agg(e.name order by e.name) filter (where p.proname is null), '{}') as missing_names
from expected_functions e
left join pg_proc p
  on p.pronamespace = 'public'::regnamespace
 and p.proname = e.name

union all

select
  'rls_enabled_tables' as check_group,
  12 as expected,
  count(c.relname)::int as found,
  coalesce(array_agg(e.name order by e.name) filter (where c.relname is not null), '{}') as found_names,
  coalesce(array_agg(e.name order by e.name) filter (where c.relname is null), '{}') as missing_names
from expected_tables e
left join pg_class c
  on c.relnamespace = 'public'::regnamespace
 and c.relname = e.name
 and c.relrowsecurity = true
order by check_group;
