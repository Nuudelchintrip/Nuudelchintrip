import { supabase } from '../lib/supabase';
import { safeUploadFileName, validateUploadFile } from '../utils/fileValidation';
import {
  clearStoredUser,
  getStoredUser,
  saveStoredUser,
  updateStoredUser,
  type DriverVerificationStatus,
  type MarketplaceRole,
  type MockUserProfile,
} from '../utils/auth';

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

async function syncCurrentProfileFromSupabase(fallbackEmail = '') {
  if (!supabase) return getStoredUser();

  const { data, error } = await supabase.rpc('sync_current_profile');
  if (error) {
    throw toError(error, 'Хэрэглэгчийн мэдээллийг Supabase-тэй синк хийхэд алдаа гарлаа.');
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Supabase profile sync хоосон хариу буцаалаа.');
  }

  const profile = toLocalProfile(data as ProfileRow, fallbackEmail);
  saveStoredUser(profile);
  return profile;
}

export type RegisterResult =
  | { status: 'active'; profile: MockUserProfile }
  | { status: 'email_confirmation_pending'; email: string };

export async function registerWithSupabase(input: RegisterInput): Promise<RegisterResult> {
  if (!supabase) throw new Error('Supabase env тохируулагдаагүй байна.');

  clearStoredUser();
  const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
  if (signOutError) throw signOutError;

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
  if (!data.user || data.user.identities?.length === 0) {
    throw new Error('Энэ и-мэйл хаяг өмнө нь бүртгэгдсэн байна. Нэвтрэх хэсгийг ашиглана уу.');
  }

  // When "Confirm email" is enabled (production), signUp returns no session until
  // the user clicks the link in their inbox. Surface that as a pending state
  // instead of an error so the flow works with email confirmation on.
  if (!data.session) {
    return { status: 'email_confirmation_pending', email: input.email };
  }

  const localProfile = await syncCurrentProfileFromSupabase(input.email);
  if (!localProfile || localProfile.role !== input.role) {
    throw new Error('Сонгосон хэрэглэгчийн төрөл хадгалагдсангүй. Бүртгэлийг дахин оролдоно уу.');
  }

  return { status: 'active', profile: localProfile };
}

export async function loginWithSupabase(email: string, password: string) {
  if (!supabase) throw new Error('Supabase env тохируулагдаагүй байна.');

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  return syncCurrentProfileFromSupabase(data.user.email || email);
}

