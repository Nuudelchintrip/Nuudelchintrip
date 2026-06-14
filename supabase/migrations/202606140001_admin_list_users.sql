-- Admin-only user list used by /admin/users.

create or replace function public.admin_list_users()
returns table (
  id uuid,
  full_name text,
  phone text,
  email text,
  role public.user_role,
  phone_verified boolean,
  onboarding_completed boolean,
  is_suspended boolean,
  created_at timestamptz
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
    p.id,
    p.full_name,
    p.phone,
    p.email,
    p.role,
    p.phone_verified,
    p.onboarding_completed,
    p.is_suspended,
    p.created_at
  from public.profiles p
  order by p.created_at desc
  limit 500;
end;
$$;

revoke all on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;
