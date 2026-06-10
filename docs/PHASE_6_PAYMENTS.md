# Phase 6 — Payments (хэрэгжүүлэлтийн тэмдэглэл)

Blueprint Phase 6: Admin account, proof review, transaction, refund/payout. "Мөнгөний урсгал хяналттай болно."

## Загвар
Энэ нь **автомат payment gateway биш** — хэрэглэгч банкны гүйлгээний баримт (зураг/PDF) оруулж, **админ гараар баталгаажуулдаг** MVP загвар. Phase 6 нь энэ урсгалыг атомик, дүрэмтэй болгосон.

## Кодын талаас хийгдсэн зүйл

| Зүйл | Төлөв | Хаана |
|---|---|---|
| Төлбөрийн баримт илгээх — атомик (payment + proof + booking→payment_review нэг transaction) | ✅ | `submit_payment_proof()` RPC |
| Админ баталгаажуулах/буцаах — атомик (payment + booking нэг transaction) | ✅ | `review_payment()` RPC |
| Refund — payment→refunded + booking cancel + суудал суллах | ✅ | `refund_payment()` RPC + admin "refund" товч |
| Админаар тохируулдаг платформын банкны данс (fake данс арилгасан) | ✅ | `app_settings` + `get_platform_payment_info()`, `PaymentProofPage.tsx` |
| Validation: эзэмшил, төлөв, дүн, давхар review | ✅ | RPC дотор |
| Бүх booking transition lifecycle RPC-аар (audit) | ✅ | `set_passenger_booking_status` reuse |

Migration: `supabase/migrations/202606070005_payments.sql`

## Чи хийх ёстой
1. Migration-г ажиллуул (1→2→3→4→5 дарааллаар).
2. **Платформын банкны дансаа тохируул** (хэрэглэгч энэ данс руу шилжүүлнэ):
   ```sql
   update public.app_settings set value='Хаан банк' where key='platform_bank_name';
   update public.app_settings set value='5xxxxxxxxx' where key='platform_bank_account';
   update public.app_settings set value='Нэр Овог' where key='platform_bank_holder';
   ```
   (Дансны UI-г админ самбарт Phase 10-д нэмж болно. Одоо SQL-ээр эсвэл `VITE_PLATFORM_BANK_*` env-ээр.)

## Үлдсэн known gap
- Cargo-ийн төлбөр (`approvePayment`/`rejectPayment`-ийн cargo салаа) одоогоор шууд update — Phase 9-д атомик болгоно.
- Жолоочид payout (орлого шилжүүлэх) автомат биш — энэ нь админ гар процесс (refund-тэй адил дүрмээр өргөтгөж болно).

## Дууссан шалгуур (blueprint)
"Мөнгөний урсгал хяналттай болно." → хангагдсан (атомик proof/approval/refund + админ данс).
