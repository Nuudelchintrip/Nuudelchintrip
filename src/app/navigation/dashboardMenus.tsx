import { Banknote, Box, Bus, CreditCard, FileCheck2, Flag, LayoutDashboard, ListChecks, PackageCheck, PackagePlus, Route, Search, Settings, ShieldCheck, Star, UserCircle, UsersRound } from 'lucide-react';

export type DashboardRole = 'sender' | 'traveler' | 'driver' | 'admin';

export function getDashboardMenu(role: DashboardRole) {
  if (role === 'sender') {
    return [
      { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Самбар', href: '/dashboard/cargo' },
      { icon: <PackagePlus className="h-5 w-5" />, label: 'Ачаа илгээх', href: '/cargo/find-routes' },
      { icon: <Box className="h-5 w-5" />, label: 'Миний ачаа', href: '/dashboard/cargo/requests' },
      { icon: <ShieldCheck className="h-5 w-5" />, label: 'Хүргэлтийн код', href: '/dashboard/cargo/status' },
      { icon: <FileCheck2 className="h-5 w-5" />, label: 'Төлбөрийн баримт', href: '/dashboard/cargo/proof' },
      { icon: <Flag className="h-5 w-5" />, label: 'Ачааны дүрэм', href: '/dashboard/cargo/rules' },
      { icon: <UserCircle className="h-5 w-5" />, label: 'Хувийн мэдээлэл', href: '/dashboard/cargo/profile' },
      { icon: <Settings className="h-5 w-5" />, label: 'Тохиргоо', href: '/dashboard/cargo/settings' },
    ];
  }

  if (role === 'traveler') {
    return [
      { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Самбар', href: '/dashboard/traveler' },
      { icon: <Search className="h-5 w-5" />, label: 'Жолооч хайх', href: '/traveler/find-drivers' },
      { icon: <Bus className="h-5 w-5" />, label: 'Миний аялал', href: '/dashboard/traveler/trips' },
      { icon: <CreditCard className="h-5 w-5" />, label: 'Төлбөрийн баримт', href: '/dashboard/bookings/BK-001/payment-proof' },
      { icon: <Star className="h-5 w-5" />, label: 'Үнэлгээ', href: '/dashboard/traveler/reviews' },
      { icon: <UserCircle className="h-5 w-5" />, label: 'Хувийн мэдээлэл', href: '/dashboard/traveler/profile' },
      { icon: <Settings className="h-5 w-5" />, label: 'Тохиргоо', href: '/dashboard/traveler/settings' },
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
      { icon: <ShieldCheck className="h-5 w-5" />, label: 'Баталгаажуулалт', href: '/dashboard/driver/verification' },
      { icon: <UserCircle className="h-5 w-5" />, label: 'Хувийн мэдээлэл', href: '/dashboard/driver/profile' },
      { icon: <Settings className="h-5 w-5" />, label: 'Тохиргоо', href: '/dashboard/driver/settings' },
    ];
  }

  return [
    { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Админ самбар', href: '/admin' },
    { icon: <UsersRound className="h-5 w-5" />, label: 'Хэрэглэгчид', href: '/admin/users' },
    { icon: <ShieldCheck className="h-5 w-5" />, label: 'Баталгаажуулалт', href: '/admin/verifications' },
    { icon: <CreditCard className="h-5 w-5" />, label: 'Төлбөрүүд', href: '/admin/payments' },
    { icon: <Route className="h-5 w-5" />, label: 'Чиглэлүүд', href: '/admin/routes' },
    { icon: <Bus className="h-5 w-5" />, label: 'Захиалгууд', href: '/admin/bookings' },
    { icon: <PackageCheck className="h-5 w-5" />, label: 'Ачааны хүсэлтүүд', href: '/admin/cargo' },
    { icon: <Flag className="h-5 w-5" />, label: 'Гомдол, маргаан', href: '/admin/reports' },
    { icon: <ListChecks className="h-5 w-5" />, label: 'Үйлдлийн түүх', href: '/admin/logs' },
    { icon: <Settings className="h-5 w-5" />, label: 'Тохиргоо', href: '/admin/settings' },
  ];
}
