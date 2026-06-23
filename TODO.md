# TODO - Step-by-step checklist testing (from screenshot requirements)

## 0) Scope
- [ ] Test and verify each listed requirement one-by-one
- [ ] Track PASS/FAIL with notes
- [ ] Run build verification
- [ ] Prepare commit/push/deploy checks

---

## 1) UI compactness / “их болсон самбаруудыг багасгах”
- [ ] Check mobile layout in:
  - [ ] `RegisterPage`
  - [ ] `ProfileSetupPage`
  - [ ] `FindDriversPage` (in `DashboardWorkPages.tsx`)
  - [ ] `TripDetailPage`
- [ ] Confirm no overflow / clipped CTA / oversized spacing on mobile viewport
- [ ] Result: PASS/FAIL
- Notes:

## 2) “Аяллын үед бусдын мэдээлэл харах”
- [ ] Verify participant profile route works from booking/request cards
- [ ] Verify `ParticipantProfilePage` loads allowed public profile fields
- [ ] Confirm unauthorized/missing data message is clear
- [ ] Result: PASS/FAIL
- Notes:

## 3) “Аялагч/жолооч чиглэл дээр хүсэлт гаргах”
- [ ] Traveler can open route detail and submit seat booking request
- [ ] Driver can see incoming requests in dashboard requests page
- [ ] Status transition visibility is clear (pending/accepted/etc.)
- [ ] Result: PASS/FAIL
- Notes:

## 4) “NOF / female-only чиглэл”
- [ ] Driver can enable female-only in trip create/edit
- [ ] Female-only badge appears in list/detail
- [ ] Male/unknown users are blocked with clear message
- [ ] Service-layer guard (`createPassengerBooking`) also blocks
- [ ] Result: PASS/FAIL
- Notes:

## 5) “Аялагч, жолооч, дайвар ачаа user info/flows”
- [ ] Traveler dashboard renders booking summaries correctly
- [ ] Driver dashboard renders trips/requests/verification state correctly
- [ ] Cargo flow pages render and actions show expected statuses
- [ ] Result: PASS/FAIL
- Notes:

## 6) “Эмэгтэй/эрэгтэй ялгалттай горим”
- [ ] Gender-based booking behavior verified end-to-end
- [ ] Mongolian and English gender values handled correctly
- [ ] Result: PASS/FAIL
- Notes:

## 7) “Жолооч баталгаажуулалт, мэдээллийн ойлгомж”
- [ ] Driver onboarding messaging is clear for required docs and verification state
- [ ] Dashboard verification CTA links work and are consistent
- [ ] Result: PASS/FAIL
- Notes:

## 8) “Ойлгомжтой болгож хэрэглэгчийн тав тух”
- [ ] Error messages are actionable
- [ ] Empty states guide next action
- [ ] Primary actions are discoverable on mobile + desktop
- [ ] Result: PASS/FAIL
- Notes:

## 9) “Суудал сонголт mobile дээр жигд”
- [ ] SeatPicker renders compactly on mobile
- [ ] Seat selection interaction is usable (tap targets, readability)
- [ ] Desktop spacing remains unchanged
- [ ] Result: PASS/FAIL
- Notes:

---

## Build/Test verification
- [ ] Run install (if needed)
- [ ] Run project build
- [ ] Record build result
- Notes:

## Git/Deploy
- [x] Create branch `blackboxai/checklist-step-by-step`
- [ ] Commit tested updates
- [ ] Push branch
- [ ] Check Supabase project config presence (folder/config/env)
- [ ] Trigger/confirm Vercel deployment path
- Notes:
