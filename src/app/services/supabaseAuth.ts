import { supabase } from '../lib/supabase';
import { getStoredUser, saveStoredUser, updateStoredUser, type DriverVerificationStatus, type MarketplaceRole, type MockUserProfile } from '../utils/auth';

interface RegisterInput {
  role: MarketplaceRole;
  fullName: string;
  phone: string;
  email: string;
  password: string;
}

type ProfileRow = {
  role: MarketplaceRole;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  phone_verified: boolean;
  onboarding_completed: boolean;
  verification_status?: DriverVerificationStatus;
  cargo_policy_accepted: boolean;
};

function toError(error: unknown, fallback: string) {
  if (error instanceof Error) return error;
  if (error && typeof error === 'object') {
    const record = error as { message?: string; details?: string; hint?: string; code?: string };
    const parts = [record.message, record.details, record.hint, record.code ? `code: ${record.code}` : undefined].filter(Boolean);
    if (parts.length) return new Error(parts.join(' | '));
  }
  return new Error(fallback);
}

function toLocalProfile(row: ProfileRow, fallbackEmail = ''): MockUserProfile {
  return {
    role: row.role,
    full_name: row.full_name || '',
    phone: row.phone || '',
    email: row.email || fallbackEmail,
    phone_verified: row.phone_verified,
    onboarding_completed: row.onboarding_completed,
    verification_status: row.verification_status,
    cargo_policy_accepted: row.cargo_policy_accepted,
  };
}

export async function registerWithSupabase(input: RegisterInput) {
  if (!supabase) throw new Error('Supabase env тохируулагдаагүй байна.');

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/verify-phone`,
      data: {
        role: input.role,
        full_name: input.fullName,
        phone: input.phone,
      },
    },
  });

  if (error) throw error;

  const localProfile: MockUserProfile = {
    role: input.role,
    full_name: input.fullName,
    phone: input.phone,
    email: input.email,
    phone_verified: false,
    onboarding_completed: false,
    verification_status: input.role === 'driver' ? 'pending' : undefined,
    cargo_policy_accepted: input.role === 'cargo_sender' ? false : undefined,
  };
  saveStoredUser(localProfile);

  if (data.session) {
    await supabase
      .from('profiles')
      .update({
        role: input.role,
        full_name: input.fullName,
        phone: input.phone,
        email: input.email,
        phone_verified: false,
        onboarding_completed: false,
        cargo_policy_accepted: input.role === 'cargo_sender' ? false : undefined,
      })
      .eq('id', data.user?.id);
  }

  return localProfile;
}

export async function loginWithSupabase(email: string, password: string) {
  if (!supabase) throw new Error('Supabase env тохируулагдаагүй байна.');

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  await supabase.rpc('ensure_current_profile');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name, phone, email, phone_verified, onboarding_completed, cargo_policy_accepted')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profileError) throw toError(profileError, 'Profile мэдээлэл уншихад алдаа гарлаа.');
  if (!profile) {
    throw new Error('Auth login амжилттай боловч profiles мөр олдсонгүй. Supabase SQL дээр ensure_current_profile migration ажиллуулна уу.');
  }

  let verificationStatus: ProfileRow['verification_status'];
  if (profile.role === 'driver') {
    const { data: driverProfile } = await supabase
      .from('driver_profiles')
      .select('verification_status')
      .eq('user_id', data.user.id)
      .maybeSingle();
    verificationStatus = driverProfile?.verification_status;
  }

  const localProfile = toLocalProfile({ ...profile, verification_status: verificationStatus }, email);
  saveStoredUser(localProfile);
  return localProfile;
}

export async function sendPasswordResetEmail(email: string) {
  if (!supabase) throw new Error('Supabase env тохируулагдаагүй байна.');

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;
}

export async function updatePasswordWithRecovery(newPassword: string) {
  if (!supabase) throw new Error('Supabase env тохируулагдаагүй байна.');

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function refreshLocalProfileFromSupabase() {
  if (!supabase) return getStoredUser();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const userId = userData.user?.id;
  if (!userId) return getStoredUser();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name, phone, email, phone_verified, onboarding_completed, cargo_policy_accepted')
    .eq('id', userId)
    .single();

  if (profileError) throw profileError;

  let verificationStatus: ProfileRow['verification_status'];
  if (profile.role === 'driver') {
    const { data: driverProfile, error: driverError } = await supabase
      .from('driver_profiles')
      .select('verification_status')
      .eq('user_id', userId)
      .maybeSingle();

    if (driverError) throw driverError;
    verificationStatus = driverProfile?.verification_status;
  }

  const localProfile = toLocalProfile(
    { ...profile, verification_status: verificationStatus },
    userData.user.email || '',
  );
  saveStoredUser(localProfile);
  return localProfile;
}

export async function markPhoneVerified() {
  if (!supabase) return updateStoredUser({ phone_verified: true });

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (userId) {
    await supabase.from('profiles').update({ phone_verified: true }).eq('id', userId);
  }

  return updateStoredUser({ phone_verified: true });
}

export async function completeTravelerOnboarding(input: {
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}) {
  if (supabase) {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (userId) {
      await supabase
        .from('profiles')
        .update({
          emergency_contact_name: input.emergencyContactName,
          emergency_contact_phone: input.emergencyContactPhone,
          onboarding_completed: true,
        })
        .eq('id', userId);
    }
  }

  return updateStoredUser({ role: 'traveler', onboarding_completed: true });
}

export async function submitDriverOnboarding(input: {
  carModel?: string;
  plateNumber?: string;
  seats?: number;
}) {
  if (supabase) {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (userId) {
      await supabase.from('driver_profiles').upsert({
        user_id: userId,
        verification_status: 'pending',
        car_model: input.carModel,
        plate_number: input.plateNumber,
        seats: input.seats,
      });
      await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', userId);
    }
  }

  return updateStoredUser({ role: 'driver', onboarding_completed: true, verification_status: 'pending' });
}

export async function completeCargoOnboarding() {
  if (supabase) {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (userId) {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true, cargo_policy_accepted: true })
        .eq('id', userId);
    }
  }

  return updateStoredUser({ role: 'cargo_sender', onboarding_completed: true, cargo_policy_accepted: true });
}
