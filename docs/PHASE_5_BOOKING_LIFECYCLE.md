# Phase 5 — Booking lifecycle (хэрэгжүүлэлтийн тэмдэглэл)

Blueprint Phase 5: Role-validated RPC state transitions. "Төлөв зөв дарааллаар, audit-тай шилжинэ."

## Кодын талаас хийгдсэн зүйл

| Зүйл | Төлөв | Хаана |
|---|---|---|
| Хүчинтэй шилжилтийн граф (state machine) | ✅ | `booking_transition_allowed()` |
| Бүх төлөв шилжилтийг audit log-д бичих | ✅ | `log_booking_status_change()` → `trip_status_logs` |
| Role + дараалал шалгадаг нэгдсэн RPC | ✅ | `set_passenger_booking_status(booking, status, note)` |
| Бүх статус өөрчлөлтийг тэр RPC-аар дамжуулсан | ✅ | жолооч accept/reject, аялагч cancel, төлбөрийн баримт→payment_review, admin approve→confirmed, admin reject→waiting_payment |
| Бодит "Төлвийн түүх" UI | ✅ | `BookingDetailPage.tsx` (`fetchBookingStatusHistory`) |

Migration: `supabase/migrations/202606070004_booking_lifecycle.sql`

## State machine (зөвшөөрөгдсөн шилжилт)
```
pending_request → accepted | rejected | cancelled
accepted        → waiting_payment | payment_review | cancelled | disputed
waiting_payment → payment_review | cancelled | disputed
payment_review  → confirmed | waiting_payment | cancelled | disputed
confirmed       → on_trip | cancelled | disputed
on_trip         → completed | disputed
completed       → disputed
disputed        → confirmed | completed | cancelled
```
Admin нь дарааллын шалгалтыг алгасч (force) болно. Role:
- accepted/rejected/waiting_payment/on_trip/completed → жолооч эсвэл admin
- payment_review → аялагч (өөрийн) эсвэл admin
- confirmed → зөвхөн admin
- cancelled/disputed → жолооч/аялагч/admin

## Чи хийх ёстой
- Migration-г Supabase SQL Editor-т ажиллуул (1→2→3→4 дарааллаар; 4 нь `set_passenger_booking_status`-ийн 2-аргументтэй хувилбарыг устгаж 3-аргументтэйг үлдээнэ).

## Дууссан шалгуур (blueprint)
"Төлөв зөв дарааллаар, audit-тай шилжинэ." → хангагдсан.

## Тэмдэглэл
`changed_by` нь definer функц дотор `auth.uid()`-аар бичигдэнэ (жинхэнэ actor). Cargo lifecycle-ийн адил state machine Phase 9-д хийгдэнэ.
