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
  'submit_review', 'record_driver_payout', 'create_cargo_request'
)
order by proname;
-- Expect 11 rows.

-- 5. notifications has NO client insert policy (only definer functions write).
select 'notifications insert policy (should be none)' as check, policyname
from pg_policies where tablename = 'notifications' and cmd = 'INSERT';
-- Expect 0 rows.
