import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { lazy, Suspense, useEffect, useState, type ComponentType, type ReactNode } from 'react';
// Public entry pages stay eager for a fast first paint.
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { refreshLocalProfileFromSupabase } from './services/supabaseAuth';
import { getDashboardPath, getOnboardingPath, type MarketplaceRole, type MockUserProfile } from './utils/auth';

// Everything else is lazy-loaded so the initial bundle stays small.
const named = <T extends Record<string, unknown>, K extends keyof T>(
  loader: () => Promise<T>,
  key: K,
) => lazy(() => loader().then((m) => ({ default: m[key] as unknown as ComponentType })));

const AccountPasswordPage = named(() => import('./pages/AccountPages'), 'AccountPasswordPage');
const AccountProfilePage = named(() => import('./pages/AccountPages'), 'AccountProfilePage');
const AccountSettingsPage = named(() => import('./pages/AccountPages'), 'AccountSettingsPage');
const AccountVerificationPage = named(() => import('./pages/AccountPages'), 'AccountVerificationPage');
const PublicDriverProfilePage = named(() => import('./pages/AccountPages'), 'PublicDriverProfilePage');
const ProfileRouterPage = named(() => import('./pages/AccountRouterPages'), 'ProfileRouterPage');
const SettingsRouterPage = named(() => import('./pages/AccountRouterPages'), 'SettingsRouterPage');
const AdminDashboard = named(() => import('./pages/AdminDashboard'), 'AdminDashboard');
const AdminLoginPage = named(() => import('./pages/AdminLoginPage'), 'AdminLoginPage');
const CargoFindRoutesPage = named(() => import('./pages/DashboardWorkPages'), 'CargoFindRoutesPage');
const DriverCargoRequestsPage = named(() => import('./pages/DashboardWorkPages'), 'DriverCargoRequestsPage');
const DriverOffersPage = named(() => import('./pages/DashboardWorkPages'), 'DriverOffersPage');
const EarningsPage = named(() => import('./pages/DashboardWorkPages'), 'EarningsPage');
const FindDriversPage = named(() => import('./pages/DashboardWorkPages'), 'FindDriversPage');
const MyRoutesPage = named(() => import('./pages/DashboardWorkPages'), 'MyRoutesPage');
const ReviewsPage = named(() => import('./pages/DashboardWorkPages'), 'ReviewsPage');
const RoleRequestsPage = named(() => import('./pages/DashboardWorkPages'), 'RoleRequestsPage');
const SenderCargoPage = named(() => import('./pages/DashboardWorkPages'), 'SenderCargoPage');
const TripFormPage = named(() => import('./pages/DashboardWorkPages'), 'TripFormPage');
const AdminQueuePage = named(() => import('./pages/AdminQueueRealPage'), 'AdminQueuePage');
const BookingDetailPage = named(() => import('./pages/BookingDetailPage'), 'BookingDetailPage');
const CargoDetailPage = named(() => import('./pages/CargoDetailPage'), 'CargoDetailPage');
const CargoRulesPage = named(() => import('./pages/CargoRulesPage'), 'CargoRulesPage');
const DashboardRedirectPage = named(() => import('./pages/DashboardRedirectPage'), 'DashboardRedirectPage');
const DeliveryProofPage = named(() => import('./pages/DeliveryProofPage'), 'DeliveryProofPage');
const DriverDashboard = named(() => import('./pages/DriverDashboard'), 'DriverDashboard');
const HowItWorksPage = named(() => import('./pages/HowItWorksPage'), 'HowItWorksPage');
const PaymentProofPage = named(() => import('./pages/PaymentProofPage'), 'PaymentProofPage');
const PostCargoPage = named(() => import('./pages/PostCargoPage'), 'PostCargoPage');
const PricingPage = named(() => import('./pages/PricingPage'), 'PricingPage');
const AboutPage = named(() => import('./pages/PublicInfoPages'), 'AboutPage');
const FaqPage = named(() => import('./pages/PublicInfoPages'), 'FaqPage');
const ForgotPasswordPage = named(() => import('./pages/PublicInfoPages'), 'ForgotPasswordPage');
const LegalPage = named(() => import('./pages/PublicInfoPages'), 'LegalPage');
const NotFoundPage = named(() => import('./pages/PublicInfoPages'), 'NotFoundPage');
const ResetPasswordPage = named(() => import('./pages/PublicInfoPages'), 'ResetPasswordPage');
const SupportPage = named(() => import('./pages/PublicInfoPages'), 'SupportPage');
const ProfileSetupPage = named(() => import('./pages/ProfileSetupPage'), 'ProfileSetupPage');
const RoleSelectPage = named(() => import('./pages/RoleSelectPage'), 'RoleSelectPage');
const SafetyPage = named(() => import('./pages/SafetyPage'), 'SafetyPage');
const SenderDashboard = named(() => import('./pages/SenderDashboard'), 'SenderDashboard');
const TripDetailPage = named(() => import('./pages/TripDetailPage'), 'TripDetailPage');
const TripsPage = named(() => import('./pages/TripsPage'), 'TripsPage');
const TravelerDashboard = named(() => import('./pages/TravelerDashboard'), 'TravelerDashboard');
const NotificationsPage = named(() => import('./pages/NotificationsPage'), 'NotificationsPage');
const VerifyPhonePage = named(() => import('./pages/VerifyPhonePage'), 'VerifyPhonePage');

