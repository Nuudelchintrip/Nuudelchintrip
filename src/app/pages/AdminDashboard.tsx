import { CreditCard, Flag, Route, ShieldCheck, Users } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { AppFooter } from '../components/Footer';
import { Sidebar } from '../components/Sidebar';
import { getDashboardMenu } from '../navigation/dashboardMenus';

const adminAreas = [
  { title: 'Хэрэглэгчид', text: 'Бүртгэлтэй хэрэглэгч, role, suspension төлөвийг хянана.', href: '/admin/users', icon: <Users className="h-5 w-5" /> },
  { title: 'Баталгаажуулалт', text: 'Жолоочийн бичиг баримт, машины мэдээлэл, profile verification.', href: '/admin/verifications', icon: <ShieldCheck className="h-5 w-5" /> },
  { title: 'Төлбөрүүд', text: 'Төлбөрийн баримт илгээгдсэн үед зөвшөөрөх эсвэл буцаах шийдвэр гаргана.', href: '/admin/payments', icon: <CreditCard className="h-5 w-5" /> },
  { title: 'Чиглэлүүд', text: 'Жолоочийн нийтэлсэн чиглэлүүдийг шалгана.', href: '/admin/routes', icon: <Route className="h-5 w-5" /> },
  { title: 'Гомдол, маргаан', text: 'Report үүссэн үед нотолгоо, төлөв, шийдвэрийг хянана.', href: '/admin/reports', icon: <Flag className="h-5 w-5" /> },
];

export function AdminDashboard() {
  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar menuItems={getDashboardMenu('admin')} />

      <main className="mx-auto w-full max-w-6xl min-w-0 flex-1 overflow-x-hidden p-3.5 sm:p-5 md:p-8">
        <div className="mb-5 sm:mb-8">
          <Badge variant="info" className="mb-3">Админы хяналтын төв</Badge>
          <h1 className="text-2xl font-bold text-foreground sm:text-4xl">Админ самбар</h1>
          <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
            Энэ хэсэгт баталгаажуулалт, төлбөрийн баримт, гомдол, чиглэлийн хяналт зэрэг бодит хүсэлтүүд өгөгдлийн сангаас уншигдана.
            Одоогоор зохиомол queue, зохиомол хэрэглэгч, зохиомол төлбөр харуулахгүй.
          </p>
        </div>

        <Card className="mb-5 border-primary/20 bg-primary/5 p-4 sm:mb-8 sm:p-6">
          <h2 className="text-xl font-semibold text-foreground">Админы хийх үндсэн ажил</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Жолоочийн эрх зөвшөөрөгдсөний дараа чиглэл нийтлэх эрх нээгдэнэ. Төлбөрийн баримт баталгаажсаны дараа захиалга баталгаажна.
            Report үүсвэл админ нотолгоо шалгаж шийдвэр гаргана.
          </p>
        </Card>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {adminAreas.map((area) => (
            <Card key={area.title} className="p-4 sm:p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {area.icon}
              </div>
              <h2 className="mt-3 text-lg font-semibold text-foreground sm:mt-5 sm:text-xl">{area.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground sm:min-h-16">{area.text}</p>
              <Button className="mt-5" variant="outline" fullWidth onClick={() => window.location.href = area.href}>
                Харах
              </Button>
            </Card>
          ))}
        </div>

        <Card className="mt-5 p-5 text-center sm:mt-8 sm:p-8">
          <h2 className="text-xl font-semibold text-foreground">Одоогоор хүлээгдэж буй бодит зүйл алга</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Хэрэглэгч бодит чиглэл, захиалга, баримт, гомдол үүсгэсний дараа эдгээр жагсаалт өгөгдлийн сангаас дүүрнэ.
          </p>
        </Card>

        <AppFooter />
      </main>
    </div>
  );
}
