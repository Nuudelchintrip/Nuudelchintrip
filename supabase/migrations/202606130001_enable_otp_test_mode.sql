-- ---------------------------------------------------------------------------
-- 202606130001_enable_otp_test_mode
--
-- TEST MODE for phone OTP. The send-otp Edge Function is not deployed yet, so
-- the frontend falls back to the request_phone_otp RPC. 202606120001 locked that
-- RPC down for production. This migration re-opens it for testing and turns on
-- otp_dev_mode so the 6-digit code is returned on screen (no real SMS needed).
--
-- BEFORE GOING LIVE: deploy the send-otp Edge Function, then run
--   202606120001_security_antispam.sql again (it revokes these grants and sets
--   otp_dev_mode = false), so codes are delivered by SMS only.
-- ---------------------------------------------------------------------------

-- 1. Return the code on screen instead of sending SMS.
update public.app_settings
set value = 'true', updated_at = now()
where key = 'otp_dev_mode';

insert into public.app_settings (key, value)
select 'otp_dev_mode', 'true'
where not exists (select 1 from public.app_settings where key = 'otp_dev_mode');

-- 2. Allow signed-in users to call the OTP RPCs directly (fallback path).
grant execute on function public.request_phone_otp(text) to authenticated;
grant execute on function public.complete_phone_verification() to authenticated;
