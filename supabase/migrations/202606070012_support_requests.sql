-- Support requests: public support form saved to DB + surfaced to admins.

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  name text,
  phone text,
  booking_ref text,
  category text,
  message text not null,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved')),
  created_at timestamptz not null default now()
);

create index if not exists idx_support_requests_status on public.support_requests (status, created_at desc);

alter table public.support_requests enable row level security;

-- Anyone (even logged-out visitors) may submit a support request, but cannot
-- spoof another user's id.
drop policy if exists "support insert anyone" on public.support_requests;
create policy "support insert anyone" on public.support_requests
for insert to anon, authenticated
with check (user_id is null or user_id = auth.uid());

drop policy if exists "support read admin" on public.support_requests;
create policy "support read admin" on public.support_requests
for select using (public.is_admin());

drop policy if exists "support update admin" on public.support_requests;
create policy "support update admin" on public.support_requests
for update using (public.is_admin()) with check (public.is_admin());
