-- ---------------------------------------------------------------------------
-- 202606130002_complete_cargo_onboarding
--
-- The frontend (completeCargoOnboarding) calls the complete_cargo_onboarding
-- RPC when a cargo sender accepts the cargo rules. The original migration that
-- held this function (202606120002) shipped empty, so the function was missing
-- and the cargo onboarding step failed with "Мэдээлэл хадгалахад алдаа гарлаа".
--
-- Mirrors complete_traveler_onboarding: sets role = cargo_sender, marks the
-- cargo policy accepted and onboarding completed, self-heals a missing profile.
-- ---------------------------------------------------------------------------

create or replace function public.complete_cargo_onboarding()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  auth_user auth.users%rowtype;
  profile_row public.profiles%rowtype;
  metadata_role text;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select * into auth_user from auth.users where id = current_user_id;
  if auth_user.id is null then
    raise exception 'auth_user_not_found';
  end if;

  metadata_role := auth_user.raw_user_meta_data->>'role';

  select * into profile_row
  from public.profiles
  where id = current_user_id
  for update;

  if profile_row.id is null then
    if metadata_role <> 'cargo_sender' then
      raise exception 'cargo_role_required';
    end if;

    insert into public.profiles (
      id, role, full_name, phone, email, onboarding_completed, cargo_policy_accepted
    )
    values (
      auth_user.id,
      'cargo_sender',
      coalesce(
        nullif(auth_user.raw_user_meta_data->>'full_name', ''),
        split_part(coalesce(auth_user.email, ''), '@', 1)
      ),
      coalesce(nullif(auth_user.raw_user_meta_data->>'phone', ''), auth_user.phone),
      auth_user.email,
      true,
      true
    )
    returning * into profile_row;
  else
    if profile_row.role <> 'cargo_sender' then
      if profile_row.role = 'admin'
        or profile_row.onboarding_completed
        or metadata_role <> 'cargo_sender'
      then
        raise exception 'cargo_role_required';
      end if;
    end if;

    if profile_row.is_suspended then
      raise exception 'account_suspended';
    end if;

    update public.profiles
    set role = 'cargo_sender',
        cargo_policy_accepted = true,
        onboarding_completed = true,
        updated_at = now()
    where id = current_user_id
    returning * into profile_row;
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

revoke all on function public.complete_cargo_onboarding() from public;
grant execute on function public.complete_cargo_onboarding() to authenticated;
