import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from './Button';

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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-8">
            <a href="/" className="flex min-w-0 items-center gap-3" aria-label="NuudelchinTrip home">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary">
                <span className="text-xl font-bold text-primary-foreground">N</span>
              </div>
              <span className="truncate text-xl font-bold text-foreground">NuudelchinTrip</span>
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
            <Button variant="ghost" onClick={() => { window.location.href = '/auth/login'; }}>
              Нэвтрэх
            </Button>
            <Button variant="primary" onClick={() => { window.location.href = '/auth/register'; }}>
              Бүртгүүлэх
            </Button>
          </div>

          <button
            type="button"
            className="rounded-lg border border-border p-2 md:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? 'Цэс хаах' : 'Цэс нээх'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-border bg-card md:hidden">
          <div className="space-y-2 px-4 py-4">
            {publicLinks.map((link) => (
              <a key={link.href} href={link.href} className="block rounded-lg px-3 py-2 font-medium text-foreground hover:bg-secondary">
                {link.label}
              </a>
            ))}
            <div className="space-y-2 border-t border-border pt-4">
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
