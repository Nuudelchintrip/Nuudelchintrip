import { Navigate } from 'react-router';
import { getDashboardPath, getOnboardingPath, getStoredUser } from '../utils/auth';

export function DashboardRedirectPage() {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/auth/login?reason=%D0%A1%D0%B0%D0%BC%D0%B1%D0%B0%D1%80%20%D1%80%D1%83%D1%83%20%D0%BE%D1%80%D0%BE%D1%85%D1%8B%D0%BD%20%D1%82%D1%83%D0%BB%D0%B4%20%D0%BD%D1%8D%D0%B2%D1%82%D1%8D%D1%80%D0%BD%D1%8D%20%D2%AF%D2%AF." replace />;
  }

  if (!user.phone_verified) {
    return <Navigate to="/auth/verify-phone" replace />;
  }

  if (user.role !== 'admin' && !user.onboarding_completed) {
    return <Navigate to={getOnboardingPath(user.role)} replace />;
  }

  return <Navigate to={getDashboardPath(user.role)} replace />;
}
