export type MarketplaceRole = 'traveler' | 'driver' | 'cargo_sender' | 'admin';
export type DriverVerificationStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';
export type VerificationStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';
export type ActionLogStatus = 'Амжилттай' | 'Амжилтгүй' | 'Хүлээгдэж байна' | 'Татгалзсан';

export interface IdentityVerificationState {
  status: VerificationStatus;
  id?: string;
  familyName?: string;
  fullName?: string;
  registerNumber?: string;
  documentName?: string;
  selfieName?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface MockUserProfile {
  role: MarketplaceRole;
  full_name: string;
  phone: string;
  email: string;
  phone_verified: boolean;
  onboarding_completed: boolean;
  verification_status?: DriverVerificationStatus;
  cargo_policy_accepted?: boolean;
  identity_verification?: IdentityVerificationState;
}

export interface IdentityVerificationRequest {
  id: string;
  role: MarketplaceRole;
  userName: string;
  phone: string;
  email: string;
  familyName: string;
  fullName: string;
  registerNumber: string;
  documentName: string;
  selfieName?: string;
  status: VerificationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface ActionLogEntry {
  id: string;
  actor: string;
  user: string;
  actionType: string;
  status: ActionLogStatus;
  details: string;
  createdAt: string;
}

const STORAGE_KEY = 'nuudelchin_user';
const IDENTITY_REQUESTS_KEY = 'nuudelchin_identity_requests';
const ACTION_LOGS_KEY = 'nuudelchin_action_logs';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function getRoleLabel(role?: MarketplaceRole) {
  if (role === 'driver') return 'Жолооч';
  if (role === 'cargo_sender') return 'Дайвар ачаа илгээгч';
  if (role === 'admin') return 'Админ';
  return 'Аялагч';
}

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

export function getMongoliaPhoneDigits(input: string) {
  return input.replace(/\D/g, '').replace(/^976/, '').slice(0, 8);
}

export function isValidMongoliaPhone(input: string) {
  return getMongoliaPhoneDigits(input).length === 8;
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

const seedActionLogs: ActionLogEntry[] = [
  {
    id: 'LOG-001',
    actor: 'Систем',
    user: 'Бат-Эрдэнэ',
    actionType: 'Жолоочийн баталгаажуулалт',
    status: 'Амжилттай',
    details: 'Жолоочийн профайл баталгаажиж чиглэл нийтлэх эрх нээгдсэн.',
    createdAt: '2026-06-03T11:20:00.000Z',
  },
  {
    id: 'LOG-002',
    actor: 'Админ',
    user: 'Сарангэрэл Цэцэг',
    actionType: 'Төлбөрийн баримт',
    status: 'Хүлээгдэж байна',
    details: 'BK-001 захиалгын төлбөрийн баримт шалгалтад орсон.',
    createdAt: '2026-06-03T12:10:00.000Z',
  },
  {
    id: 'LOG-003',
    actor: 'Систем',
    user: 'Дорж Цэцэг',
    actionType: 'OTP баталгаажуулалт',
    status: 'Амжилтгүй',
    details: 'Оруулсан код буруу байсан тул дахин код авах шаардлагатай.',
    createdAt: '2026-06-03T12:40:00.000Z',
  },
];

export function getActionLogs() {
  return readJson<ActionLogEntry[]>(ACTION_LOGS_KEY, seedActionLogs);
}

export function addActionLog(entry: Omit<ActionLogEntry, 'id' | 'createdAt'>) {
  const nextEntry: ActionLogEntry = {
    id: createId('LOG'),
    createdAt: new Date().toISOString(),
    ...entry,
  };
  const logs = [nextEntry, ...getActionLogs()].slice(0, 100);
  writeJson(ACTION_LOGS_KEY, logs);
  return nextEntry;
}

export function getIdentityRequests() {
  return readJson<IdentityVerificationRequest[]>(IDENTITY_REQUESTS_KEY, []);
}

export function upsertIdentityRequest(input: Omit<IdentityVerificationRequest, 'id' | 'status' | 'submittedAt'>) {
  const requests = getIdentityRequests();
  const existingIndex = requests.findIndex((request) => {
    const sameEmail = input.email && request.email === input.email;
    const samePhone = input.phone && request.phone === input.phone;
    return sameEmail || samePhone;
  });

  const existing = existingIndex >= 0 ? requests[existingIndex] : null;
  const request: IdentityVerificationRequest = {
    ...existing,
    ...input,
    id: existing?.id || createId('IDV'),
    status: 'pending',
    submittedAt: new Date().toISOString(),
    reviewedAt: undefined,
    reviewedBy: undefined,
    rejectionReason: undefined,
  };

  const nextRequests =
    existingIndex >= 0
      ? requests.map((item, index) => (index === existingIndex ? request : item))
      : [request, ...requests];
  writeJson(IDENTITY_REQUESTS_KEY, nextRequests);

  const stored = getStoredUser();
  if (stored && ((stored.email && stored.email === input.email) || (stored.phone && stored.phone === input.phone))) {
    updateStoredUser({
      identity_verification: {
        id: request.id,
        status: request.status,
        familyName: request.familyName,
        fullName: request.fullName,
        registerNumber: request.registerNumber,
        documentName: request.documentName,
        selfieName: request.selfieName,
        submittedAt: request.submittedAt,
      },
    });
  }

  addActionLog({
    actor: input.fullName || input.userName,
    user: input.fullName || input.userName,
    actionType: 'Иргэний үнэмлэхний хүсэлт',
    status: 'Хүлээгдэж байна',
    details: 'Хэрэглэгч иргэний үнэмлэхний баталгаажуулалт илгээсэн.',
  });

  return request;
}

export function updateIdentityRequestStatus(id: string, status: Exclude<VerificationStatus, 'not_submitted' | 'pending'>, rejectionReason?: string) {
  const requests = getIdentityRequests();
  const request = requests.find((item) => item.id === id);
  if (!request) return null;

  const reviewedAt = new Date().toISOString();
  const updated: IdentityVerificationRequest = {
    ...request,
    status,
    reviewedAt,
    reviewedBy: 'Админ',
    rejectionReason: status === 'rejected' ? rejectionReason || 'Мэдээлэл тодорхойгүй байна.' : undefined,
  };

  writeJson(
    IDENTITY_REQUESTS_KEY,
    requests.map((item) => (item.id === id ? updated : item)),
  );

  const stored = getStoredUser();
  if (stored && ((stored.email && stored.email === updated.email) || (stored.phone && stored.phone === updated.phone))) {
    updateStoredUser({
      identity_verification: {
        id: updated.id,
        status: updated.status,
        familyName: updated.familyName,
        fullName: updated.fullName,
        registerNumber: updated.registerNumber,
        documentName: updated.documentName,
        selfieName: updated.selfieName,
        submittedAt: updated.submittedAt,
        reviewedAt: updated.reviewedAt,
        reviewedBy: updated.reviewedBy,
        rejectionReason: updated.rejectionReason,
      },
    });
  }

  addActionLog({
    actor: 'Админ',
    user: updated.fullName || updated.userName,
    actionType: 'Иргэний үнэмлэхний баталгаажуулалт',
    status: status === 'approved' ? 'Амжилттай' : 'Татгалзсан',
    details:
      status === 'approved'
        ? 'Админ хэрэглэгчийн иргэний үнэмлэхний мэдээллийг зөвшөөрсөн.'
        : `Админ хүсэлтийг буцаасан. Шалтгаан: ${updated.rejectionReason}`,
  });

  return updated;
}
