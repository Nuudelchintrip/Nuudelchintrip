import {
  AlertTriangle,
  CheckCircle,
  CreditCard,
  Eye,
  FileCheck2,
  Flag,
  PackageCheck,
  ShieldCheck,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { AppFooter } from '../components/Footer';
import { Sidebar } from '../components/Sidebar';
import { bookings, reports, users } from '../data/mockData';
import { getDashboardMenu } from '../navigation/dashboardMenus';

const verificationQueue = [
  {
    id: 'DRV-204',
    name: 'Мөнх-Эрдэнэ',
    type: 'Жолооч verification',
    phone: '+976 9090 9090',
    detail: 'Toyota Prius · B ангилал · ID/license upload хүлээгдэж байна',
    risk: 'Дунд',
  },
  {
    id: 'DRV-118',
    name: 'Оюунбат Ням',
    type: 'Машины мэдээлэл',
    phone: '+976 9191 2020',
    detail: 'SUV · улсын дугаар баталгаажуулах шаардлагатай',
    risk: 'Бага',
  },
];

const cargoQueue = [
  {
    id: 'CR-018',
    sender: 'Дорж Цэцэг',
    route: 'Улаанбаатар → Дархан',
    cargo: 'Баримт бичиг',
    proof: 'Pickup proof missing',
    status: 'Жолооч accept хүлээгдэж байна',
  },
  {
    id: 'CR-021',
    sender: 'Мөнх-Эрдэнэ',
    route: 'Улаанбаатар → Эрдэнэт',
    cargo: 'Жижиг хайрцаг',
    proof: 'Delivery code pending',
    status: 'Замд явж байна',
  },
];

const auditLog = [
  { time: '10:24', actor: 'Admin', action: 'BK-001 payment proof шалгасан', tone: 'warning' },
  { time: '09:48', actor: 'System', action: 'DRV-204 verification queue-д орсон', tone: 'info' },
  { time: '09:15', actor: 'Admin', action: 'RP-001 dispute evidence нээсэн', tone: 'danger' },
];

export function AdminDashboard() {
  const pendingPayments = bookings.filter((booking) => booking.payment.status === 'pending');
  const verifiedUsers = users.filter((user) => user.verified);
  const pendingUsers = users.filter((user) => !user.verified);

  const stats = [
    { label: 'Нийт хэрэглэгч', value: users.length.toString(), color: 'bg-primary', icon: <Users className="w-5 h-5" />, href: '/admin/users' },
    { label: 'Батлах төлбөр', value: pendingPayments.length.toString(), color: 'bg-warning', icon: <CreditCard className="w-5 h-5" />, href: '/admin/payments' },
    { label: 'Driver verification', value: verificationQueue.length.toString(), color: 'bg-success', icon: <ShieldCheck className="w-5 h-5" />, href: '/admin/verifications' },
    { label: 'Маргаан', value: reports.length.toString(), color: 'bg-destructive', icon: <Flag className="w-5 h-5" />, href: '/admin/reports' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar menuItems={getDashboardMenu('admin')} />

      <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="info" className="mb-3">Admin control center</Badge>
            <h1 className="text-3xl font-bold text-foreground mb-2">Админ хянах самбар</h1>
            <p className="max-w-3xl text-muted-foreground">
              Төлбөрийн proof, жолоочийн verification, booking moderation, дайвар ачаа, report/dispute-г нэг дор хянана.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => window.location.href = '/admin/verifications'}>
              <ShieldCheck className="h-4 w-4" />
              Verification queue
            </Button>
            <Button onClick={() => window.location.href = '/admin/payments'}>
              <CreditCard className="h-4 w-4" />
              Payment approve
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} hover className="cursor-pointer" onClick={() => window.location.href = stat.href}>
              <CardBody className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.color}/10 rounded-lg flex items-center justify-center`}>
                    <div className={stat.color.replace('bg-', 'text-')}>{stat.icon}</div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <Card className="mb-8 border-warning/20 bg-warning/5">
          <CardBody className="p-6">
            <div className="grid gap-5 lg:grid-cols-[1fr_280px] lg:items-center">
              <div className="flex gap-4">
                <AlertTriangle className="mt-1 h-6 w-6 shrink-0 text-warning" />
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Өнөөдрийн priority</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Payment proof approve хийвэл booking confirmed болно. Driver verification approve хийвэл route нийтлэх эрх нээгдэнэ.
                    Report/dispute дээр evidence timeline заавал шалгана.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <MiniMetric label="Payment" value={pendingPayments.length} />
                <MiniMetric label="Verify" value={verificationQueue.length} />
                <MiniMetric label="Dispute" value={reports.length} />
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="grid gap-8 xl:grid-cols-[1.35fr_0.9fr]">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Төлбөр батлах queue</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Approve хийвэл booking status: payment_review → confirmed</p>
                </div>
                <Badge variant="warning">{pendingPayments.length} хүлээгдэж буй</Badge>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <TableHead>Booking</TableHead>
                      <TableHead>Аялагч / жолооч</TableHead>
                      <TableHead>Дүн</TableHead>
                      <TableHead>Proof</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Үйлдэл</TableHead>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-muted/30">
                        <td className="px-6 py-4">
                          <button className="font-medium text-primary hover:underline" onClick={() => window.location.href = `/dashboard/bookings/${booking.id}`}>
                            {booking.id}
                          </button>
                          <p className="mt-1 text-xs text-muted-foreground">{booking.route.from} → {booking.route.to}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-foreground">{booking.passenger.name}</p>
                          <p className="text-xs text-muted-foreground">{booking.driver.name}</p>
                        </td>
                        <td className="px-6 py-4 font-semibold text-foreground">₮{booking.price.total.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-mono text-foreground">{booking.payment.transactionCode}</p>
                          <p className="text-xs text-muted-foreground">{booking.payment.screenshotName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={booking.payment.status === 'approved' ? 'success' : 'warning'}>
                            {booking.payment.status === 'approved' ? 'Батлагдсан' : 'Хүлээгдэж буй'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => window.location.href = `/dashboard/bookings/${booking.id}/payment-proof`}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="primary" size="sm">
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </Button>
                            <Button variant="outline" size="sm">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>

          <div className="space-y-6">
            <QueueCard
              title="Жолоочийн verification"
              badge={`${verificationQueue.length} pending`}
              icon={<ShieldCheck className="h-5 w-5" />}
              href="/admin/verifications"
              items={verificationQueue.map((item) => ({
                id: item.id,
                title: item.name,
                meta: item.detail,
                badge: item.risk,
              }))}
            />

            <QueueCard
              title="Дайвар ачааны moderation"
              badge={`${cargoQueue.length} active`}
              icon={<PackageCheck className="h-5 w-5" />}
              href="/admin/cargo"
              items={cargoQueue.map((item) => ({
                id: item.id,
                title: item.route,
                meta: `${item.sender} · ${item.cargo} · ${item.proof}`,
                badge: item.status,
              }))}
            />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Хэрэглэгчид</h2>
                <Badge variant={pendingUsers.length ? 'warning' : 'success'}>{pendingUsers.length} pending</Badge>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <TableHead>Нэр</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Verification</TableHead>
                      <TableHead>Аялал</TableHead>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/30">
                        <td className="px-6 py-4">
                          <p className="font-medium text-foreground">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.phone}</p>
                        </td>
                        <td className="px-6 py-4"><Badge variant="default">{user.role}</Badge></td>
                        <td className="px-6 py-4">
                          {user.verified ? <Badge variant="success">Verified</Badge> : <Badge variant="warning">Pending</Badge>}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{user.completedTrips}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Reports / disputes</h2>
                <Badge variant="danger">{reports.length} шинэ</Badge>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <p className="font-semibold text-foreground">{report.reason}</p>
                        <p className="text-sm text-muted-foreground">{report.bookingId} · {report.date}</p>
                      </div>
                      <Badge variant="warning">Pending</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {report.reportedBy} хэрэглэгч {report.reportedUser}-г мэдэгдсэн.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => window.location.href = `/dashboard/bookings/${report.bookingId}`}>
                        <TrendingUp className="w-4 h-4" />
                        Evidence харах
                      </Button>
                      <Button variant="primary" size="sm">Шийдвэрлэх</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <h2 className="text-xl font-semibold text-foreground">Admin audit log</h2>
          </CardHeader>
          <CardBody>
            <div className="grid gap-3">
              {auditLog.map((log) => (
                <div key={`${log.time}-${log.action}`} className="flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-foreground">{log.action}</p>
                    <p className="text-sm text-muted-foreground">{log.actor} · {log.time}</p>
                  </div>
                  <Badge variant={log.tone as 'warning' | 'info' | 'danger'}>{log.tone}</Badge>
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

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function TableHead({ children }: { children: ReactNode }) {
  return <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{children}</th>;
}

function QueueCard({
  title,
  badge,
  icon,
  href,
  items,
}: {
  title: string;
  badge: string;
  icon: ReactNode;
  href: string;
  items: { id: string; title: string; meta: string; badge: string }[];
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-primary">{icon}</span>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          </div>
          <Badge variant="info">{badge}</Badge>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge variant="default">{item.id}</Badge>
                  <p className="mt-2 font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.meta}</p>
                </div>
                <Badge variant="warning">{item.badge}</Badge>
              </div>
            </div>
          ))}
        </div>
        <Button className="mt-4" variant="outline" fullWidth onClick={() => window.location.href = href}>
          Дэлгэрэнгүй шалгах
        </Button>
      </CardBody>
    </Card>
  );
}
