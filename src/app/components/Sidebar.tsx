import { useState, type ReactNode } from 'react';
import { CircleHelp, LogOut, Menu, ShieldCheck, UserCircle, X } from 'lucide-react';
import { useLocation } from 'react-router';
import type { DashboardRole } from '../navigation/dashboardMenus';

interface SidebarProps {
  menuItems: {
    icon: ReactNode;
    label: string;
    href: string;
  }[];
  accountRole?: DashboardRole;
  activeHref?: string;
}

export function Sidebar({ menuItems, accountRole, activeHref }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const account = getAccountContext(location.pathname, accountRole);
  const activeMenuHref = activeHref ?? getActiveMenuHref(location.pathname, menuItems.map((item) => item.href));

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3 md:hidden">
        <a href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">N</span>
          </div>
          <span className="text-[15px] font-bold text-foreground">NuudelchinTrip</span>
        </a>
        <button
          type="button"
          aria-label="Цэс нээх"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-sidebar-border text-sidebar-foreground"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Цэсний арын хэсгийг хаах"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-[82vw] max-w-80 flex-col bg-sidebar shadow-2xl">
            <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-4">
              <a href="/" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                  <span className="text-lg font-bold text-primary-foreground">N</span>
                </div>
                <span className="text-[15px] font-bold text-foreground">NuudelchinTrip</span>
              </a>
              <button
                type="button"
                aria-label="Цэс хаах"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sidebar-border text-sidebar-foreground"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b border-sidebar-border p-3">
              <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <UserCircle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold leading-5 text-foreground">{account.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{account.label}</p>
                  </div>
                </div>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-2.5 space-y-0.5">
              {menuItems.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] leading-5 transition-colors [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 ${
                    activeMenuHref === item.href
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium leading-5">{item.label}</span>
                </a>
              ))}
            </nav>

            <SidebarFooter />
          </aside>
        </div>
      )}

      <aside className="hidden w-60 shrink-0 bg-sidebar border-r border-sidebar-border md:flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-sidebar-border">
        <a href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-lg font-bold text-primary-foreground">N</span>
          </div>
          <span className="text-[15px] font-bold text-foreground">NuudelchinTrip</span>
        </a>
        <div className="mt-3 rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold leading-5 text-foreground">{account.name}</p>
              <p className="truncate text-xs text-muted-foreground">{account.label}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-2.5 space-y-0.5">
        {menuItems.map((item, index) => (
          <a
            key={index}
            href={item.href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] leading-5 transition-colors [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 ${
              activeMenuHref === item.href
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            }`}
          >
            {item.icon}
            <span className="font-medium leading-5">{item.label}</span>
          </a>
        ))}
      </nav>

        <SidebarFooter />
      </aside>
    </>
  );
}

function SidebarFooter() {
  return (
    <div className="space-y-0.5 border-t border-sidebar-border p-2.5">
      <a
        href="/support"
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] leading-5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <CircleHelp className="h-4 w-4 shrink-0" />
        <span className="font-medium leading-5">Тусламж</span>
      </a>
      <a
        href="/safety"
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] leading-5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <ShieldCheck className="h-4 w-4 shrink-0" />
        <span className="font-medium leading-5">Аюулгүй байдал</span>
      </a>
      <button
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] leading-5 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        onClick={() => window.location.href = '/auth/login'}
      >
        <LogOut className="h-4 w-4 shrink-0" />
        <span className="font-medium leading-5">Гарах</span>
      </button>
    </div>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === '/admin') {
    return pathname === '/admin';
  }
  if (href === '/dashboard/cargo' || href === '/dashboard/sender' || href === '/dashboard/traveler' || href === '/dashboard/driver') {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getActiveMenuHref(pathname: string, hrefs: string[]) {
  const matches = hrefs.filter((href) => isActivePath(pathname, href));
  return matches.sort((a, b) => b.length - a.length)[0];
}

function getAccountContext(pathname: string, accountRole?: DashboardRole) {
  const role =
    accountRole ??
    (pathname.startsWith('/admin')
      ? 'admin'
      : pathname.startsWith('/dashboard/driver')
        ? 'driver'
        : pathname.startsWith('/dashboard/traveler')
          ? 'traveler'
          : pathname.startsWith('/dashboard/cargo')
            ? 'sender'
          : 'sender');

  if (role === 'admin') {
    return {
      name: 'Админ хэрэглэгч',
      label: 'Платформын хяналт',
      profileHref: '/admin/profile',
      settingsHref: '/admin/settings',
    };
  }
  if (role === 'driver') {
    return {
      name: 'Бат Болд',
      label: 'Жолооч',
    };
  }
  if (role === 'traveler') {
    return {
      name: 'Сарангэрэл Цэцэг',
      label: 'Аялагч',
    };
  }
  return {
    name: 'Дорж Цэцэг',
    label: 'Дайвар ачаа',
  };
}
