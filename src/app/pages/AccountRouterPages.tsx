import { AccountProfilePage, AccountSettingsPage } from './AccountPages';
import { getStoredUser } from '../utils/auth';

function getAccountRole() {
  const role = getStoredUser()?.role;
  if (role === 'driver') return 'driver';
  if (role === 'admin') return 'admin';
  if (role === 'cargo_sender') return 'sender';
  return 'traveler';
}

export function ProfileRouterPage() {
  return <AccountProfilePage role={getAccountRole()} />;
}

export function SettingsRouterPage() {
  return <AccountSettingsPage role={getAccountRole()} />;
}
