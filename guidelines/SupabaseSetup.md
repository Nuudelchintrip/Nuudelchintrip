# Supabase setup checklist

Project ref: `yemveoekjnvdoivblccg`

API URL:

```txt
https://yemveoekjnvdoivblccg.supabase.co
```

Local env file:

```txt
.env.local
```

Required Vite env variables:

```env
VITE_SUPABASE_URL=https://yemveoekjnvdoivblccg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key from Supabase>
VITE_SUPABASE_ANON_KEY=<same publishable key for compatibility until the client is wired>
```

Do not put the `service_role` key in frontend code, `.env.local` for Vite, Netlify public env, or Vercel public env.

## Dashboard steps

1. Open Supabase Dashboard.
2. Go to SQL Editor.
3. Open `supabase/migrations/202605310001_initial_schema.sql` from this repo.
4. Paste the full SQL into SQL Editor.
5. Run it once.
6. Confirm these tables exist:
   - `profiles`
   - `driver_profiles`
   - `trips`
   - `passenger_bookings`
   - `cargo_requests`
   - `payments`
   - `proofs`
   - `reviews`
   - `reports`
   - `notifications`
7. Confirm these storage buckets exist:
   - `avatars`
   - `driver-documents`
   - `vehicle-documents`
   - `payment-proofs`
   - `cargo-proofs`

## Auth URL configuration

Add these URLs in Authentication -> URL Configuration:

```txt
http://localhost:5173
```

After deployment, also add the deployed domain:

```txt
https://your-site.vercel.app
https://your-site.netlify.app
```

## MVP permission rules

- Traveler creates passenger bookings only after `phone_verified = true`.
- Driver creates trips only after `driver_profiles.verification_status = 'approved'`.
- Cargo sender creates cargo requests only after `cargo_policy_accepted = true`.
- Cargo requests can target only trips where `allows_cargo = true`.
- Admin approval is required for payments and driver verification.
