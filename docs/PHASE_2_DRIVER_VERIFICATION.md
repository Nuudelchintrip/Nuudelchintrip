# Phase 2 — Driver verification (хэрэгжүүлэлтийн тэмдэглэл)

Blueprint Phase 2: Document upload, admin review, approve/reject. "Approved жолооч л чиглэл нийтэлнэ."

## Кодын талаас хийгдсэн зүйл

| Зүйл | Төлөв | Хаана |
|---|---|---|
| Жинхэнэ document upload (үнэмлэх, гэрчилгээ, машины зураг) — fake placeholder арилгасан | ✅ | `ProfileSetupPage.tsx`, `uploadDriverDocument` (`supabaseAuth.ts`) |
| 3 баримтыг заавал шаардах + `driver-documents` (private) bucket-д хадгалах | ✅ | `submit_driver_onboarding` (шинэ migration) |
| Admin queue дээр баримтыг signed URL-ээр харах | ✅ | `fetchAdminDriverVerifications` (`adminService.ts`), `AdminQueueRealPage.tsx` |
| Approve/Reject + татгалзах шалтгаан, reviewer/reviewed_at хадгалах | ✅ | `review_driver_verification` RPC, admin UI |
| Security guard: жолооч өөрийгөө approve хийж чадахгүй | ✅ | `guard_driver_verification_fields` trigger |
| Татгалзагдсан жолооч шалтгаанаа хараад дахин илгээх loop | ✅ | `DriverDashboard.tsx`, `fetchMyDriverVerification` |
| Approved жолооч л чиглэл нийтэлнэ (өмнө нь enforced) | ✅ | `can_create_trip()` + add-route товч disabled |

Migration: `supabase/migrations/202606070002_driver_verification.sql`

## Чи хийх ёстой
1. Migration-г Supabase SQL Editor-т ажиллуул.
2. `driver-documents` bucket аль хэдийн initial schema-д үүссэн — нэмэлт тохиргоо шаардахгүй.

## Үлдсэн known gap (дараагийн цэвэрлэгээнд)
`AccountVerificationPage` (`/dashboard/driver/verification`) нь **localStorage дээрх mock identity-verification** систем (`getIdentityRequests`/`upsertIdentityRequest`, `FileSelectBox` зөвхөн файлын нэр хадгалдаг). Энэ нь жинхэнэ `driver_profiles` системтэй холбоогүй тул "fake/placeholder UX арилгах" (P0) ажлын хүрээнд бүрэн зайлуулах/жинхэнэ систем рүү холбох ёстой. Одоогоор жолоочийн жинхэнэ урсгал нь onboarding (`/onboarding/driver`) + dashboard banner-ээр ажиллана.

## Дууссан шалгуур (blueprint)
"Approved жолооч л чиглэл нийтэлнэ." → migration apply хийсний дараа хангагдана.
