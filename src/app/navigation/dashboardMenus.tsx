import { Banknote, Box, Bus, CreditCard, LayoutDashboard, PackageCheck, PackagePlus, Route, Search, Settings, ShieldCheck, UserCircle, UsersRound } from 'lucide-react';

export type DashboardRole = 'sender' | 'traveler' | 'driver' | 'admin';

export function getDashboardMenu(role: DashboardRole) {
  if (role === 'sender') {
    return [
      { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Самбар', href: '/dashboard/cargo' },
      { icon: <PackagePlus className="h-5 w-5" />, label: 'Ачаа илгээх', href: '/cargo/find-routes' },
      { icon: <Box className="h-5 w-5" />, label: 'Миний ачаа', href: '/dashboard/cargo/requests' },
      { icon: <UserCircle className="h-5 w-5" />, label: 'Бүртгэл', href: '/dashboard/cargo/profile' },
      { icon: <Settings className="h-5 w-5" />, label: 'Тохиргоо', href: '/dashboard/cargo/settings' },
    ];
  }

  if (role === 'traveler') {
    return [
      { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Самбар', href: '/dashboard/traveler' },
      { icon: <Search className="h-5 w-5" />, label: 'Жолооч хайх', href: '/traveler/find-drivers' },
      { icon: <Bus className="h-5 w-5" />, label: 'Миний аялал', href: '/dashboard/traveler/trips' },
      { icon: <UserCircle className="h-5 w-5" />, label: 'Бүртгэл', href: '/dashboard/traveler/profile' },
      { icon: <Settings className="h-5 w-5" />, label: 'Тохиргоо', href: '/dashboard/traveler/settings' },
    ];
  }

  if (role === 'driver') {
    return [
      { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Самбар', href: '/dashboard/driver' },
      { icon: <Route className="h-5 w-5" />, label: 'Чиглэл', href: '/dashboard/driver/routes' },
      { icon: <UsersRound className="h-5 w-5" />, label: 'Хүсэлтүүд', href: '/driver/requests' },
      { icon: <Banknote className="h-5 w-5" />, label: 'Орлого', href: '/dashboard/driver/earnings' },
      { icon: <UserCircle className="h-5 w-5" />, label: 'Бүртгэл', href: '/dashboard/driver/profile' },
      { icon: <Settings className="h-5 w-5" />, label: 'Тохиргоо', href: '/dashboard/driver/settings' },
    ];
  }

  return [
    { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Админ', href: '/admin' },
    { icon: <UsersRound className="h-5 w-5" />, label: 'Хэрэглэгчид', href: '/admin/users' },
    { icon: <ShieldCheck className="h-5 w-5" />, label: 'Баталгаажуулалт', href: '/admin/verifications' },
    { icon: <CreditCard className="h-5 w-5" />, label: 'Төлбөр', href: '/admin/payments' },
    { icon: <Route className="h-5 w-5" />, label: 'Чиглэл', href: '/admin/routes' },
    { icon: <PackageCheck className="h-5 w-5" />, label: 'Ачаа', href: '/admin/cargo' },
  ];
}
