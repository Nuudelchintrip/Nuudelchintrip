# NuudelchinTrip — Deployment & Handoff Runbook

Production-д гаргах, ажиллуулах, хүлээлгэн өгөх практик заавар. (Blueprint Phase 12.)

## 1. Supabase migration-ийн дараалал
SQL Editor-т **дарааллаар** Run хийнэ (idempotent, дахин ажиллуулж болно):

| # | Файл | Агуулга |
|---|------|---------|
| 1 | `202605310001_initial_schema.sql` … (анхны schema-ийн файлууд) | Хүснэгт, enum, RLS, storage bucket |
| 2 | `202606070001_phone_otp_and_profile_guard.sql` | OTP + profile field guard |
| 3 | `202606070002_driver_verification.sql` | Жолоочийн verification |
| 4 | `202606070003_seat_management.sql` | Суудал hold/release |
| 5 | `202606070004_booking_lifecycle.sql` | Booking state machine + audit |
| 6 | `202606070005_payments.sql` | Атомик төлбөр + refund + банкны данс |
| 7 | `202606070006_trip_lifecycle.sql` | Аялал эхлэх/дуусгах + код |
| 8 | `202606070007_notifications.sql` | Мэдэгдэл |
| 9 | `202606070008_cargo_lifecycle.sql` | Дайвар ачаа lifecycle |
| 10 | `202606070009_rls_hardening.sql` | Security — шууд бичилт хаах (ЗААВАЛ) |

Шалгах: `select proname from pg_proc where proname like '%payment%' or proname like '%booking%';`

## 2. Supabase Dashboard тохиргоо
- **Authentication → Email**: Confirm email = ON.
- **Authentication → SMTP**: production custom SMTP холбох (имэйл хүргэлт).
- **Authentication → Rate Limits**: signup/login/OTP хязгаар.
- **SMS**: provider холбож, бэлэн болоход `update public.app_settings set value='false' where key='otp_dev_mode';`
- **Платформын банкны данс**:
  ```sql
  update public.app_settings set value='<банк>'  where key='platform_bank_name';
  update public.app_settings set value='<данс>'   where key='platform_bank_account';
  update public.app_settings set value='<нэр>'    where key='platform_bank_holder';
  ```

## 3. Vercel / hosting environment variables
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (эсвэл `VITE_SUPABASE_ANON_KEY`)
- ⚠️ `service_role` key-г frontend-д **хэзээ ч** бүү тавь.

## 4. Админ хэрэглэгч үүсгэх
1. Энгийн хэрэглэгчээр бүртгүүлж, утсаа баталгаажуул.
2. SQL Editor:
   ```sql
   update public.profiles set role='admin' where email='<админ имэйл>';
   ```
3. `/admin/login`-ээр нэвтэрч шалга.

## 5. Backup / restore
- Supabase → Database → **Backups** (Pro plan дээр өдөр тутмын). Restore-г туршиж үз.
- Migration файлуудыг git-д хадгална (schema-ийн эх сурвалж).

## 6. Гар хийгдэх QA (launch-аас өмнө)
- 4 role-ийн end-to-end: traveler (register→OTP→хайлт→суудал→төлбөр→аялал→үнэлгээ), driver (verification→route→accept→start/end→earnings), cargo sender (cargo route→request→payment→delivery code), admin (verification→payment→refund→reports→logs).
- Mobile: 360px / 390px / tablet / desktop дээр core flow.
- Security: role bypass, RLS, давхар суудал, буруу status, файл upload.

## 7. Мэдэгдэж буй хязгаарлалт (known limitations)
- Төлбөр нь автомат gateway биш — баримт upload + админ гар баталгаажуулалт.
- SMS provider холбогдох хүртэл OTP нь dev mode (код дэлгэцэнд харагдана).
- Жолоочид payout (орлого шилжүүлэх) автомат биш — админ гар процесс.
- `AccountVerificationPage` (`/dashboard/driver/verification`) нь хуучин mock identity flow — жинхэнэ жолоочийн урсгал нь `/onboarding/driver`-аар явна (дараа цэвэрлэх).
- Realtime чат байхгүй (зориуд).

## 8. Хүлээлгэн өгөх багц
- Production source code + git tag.
- Supabase schema/migration + RLS policy (энэ repo-д).
- Vercel env жагсаалт (дээрх №3).
- Админ үүсгэх заавар (№4).
- Operational runbook (энэ файл): payment, verification, refund, report.
- QA checklist (№6) + known issues (№7).
