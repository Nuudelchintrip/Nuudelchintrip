import { Banknote, Box, Bus, CreditCard, FileCheck2, Flag, LayoutDashboard, PackageCheck, PackagePlus, Route, Search, Settings, ShieldCheck, Star, UserCircle, UsersRound } from 'lucide-react';

export type DashboardRole = 'sender' | 'traveler' | 'driver' | 'admin';

export function getDashboardMenu(role: DashboardRole) {
  if (role === 'sender') {
    return [
      { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Самбар', href: '/dashboard/cargo' },
      { icon: <PackagePlus className="h-5 w-5" />, label: 'Ачаа илгээх', href: '/cargo/find-routes' },
      { icon: <Box className="h-5 w-5" />, label: 'Миний ачаа', href: '/dashboard/cargo/requests' },
      { icon: <ShieldCheck className="h-5 w-5" />, label: 'Delivery code', href: '/dashboard/cargo/status' },
      { icon: <FileCheck2 className="h-5 w-5" />, label: 'Төлбөрийн баримт', href: '/dashboard/cargo/proof' },
      { icon: <Flag className="h-5 w-5" />, label: 'Ачааны дүрэм', href: '/dashboard/cargo/rules' },
      { icon: <UserCircle className="h-5 w-5" />, label: 'Profile', href: '/dashboard/cargo/profile' },
      { icon: <Settings className="h-5 w-5" />, label: 'Settings', href: '/dashboard/cargo/settings' },
    ];
  }

  if (role === 'traveler') {
    return [
      { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Самбар', href: '/dashboard/traveler' },
      { icon: <Search className="h-5 w-5" />, label: 'Жолооч хайх', href: '/traveler/find-drivers' },
      { icon: <Bus className="h-5 w-5" />, label: 'Миний аялал', href: '/dashboard/traveler/trips' },
      { icon: <CreditCard className="h-5 w-5" />, label: 'Төлбөрийн баримт', href: '/dashboard/bookings/BK-001/payment-proof' },
      { icon: <Star className="h-5 w-5" />, label: 'Үнэлгээ', href: '/dashboard/traveler/reviews' },
      { icon: <UserCircle className="h-5 w-5" />, label: 'Profile', href: '/dashboard/traveler/profile' },
      { icon: <Settings className="h-5 w-5" />, label: 'Settings', href: '/dashboard/traveler/settings' },
    ];
  }

  if (role === 'driver') {
    return [
      { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Самбар', href: '/dashboard/driver' },
      { icon: <Route className="h-5 w-5" />, label: 'Чиглэл нэмэх', href: '/driver/add-route' },
      { icon: <Route className="h-5 w-5" />, label: 'Миний чиглэлүүд', href: '/dashboard/driver/routes' },
      { icon: <UsersRound className="h-5 w-5" />, label: 'Ирсэн хүсэлтүүд', href: '/driver/requests' },
      { icon: <Box className="h-5 w-5" />, label: 'Дайвар ачааны хүсэлтүүд', href: '/dashboard/driver/cargo-requests' },
      { icon: <Banknote className="h-5 w-5" />, label: 'Орлого', href: '/dashboard/driver/earnings' },
      { icon: <ShieldCheck className="h-5 w-5" />, label: 'Verification', href: '/dashboard/driver/verification' },
      { icon: <UserCircle className="h-5 w-5" />, label: 'Profile', href: '/dashboard/driver/profile' },
      { icon: <Settings className="h-5 w-5" />, label: 'Settings', href: '/dashboard/driver/settings' },
    ];
  }

  return [
    { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Admin overview', href: '/admin' },
    { icon: <UsersRound className="h-5 w-5" />, label: 'Users', href: '/admin/users' },
    { icon: <ShieldCheck className="h-5 w-5" />, label: 'Verifications', href: '/admin/verifications' },
    { icon: <CreditCard className="h-5 w-5" />, label: 'Payments', href: '/admin/payments' },
    { icon: <Route className="h-5 w-5" />, label: 'Routes', href: '/admin/routes' },
    { icon: <Bus className="h-5 w-5" />, label: 'Bookings', href: '/admin/bookings' },
    { icon: <PackageCheck className="h-5 w-5" />, label: 'Cargo requests', href: '/admin/cargo' },
    { icon: <Flag className="h-5 w-5" />, label: 'Reports', href: '/admin/reports' },
    { icon: <Settings className="h-5 w-5" />, label: 'Settings', href: '/admin/settings' },
  ];
}
