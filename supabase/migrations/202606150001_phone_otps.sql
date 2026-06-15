-- ---------------------------------------------------------------------------
-- 202606150001_phone_otps
--
-- OTP store for the CallPro SMS phone-verification flow. Written/read ONLY by
-- the send-otp / verify-otp Edge Functions via the service_role key — never
-- from the browser. RLS is enabled with NO client policies, so anon/authenticated
-- have no access; service_role bypasses RLS.
--
-- The Edge Functions enforce the business rules; the columns below support them:
--   * rate limit (1 OTP / phone / 60s)  -> created_at + (phone, created_at) index
--   * expiry after 5 minutes            -> expires_at (default now() + 5 min)
--   * max 5 wrong attempts              -> attempts
--   * mark verified on success          -> verified
-- The code itself is stored hashed (HMAC with OTP_SECRET) in code_hash; plaintext
-- codes are never persisted.
-- ---------------------------------------------------------------------------

create table if not exists public.phone_otps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  phone text not null,
  code_hash text not null,
  attempts integer not null default 0,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '5 minutes')
);

-- Fast "latest OTP for this phone" lookup (rate limit + verification).
create index if not exists idx_phone_otps_phone_created
  on public.phone_otps (phone, created_at desc);

create index if not exists idx_phone_otps_user
  on public.phone_otps (user_id);

-- Edge-function-only access: lock the table down to the service role.
alter table public.phone_otps enable row level security;
revoke all on public.phone_otps from anon, authenticated;
