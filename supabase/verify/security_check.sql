-- Security posture verification. Run in the Supabase SQL editor after applying all
-- migrations. Every row returned should match the expected description.

-- 1. Sensitive-field guard triggers must exist (users cannot self-escalate).
select 'guard trigger' as check, tgname
from pg_trigger
where tgname in ('profiles_guard_sensitive', 'driver_profiles_guard_verification')
order by tgname;
-- Expect 2 rows.

-- 2. Booking/cargo direct writes must be admin-only (no participant UPDATE, no
--    client INSERT). These policy names should be PRESENT:
select 'locked policy' as check, policyname, tablename
from pg_policies
where policyname in ('bookings update admin only', 'cargo update admin only', 'payments create own pending')
order by policyname;
-- Expect 3 rows.

-- 3. The permissive policies must be GONE (this should return 0 rows):
select 'should-be-removed' as check, policyname, tablename
from pg_policies
where policyname in ('travelers create bookings', 'bookings update participant admin',
                     'cargo senders create on cargo trips', 'cargo update participant admin');
-- Expect 0 rows.

-- 4. Core security-definer RPCs must exist.
select 'rpc' as check, proname
from pg_proc
where proname in (
  'request_phone_otp', 'verify_phone_otp', 'generate_otp_for_user',
  'review_driver_verification', 'set_passenger_booking_status',
  'set_cargo_request_status', 'review_payment', 'refund_payment',
  'submit_review', 'record_driver_payout', 'create_cargo_request',
  'create_booking_report', 'submit_cargo_payment_proof',
  'consume_security_rate_limit', 'log_security_event'
)
order by proname;
-- Expect 15 rows.

-- 5. notifications has NO client insert policy (only definer functions write).
select 'notifications insert policy (should be none)' as check, policyname
from pg_policies where tablename = 'notifications' and cmd = 'INSERT';
-- Expect 0 rows.

-- 6. Public/direct spam write paths must be gone.
select 'direct insert policy (should be none)' as check, tablename, policyname
from pg_policies
where cmd = 'INSERT'
  and (
    (tablename = 'support_requests')
    or (tablename = 'reports' and policyname = 'reports create own')
    or (tablename = 'reviews' and policyname = 'reviews create own')
    or (tablename = 'trip_status_logs' and policyname = 'trip logs create participant admin')
    or (tablename = 'payments' and policyname in ('payments create own', 'payments create own pending'))
    or (tablename = 'proofs' and policyname = 'proofs create own')
  );
-- Expect 0 rows.

-- 7. Security tables and all user-data tables must have RLS enabled.
with expected(name) as (
  values
    ('profiles'), ('driver_profiles'), ('trips'), ('passenger_bookings'),
    ('cargo_requests'), ('payments'), ('proofs'), ('reviews'), ('reports'),
    ('notifications'), ('trip_status_logs'), ('support_requests'),
    ('driver_payouts'), ('phone_otp_codes'), ('app_settings'),
    ('security_events'), ('security_rate_limits')
)
select
  'rls enabled' as check,
  count(*) filter (where c.relrowsecurity)::int as found,
  count(*)::int as expected
from expected e
join pg_class c on c.relname = e.name
join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public';
-- Expect found = expected = 17.

-- 8. Browser roles must not execute OTP bypass or server-only security RPCs.
select
  'server-only privilege' as check,
  p.proname,
  has_function_privilege('authenticated', p.oid, 'execute') as authenticated_can_execute,
  has_function_privilege('anon', p.oid, 'execute') as anon_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'request_phone_otp',
    'complete_phone_verification',
    'consume_security_rate_limit',
    'log_security_event'
  )
order by p.proname;
-- Expect every authenticated_can_execute and anon_can_execute value = false.

-- 9. Storage buckets must enforce file type and size constraints.
select 'storage restriction' as check, id, file_size_limit, allowed_mime_types
from storage.buckets
where id in (
  'avatars', 'driver-documents', 'vehicle-documents',
  'payment-proofs', 'cargo-proofs'
)
order by id;
-- Expect avatars = 5 MB image-only; private document/proof buckets = 10 MB image/PDF.
