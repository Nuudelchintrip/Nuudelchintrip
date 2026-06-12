-- NuudelchinTrip Backend V2 - Step 1
-- Auth user -> public profile synchronization.
-- Run once in a NEW Supabase project.

do $$
begin
  create type public.user_role as enum ('traveler', 'driver', 'cargo_sender', 'admin');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'traveler',
  full_name text not null default '',
  phone text,
  email text,
  phone_verified boolean not null default false,
  onboarding_completed boolean not null default false,
  cargo_policy_accepted boolean not null default false,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.user_role;
begin
  requested_role := case new.raw_user_meta_data->>'role'
    when 'driver' then 'driver'::public.user_role
    when 'cargo_sender' then 'cargo_sender'::public.user_role
    else 'traveler'::public.user_role
  end;

  insert into public.profiles (id, role, full_name, phone, email)
  values (
    new.id,
    requested_role,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(nullif(new.raw_user_meta_data->>'phone', ''), new.phone),
    new.email
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.sync_current_profile()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user auth.users%rowtype;
  profile_row public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select * into current_user
  from auth.users
  where id = auth.uid();

  if current_user.id is null then
    raise exception 'auth_user_not_found';
  end if;

  insert into public.profiles (id, role, full_name, phone, email)
  values (
    current_user.id,
    case current_user.raw_user_meta_data->>'role'
      when 'driver' then 'driver'::public.user_role
      when 'cargo_sender' then 'cargo_sender'::public.user_role
      else 'traveler'::public.user_role
    end,
    coalesce(
      nullif(current_user.raw_user_meta_data->>'full_name', ''),
      split_part(coalesce(current_user.email, ''), '@', 1)
    ),
    coalesce(nullif(current_user.raw_user_meta_data->>'phone', ''), current_user.phone),
    current_user.email
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now()
  returning * into profile_row;

  if profile_row.is_suspended then
    raise exception 'account_suspended';
  end if;

  return jsonb_build_object(
    'role', profile_row.role,
    'full_name', profile_row.full_name,
    'phone', profile_row.phone,
    'email', profile_row.email,
    'phone_verified', profile_row.phone_verified,
    'onboarding_completed', profile_row.onboarding_completed,
    'cargo_policy_accepted', profile_row.cargo_policy_accepted,
    'verification_status', null
  );
end;
$$;

revoke all on function public.sync_current_profile() from public, anon;
grant execute on function public.sync_current_profile() to authenticated;

-- Rollback (run separately only if this step must be removed):
-- drop trigger if exists on_auth_user_created on auth.users;
-- drop function if exists public.handle_new_user();
-- drop function if exists public.sync_current_profile();
-- drop table if exists public.profiles;
-- drop type if exists public.user_role;
