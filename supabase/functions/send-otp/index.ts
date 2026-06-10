// Supabase Edge Function: send-otp
// Generates a one-time code (server-side) and delivers it by SMS via MoceanAPI.
// Verbose step logging so failures are easy to locate in the function Logs.
//
// Required secrets: MOCEAN_API_TOKEN (apit_... Bearer token), MOCEAN_SENDER
// Auto-provided: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  console.log('STEP 1: invoked', req.method);

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization') ?? '';
    console.log('STEP 2: auth header?', authHeader ? 'yes' : 'NO');

    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: u, error: uerr } = await userClient.auth.getUser();
    console.log('STEP 3: user =', u?.user?.id ?? 'NONE', '| err:', uerr?.message ?? '');
    if (!u?.user) return json({ error: 'not_authenticated' }, 401);

    const { phone } = await req.json().catch(() => ({ phone: '' }));
    console.log('STEP 4: phone =', phone);
    if (!phone) return json({ error: 'phone_required' }, 400);

    const admin = createClient(url, serviceKey);
    const { data: code, error: genErr } = await admin.rpc('generate_otp_for_user', {
      p_user_id: u.user.id,
      p_phone: phone,
    });
    console.log('STEP 5: gen =', code ? 'OK' : 'NULL', '| err:', genErr?.message ?? '');
    if (genErr) return json({ error: 'gen_failed', detail: genErr.message }, 400);

    const token = Deno.env.get('MOCEAN_API_TOKEN') ?? '';
    const sender = Deno.env.get('MOCEAN_SENDER') ?? '';
    const to = String(phone).replace(/\D/g, '');
    console.log('STEP 6: mocean token length =', token.length, '| sender =', sender, '| to =', to);

    const smsResp = await fetch('https://rest.moceanapi.com/rest/2/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${token}`,
      },
      body: new URLSearchParams({
        'mocean-from': sender || 'Nuudelchin',
        'mocean-to': to,
        'mocean-text': `NuudelchinTrip код: ${code}`,
        'mocean-resp-format': 'JSON',
      }),
    });
    const result = await smsResp.json().catch(() => ({}));
    console.log('STEP 7: MOCEAN RESPONSE', smsResp.status, JSON.stringify(result));

    const ok = Array.isArray(result?.messages) && Number(result.messages[0]?.status) === 0;
    if (!ok) return json({ error: 'sms_send_failed', detail: result }, 502);

    return json({ ok: true, resend_after_seconds: 60, expires_in_seconds: 300 });
  } catch (e) {
    console.error('FUNC ERROR', String(e));
    return json({ error: String(e) }, 500);
  }
});
