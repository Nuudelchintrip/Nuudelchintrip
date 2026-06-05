import { Car, FileCheck2, Inbox, Route, ShieldCheck } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { AppFooter } from '../components/Footer';
import { Sidebar } from '../components/Sidebar';
import { getDashboardMenu } from '../navigation/dashboardMenus';
import { getStoredUser } from '../utils/auth';

export function DriverDashboard() {
  const user = getStoredUser();
  const isApproved = user?.verification_status === 'approved';

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar menuItems={getDashboardMenu('driver')} />

      <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <Badge variant="success" className="mb-3">Жолоочийн самбар</Badge>
          <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">
            {user?.full_name ? `${user.full_name}, чиглэлээ удирдаарай` : 'Чиглэлээ удирдаарай'}
          </h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Энэ самбар дээр зөвхөн таны бодитоор нийтэлсэн чиглэл, ирсэн хүсэлт, төлбөрийн мэдээлэл харагдана.
          </p>
        </div>

        {!isApproved && (
          <Card className="mb-8 border-warning/30 bg-warning/5">
            <CardBody className="p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold text-foreground">Жолоочийн баталгаажуулалт шаардлагатай</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Админ баталгаажуулалтыг зөвшөөрсний дараа чиглэл нийтлэх эрх нээгдэнэ.
                  </p>
                </div>
                <Button variant="outline" onClick={() => window.location.href = '/dashboard/driver/verification'}>
                  Баталгаажуулалт шалгах
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardBody className="p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Route className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-foreground">Таны эхний үйлдэл: чиглэл нэмэх</h2>
                <p className="mt-2 text-muted-foreground">
                  Хөдлөх огноо, цаг, сул суудал, үнэ, авах/буух цэгээ оруулж бодит чиглэл нийтэлнэ.
                </p>
              </div>
              <Button className="w-full sm:w-auto" onClick={() => window.location.href = '/driver/add-route'} disabled={!isApproved}>
                Чиглэл нэмэх
              </Button>
            </div>
          </CardBody>
        </Card>

        <div className="grid gap-6 lg:grid-cols-4">
          <EmptyPanel icon={<Car className="h-6 w-6" />} title="Миний чиглэлүүд" text="Нийтэлсэн чиглэлүүд энд харагдана." action="Харах" href="/dashboard/driver/routes" />
          <EmptyPanel icon={<Inbox className="h-6 w-6" />} title="Ирсэн хүсэлтүүд" text="Аялагчийн суудлын хүсэлтүүд бодитоор ирэх үед энд харагдана." action="Харах" href="/driver/requests" />
          <EmptyPanel icon={<FileCheck2 className="h-6 w-6" />} title="Дайвар ачаа" text="Зөвхөн ачаа авах боломжтой чиглэл дээр ирсэн хүсэлтүүд харагдана." action="Харах" href="/driver/cargo-requests" />
          <EmptyPanel icon={<ShieldCheck className="h-6 w-6" />} title="Баталгаажуулалт" text={isApproved ? 'Жолоочийн эрх зөвшөөрөгдсөн төлөвтэй байна.' : 'Жолоочийн эрх хараахан нээгдээгүй байна.'} />
        </div>

        <AppFooter />
      </main>
    </div>
  );
}

function EmptyPanel({ icon, title, text, action, href }: { icon: JSX.Element; title: string; text: string; action?: string; href?: string }) {
  return (
    <Card className="p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h2 className="mt-5 text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-2 min-h-16 text-sm leading-6 text-muted-foreground">{text}</p>
      {action && href && (
        <Button className="mt-5" variant="outline" fullWidth onClick={() => window.location.href = href}>
          {action}
        </Button>
      )}
    </Card>
  );
}
