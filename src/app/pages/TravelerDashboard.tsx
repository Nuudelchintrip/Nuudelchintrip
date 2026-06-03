import { Bus, CheckCircle, ShieldCheck, UsersRound } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { AppFooter } from '../components/Footer';
import { Sidebar } from '../components/Sidebar';
import { getDashboardMenu } from '../navigation/dashboardMenus';

const stats = [
  { label: 'Идэвхтэй аялал', value: '2', tone: 'bg-primary', icon: <Bus className="w-5 h-5" /> },
  { label: 'Жолоочийн санал', value: '5', tone: 'bg-warning', icon: <UsersRound className="w-5 h-5" /> },
  { label: 'Таарсан чиглэл', value: '8', tone: 'bg-success', icon: <ShieldCheck className="w-5 h-5" /> },
  { label: 'Баталгаажсан жолооч', value: '12', tone: 'bg-accent', icon: <ShieldCheck className="w-5 h-5" /> },
];

const driverOffers = [
  {
    id: 1,
    driver: 'Бат Болд',
    route: 'Улаанбаатар → Дархан',
    vehicle: 'SUV, 2 сул суудал',
    note: '09:00 хөдөлнө. Дархан хүртэл шууд явна, 2 сул суудалтай.',
    price: 18000,
  },
  {
    id: 2,
    driver: 'Ганбаатар Дорж',
    route: 'Улаанбаатар → Сэлэнгэ',
    vehicle: 'Фургон, замын дагуу pickup',
    note: 'Аялагч авах боломжтой. Pickup цэг болон явах цаг уян хатан.',
    price: 22000,
  },
];

const upcomingTrips = [
  { route: 'Улаанбаатар → Дархан', date: '2026-05-25', match: 'Бат Болд жолооч', status: 'Жолооч таарсан' },
  { route: 'Улаанбаатар → Эрдэнэт', date: '2026-05-28', match: '3 санал ирсэн', status: 'Санал шалгах' },
];

export function TravelerDashboard() {
  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar menuItems={getDashboardMenu('traveler')} />

      <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <Badge variant="info" className="mb-3">Traveler dashboard</Badge>
          <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">Аялагчийн хянах самбар</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Та хаашаа явахаа хайж, тохирох жолоочийн санал, суудал, үнэ, route match-уудыг ялгаж харна.
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

        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardBody className="p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <Badge variant="success">Гол урсгал</Badge>
                <h2 className="mt-3 text-2xl font-semibold text-foreground">Жолоочтой таарах хүсэлтүүд эхэнд</h2>
                <p className="mt-2 text-muted-foreground">Аялагчийн хувьд хамгийн түрүүнд жолоочийн санал, суудал, цаг, route тохирол харагдана.</p>
              </div>
              <Button className="w-full sm:w-auto" onClick={() => window.location.href = '/traveler/find-drivers'}>
                Жолооч хайх
              </Button>
            </div>
          </CardBody>
        </Card>

        <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold text-foreground">Шинэ жолоочийн саналууд</h2>
                <Badge variant="warning">{driverOffers.length} шинэ</Badge>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {driverOffers.map((offer) => (
                  <Card key={offer.id} className="border-2 p-5">
                    <div className="grid gap-5 lg:grid-cols-[1fr_190px] lg:items-center">
                      <div>
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Badge variant="success">Жолооч</Badge>
                          <Badge variant="default">{offer.vehicle}</Badge>
                        </div>
                        <h3 className="text-xl font-semibold text-foreground">{offer.route}</h3>
                        <p className="mt-1 font-medium text-foreground">{offer.driver}</p>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">{offer.note}</p>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-4">
                        <p className="text-sm text-muted-foreground">Санал</p>
                        <p className="mt-1 text-2xl font-bold text-primary">₮{offer.price.toLocaleString()}</p>
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                          <Button className="w-full sm:w-auto" size="sm" onClick={() => window.location.href = `/dashboard/traveler/requests/${offer.id}/accept`}>
                            <CheckCircle className="h-4 w-4" />
                            Зөвшөөрөх
                          </Button>
                          <Button className="w-full sm:w-auto" size="sm" variant="outline" onClick={() => window.location.href = `/dashboard/traveler/requests/${offer.id}/reject`}>Татгалзах</Button>
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
                <h2 className="text-xl font-semibold text-foreground">Миний аяллууд</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {upcomingTrips.map((trip) => (
                    <div key={trip.route} className="rounded-lg border border-border p-4">
                      <Badge variant="info">{trip.status}</Badge>
                      <p className="mt-3 font-semibold text-foreground">{trip.route}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{trip.date} - {trip.match}</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardBody className="p-6">
                <ShieldCheck className="h-8 w-8 text-primary" />
                <p className="mt-3 text-xl font-semibold text-foreground">Аюулгүй зорчих мэдээлэл</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Жолоочийн verification, route match, pickup/dropoff тохирлыг шалгаад аяллаа баталгаажуулна.
                </p>
                <Button className="mt-5" variant="outline" fullWidth onClick={() => window.location.href = '/dashboard/traveler/profile'}>
                  Профайл шалгах
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
