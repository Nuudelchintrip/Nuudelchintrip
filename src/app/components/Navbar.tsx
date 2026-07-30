import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from './Button';
import { Logo } from './Logo';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from './ThemeToggle';
import { getDashboardPath, getStoredUser } from '../utils/auth';
import { logoutFromSupabase } from '../services/supabaseAuth';

const publicLinks = [
  { href: '/how-it-works', label: 'Хэрхэн ажилладаг' },
  { href: '/safety', label: 'Аюулгүй байдал' },
  { href: '/pricing', label: 'Үнэ' },
  { href: '/support', label: 'Тусламж' },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = getStoredUser();
  const dashboardPath = getDashboardPath(user?.role);

  const handleLogout = async () => {
    try {
      await logoutFromSupabase();
    } finally {
      window.location.href = '/auth/login';
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-3 sm:h-16 sm:gap-4">
          <div className="flex min-w-0 items-center gap-6 lg:gap-8">
            {/* Нэвтэрсэн үед лого дарахад нүүр рүү биш, өөрийн самбар руу очно. */}
            <a href={user ? dashboardPath : '/'} aria-label={user ? 'Самбар руу очих' : 'NuudelchinTrip нүүр'}>
              <Logo size="md" />
            </a>

            <div className="hidden items-center gap-6 lg:flex">
              {publicLinks.map((link) => (
                <a key={link.href} href={link.href} className="text-sm font-medium text-foreground transition-colors hover:text-primary">
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <ThemeToggle />
            {user ? (
              <>
                <NotificationBell />
                <Button variant="ghost" onClick={() => { window.location.href = dashboardPath; }}>
                  Самбар
                </Button>
                <Button variant="primary" onClick={handleLogout}>
                  Гарах
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => { window.location.href = '/auth/login'; }}>
                  Нэвтрэх
                </Button>
                <Button variant="primary" onClick={() => { window.location.href = '/auth/register'; }}>
                  Бүртгүүлэх
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            {user && <NotificationBell />}
            <ThemeToggle />
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? 'Цэс хаах' : 'Цэс нээх'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-border bg-card md:hidden">
          <div className="space-y-1 px-3.5 py-3">
            {publicLinks.map((link) => (
              <a key={link.href} href={link.href} className="block min-h-11 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary">
                {link.label}
              </a>
            ))}
            {user ? (
              <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
                <Button variant="ghost" fullWidth onClick={() => { window.location.href = dashboardPath; }}>
                  Самбар
                </Button>
                <Button variant="primary" fullWidth onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  Гарах
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
                <Button variant="ghost" fullWidth onClick={() => { window.location.href = '/auth/login'; }}>
                  Нэвтрэх
                </Button>
                <Button variant="primary" fullWidth onClick={() => { window.location.href = '/auth/register'; }}>
                  Бүртгүүлэх
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
