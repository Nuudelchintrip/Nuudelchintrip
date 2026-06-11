import { supabase } from '../lib/supabase';

export interface NotificationPreferences {
  bookingRequests: boolean;
  driverResponses: boolean;
  paymentUpdates: boolean;
  tripReminders: boolean;
  reviewReminders: boolean;
  cargoUpdates: boolean;
}

export interface PrivacyPreferences {
  phoneVisibility: 'accepted' | 'confirmed' | 'admin';
  requestVisibility: 'matched' | 'admin';
  reviewsPublic: boolean;
  reportsPrivate: boolean;
}

export interface AccountPreferences {
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
}

export const DEFAULT_ACCOUNT_PREFERENCES: AccountPreferences = {
  notifications: {
    bookingRequests: true,
    driverResponses: true,
    paymentUpdates: true,
    tripReminders: true,
    reviewReminders: true,
    cargoUpdates: true,
  },
  privacy: {
    phoneVisibility: 'accepted',
    requestVisibility: 'matched',
    reviewsPublic: true,
    reportsPrivate: true,
  },
};

const LOCAL_STORAGE_KEY = 'nuudelchintrip_account_preferences';

function mergePreferences(
  notifications?: Partial<NotificationPreferences> | null,
  privacy?: Partial<PrivacyPreferences> | null,
): AccountPreferences {
  return {
    notifications: {
      ...DEFAULT_ACCOUNT_PREFERENCES.notifications,
      ...(notifications || {}),
    },
    privacy: {
      ...DEFAULT_ACCOUNT_PREFERENCES.privacy,
      ...(privacy || {}),
    },
  };
}

function readLocalPreferences(): AccountPreferences {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return DEFAULT_ACCOUNT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<AccountPreferences>;
    return mergePreferences(parsed.notifications, parsed.privacy);
  } catch {
    return DEFAULT_ACCOUNT_PREFERENCES;
  }
}

function writeLocalPreferences(preferences: AccountPreferences) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(preferences));
}

function isPreferencesSchemaMissing(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === '42703'
    || error.code === 'PGRST204'
    || error.message?.includes('notification_preferences')
    || error.message?.includes('privacy_preferences')
  );
}

export async function fetchAccountPreferences(): Promise<AccountPreferences> {
  if (!supabase) return readLocalPreferences();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const userId = userData.user?.id;
  if (!userId) throw new Error('Тохиргоо харахын тулд дахин нэвтэрнэ үү.');

  const { data, error } = await supabase
    .from('profiles')
    .select('notification_preferences, privacy_preferences')
    .eq('id', userId)
    .single();

  if (error) {
    if (isPreferencesSchemaMissing(error)) return readLocalPreferences();
    throw error;
  }

  const preferences = mergePreferences(
    data.notification_preferences as Partial<NotificationPreferences> | null,
    data.privacy_preferences as Partial<PrivacyPreferences> | null,
  );
  writeLocalPreferences(preferences);
  return preferences;
}

export async function saveAccountPreferences(preferences: AccountPreferences): Promise<AccountPreferences> {
  const normalized = mergePreferences(preferences.notifications, preferences.privacy);

  if (!supabase) {
    writeLocalPreferences(normalized);
    return normalized;
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const userId = userData.user?.id;
  if (!userId) throw new Error('Тохиргоо хадгалахын тулд дахин нэвтэрнэ үү.');

  const { error } = await supabase
    .from('profiles')
    .update({
      notification_preferences: normalized.notifications,
      privacy_preferences: normalized.privacy,
    })
    .eq('id', userId);

  if (error) {
    if (isPreferencesSchemaMissing(error)) {
      writeLocalPreferences(normalized);
      return normalized;
    }
    throw error;
  }
  writeLocalPreferences(normalized);
  return normalized;
}
