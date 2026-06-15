// Send a phone OTP via CallPro SMS. All secrets stay in Supabase Edge Function
// secrets (CALLPRO_API_KEY, CALLPRO_FROM, OTP_SECRET) — never in the frontend.
import { createClient } from 'jsr:@supabase/supabase-js@2';

function corsHeaders(req: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': req.headers.get('Origin') || '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

function jsonResponse(req: Request, body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(req), ...extra },
  });
}

// 8-digit Mongolian number: strip non-digits and any 976 country code.
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
    const apiKey = Deno.env.get('CALLPRO_API_KEY');
    const from = Deno.env.get('CALLPRO_FROM');
    const otpSecret = Deno.env.get('OTP_SECRET');
    if (!url || !anonKey || !serviceKey || !apiKey || !from || !otpSecret) {
      return jsonResponse(req, { error: 'server_configuration_error' }, 500);
    }

    // Identify the signed-in user from their JWT.
    const authHeader = req.headers.get('Authorization') || '';
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData.user;
    if (!user) return jsonResponse(req, { error: 'not_authenticated' }, 401);

    const body = await req.json().catch(() => ({}));
    const phone = normalizePhone((body as { phone?: unknown }).phone);
    if (!/^\d{8}$/.test(phone)) return jsonResponse(req, { error: 'phone_required' }, 400);

    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    // Rate limit: 1 OTP per phone per 60 seconds.
    const { data: recent } = await admin
      .from('phone_otps')
      .select('created_at')
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recent?.created_at) {
      const ageMs = Date.now() - new Date(recent.created_at).getTime();
      if (ageMs < 60_000) {
        const retry = Math.ceil((60_000 - ageMs) / 1000);
        return jsonResponse(req, { error: 'otp_rate_limited', retry_after_seconds: retry }, 429, {
          'Retry-After': String(retry),
        });
      }
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await hashCode(code, otpSecret);

    const { error: insertError } = await admin.from('phone_otps').insert({
      user_id: user.id,
      phone,
      code_hash: codeHash,
      expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
    });
    if (insertError) return jsonResponse(req, { error: 'otp_store_failed' }, 500);

    // Short Cyrillic-safe text (1 SMS segment).
    const text = `NuudelchinTrip код: ${code}`;
    const smsResponse = await fetch('https://api-text.callpro.mn/v1/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify({ from, to: phone, text }),
    });

    if (!smsResponse.ok) {
      console.error('callpro_send_failed', smsResponse.status, await smsResponse.text().catch(() => ''));
      return jsonResponse(req, { error: 'sms_send_failed' }, 502);
    }

    return jsonResponse(req, { ok: true, resend_after_seconds: 60, expires_in_seconds: 300 });
  } catch (error) {
    console.error('send_otp_failed', error instanceof Error ? error.message : 'unknown_error');
    return jsonResponse(req, { error: 'internal_error' }, 500);
  }
});
