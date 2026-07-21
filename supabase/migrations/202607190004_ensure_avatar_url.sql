-- Fix: traveler onboarding failed with
--   "Could not find the 'avatar_url' column of 'profiles' in the schema cache (PGRST204)"
-- because this deployment's profiles table is missing avatar_url. Add it
-- defensively and reload the PostgREST schema cache.
--
-- Apply manually in Supabase SQL Editor.

alter table public.profiles
  add column if not exists avatar_url text;

-- Ask PostgREST to refresh its cached schema so the new column is usable now.
notify pgrst, 'reload schema';
