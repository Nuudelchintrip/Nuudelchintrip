# NuudelchinTrip frozen route map

This file is the frontend route contract for the backend/API/RLS work. Do not rename these canonical routes without updating backend handlers, Supabase RLS assumptions, and QA scripts.

## Public

| Route | Purpose |
| --- | --- |
| `/` | Public landing page: concept, role CTA, trust, how it works |
| `/how-it-works` | Public flow explanation |
| `/safety` | Trust, verification, payment proof, report/safety policy |
| `/pricing` | Service fee explanation |
| `/login` | Public alias to `/auth/login` |
| `/register` | Public alias to `/auth/register` |

## Auth and onboarding

| Route | Purpose |
| --- | --- |
| `/auth/login` | Mock login UI now, Supabase Auth later |
| `/auth/register` | Lightweight account creation with role selected |
| `/auth/verify-phone` | Phone verification step; later SMS webhook updates `phone_verified` |
| `/role-select` | Public alias to `/auth/role-select` |
| `/auth/role-select` | Role selection fallback for mock login |
| `/onboarding/traveler` | Traveler setup |
| `/onboarding/driver` | Driver verification setup |
| `/onboarding/cargo` | Cargo policy setup |

## Role redirect

| Route | Behavior |
| --- | --- |
| `/dashboard` | Redirect by role after auth, phone verification, and onboarding |
| `/dashboard` without user | Redirect to `/auth/login` |
| Traveler role | `/dashboard/traveler` |
| Driver role | `/dashboard/driver` |
| Cargo sender role | `/dashboard/cargo` |
| Admin role | `/admin` |

## Traveler

| Route | Purpose |
| --- | --- |
| `/dashboard/traveler` | Traveler overview |
| `/traveler/find-drivers` | Driver/route search after login |
| `/routes/:id` | Route detail with booking and cargo add-on CTA |
| `/bookings/:id` | Public alias for booking detail |
| `/dashboard/bookings/:id` | Booking detail and status timeline |
| `/dashboard/bookings/:id/payment-proof` | Payment proof upload placeholder |
| `/dashboard/traveler/trips` | Traveler trips |
| `/dashboard/traveler/profile` | Traveler profile |
| `/dashboard/traveler/settings` | Traveler settings |

## Driver

| Route | Purpose |
| --- | --- |
| `/dashboard/driver` | Driver overview |
| `/driver/add-route` | Canonical add route form |
| `/driver/requests` | Incoming passenger requests |
| `/driver/cargo-requests` | Incoming cargo requests |
| `/driver/earnings` | Driver earnings UI |
| `/dashboard/driver/routes` | My routes |
| `/dashboard/driver/verification` | Driver verification |
| `/dashboard/driver/profile` | Driver profile |
| `/dashboard/driver/settings` | Driver settings |

## Cargo sender

| Route | Purpose |
| --- | --- |
| `/dashboard/cargo` | Cargo sender overview |
| `/cargo/find-routes` | Cargo-enabled route search only |
| `/cargo/new` | Cargo request form |
| `/cargo/:id` | Cargo detail, timeline, delivery code |
| `/dashboard/cargo/proof` | Cargo payment/proof area |
| `/dashboard/cargo/status` | Delivery code/status area |
| `/dashboard/cargo/rules` | Cargo policy |
| `/dashboard/cargo/profile` | Cargo sender profile |
| `/dashboard/cargo/settings` | Cargo sender settings |

## Admin

| Route | Purpose |
| --- | --- |
| `/admin` | Admin overview |
| `/admin/users` | User moderation |
| `/admin/verifications` | Verification approval queue |
| `/admin/payments` | Payment proof approval queue |
| `/admin/routes` | Route moderation |
| `/admin/bookings` | Booking moderation |
| `/admin/cargo` | Cargo request moderation |
| `/admin/reports` | Reports/disputes |
| `/admin/settings` | Admin settings |

## Backend guardrails

- Frontend role guards are UX only. Backend must enforce all permissions through Supabase RLS and server-side helpers.
- Drivers can create routes only when `driver_profiles.verification_status = 'approved'`.
- Travelers can send booking requests only when `profiles.phone_verified = true`.
- Cargo requests must target `trips.allows_cargo = true`.
- Admin-only routes map to admin-only RLS policies and admin UI checks.
- Manual proof upload is the MVP payment flow; QPay/automatic payment is later.
