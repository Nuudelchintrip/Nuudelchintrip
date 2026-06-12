# NuudelchinTrip security deployment

The code keeps browser-safe Supabase values in Vite and server secrets in
Supabase Edge Function secrets. Never add a service-role key to Vercel or to a
variable whose name starts with `VITE_`.

## 1. Apply the database migration

Run this file in Supabase SQL Editor:

`supabase/migrations/202606120001_security_antispam.sql`

Then run:

`supabase/verify/security_check.sql`

The verification file contains the expected result beside every query.

## 2. Configure Edge Function secrets

Generate a long random value for `RATE_LIMIT_HASH_SECRET` and store it only as a
Supabase secret. Also keep the existing SMS provider values there:

```powershell
supabase secrets set RATE_LIMIT_HASH_SECRET="REPLACE_WITH_A_LONG_RANDOM_VALUE"
supabase secrets set ALLOWED_ORIGINS="https://nuudelchintrip.com,https://www.nuudelchintrip.com"
supabase secrets set MOCEAN_API_TOKEN="REPLACE_WITH_PROVIDER_TOKEN"
supabase secrets set MOCEAN_SENDER="Nuudelchin"
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are supplied
to hosted Edge Functions by Supabase.

## 3. Deploy the functions

```powershell
supabase functions deploy send-otp
supabase functions deploy submit-support --no-verify-jwt
```

`submit-support` intentionally performs its own origin, honeypot, timing, and IP
rate-limit checks so logged-out visitors can contact support.

## 4. Vercel variables

Only these public variables belong in Vercel:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_OTP_FUNCTION=send-otp
VITE_ALLOW_OTP_DEV_FALLBACK=false
```

Do not add `SUPABASE_SERVICE_ROLE_KEY`, `MOCEAN_API_TOKEN`,
`MOCEAN_SENDER`, or `RATE_LIMIT_HASH_SECRET` to Vercel frontend variables.

## 5. Smoke tests

1. Request OTP six times for one phone in an hour. The later request must return
   a rate-limit message.
2. Submit the support form four times in ten minutes from one connection. The
   fourth request must be blocked.
3. Create more than six passenger bookings in ten minutes. The database must
   return `request_rate_limited`.
4. Try to insert directly into `support_requests`, `reports`, `reviews`,
   `payments`, `proofs`, or `trip_status_logs` with an anon/authenticated
   client. RLS must reject it.
5. Upload a file over the bucket limit or an executable file. Storage must reject
   it even if browser validation is bypassed.
6. Open `/admin/logs` as an admin and confirm OTP/support security events appear.
