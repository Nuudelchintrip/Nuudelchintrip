// Authenticated OTP delivery. Secrets stay in Supabase Edge Function secrets.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  consumeRateLimit,
  corsHeaders,
  getClientIp,
  hmacHash,
  jsonResponse,
  logSecurityEvent,
} from '../_shared/security.ts';

const normalizePhone = (value: unknown) => String(value || '').replace(/\D/g, '');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  if (req.method !== 'POST') return jsonResponse(req, { error: 'method_not_allowed' }, 405);

  try {
    const url = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const smsToken = Deno.env.get('MOCEAN_API_TOKEN');
    const smsSender = Deno.env.get('MOCEAN_SENDER');
    if (!url || !anonKey || !serviceKey || !smsToken || !smsSender) {
      return jsonResponse(req, { error: 'server_configuration_error' }, 500);
    }

    const authHeader = req.headers.get('Authorization') || '';
    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData.user;
    if (!user) return jsonResponse(req, { error: 'not_authenticated' }, 401);

    const body = await req.json().catch(() => ({}));
    const phone = normalizePhone((body as { phone?: unknown }).phone);
    if (!/^976\d{8}$/.test(phone)) {
      return jsonResponse(req, { error: 'phone_required' }, 400);
    }

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const ipHash = await hmacHash(`ip:${getClientIp(req)}`);
    const phoneHash = await hmacHash(`phone:${phone}`);

    const [phoneLimit, ipLimit] = await Promise.all([
      consumeRateLimit(admin, 'otp:phone:hour', phoneHash, 5, 3600, 3600),
      consumeRateLimit(admin, 'otp:ip:hour', ipHash, 20, 3600, 3600),
    ]);

    if (!phoneLimit.allowed || !ipLimit.allowed) {
      const retryAfter = Math.max(phoneLimit.retryAfterSeconds, ipLimit.retryAfterSeconds, 60);
      await logSecurityEvent(admin, {
        eventType: 'otp_rate_limited',
        actorUserId: user.id,
        subjectHash: phoneHash,
        ipHash,
        route: '/functions/v1/send-otp',
        metadata: { retry_after_seconds: retryAfter },
      });
      return jsonResponse(
        req,
        { error: 'otp_rate_limited', retry_after_seconds: retryAfter },
        429,
        { 'Retry-After': String(retryAfter) },
      );
    }

    const { data: code, error: generateError } = await admin.rpc('generate_otp_for_user', {
      p_user_id: user.id,
      p_phone: `+${phone}`,
    });
    if (generateError || !code) {
      const knownError = ['otp_rate_limited', 'otp_hourly_limit']
        .find((name) => generateError?.message?.includes(name));
      return jsonResponse(req, { error: knownError || 'otp_generation_failed' }, knownError ? 429 : 400);
    }

    const smsResponse = await fetch('https://rest.moceanapi.com/rest/2/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${smsToken}`,
      },
      body: new URLSearchParams({
        'mocean-from': smsSender,
        'mocean-to': phone,
        'mocean-text': `NuudelchinTrip код: ${code}`,
        'mocean-resp-format': 'JSON',
      }),
    });
    const smsResult = await smsResponse.json().catch(() => ({}));
    const sent = Array.isArray(smsResult?.messages) && Number(smsResult.messages[0]?.status) === 0;

    if (!sent) {
      await logSecurityEvent(admin, {
        eventType: 'otp_delivery_failed',
        severity: 'warning',
        actorUserId: user.id,
        subjectHash: phoneHash,
        ipHash,
        route: '/functions/v1/send-otp',
        metadata: { provider_status: smsResponse.status },
      });
      return jsonResponse(req, { error: 'sms_send_failed' }, 502);
    }

    return jsonResponse(req, {
      ok: true,
      resend_after_seconds: 60,
      expires_in_seconds: 300,
    });
  } catch (error) {
    console.error('send_otp_failed', error instanceof Error ? error.message : 'unknown_error');
    return jsonResponse(req, { error: 'internal_error' }, 500);
  }
});