function AccountGate({
  children,
  roles,
  loginPath = '/auth/login',
}: {
  children: ReactNode;
  roles?: MarketplaceRole[];
  loginPath?: string;
}) {
  const [user, setUser] = useState<MockUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let isActive = true;

    refreshLocalProfileFromSupabase()
      .then((profile) => {
        if (isActive) setUser(profile);
      })
      .catch((error: unknown) => {
        if (isActive) {
          setLoadError(error instanceof Error ? error.message : 'Бүртгэлийг шалгахад алдаа гарлаа.');
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-sm font-medium text-muted-foreground">Бүртгэлийг шалгаж байна...</p>
      </div>
    );
  }

  const next = `${window.location.pathname}${window.location.search}`;

  if (loadError || !user) {
    const reason = loadError
      ? `Бүртгэлийг баталгаажуулж чадсангүй: ${loadError}`
      : 'Энэ хэсэгт орохын тулд нэвтэрнэ үү.';
    return <Navigate to={`${loginPath}?reason=${encodeURIComponent(reason)}&next=${encodeURIComponent(next)}`} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    if (roles.length === 1 && roles[0] === 'admin') {
      return <Navigate to="/admin/login?reason=Энэ бүртгэл админ эрхгүй байна." replace />;
    }
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  if (user.role !== 'admin' && !user.phone_verified) {
    return <Navigate to="/auth/verify-phone" replace />;
  }

  if (user.role !== 'admin' && !user.onboarding_completed) {
    return <Navigate to={getOnboardingPath(user.role)} replace />;
  }

  return children;
}

function AdminOnly({ children }: { children: ReactNode }) {
  return <AccountGate roles={['admin']} loginPath="/admin/login">{children}</AccountGate>;
}

function RequireAccount({ children, roles }: { children: ReactNode; roles?: MarketplaceRole[] }) {
  return <AccountGate roles={roles}>{children}</AccountGate>;
}

function OnboardingGate({
  children,
  role,
}: {
  children: ReactNode;
  role: Exclude<MarketplaceRole, 'admin'>;
}) {
  const [user, setUser] = useState<MockUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    refreshLocalProfileFromSupabase()
      .then((profile) => {
        if (isActive) setUser(profile);
      })
      .catch(() => {
        if (isActive) setUser(null);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-sm font-medium text-muted-foreground">Бүртгэлийг шалгаж байна...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (user.role !== role) {
    return user.onboarding_completed
      ? <Navigate to={getDashboardPath(user.role)} replace />
      : <Navigate to={getOnboardingPath(user.role)} replace />;
  }

  if (!user.phone_verified) {
    return <Navigate to="/auth/verify-phone" replace />;
  }

  if (user.onboarding_completed) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">Уншиж байна...</div>}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/routes" element={<TripsPage />} />
        <Route path="/routes/:id" element={<TripDetailPage />} />
        <Route path="/trips" element={<Navigate to="/routes" replace />} />
        <Route path="/trips/:id" element={<TripDetailPage />} />
        <Route path="/cargo/new" element={<RequireAccount roles={['cargo_sender']}><PostCargoPage /></RequireAccount>} />
        <Route path="/cargo/find-routes" element={<RequireAccount roles={['cargo_sender']}><CargoFindRoutesPage /></RequireAccount>} />
        <Route path="/cargo/:id" element={<RequireAccount roles={['cargo_sender']}><CargoDetailPage /></RequireAccount>} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/safety" element={<SafetyPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/terms" element={<LegalPage type="terms" />} />
        <Route path="/privacy" element={<LegalPage type="privacy" />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/verify-phone" element={<VerifyPhonePage />} />
        <Route path="/auth/role-select" element={<RoleSelectPage />} />
        <Route path="/profile/sender" element={<Navigate to="/onboarding/cargo" replace />} />
        <Route path="/profile/traveler" element={<Navigate to="/onboarding/traveler" replace />} />
        <Route path="/profile/driver" element={<Navigate to="/onboarding/driver" replace />} />
        <Route path="/profile/driver/:id" element={<PublicDriverProfilePage />} />

        <Route path="/dashboard" element={<DashboardRedirectPage />} />
        <Route path="/dashboard/verification" element={<Navigate to="/dashboard/driver/verification" replace />} />
        <Route path="/dashboard/sender" element={<Navigate to="/dashboard/cargo" replace />} />
        <Route path="/dashboard/sender/profile" element={<RequireAccount roles={['cargo_sender']}><AccountProfilePage role="sender" /></RequireAccount>} />
        <Route path="/dashboard/sender/settings" element={<RequireAccount roles={['cargo_sender']}><AccountSettingsPage role="sender" /></RequireAccount>} />
        <Route path="/dashboard/sender/settings/password" element={<RequireAccount roles={['cargo_sender']}><AccountPasswordPage role="sender" /></RequireAccount>} />
        <Route path="/dashboard/sender/cargo" element={<Navigate to="/dashboard/cargo/requests" replace />} />
        <Route path="/dashboard/sender/payments" element={<Navigate to="/dashboard/cargo/proof" replace />} />
        <Route path="/dashboard/sender/reviews" element={<RequireAccount roles={['cargo_sender']}><ReviewsPage role="sender" /></RequireAccount>} />
        <Route path="/dashboard/cargo" element={<RequireAccount roles={['cargo_sender']}><SenderDashboard /></RequireAccount>} />
        <Route path="/dashboard/cargo/profile" element={<RequireAccount roles={['cargo_sender']}><AccountProfilePage role="sender" /></RequireAccount>} />
        <Route path="/dashboard/cargo/settings" element={<RequireAccount roles={['cargo_sender']}><AccountSettingsPage role="sender" /></RequireAccount>} />
        <Route path="/dashboard/cargo/settings/password" element={<RequireAccount roles={['cargo_sender']}><AccountPasswordPage role="sender" /></RequireAccount>} />
        <Route path="/dashboard/cargo/verification" element={<RequireAccount roles={['cargo_sender']}><AccountVerificationPage role="sender" /></RequireAccount>} />
        <Route path="/dashboard/cargo/requests" element={<RequireAccount roles={['cargo_sender']}><SenderDashboard /></RequireAccount>} />
        <Route path="/dashboard/cargo/proof" element={<RequireAccount roles={['cargo_sender']}><SenderCargoPage view="proof" /></RequireAccount>} />
        <Route path="/dashboard/cargo/status" element={<RequireAccount roles={['cargo_sender']}><SenderCargoPage view="status" /></RequireAccount>} />
        <Route path="/dashboard/cargo/rules" element={<RequireAccount roles={['cargo_sender']}><CargoRulesPage /></RequireAccount>} />

        <Route path="/dashboard/notifications" element={<RequireAccount><NotificationsPage /></RequireAccount>} />

        <Route path="/dashboard/traveler" element={<RequireAccount roles={['traveler']}><TravelerDashboard /></RequireAccount>} />
        <Route path="/dashboard/traveler/profile" element={<RequireAccount roles={['traveler']}><AccountProfilePage role="traveler" /></RequireAccount>} />
        <Route path="/dashboard/traveler/settings" element={<RequireAccount roles={['traveler']}><AccountSettingsPage role="traveler" /></RequireAccount>} />
        <Route path="/dashboard/traveler/settings/password" element={<RequireAccount roles={['traveler']}><AccountPasswordPage role="traveler" /></RequireAccount>} />
        <Route path="/dashboard/traveler/verification" element={<RequireAccount roles={['traveler']}><AccountVerificationPage role="traveler" /></RequireAccount>} />
        <Route path="/dashboard/traveler/find" element={<RequireAccount roles={['traveler']}><FindDriversPage /></RequireAccount>} />
        <Route path="/traveler/find-drivers" element={<RequireAccount roles={['traveler']}><FindDriversPage /></RequireAccount>} />
        <Route path="/dashboard/traveler/offers" element={<RequireAccount roles={['traveler']}><DriverOffersPage /></RequireAccount>} />
        <Route path="/dashboard/traveler/trips/new" element={<Navigate to="/dashboard/traveler/find" replace />} />
        <Route path="/dashboard/traveler/requests" element={<RequireAccount roles={['traveler']}><DriverOffersPage /></RequireAccount>} />
        <Route path="/dashboard/traveler/trips" element={<RequireAccount roles={['traveler']}><MyRoutesPage role="traveler" /></RequireAccount>} />
        <Route path="/dashboard/traveler/earnings" element={<Navigate to="/dashboard/traveler" replace />} />
        <Route path="/dashboard/traveler/reviews" element={<Navigate to="/dashboard/traveler/trips" replace />} />
        <Route path="/dashboard/traveler/requests/:id/accept" element={<RequireAccount roles={['traveler']}><RoleRequestsPage role="traveler" action="accept" /></RequireAccount>} />
        <Route path="/dashboard/traveler/requests/:id/reject" element={<RequireAccount roles={['traveler']}><RoleRequestsPage role="traveler" action="reject" /></RequireAccount>} />

        <Route path="/dashboard/driver" element={<RequireAccount roles={['driver']}><DriverDashboard /></RequireAccount>} />
        <Route path="/dashboard/driver/profile" element={<RequireAccount roles={['driver']}><AccountProfilePage role="driver" /></RequireAccount>} />
        <Route path="/dashboard/driver/settings" element={<RequireAccount roles={['driver']}><AccountSettingsPage role="driver" /></RequireAccount>} />
        <Route path="/dashboard/driver/settings/password" element={<RequireAccount roles={['driver']}><AccountPasswordPage role="driver" /></RequireAccount>} />
        <Route path="/dashboard/driver/verification" element={<RequireAccount roles={['driver']}><AccountVerificationPage role="driver" /></RequireAccount>} />
        <Route path="/dashboard/driver/routes/new" element={<RequireAccount roles={['driver']}><TripFormPage role="driver" /></RequireAccount>} />
        <Route path="/driver/add-route" element={<RequireAccount roles={['driver']}><TripFormPage role="driver" /></RequireAccount>} />
        <Route path="/dashboard/driver/requests" element={<RequireAccount roles={['driver']}><RoleRequestsPage role="driver" /></RequireAccount>} />
        <Route path="/driver/requests" element={<RequireAccount roles={['driver']}><RoleRequestsPage role="driver" /></RequireAccount>} />
        <Route path="/dashboard/driver/routes" element={<RequireAccount roles={['driver']}><MyRoutesPage role="driver" /></RequireAccount>} />
        <Route path="/dashboard/driver/cargo-requests" element={<RequireAccount roles={['driver']}><DriverCargoRequestsPage /></RequireAccount>} />
        <Route path="/driver/cargo-requests" element={<RequireAccount roles={['driver']}><DriverCargoRequestsPage /></RequireAccount>} />
        <Route path="/dashboard/driver/earnings" element={<RequireAccount roles={['driver']}><EarningsPage role="driver" /></RequireAccount>} />
        <Route path="/driver/earnings" element={<RequireAccount roles={['driver']}><EarningsPage role="driver" /></RequireAccount>} />
        <Route path="/dashboard/driver/reviews" element={<RequireAccount roles={['driver']}><ReviewsPage role="driver" /></RequireAccount>} />
        <Route path="/dashboard/driver/requests/:id/accept" element={<RequireAccount roles={['driver']}><RoleRequestsPage role="driver" action="accept" /></RequireAccount>} />
        <Route path="/dashboard/driver/requests/:id/reject" element={<RequireAccount roles={['driver']}><RoleRequestsPage role="driver" action="reject" /></RequireAccount>} />

        <Route path="/dashboard/bookings/:id" element={<RequireAccount><BookingDetailPage /></RequireAccount>} />
        <Route path="/dashboard/bookings/:id/payment-proof" element={<RequireAccount><PaymentProofPage /></RequireAccount>} />
        <Route path="/dashboard/bookings/:id/delivery-proof" element={<RequireAccount><DeliveryProofPage /></RequireAccount>} />

        <Route path="/admin" element={<AdminOnly><AdminDashboard /></AdminOnly>} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/profile" element={<AdminOnly><AccountProfilePage role="admin" /></AdminOnly>} />
        <Route path="/admin/settings" element={<AdminOnly><AccountSettingsPage role="admin" /></AdminOnly>} />
        <Route path="/admin/settings/password" element={<AdminOnly><AccountPasswordPage role="admin" /></AdminOnly>} />
        <Route path="/admin/payments" element={<AdminOnly><AdminQueuePage view="payments" /></AdminOnly>} />
        <Route path="/admin/users" element={<AdminOnly><AdminQueuePage view="users" /></AdminOnly>} />
        <Route path="/admin/reports" element={<AdminOnly><AdminQueuePage view="reports" /></AdminOnly>} />
        <Route path="/admin/verifications" element={<AdminOnly><AdminQueuePage view="verifications" /></AdminOnly>} />
        <Route path="/admin/cargo" element={<AdminOnly><AdminQueuePage view="cargo" /></AdminOnly>} />
        <Route path="/admin/routes" element={<AdminOnly><AdminQueuePage view="routes" /></AdminOnly>} />
        <Route path="/admin/bookings" element={<AdminOnly><AdminQueuePage view="bookings" /></AdminOnly>} />
        <Route path="/admin/logs" element={<AdminOnly><AdminQueuePage view="logs" /></AdminOnly>} />
        <Route path="/admin/support" element={<AdminOnly><AdminQueuePage view="support" /></AdminOnly>} />
        <Route path="/admin/payouts" element={<AdminOnly><AdminQueuePage view="payouts" /></AdminOnly>} />

        <Route path="/login" element={<Navigate to="/auth/login" replace />} />
        <Route path="/register" element={<Navigate to="/auth/register" replace />} />
        <Route path="/verify-phone" element={<Navigate to="/auth/verify-phone" replace />} />
        <Route path="/profile" element={<RequireAccount><ProfileRouterPage /></RequireAccount>} />
        <Route path="/settings" element={<RequireAccount><SettingsRouterPage /></RequireAccount>} />
        <Route path="/role-select" element={<Navigate to="/auth/role-select" replace />} />
        <Route path="/sender/dashboard" element={<Navigate to="/dashboard/sender" replace />} />
        <Route path="/traveler/dashboard" element={<Navigate to="/dashboard/traveler" replace />} />
        <Route path="/driver/dashboard" element={<Navigate to="/dashboard/driver" replace />} />
        <Route path="/bookings/:id" element={<RequireAccount><BookingDetailPage /></RequireAccount>} />
        <Route path="/payment/upload-proof" element={<Navigate to="/dashboard" replace />} />
        <Route path="/delivery/upload-proof" element={<Navigate to="/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="/sender/post-cargo" element={<Navigate to="/cargo/new" replace />} />
        <Route path="/traveler/create-trip" element={<Navigate to="/dashboard/traveler/find" replace />} />
        <Route path="/traveler/delivery-proof" element={<Navigate to="/dashboard/traveler/trips" replace />} />
        <Route path="/onboarding/sender" element={<Navigate to="/onboarding/cargo" replace />} />
        <Route path="/onboarding/traveler" element={<OnboardingGate role="traveler"><ProfileSetupPage role="traveler" /></OnboardingGate>} />
        <Route path="/onboarding/driver" element={<OnboardingGate role="driver"><ProfileSetupPage role="driver" /></OnboardingGate>} />
        <Route path="/onboarding/cargo" element={<OnboardingGate role="cargo_sender"><ProfileSetupPage role="cargo" /></OnboardingGate>} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
