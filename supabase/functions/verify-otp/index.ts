// Verify a phone OTP issued by send-otp. Enforces 5-minute expiry and a max of
// 5 wrong attempts, then marks the profile phone_verified via the existing
// SECURITY DEFINER RPC (which handles guarded columns correctly).
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/security.ts';

const MAX_ATTEMPTS = 5;

function normalizePhone(value: unknown): string {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length > 8 ? digits.slice(-8) : digits;
}

async function hashCode(code: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(code));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  if (req.method !== 'POST') return jsonResponse(req, { error: 'method_not_allowed' }, 405);

  try {
    const url = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const otpSecret = Deno.env.get('OTP_SECRET');
    if (!url || !anonKey || !serviceKey || !otpSecret) {
      return jsonResponse(req, { error: 'server_configuration_error' }, 500);
    }

    const authHeader = req.headers.get('Authorization') || '';
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData.user;
    if (!user) return jsonResponse(req, { error: 'not_authenticated' }, 401);

    const body = await req.json().catch(() => ({}));
    const phone = normalizePhone((body as { phone?: unknown }).phone);
    const code = String((body as { code?: unknown }).code || '').replace(/\D/g, '');
    if (!/^\d{8}$/.test(phone)) return jsonResponse(req, { error: 'phone_required' }, 400);
    if (!/^\d{6}$/.test(code)) return jsonResponse(req, { error: 'otp_invalid' }, 400);

    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    // Latest unverified OTP for this user + phone.
    const { data: otp } = await admin
      .from('phone_otps')
      .select('id, code_hash, attempts, verified, expires_at')
      .eq('user_id', user.id)
      .eq('phone', phone)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otp) return jsonResponse(req, { error: 'otp_not_found' }, 400);
    if (new Date(otp.expires_at).getTime() < Date.now()) {
      return jsonResponse(req, { error: 'otp_expired' }, 400);
    }
    if (otp.attempts >= MAX_ATTEMPTS) {
      return jsonResponse(req, { error: 'otp_too_many_attempts' }, 429);
    }

    const expected = await hashCode(code, otpSecret);
    if (expected !== otp.code_hash) {
      await admin.from('phone_otps').update({ attempts: otp.attempts + 1 }).eq('id', otp.id);
      const remaining = Math.max(0, MAX_ATTEMPTS - (otp.attempts + 1));
      return jsonResponse(req, { error: 'otp_invalid', attempts_left: remaining }, 400);
    }

    // Correct code — consume it and mark the profile verified via the RPC
    // (runs as the signed-in user, handles guarded columns).
    await admin.from('phone_otps').update({ verified: true }).eq('id', otp.id);

    const { error: verifyError } = await userClient.rpc('complete_phone_verification');
    if (verifyError) {
      console.error('complete_phone_verification_failed', verifyError.message);
      return jsonResponse(req, { error: 'profile_update_failed' }, 500);
    }

    return jsonResponse(req, { ok: true, phone_verified: true });
  } catch (error) {
    console.error('verify_otp_failed', error instanceof Error ? error.message : 'unknown_error');
    return jsonResponse(req, { error: 'internal_error' }, 500);
  }
});
