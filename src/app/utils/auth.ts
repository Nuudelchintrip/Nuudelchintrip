export type MarketplaceRole = 'traveler' | 'driver' | 'cargo_sender' | 'admin';
export type DriverVerificationStatus = 'pending' | 'approved' | 'rejected';

export interface MockUserProfile {
  role: MarketplaceRole;
  full_name: string;
  phone: string;
  email: string;
  phone_verified: boolean;
  onboarding_completed: boolean;
  verification_status?: DriverVerificationStatus;
  cargo_policy_accepted?: boolean;
}

const STORAGE_KEY = 'nuudelchin_user';

export function getStoredUser(): MockUserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MockUserProfile) : null;
  } catch {
    return null;
  }
}

export function saveStoredUser(profile: MockUserProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function updateStoredUser(patch: Partial<MockUserProfile>) {
  const current = getStoredUser();
  const next: MockUserProfile = {
    role: 'traveler',
    full_name: '',
    phone: '',
    email: '',
    phone_verified: false,
    onboarding_completed: false,
    ...current,
    ...patch,
  };
  saveStoredUser(next);
  return next;
}

export function formatMongoliaPhone(input: string) {
  const digits = input.replace(/\D/g, '').replace(/^976/, '').slice(0, 8);
  return digits ? `+976 ${digits}` : '+976 ';
}

export function getDashboardPath(role?: MarketplaceRole) {
  if (role === 'driver') return '/dashboard/driver';
  if (role === 'cargo_sender') return '/dashboard/cargo';
  if (role === 'admin') return '/admin';
  return '/dashboard/traveler';
}

export function getOnboardingPath(role?: MarketplaceRole) {
  if (role === 'driver') return '/onboarding/driver';
  if (role === 'cargo_sender') return '/onboarding/cargo';
  return '/onboarding/traveler';
}
