-- Update auth profile trigger to persist phone from Supabase Auth metadata.
-- Safe to run multiple times.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.user_role;
begin
  begin
    requested_role := coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'traveler');
  exception when others then
    requested_role := 'traveler';
  end;

  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone',
    requested_role
  )
  on conflict (id) do update
    set email = excluded.email,
        phone = coalesce(public.profiles.phone, excluded.phone),
        full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
        role = public.profiles.role,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
