import { Banknote, Car, CheckCircle, ShieldCheck, Star, UsersRound } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { AppFooter } from '../components/Footer';
import { Sidebar } from '../components/Sidebar';
import { getDashboardMenu } from '../navigation/dashboardMenus';

const stats = [
  { label: 'Идэвхтэй маршрут', value: '3', tone: 'bg-primary', icon: <Car className="w-5 h-5" /> },
  { label: 'Ирсэн хүсэлт', value: '7', tone: 'bg-warning', icon: <UsersRound className="w-5 h-5" /> },
  { label: 'Таарсан аялал', value: '12', tone: 'bg-success', icon: <ShieldCheck className="w-5 h-5" /> },
  { label: 'Нийт орлого', value: '₮620k', tone: 'bg-accent', icon: <Banknote className="w-5 h-5" /> },
];

const travelerRequests = [
  {
    id: 1,
    traveler: 'Оюун Наран',
    route: 'Улаанбаатар → Дархан',
    need: '1 суудал, 1 жижиг цүнх',
    note: '09:00-10:00 хооронд хөдөлвөл тохирно. Зорчигчийн суудал гол хэрэгцээ.',
    price: 18000,
  },
  {
    id: 2,
    traveler: 'Сарангэрэл Цэцэг',
    route: 'Улаанбаатар → Эрдэнэт',
    need: 'Route match, pickup уян хатан',
    note: 'Эрдэнэт хүртэл хамт явах жолооч хайж байна. Pickup цэг уян хатан.',
    price: 25000,
  },
];

const activeRoutes = [
  { route: 'Улаанбаатар → Дархан', date: '2026-05-25', capacity: '2 суудал, 10 кг', status: 'Нээлттэй' },
  { route: 'Улаанбаатар → Сэлэнгэ', date: '2026-05-27', capacity: '1 суудал, 15 кг', status: 'Match pending' },
];

export function DriverDashboard() {
  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar menuItems={getDashboardMenu('driver')} />

      <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <Badge variant="success" className="mb-3">Driver dashboard</Badge>
          <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">Жолоочийн хянах самбар</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Машинаар явах маршрутаа нийтэлж, хамгийн түрүүнд аялагчийн хүсэлт болон суудлын тохирлыг харна.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:mb-8 xl:grid-cols-4 xl:gap-6">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardBody className="p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="mt-1 text-3xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.tone}/10`}>
                    <div className={stat.tone.replace('bg-', 'text-')}>{stat.icon}</div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <Card className="mb-8 border-success/20 bg-success/5">
          <CardBody className="p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <Badge variant="success">Гол урсгал</Badge>
                <h2 className="mt-3 text-2xl font-semibold text-foreground">Аялагчийн хүсэлтүүд эхэнд</h2>
                <p className="mt-2 text-muted-foreground">Жолоочийн хувьд зорчигч, route match, суудлын тохирол хамгийн түрүүнд харагдана.</p>
              </div>
              <Button className="w-full sm:w-auto" onClick={() => window.location.href = '/driver/requests'}>
                Ирсэн хүсэлтүүд
              </Button>
            </div>
          </CardBody>
        </Card>

        <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold text-foreground">Шинэ аялагчийн хүсэлтүүд</h2>
                <Badge variant="warning">{travelerRequests.length} шинэ</Badge>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {travelerRequests.map((request) => (
                  <Card key={request.id} className="border-2 p-5">
                    <div className="grid gap-5 lg:grid-cols-[1fr_190px] lg:items-center">
                      <div>
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Badge variant="info">Аялагч</Badge>
                          <Badge variant="default">{request.need}</Badge>
                        </div>
                        <h3 className="text-xl font-semibold text-foreground">{request.route}</h3>
                        <p className="mt-1 font-medium text-foreground">{request.traveler}</p>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">{request.note}</p>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-4">
                        <p className="text-sm text-muted-foreground">Санал</p>
                        <p className="mt-1 text-2xl font-bold text-primary">₮{request.price.toLocaleString()}</p>
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                          <Button className="w-full sm:w-auto" size="sm" onClick={() => window.location.href = `/dashboard/driver/requests/${request.id}/accept`}>
                            <CheckCircle className="h-4 w-4" />
                            Зөвшөөрөх
                          </Button>
                          <Button className="w-full sm:w-auto" size="sm" variant="outline" onClick={() => window.location.href = `/dashboard/driver/requests/${request.id}/reject`}>Татгалзах</Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardBody>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-foreground">Миний маршрутууд</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {activeRoutes.map((route) => (
                    <div key={route.route} className="rounded-lg border border-border p-4">
                      <Badge variant={route.status === 'Нээлттэй' ? 'success' : 'warning'}>{route.status}</Badge>
                      <p className="mt-3 font-semibold text-foreground">{route.route}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{route.date} - {route.capacity}</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card className="bg-warning/5 border-warning/20">
              <CardBody className="p-6">
                <Star className="h-8 w-8 fill-warning text-warning" />
                <p className="mt-3 text-3xl font-bold text-foreground">4.9 / 5.0</p>
                <p className="mt-1 text-sm text-muted-foreground">31 үнэлгээнээс</p>
                <Button className="mt-5" variant="outline" fullWidth onClick={() => window.location.href = '/dashboard/driver/reviews'}>
                  Үнэлгээ харах
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>
        <AppFooter />
      </main>
    </div>
  );
}
