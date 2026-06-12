-- Driver payouts + platform commission.
--
-- Model: the traveler pays the fare (booking total_amount). The platform keeps a
-- commission (default 10%) and the driver is owed the rest (90%). Payouts are made
-- manually by an admin (bank transfer) and recorded in driver_payouts.

insert into public.app_settings (key, value)
values ('commission_percent', '10')
on conflict (key) do nothing;

create table if not exists public.driver_payouts (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null check (amount > 0),
  note text,
  paid_by uuid references public.profiles(id),
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_driver_payouts_driver on public.driver_payouts (driver_id, paid_at desc);

alter table public.driver_payouts enable row level security;

drop policy if exists "payouts read own or admin" on public.driver_payouts;
create policy "payouts read own or admin" on public.driver_payouts
for select using (driver_id = auth.uid() or public.is_admin());

drop policy if exists "payouts insert admin" on public.driver_payouts;
create policy "payouts insert admin" on public.driver_payouts
for insert with check (public.is_admin());

-- Admin records a payout to a driver.
create or replace function public.record_driver_payout(p_driver_id uuid, p_amount integer, p_note text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then raise exception 'admin_required'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'invalid_amount'; end if;

  insert into public.driver_payouts (driver_id, amount, note, paid_by)
  values (p_driver_id, p_amount, nullif(btrim(coalesce(p_note, '')), ''), auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.record_driver_payout(uuid, integer, text) from public;
grant execute on function public.record_driver_payout(uuid, integer, text) to authenticated;