export async function sendPasswordResetEmail(email: string) {
  if (!supabase) throw new Error('Supabase env тохируулагдаагүй байна.');

  const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const siteOrigin = isLocalhost ? window.location.origin : 'https://nuudelchintrip.com';

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteOrigin}/reset-password`,
  });

  if (error) throw error;
}

export async function updatePasswordWithRecovery(newPassword: string) {
  if (!supabase) throw new Error('Supabase env тохируулагдаагүй байна.');

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

/** Change password while logged in: verifies the current password, then updates. */
export async function updateProfileInfo(input: { fullName?: string; avatarUrl?: string }) {
  if (!supabase) return updateStoredUser({ full_name: input.fullName });

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('Нэвтрэлтийн хугацаа дууссан байна. Дахин нэвтэрнэ үү.');

  const patch: Record<string, unknown> = {};
  if (input.fullName !== undefined) patch.full_name = input.fullName.trim();
  if (input.avatarUrl !== undefined) patch.avatar_url = input.avatarUrl;
  if (Object.keys(patch).length === 0) return getStoredUser();

  const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (error) throw toError(error, 'Профайл хадгалахад алдаа гарлаа.');

  return syncCurrentProfileFromSupabase(sessionData.session?.user.email || '');
}

export async function uploadAvatar(file: File): Promise<string> {
  if (!supabase) throw new Error('Supabase env тохируулагдаагүй байна.');

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('Дахин нэвтэрнэ үү.');

  validateUploadFile(file, {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    maxBytes: 5 * 1024 * 1024,
    typeError: 'Зөвхөн JPG, PNG, WEBP зураг оруулна уу.',
    sizeError: 'Зургийн хэмжээ 5MB-аас бага байх ёстой.',
  });

  const path = `${userId}/${Date.now()}-${safeUploadFileName(file.name, 'avatar')}`;
  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
  if (uploadError) throw toError(uploadError, 'Зураг upload хийхэд алдаа гарлаа.');

  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

export async function fetchMyAvatarUrl(): Promise<string | null> {
  if (!supabase) return null;
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return null;
  const { data } = await supabase.from('profiles').select('avatar_url').eq('id', userId).maybeSingle();
  return (data?.avatar_url as string) || null;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  if (!supabase) throw new Error('Supabase env тохируулагдаагүй байна.');

  const { data: sessionData } = await supabase.auth.getSession();
  const email = sessionData.session?.user.email;
  if (!email) throw new Error('Нэвтрэлтийн хугацаа дууссан байна. Дахин нэвтэрнэ үү.');

  // Verify the current password by re-authenticating.
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
  if (signInError) throw new Error('Одоогийн нууц үг буруу байна.');

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw toError(error, 'Нууц үг шинэчлэхэд алдаа гарлаа.');
}

export async function refreshLocalProfileFromSupabase() {
  if (!supabase) return getStoredUser();

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  if (!sessionData.session) {
    clearStoredUser();
    return null;
  }

  return syncCurrentProfileFromSupabase(sessionData.session.user.email || '');
}

export async function logoutFromSupabase() {
  clearStoredUser();
  if (!supabase) return;

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

const OTP_ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: 'Нэвтрэлтийн хугацаа дууссан байна. Дахин нэвтэрнэ үү.',
  phone_required: 'Утасны дугаараа оруулна уу.',
  otp_rate_limited: 'Дахин код авахын тулд түр хүлээнэ үү.',
  otp_hourly_limit: 'Хэт олон код хүслээ. 1 цагийн дараа дахин оролдоно уу.',
  otp_invalid: 'Код буруу байна. 6 оронтой кодоо шалгаад дахин оруулна уу.',
  otp_expired: 'Кодын хугацаа дууссан байна. Дахин код авна уу.',
  otp_not_found: 'Идэвхтэй код олдсонгүй. Дахин код авна уу.',
  otp_not_found_or_expired: 'Кодын хугацаа дууссан байна. Дахин код авна уу.',
  otp_too_many_attempts: 'Хэт олон удаа буруу оруулсан байна. Дахин код авна уу.',
  sms_send_failed: 'Мессеж илгээхэд алдаа гарлаа. Дугаараа шалгаад дахин оролдоно уу.',
  auth_user_not_found: 'Нэвтэрсэн хэрэглэгчийн бүртгэл олдсонгүй.',
};

function mapOtpError(error: { message?: string } | null, fallback: string) {
  const known = Object.entries(OTP_ERROR_MESSAGES).find(([code]) => error?.message?.includes(code));
  return known ? new Error(known[1]) : toError(error, fallback);
}

export interface RequestOtpResult {
  resendAfterSeconds: number;
  expiresInSeconds: number;
  /** Present only during local development. */
  devCode: string | null;
}

async function requestOtpViaRpc(phone: string): Promise<RequestOtpResult> {
  const { data, error } = await supabase!.rpc('request_phone_otp', { p_phone: phone });
  if (error) throw mapOtpError(error, 'OTP код илгээхэд алдаа гарлаа.');
  const row = (data || {}) as { resend_after_seconds?: number; expires_in_seconds?: number; dev_code?: string | null };
  return {
    resendAfterSeconds: row.resend_after_seconds ?? 60,
    expiresInSeconds: row.expires_in_seconds ?? 300,
    devCode: row.dev_code ?? null,
  };
}

export async function requestPhoneOtp(phone: string): Promise<RequestOtpResult> {
  if (!supabase) {
    if (import.meta.env.DEV && import.meta.env.VITE_ALLOW_OTP_DEV_FALLBACK === 'true') {
      return { resendAfterSeconds: 60, expiresInSeconds: 300, devCode: '123456' };
    }
    throw new Error('Утас баталгаажуулах үйлчилгээ тохируулагдаагүй байна.');
  }

  // Production: the send-otp edge function generates the code and delivers it by SMS.
  const fnName = (import.meta.env.VITE_OTP_FUNCTION as string | undefined) || 'send-otp';
  const { data, error } = await supabase.functions.invoke(fnName, { body: { phone } });

  if (!error && data?.ok) {
    return {
      resendAfterSeconds: data.resend_after_seconds ?? 60,
      expiresInSeconds: data.expires_in_seconds ?? 300,
      devCode: null,
    };
  }

  if (error) {
    // If the function ran but returned a known OTP error, surface it (no fallback).
    let payload: { error?: string } | null = null;
    try {
      payload = await (error as { context?: { json?: () => Promise<{ error?: string }> } }).context?.json?.() ?? null;
    } catch {
      payload = null;
    }
    if (payload?.error && OTP_ERROR_MESSAGES[payload.error]) {
      throw new Error(OTP_ERROR_MESSAGES[payload.error]);
    }
    return requestOtpViaRpc(phone);
  }

  return requestOtpViaRpc(phone);
}

export async function verifyPhoneOtp(phone: string, code: string) {
  if (!supabase) {
    if (!import.meta.env.DEV || import.meta.env.VITE_ALLOW_OTP_DEV_FALLBACK !== 'true') {
      throw new Error('Утас баталгаажуулах үйлчилгээ тохируулагдаагүй байна.');
    }
    if (code !== '123456') throw new Error(OTP_ERROR_MESSAGES.otp_invalid);
    return updateStoredUser({ phone_verified: true });
  }

  const fnName = (import.meta.env.VITE_VERIFY_OTP_FUNCTION as string | undefined) || 'verify-otp';
  const { data, error } = await supabase.functions.invoke(fnName, { body: { phone, code } });

  if (error || !(data as { ok?: boolean })?.ok) {
    let payload: { error?: string } | null =
      data && typeof data === 'object' ? (data as { error?: string }) : null;
    if (error) {
      try {
        payload = (await (error as { context?: { json?: () => Promise<{ error?: string }> } }).context?.json?.()) ?? null;
      } catch {
        payload = null;
      }
    }
    const known = payload?.error ? OTP_ERROR_MESSAGES[payload.error] : undefined;
    throw new Error(known || 'Утасны баталгаажуулалт амжилтгүй боллоо.');
  }

  return updateStoredUser({ phone_verified: true });
}

export async function completeTravelerOnboarding(input: {
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}) {
  if (supabase) {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw toError(sessionError, 'Нэвтрэлтийн мэдээллийг шалгахад алдаа гарлаа.');
    }
    const userId = sessionData.session?.user.id;
    if (!userId) throw new Error('Нэвтрэлтийн хугацаа дууссан байна. Дахин нэвтэрнэ үү.');

    const { data, error } = await supabase.rpc('complete_traveler_onboarding', {
      p_emergency_contact_name: input.emergencyContactName?.trim() || null,
      p_emergency_contact_phone: input.emergencyContactPhone?.trim() || null,
    });
    if (error) {
      const messageByCode: Record<string, string> = {
        not_authenticated: 'Нэвтрэлтийн хугацаа дууссан байна. Дахин нэвтэрнэ үү.',
        auth_user_not_found: 'Нэвтэрсэн хэрэглэгчийн бүртгэл олдсонгүй.',
        traveler_role_required: 'Энэ бүртгэл аялагчийн эрхгүй байна.',
        account_suspended: 'Таны бүртгэл түр түдгэлзсэн байна.',
      };
      const knownMessage = Object.entries(messageByCode).find(([code]) =>
        error.message?.includes(code),
      )?.[1];
      throw knownMessage
        ? new Error(knownMessage)
        : toError(error, 'Аялагчийн мэдээллийг хадгалахад алдаа гарлаа.');
    }

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('Аялагчийн мэдээлэл хадгалсан хариу буруу байна.');
    }

    const profile = toLocalProfile(data as ProfileRow, sessionData.session?.user.email || '');
    saveStoredUser(profile);
    return profile;
  }

  return updateStoredUser({ role: 'traveler', onboarding_completed: true });
}

export type DriverDocumentKind = 'driver_license' | 'vehicle_certificate' | 'vehicle_photo';

/** Upload one driver document to the private driver-documents bucket; returns the stored path. */
export async function uploadDriverDocument(file: File, kind: DriverDocumentKind): Promise<string> {
  if (!supabase) throw new Error('Supabase env тохируулагдаагүй байна.');

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('Нэвтрэлтийн хугацаа дууссан байна. Дахин нэвтэрнэ үү.');

  validateUploadFile(file, {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.pdf'],
    maxBytes: 10 * 1024 * 1024,
    typeError: 'Зөвхөн JPG, PNG, WEBP, PDF файл оруулна уу.',
    sizeError: 'Файлын хэмжээ 10MB-аас бага байх ёстой.',
  });

  const path = `${userId}/${kind}/${Date.now()}-${safeUploadFileName(file.name, kind)}`;
  const { error: uploadError } = await supabase.storage
    .from('driver-documents')
    .upload(path, file, { cacheControl: '3600', upsert: true });

  if (uploadError) throw toError(uploadError, 'Бичиг баримт upload хийхэд алдаа гарлаа.');
  return `driver-documents/${path}`;
}

export async function submitDriverOnboarding(input: {
  carModel?: string;
  plateNumber?: string;
  seats?: number;
  driverLicenseUrl?: string;
  vehicleCertificateUrl?: string;
  vehiclePhotoUrl?: string;
}) {
  if (supabase) {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw toError(sessionError, 'Нэвтрэлтийн мэдээллийг шалгахад алдаа гарлаа.');
    }
    const userId = sessionData.session?.user.id;
    if (!userId) throw new Error('Нэвтрэлтийн хугацаа дууссан байна. Дахин нэвтэрнэ үү.');

    const { error: onboardingError } = await supabase.rpc('submit_driver_onboarding', {
      p_car_model: input.carModel?.trim() || null,
      p_plate_number: input.plateNumber?.trim() || null,
      p_seats: input.seats ?? null,
      p_driver_license_url: input.driverLicenseUrl?.trim() || null,
      p_vehicle_certificate_url: input.vehicleCertificateUrl?.trim() || null,
      p_vehicle_photo_url: input.vehiclePhotoUrl?.trim() || null,
    });
    if (onboardingError) {
      const messageByCode: Record<string, string> = {
        not_authenticated: 'Нэвтрэлтийн хугацаа дууссан байна. Дахин нэвтэрнэ үү.',
        auth_user_not_found: 'Нэвтэрсэн хэрэглэгчийн бүртгэл олдсонгүй.',
        profile_not_found: 'Таны хэрэглэгчийн profile олдсонгүй.',
        driver_role_required: 'Энэ бүртгэл жолоочийн эрхгүй байна.',
        account_suspended: 'Таны бүртгэл түр түдгэлзсэн байна.',
        car_model_required: 'Машины загварыг оруулна уу.',
        plate_number_required: 'Улсын дугаарыг оруулна уу.',
        invalid_seat_count: 'Суудлын тоо 1-12 хооронд байх ёстой.',
        driver_license_required: 'Жолооны үнэмлэхний зургийг оруулна уу.',
        vehicle_certificate_required: 'Машины гэрчилгээний зургийг оруулна уу.',
        vehicle_photo_required: 'Машины зургийг оруулна уу.',
      };
      const knownMessage = Object.entries(messageByCode).find(([code]) =>
        onboardingError.message?.includes(code),
      )?.[1];

      throw knownMessage
        ? new Error(knownMessage)
        : toError(onboardingError, 'Жолоочийн мэдээллийг хадгалахад алдаа гарлаа.');
    }

    return syncCurrentProfileFromSupabase(sessionData.session?.user.email || '');
  }

  return updateStoredUser({ role: 'driver', onboarding_completed: true, verification_status: 'pending' });
}

/** Update the signed-in user's display name (full_name is not a guarded field). */
export async function updateProfileName(fullName: string) {
  const trimmed = fullName.trim();
  if (!trimmed) throw new Error('Нэрээ оруулна уу.');

  if (!supabase) return updateStoredUser({ full_name: trimmed });

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('Нэвтрэлтийн хугацаа дууссан байна. Дахин нэвтэрнэ үү.');

  const { error } = await supabase.from('profiles').update({ full_name: trimmed }).eq('id', userId);
  if (error) throw toError(error, 'Нэр хадгалахад алдаа гарлаа.');
  updateStoredUser({ full_name: trimmed });
}

export interface MyDriverVerification {
  status: DriverVerificationStatus;
  rejectionReason?: string;
  reviewedAt?: string;
}

/** Fetch the signed-in driver's own verification status + rejection reason. */
export async function fetchMyDriverVerification(): Promise<MyDriverVerification | null> {
  if (!supabase) return null;

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from('driver_profiles')
    .select('verification_status, rejection_reason, reviewed_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    status: data.verification_status as DriverVerificationStatus,
    rejectionReason: data.rejection_reason || undefined,
    reviewedAt: data.reviewed_at || undefined,
  };
}

export async function completeCargoOnboarding() {
  if (supabase) {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) throw new Error('Нэвтрэлтийн хугацаа дууссан байна.');
    const { error } = await supabase.rpc('complete_cargo_onboarding');
    if (error) throw error;
    return syncCurrentProfileFromSupabase(sessionData.session?.user.email || '');
  }

  return updateStoredUser({ role: 'cargo_sender', onboarding_completed: true, cargo_policy_accepted: true });
}
