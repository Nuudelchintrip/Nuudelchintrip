import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

const DEFAULT_ORIGINS = [
  'https://nuudelchintrip.com',
  'https://www.nuudelchintrip.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

export function corsHeaders(req: Request) {
  const configured = (Deno.env.get('ALLOWED_ORIGINS') || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const allowed = configured.length ? configured : DEFAULT_ORIGINS;
  const origin = req.headers.get('origin') || '';
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0];

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export function jsonResponse(req: Request, body: unknown, status = 200, extraHeaders: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      ...extraHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export function getClientIp(req: Request) {
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

export async function hmacHash(value: string) {
  const secret = Deno.env.get('RATE_LIMIT_HASH_SECRET') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!secret) throw new Error('rate_limit_secret_missing');

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function consumeRateLimit(
  admin: SupabaseClient,
  scope: string,
  subjectHash: string,
  limit: number,
  windowSeconds: number,
  blockSeconds = 0,
) {
  const { data, error } = await admin.rpc('consume_security_rate_limit', {
    p_scope: scope,
    p_subject_hash: subjectHash,
    p_limit: limit,
    p_window_seconds: windowSeconds,
    p_block_seconds: blockSeconds,
  });
  if (error) throw error;

  const result = (data || {}) as {
    allowed?: boolean;
    remaining?: number;
    retry_after_seconds?: number;
  };
  return {
    allowed: result.allowed === true,
    remaining: Number(result.remaining || 0),
    retryAfterSeconds: Math.max(0, Number(result.retry_after_seconds || 0)),
  };
}

export async function logSecurityEvent(
  admin: SupabaseClient,
  input: {
    eventType: string;
    severity?: 'info' | 'warning' | 'critical';
    actorUserId?: string | null;
    subjectHash?: string | null;
    ipHash?: string | null;
    route?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  const { error } = await admin.rpc('log_security_event', {
    p_event_type: input.eventType,
    p_severity: input.severity || 'warning',
    p_actor_user_id: input.actorUserId || null,
    p_subject_hash: input.subjectHash || null,
    p_ip_hash: input.ipHash || null,
    p_route: input.route || null,
    p_metadata: input.metadata || {},
  });
  if (error) console.error('security_event_write_failed', error.message);
}
