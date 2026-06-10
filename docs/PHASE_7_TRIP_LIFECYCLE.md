# Phase 7 — Trip start / end (хэрэгжүүлэлтийн тэмдэглэл)

Blueprint Phase 7: Driver actions, timestamps, logs, notifications. "Бодит аяллын lifecycle дуусна."

## Кодын талаас хийгдсэн зүйл

| Зүйл | Төлөв | Хаана |
|---|---|---|
| Жинхэнэ 6-оронтой аяллын код (booking тус бүрд, өмнө placeholder) | ✅ | `passenger_bookings.trip_code`, `BookingDetailPage.tsx` (аялагч хардаг) |
| Жолооч аялал эхлүүлэх (confirmed→on_trip) + started_at + audit | ✅ | `start_passenger_trip()` RPC, driver requests UI |
| Жолооч аялал дуусгах кодоор баталгаажуулж (on_trip→completed) + completed_at + audit | ✅ | `complete_passenger_trip()` RPC, code input UI |
| Дуусахад жолоочийн `completed_trips` нэмэгдэх | ✅ | RPC дотор (guard bypass) |
| Status log (audit) | ✅ | `log_booking_status_change` reuse → trip_status_logs |

Migration: `supabase/migrations/202606070006_trip_lifecycle.sql`

## Урсгал
1. Төлбөр баталгаажиж booking → `confirmed`.
2. Жолооч "Аялал эхлүүлэх" → `on_trip` (DriverRequests хуудас).
3. Аялагч өөрийн **6-оронтой кодоо** (BookingDetail → "Аяллын код") жолоочид хэлнэ.
4. Жолооч кодыг оруулж "Аялал дуусгах" → `completed`. Код буруу бол `invalid_trip_code`.

## Чи хийх ёстой
- Migration-г ажиллуул (1→2→3→4→5→6 дарааллаар).

## Үлдсэн
- **Мэдэгдэл (notification)**: аялал эхэлсэн/дууссан үед аялагчид мэдэгдэх нь Phase 8 (Notifications)-д холбогдоно. Одоогоор audit log-д бичигдэж, BookingDetail дээр төлвийн түүхээр харагдана.
- Trip-level (бүх зорчигчийг нэг дор) эхлүүлэх биш, booking тус бүрээр. Single-passenger ихэвчлэн тул MVP-д хангалттай.

## Дууссан шалгуур (blueprint)
"Бодит аяллын lifecycle дуусна." → хангагдсан (start/end + код баталгаажуулалт + timestamp + audit).
