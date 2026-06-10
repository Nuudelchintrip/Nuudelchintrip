# Phase 1 — Auth, OTP, SMTP (хэрэгжүүлэлтийн тэмдэглэл)

Blueprint-ийн Phase 1: Production SMS/OTP, email confirmation, password reset.

## Кодын талаас хийгдсэн зүйл

| Зүйл | Төлөв | Хаана |
|---|---|---|
| Серверийн OTP (hash, expiry, attempt + resend rate limit) | ✅ | `supabase/migrations/202606070001_phone_otp_and_profile_guard.sql` |
| Sensitive field guard (хэрэглэгч өөрөө `role`/`phone_verified`/`is_suspended` өөрчилж чадахгүй) | ✅ | мөн адил migration |
| OTP-г frontend дээр шалгахаа болиод серверт шалгуулдаг болсон | ✅ | `VerifyPhonePage.tsx`, `supabaseAuth.ts` (`requestPhoneOtp`/`verifyPhoneOtp`) |
| Email confirmation асаалттай үед "имэйлээ шалга" дэлгэц | ✅ | `RegisterPage.tsx`, `registerWithSupabase` |
| Password reset (forgot + reset хуудас, route) | ✅ (өмнө нь хийгдсэн) | `PublicInfoPages.tsx`, `App.tsx` |

## Чи дараах тохиргоог хийх ёстой (зөвхөн чи хийж чадна)

### 1. Migration-г Supabase дээр ажиллуулах
Supabase Dashboard → SQL Editor → доорх файлын агуулгыг хуулж ажиллуул:
`supabase/migrations/202606070001_phone_otp_and_profile_guard.sql`

> Энэ нь `app_settings`, `phone_otp_codes` хүснэгт, `request_phone_otp`/`verify_phone_otp` функц, profiles дээрх хамгаалалтын trigger үүсгэнэ.

### 2. SMS provider (Phase 1-ийн үлдсэн гадаад хамаарал)
Одоо `otp_dev_mode = true` тул код дэлгэц дээр харагдана (туршихад). Production-д:
- SMS provider сонгож холбо (Twilio / MessageBird / Монголын gateway).
- Кодыг илгээх жижиг sender нэм (Edge Function эсвэл webhook), `request_phone_otp` нь хадгалсан кодыг авч SMS-ээр явуулна.
- Дараа нь `app_settings` дотор `otp_dev_mode = false` болго:
  ```sql
  update public.app_settings set value = 'false' where key = 'otp_dev_mode';
  ```
  Ингэснээр код client-д буцахаа болино.

### 3. Email confirmation + SMTP (Supabase Dashboard)
- Authentication → Providers → Email → **Confirm email** = ON.
- Authentication → Emails / SMTP → production custom SMTP тохируул (deliverability).
- Frontend нь аль алинд (on/off) ажиллана; ON болгосон үед хэрэглэгч имэйл баталгаажуулах дэлгэц харна.

### 4. Auth rate limit (Supabase Dashboard)
- Authentication → Rate Limits → signup/login/OTP/email дээр хязгаар тавь.

## Дууссан шалгуур (blueprint)
"Хэрэглэгч найдвартай бүртгүүлж нэвтэрнэ." → migration apply + дээрх dashboard тохиргоо хийгдсэний дараа хангагдана.
