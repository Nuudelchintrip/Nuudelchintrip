import { useState, type ReactNode } from 'react';
import { CircleHelp, LogOut, Menu, ShieldCheck, UserCircle, X } from 'lucide-react';
import { useLocation } from 'react-router';
import type { DashboardRole } from '../navigation/dashboardMenus';
import { logoutFromSupabase } from '../services/supabaseAuth';
import { getRoleLabel, getStoredUser } from '../utils/auth';
import { Logo } from './Logo';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from './ThemeToggle';

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
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar/95 px-3.5 backdrop-blur md:hidden">
        <a href="/" aria-label="NuudelchinTrip нүүр">
            <Logo size="sm" />
        </a>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            type="button"
            aria-label="Цэс нээх"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar text-sidebar-foreground"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Дэлгэцийн баруун дээд булан — самбарын бүх хуудсанд мэдэгдлийн хонх. */}
      <div className="fixed right-4 top-4 z-40 hidden md:block lg:right-6 lg:top-5">
        <NotificationBell />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Цэсний арын хэсгийг хаах"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-[86vw] max-w-[19rem] flex-col bg-sidebar shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3.5">
              <a href="/" aria-label="NuudelchinTrip нүүр">
              <Logo size="sm" />
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

            <div className="border-b border-sidebar-border p-2.5">
              <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <UserCircle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold leading-5 text-foreground">{account.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{account.label}</p>
                  </div>
                </div>
              </div>
            </div>

            <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
              {menuItems.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className={`flex min-h-10 items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] leading-5 transition-colors [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 ${
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

      <aside className="hidden w-64 shrink-0 bg-sidebar border-r border-sidebar-border md:flex flex-col h-screen sticky top-0 lg:w-72">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-sidebar-border">
        <a href="/" aria-label="NuudelchinTrip нүүр">
            <Logo size="md" />
        </a>
        <div className="mt-3 rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-5 text-foreground">{account.name}</p>
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
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm leading-5 transition-colors [&_svg]:h-[18px] [&_svg]:w-[18px] [&_svg]:shrink-0 ${
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
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm leading-5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <CircleHelp className="h-4 w-4 shrink-0" />
        <span className="font-medium leading-5">Тусламж</span>
      </a>
      <a
        href="/safety"
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm leading-5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <ShieldCheck className="h-4 w-4 shrink-0" />
        <span className="font-medium leading-5">Аюулгүй байдал</span>
      </a>
      <ThemeToggle showLabel className="border-0 bg-transparent text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
      <button
        type="button"
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm leading-5 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        onClick={async () => {
          try {
            await logoutFromSupabase();
          } finally {
            window.location.href = '/auth/login';
          }
        }}
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
  const storedUser = getStoredUser();
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
      name: storedUser?.full_name || 'Админ хэрэглэгч',
      label: 'Платформын хяналт',
      profileHref: '/admin/profile',
      settingsHref: '/admin/settings',
    };
  }
  if (role === 'driver') {
    return {
      name: storedUser?.full_name || 'Жолооч',
      label: getRoleLabel('driver'),
    };
  }
  if (role === 'traveler') {
    return {
      name: storedUser?.full_name || 'Аялагч',
      label: getRoleLabel('traveler'),
    };
  }
  return {
    name: storedUser?.full_name || 'Дайвар ачаа илгээгч',
    label: getRoleLabel('cargo_sender'),
  };
}
