-- Admin: full user detail (opened from the /admin/users list).
--
-- The list RPC only returns basic columns, so admins had no way to inspect a
-- user. This returns everything an admin needs — identity fields (gender,
-- last name, register number, birth date), emergency contact, and the driver
-- profile (car, plate, seats, verification, document paths, rating, trips).
--
-- Apply manually in Supabase SQL Editor (after 202606300001 — uses the identity
-- columns).

create or replace function public.admin_get_user_detail(p_user_id uuid)
returns table (
  id uuid,
  role public.user_role,
  full_name text,
  last_name text,
  phone text,
  email text,
  phone_verified boolean,
  gender public.user_gender,
  register_number text,
  birth_date date,
  avatar_url text,
  emergency_contact_name text,
  emergency_contact_phone text,
  onboarding_completed boolean,
  is_suspended boolean,
  created_at timestamptz,
  driver_verification_status public.driver_verification_status,
  car_model text,
  plate_number text,
  seats integer,
  rating numeric,
  completed_trips integer,
  driver_license_url text,
  vehicle_certificate_url text,
  vehicle_photo_url text
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if not public.is_admin() then
    raise exception 'admin_required';
  end if;

  return query
  select
    p.id, p.role, p.full_name, p.last_name, p.phone, p.email, p.phone_verified,
    p.gender, p.register_number, p.birth_date, p.avatar_url,
    p.emergency_contact_name, p.emergency_contact_phone,
    p.onboarding_completed, p.is_suspended, p.created_at,
    dp.verification_status, dp.car_model, dp.plate_number, dp.seats,
    dp.rating, dp.completed_trips,
    dp.driver_license_url, dp.vehicle_certificate_url, dp.vehicle_photo_url
  from public.profiles p
  left join public.driver_profiles dp on dp.user_id = p.id
  where p.id = p_user_id;
end;
$$;

revoke all on function public.admin_get_user_detail(uuid) from public, anon;
grant execute on function public.admin_get_user_detail(uuid) to authenticated;
