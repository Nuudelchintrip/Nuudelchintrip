import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from './Button';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

const publicLinks = [
  { href: '/how-it-works', label: 'Хэрхэн ажилладаг' },
  { href: '/safety', label: 'Аюулгүй байдал' },
  { href: '/pricing', label: 'Үнэ' },
  { href: '/support', label: 'Тусламж' },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-3 sm:h-16 sm:gap-4">
          <div className="flex min-w-0 items-center gap-6 lg:gap-8">
            <a href="/" aria-label="NuudelchinTrip нүүр">
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
            <Button variant="ghost" onClick={() => { window.location.href = '/auth/login'; }}>
              Нэвтрэх
            </Button>
            <Button variant="primary" onClick={() => { window.location.href = '/auth/register'; }}>
              Бүртгүүлэх
            </Button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
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
            <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
              <Button variant="ghost" fullWidth onClick={() => { window.location.href = '/auth/login'; }}>
                Нэвтрэх
              </Button>
              <Button variant="primary" fullWidth onClick={() => { window.location.href = '/auth/register'; }}>
                Бүртгүүлэх
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
