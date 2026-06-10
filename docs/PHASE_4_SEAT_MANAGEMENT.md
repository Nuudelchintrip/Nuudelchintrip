# Phase 4 — Seat management (хэрэгжүүлэлтийн тэмдэглэл)

Blueprint Phase 4: Seat hold, expiry, reject/cancel release. "Суудал давхардахгүй, түгжигдэхгүй."

## Асуудал (өмнө нь)
- Захиалга үүсэхэд суудал hold хийгддэг байсан ✅ (давхар захиалгаас сэргийлдэг).
- ГЭХДЭЭ `updatePassengerBookingStatus` нь зүгээр `.update({status})` хийдэг тул **reject/cancel үед суудал буцдаггүй** → суудал бүрмөсөн түгждэг.
- Hold-д **хугацаа байхгүй** → жолооч хариу өгөхгүй бол суудал мөнхөд түгждэг.

## Кодын талаас хийгдсэн зүйл

| Зүйл | Төлөв | Хаана |
|---|---|---|
| `hold_expires_at` + transition timestamps (accepted/rejected/cancelled/confirmed/released) | ✅ | migration |
| Захиалга үүсэхэд hold expiry тавих (default 12ц, `app_settings.seat_hold_minutes`) | ✅ | `create_passenger_booking_with_seats` |
| `release_seats_for_booking()` — суудлыг trip-д буцаах (idempotent, давхар буцаахгүй) | ✅ | migration |
| Reject/cancel үед суудал автоматаар суллах | ✅ | `set_passenger_booking_status` RPC |
| Хугацаа дууссан hold-уудыг суллаж cancel хийх sweeper | ✅ | `expire_stale_seat_holds()` (захиалга үүсэх бүрд lazy дуудагдана) |
| Role-validated transition (жолооч accept/reject, аялагч cancel) | ✅ | `set_passenger_booking_status` RPC |
| Frontend → RPC рүү шилжүүлсэн | ✅ | `updatePassengerBookingStatus` (`tripService.ts`) |
| Аялагч өөрийн захиалгаа цуцлах товч | ✅ | `BookingDetailPage.tsx` |

Migration: `supabase/migrations/202606070003_seat_management.sql`

## Чи хийх ёстой
1. Migration-г Supabase SQL Editor-т ажиллуул (Phase 1, 2-ийн дараа).
2. (Сонголтоор) Хэн ч шинэ захиалга үүсгэхгүй удвал hold автоматаар цэвэрлэгдэхийн тулд **pg_cron**-оор sweeper-ийг товлоx:
   ```sql
   -- Supabase: Database → Extensions → pg_cron-г асаа, дараа нь:
   select cron.schedule('expire-seat-holds', '*/10 * * * *', $$select public.expire_stale_seat_holds();$$);
   ```
   pg_cron байхгүй ч захиалга үүсэх бүрд lazy цэвэрлэдэг тул заавал биш.

## Дууссан шалгуур (blueprint)
"Суудал давхардахгүй, түгжигдэхгүй." → migration apply хийсний дараа хангагдана.

## Тэмдэглэл
`seat_hold_minutes`-ийг тохируулах: `update public.app_settings set value='720' where key='seat_hold_minutes';`
