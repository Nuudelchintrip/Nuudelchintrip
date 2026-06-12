// Public support endpoint with honeypot, timing checks, IP rate limits, and
// service-role insertion. Deploy with --no-verify-jwt; no secret is returned.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  consumeRateLimit,
  corsHeaders,
  getClientIp,
  hmacHash,
  jsonResponse,
  logSecurityEvent,
} from '../_shared/security.ts';

const clean = (value: unknown, maxLength: number) =>
  String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  if (req.method !== 'POST') return jsonResponse(req, { error: 'method_not_allowed' }, 405);

  try {
    const url = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceKey) {
      return jsonResponse(req, { error: 'server_configuration_error' }, 500);
    }

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const contentLength = Number(req.headers.get('content-length') || 0);
    if (Number.isFinite(contentLength) && contentLength > 32768) {
      return jsonResponse(req, { error: 'request_too_large' }, 413);
    }
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const ipHash = await hmacHash(`ip:${getClientIp(req)}`);
    const honeypot = clean(body.website, 200);
    const startedAt = Number(body.startedAt || 0);
    const elapsed = Date.now() - startedAt;

    if (honeypot || !Number.isFinite(startedAt) || elapsed < 1500) {
      await logSecurityEvent(admin, {
        eventType: honeypot ? 'support_honeypot_triggered' : 'support_submitted_too_fast',
        ipHash,
        route: '/functions/v1/submit-support',
        metadata: { elapsed_ms: Number.isFinite(elapsed) ? elapsed : null },
      });
      // Do not reveal the anti-bot rule to automated submitters.
      return jsonResponse(req, { ok: true });
    }

    const shortLimit = await consumeRateLimit(admin, 'support:ip:10m', ipHash, 3, 600, 900);
    const dailyLimit = await consumeRateLimit(admin, 'support:ip:day', ipHash, 10, 86400, 86400);
    if (!shortLimit.allowed || !dailyLimit.allowed) {
      const retryAfter = Math.max(shortLimit.retryAfterSeconds, dailyLimit.retryAfterSeconds, 60);
      await logSecurityEvent(admin, {
        eventType: 'support_rate_limited',
        ipHash,
        route: '/functions/v1/submit-support',
        metadata: { retry_after_seconds: retryAfter },
      });
      return jsonResponse(
        req,
        { error: 'support_rate_limited', retry_after_seconds: retryAfter },
        429,
        { 'Retry-After': String(retryAfter) },
      );
    }

    const name = clean(body.name, 120);
    const phone = clean(body.phone, 32);
    const bookingRef = clean(body.bookingRef, 80);
    const category = clean(body.category, 80);
    const message = clean(body.message, 4000);
    if (message.length < 10) {
      return jsonResponse(req, { error: 'message_too_short' }, 400);
    }

    let userId: string | null = null;
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    if (token) {
      const { data } = await admin.auth.getUser(token);
      userId = data.user?.id || null;
    }

    const { error } = await admin.from('support_requests').insert({
      user_id: userId,
      name: name || null,
      phone: phone || null,
      booking_ref: bookingRef || null,
      category: category || null,
      message,
    });
    if (error) throw error;

    return jsonResponse(req, { ok: true });
  } catch (error) {
    console.error('submit_support_failed', error instanceof Error ? error.message : 'unknown_error');
    return jsonResponse(req, { error: 'internal_error' }, 500);
  }
});
