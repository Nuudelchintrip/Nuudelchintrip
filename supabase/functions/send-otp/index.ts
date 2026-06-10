// Supabase Edge Function: send-otp
// Generates a one-time code (server-side) and delivers it by SMS via MoceanAPI.
// The browser only receives timing info — never the code.
//
// Required secrets (Supabase → Edge Functions → Secrets):
//   MOCEAN_API_TOKEN  — the "apit_..." API token from Mocean (Bearer auth)
//   MOCEAN_SENDER     — approved Sender ID / from (e.g. "Nuudelchin")
// Auto-provided by Supabase: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // 1. Identify the caller from their JWT.
    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: 'not_authenticated' }, 401);
    const userId = userData.user.id;

    const { phone } = await req.json().catch(() => ({ phone: '' }));
    if (!phone) return json({ error: 'phone_required' }, 400);

    // 2. Generate + store the code via the service role.
    const admin = createClient(url, serviceKey);
    const { data: code, error: genErr } = await admin.rpc('generate_otp_for_user', {
      p_user_id: userId,
      p_phone: phone,
    });
    if (genErr) return json({ error: genErr.message }, 400);

    // 3. Deliver via Mocean (Bearer API token). International MSISDN, digits only.
    const to = String(phone).replace(/\D/g, '');
    const body = new URLSearchParams({
      'mocean-from': Deno.env.get('MOCEAN_SENDER') ?? 'Nuudelchin',
      'mocean-to': to,
      'mocean-text': `NuudelchinTrip баталгаажуулах код: ${code}`,
      'mocean-resp-format': 'JSON',
    });

    const smsResp = await fetch('https://rest.moceanapi.com/rest/2/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${Deno.env.get('MOCEAN_API_TOKEN') ?? ''}`,
      },
      body,
    });
    const smsResult = await smsResp.json().catch(() => ({}));

    // Mocean returns { messages: [{ status: 0, ... }] } on success (status 0 = OK).
    const ok = smsResp.ok && Array.isArray(smsResult?.messages)
      ? Number(smsResult.messages[0]?.status) === 0
      : smsResp.ok;

    if (!ok) {
      console.error('Mocean send failed', smsResult);
      return json({ error: 'sms_send_failed', detail: smsResult }, 502);
    }

    return json({ ok: true, resend_after_seconds: 60, expires_in_seconds: 300 });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
