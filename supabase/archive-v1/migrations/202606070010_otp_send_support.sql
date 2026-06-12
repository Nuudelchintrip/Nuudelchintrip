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
