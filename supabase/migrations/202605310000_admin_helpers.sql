-- Run this first if SQL Editor says: function public.is_admin() does not exist.
-- It is safe to run multiple times.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and is_suspended = false
  );
$$;

create or replace function public.can_create_trip()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.driver_profiles d on d.user_id = p.id
    where p.id = auth.uid()
      and p.role = 'driver'
      and p.phone_verified = true
      and p.onboarding_completed = true
      and p.is_suspended = false
      and d.verification_status = 'approved'
  );
$$;
