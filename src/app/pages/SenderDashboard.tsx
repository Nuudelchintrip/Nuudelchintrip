import { Package, Clock, CheckCircle } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { AppFooter } from '../components/Footer';
import { getDashboardMenu } from '../navigation/dashboardMenus';

export function SenderDashboard() {
  const stats = [
    { label: 'Идэвхтэй', value: '3', color: 'bg-primary', icon: <Clock className="w-5 h-5" /> },
    { label: 'Хүлээгдэж буй', value: '2', color: 'bg-warning', icon: <Clock className="w-5 h-5" /> },
    { label: 'Төлөгдсөн', value: '1', color: 'bg-success', icon: <CheckCircle className="w-5 h-5" /> },
    { label: 'Дууссан', value: '8', color: 'bg-muted-foreground', icon: <CheckCircle className="w-5 h-5" /> },
  ];

  const cargoList = [
    {
      id: 1,
      name: 'Баримт бичиг',
      route: 'Улаанбаатар → Дархан',
      date: '2026-05-25',
      status: 'pending',
      statusText: 'Хүсэлт илгээгдсэн',
      traveler: 'Бат Болд',
    },
    {
      id: 2,
      name: 'Хувцас',
      route: 'Улаанбаатар → Эрдэнэт',
      date: '2026-05-26',
      status: 'confirmed',
      statusText: 'Зөвшөөрөгдсөн',
      traveler: 'Сарангэрэл Цэцэг',
    },
    {
      id: 3,
      name: 'Электроник',
      route: 'Улаанбаатар → Сэлэнгэ',
      date: '2026-05-20',
      status: 'delivered',
      statusText: 'Хүргэгдсэн',
      traveler: 'Ганбат Дорж',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar menuItems={getDashboardMenu('sender')} />

      <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="mb-2 text-3xl font-bold leading-tight text-foreground sm:text-4xl">Дайвар ачааны самбар</h1>
          <p className="max-w-3xl leading-7 text-muted-foreground">Жолоочийн route дээр суурилсан жижиг ачааны хүсэлт, proof, delivery code-оо хянаарай.</p>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:mb-8 xl:grid-cols-4 xl:gap-6">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardBody className="p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.color}/10 rounded-xl flex items-center justify-center`}>
                    <div className={`${stat.color.replace('bg-', 'text-')}`}>
                      {stat.icon}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* My Cargo List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold text-foreground">Миний дайвар ачаа</h2>
              <Button className="w-full sm:w-auto" variant="primary" size="sm" onClick={() => window.location.href = '/cargo/find-routes'}>
                <Package className="w-4 h-4" />
                Ачаа авах route хайх
              </Button>
            </div>
          </CardHeader>
          <CardBody className="p-4 pt-0 sm:p-0">
            <div className="grid gap-3 sm:hidden">
              {cargoList.map((cargo) => (
                <div key={cargo.id} className="rounded-lg border border-border bg-muted/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{cargo.name}</p>
                      <p className="mt-1 text-sm leading-5 text-muted-foreground">{cargo.route}</p>
                    </div>
                    <Badge
                      variant={
                        cargo.status === 'pending' ? 'warning' :
                        cargo.status === 'confirmed' ? 'info' :
                        cargo.status === 'delivered' ? 'success' : 'default'
                      }
                    >
                      {cargo.statusText}
                    </Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Огноо</p>
                      <p className="mt-1 font-medium text-foreground">{cargo.date}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Жолооч / route</p>
                      <p className="mt-1 font-medium text-foreground">{cargo.traveler}</p>
                    </div>
                  </div>
                  <Button
                    className="mt-4"
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => window.location.href = `/cargo/${cargo.id}`}
                  >
                    Дэлгэрэнгүй
                  </Button>
                </div>
              ))}
            </div>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Ачаа
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Чиглэл
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Огноо
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Жолооч / route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Төлөв
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Үйлдэл
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cargoList.map((cargo) => (
                    <tr key={cargo.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{cargo.name}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {cargo.route}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {cargo.date}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {cargo.traveler}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            cargo.status === 'pending' ? 'warning' :
                            cargo.status === 'confirmed' ? 'info' :
                            cargo.status === 'delivered' ? 'success' : 'default'
                          }
                        >
                          {cargo.statusText}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.location.href = `/cargo/${cargo.id}`}
                        >
                          Дэлгэрэнгүй
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {/* Recent Activity */}
        <Card className="mt-8">
          <CardHeader>
            <h2 className="text-xl font-semibold text-foreground">Сүүлийн үйлдлүүд</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {[
                {
                  action: 'Хүргэлт дууслаа',
                  cargo: 'Электроник → Сэлэнгэ',
                  time: '2 цагийн өмнө',
                  icon: <CheckCircle className="w-5 h-5 text-success" />,
                },
                {
                  action: 'Хүсэлт зөвшөөрөгдсөн',
                  cargo: 'Хувцас → Эрдэнэт',
                  time: '5 цагийн өмнө',
                  icon: <CheckCircle className="w-5 h-5 text-primary" />,
                },
                {
                  action: 'Хүсэлт илгээгдсэн',
                  cargo: 'Баримт бичиг → Дархан',
                  time: '1 өдрийн өмнө',
                  icon: <Clock className="w-5 h-5 text-warning" />,
                },
              ].map((activity, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="mt-0.5">{activity.icon}</div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.cargo}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
        <AppFooter />
      </main>
    </div>
  );
}
