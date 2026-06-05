import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import type { ReactNode } from 'react';
import { AccountPasswordPage, AccountProfilePage, AccountSettingsPage, AccountVerificationPage, PublicDriverProfilePage } from './pages/AccountPages';
import { ProfileRouterPage, SettingsRouterPage } from './pages/AccountRouterPages';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminQueuePage, CargoFindRoutesPage, DriverCargoRequestsPage, DriverOffersPage, EarningsPage, FindDriversPage, MyRoutesPage, ReviewsPage, RoleRequestsPage, SenderCargoPage, TripFormPage } from './pages/DashboardWorkPages';
import { BookingDetailPage } from './pages/BookingDetailPage';
import { CargoDetailPage } from './pages/CargoDetailPage';
import { CargoRulesPage } from './pages/CargoRulesPage';
import { DashboardRedirectPage } from './pages/DashboardRedirectPage';
import { DeliveryProofPage } from './pages/DeliveryProofPage';
import { DriverDashboard } from './pages/DriverDashboard';
import { HomePage } from './pages/HomePage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { LoginPage } from './pages/LoginPage';
import { PaymentProofPage } from './pages/PaymentProofPage';
import { PostCargoPage } from './pages/PostCargoPage';
import { PricingPage } from './pages/PricingPage';
import { AboutPage, FaqPage, ForgotPasswordPage, LegalPage, NotFoundPage, ResetPasswordPage, SupportPage } from './pages/PublicInfoPages';
import { ProfileSetupPage } from './pages/ProfileSetupPage';
import { RegisterPage } from './pages/RegisterPage';
import { RoleSelectPage } from './pages/RoleSelectPage';
import { SafetyPage } from './pages/SafetyPage';
import { SenderDashboard } from './pages/SenderDashboard';
import { TripDetailPage } from './pages/TripDetailPage';
import { TripsPage } from './pages/TripsPage';
import { TravelerDashboard } from './pages/TravelerDashboard';
import { VerifyPhonePage } from './pages/VerifyPhonePage';
import { getDashboardPath, getOnboardingPath, getStoredUser, type MarketplaceRole } from './utils/auth';

function AdminOnly({ children }: { children: ReactNode }) {
  const user = getStoredUser();

  if (user?.role === 'admin') {
    return children;
  }

  return <Navigate to={user ? getDashboardPath(user.role) : '/auth/login'} replace />;
}

function RequireAccount({ children, roles }: { children: ReactNode; roles?: MarketplaceRole[] }) {
  const user = getStoredUser();
  const next = `${window.location.pathname}${window.location.search}`;

  if (!user) {
    return <Navigate to={`/auth/login?reason=${encodeURIComponent('Энэ хэсэгт орохын тулд нэвтэрнэ үү.')}&next=${encodeURIComponent(next)}`} replace />;
  }

  if (!user.phone_verified) {
    return <Navigate to="/auth/verify-phone" replace />;
  }

  if (user.role !== 'admin' && !user.onboarding_completed) {
    return <Navigate to={getOnboardingPath(user.role)} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
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
        <Route path="/onboarding/traveler" element={<ProfileSetupPage role="traveler" />} />
        <Route path="/onboarding/driver" element={<ProfileSetupPage role="driver" />} />
        <Route path="/onboarding/cargo" element={<ProfileSetupPage role="cargo" />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
