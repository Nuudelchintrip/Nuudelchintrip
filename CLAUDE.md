# NuudelchinTrip (Нүүдэлчин Trip)

Mongolian nomad-themed ride-sharing + cargo marketplace. Connects travelers,
drivers, and cargo senders on intercity & rural routes.

## Stack
- React + Vite + TypeScript
- Tailwind CSS v4 (CSS-variable theming in `src/styles/theme.css`; light = warm
  steppe tones, dark = premium true-black). Use existing tokens, don't invent.
- Supabase (auth, Postgres, storage). RLS + SECURITY DEFINER RPCs.
- Deployed from `main` → **Vercel** (`vercel.json`). Live domain: nuudelchintrip.com
  (`netlify.toml` also present but unused). Frontend changes need a push to deploy.
- DB migrations live in `supabase/migrations/` and are applied **manually via the
  Supabase SQL Editor** (no CLI link). Each fix = a new dated `.sql` file.
- Identity verification: e-Mongolia / DAN (government ID).

## Folder layout (real)
- `src/app/components/` — UI components
- `src/app/pages/` — route-level views
- `src/app/services/` — all Supabase data calls (per-domain: tripService,
  paymentService, adminService, supabaseAuth, …)
- `src/app/lib/` — Supabase client (`supabase.ts`)
- `src/app/navigation/` — role dashboard menus
- `src/app/utils/` — auth/helpers (`getStoredUser`, paths, …)
- `src/app/data/` — static data (seats, locations)

## Domain rules (ЭНИЙГ САЙН УНШ)
**Roles:** `traveler` | `driver` | `cargo_sender` | `admin`. UI is role-aware —
render only what the active role can see/do.

**Booking state machine** (DB enum `booking_status`, transitions enforced by
`booking_transition_allowed`): `pending_request → accepted → waiting_payment →
payment_review → confirmed → on_trip → completed`; plus `rejected`, `cancelled`,
`disputed`. Cargo has its own `cargo_status` flow. Never skip states.

**Proof uploads:** separate types per stage (payment proof vs pickup vs delivery
proof). Don't merge them into one generic upload.

**Delivery code:** cargo delivery confirmed via a code. Keep that flow intact
when touching booking/cargo code.

**Verified users:** some actions are gated to phone-verified / approved-driver /
e-Mongolia-verified users. Don't remove verification gates.

## Dashboard (role-specific, NOT a landing/intro page)
A working data view, not marketing. Each role lands on a tailored dashboard with
THEIR real Supabase data. Premium feel — clean cards, real metrics, clear
hierarchy. No generic hero/onboarding fluff.

- **Cargo sender:** their shipments — active cargo with status, history, delivery
  codes, pickup/delivery proofs. Quick "send new cargo" action.
- **Traveler:** their trips — upcoming & past bookings, status, route, driver
  info. Quick "book a trip" action.
- **Driver:** their driving activity — trips driven, stats, earnings, and
  incoming requests to accept. Can create/edit/delete their own routes.

Shared: pull live data from Supabase (no placeholder/mock in real dashboards),
respect the state machine for status display, show only the active role's view.

## Conventions
- TypeScript — type everything, avoid `any`.
- All DB calls go through `src/app/services/*` (which use `src/app/lib/supabase`),
  never inline in components.
- Tailwind only, no inline styles. Use existing color tokens.
- **All user-facing UI text is Mongolian (Cyrillic). No English in the UI.**
  Never break Mongolian font rendering. Raw Postgres errors shown to users should
  be mapped to Mongolian before launch.
- Keep components role-aware; don't hardcode for a single role.

## How to work with me (TOKEN ХЭМНЭХ)
- Touch ONLY the files I name. Don't scan the whole repo.
- For multi-step / risky changes, propose a plan first (I'll review before code).
- Don't read `node_modules`, `dist`, `.netlify`, build output.
- Don't re-explain React/Tailwind/Supabase basics — I know them.
- After a task, summarize what changed in 2-3 lines, no full file dumps.
- Verify backend flows before frontend polish; deploy (push) so changes go live.
