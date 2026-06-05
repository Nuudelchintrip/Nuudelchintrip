import { Bus, CreditCard, Search, ShieldCheck } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { AppFooter } from '../components/Footer';
import { Sidebar } from '../components/Sidebar';
import { getDashboardMenu } from '../navigation/dashboardMenus';
import { getStoredUser } from '../utils/auth';

export function TravelerDashboard() {
  const user = getStoredUser();

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar menuItems={getDashboardMenu('traveler')} />

      <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <Badge variant="info" className="mb-3">Аялагчийн самбар</Badge>
          <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">
            {user?.full_name ? `${user.full_name}, жолооч хайж эхлээрэй` : 'Жолооч хайж эхлээрэй'}
          </h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Энэ самбар дээр зөвхөн таны бодитоор үүсгэсэн захиалга, төлбөрийн баримт, аяллын төлөв харагдана.
          </p>
        </div>

        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardBody className="p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Search className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-foreground">Таны эхний үйлдэл: жолооч хайх</h2>
                <p className="mt-2 text-muted-foreground">
                  Хаанаас, хаашаа, хэдэн хүн явах мэдээллээ оруулаад зөвхөн бодитоор нийтлэгдсэн чиглэлүүдээс сонгоно.
                </p>
              </div>
              <Button className="w-full sm:w-auto" onClick={() => window.location.href = '/traveler/find-drivers'}>
                Жолооч хайх
              </Button>
            </div>
          </CardBody>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <EmptyPanel
            icon={<Bus className="h-6 w-6" />}
            title="Миний аялал"
            text="Захиалга үүссэний дараа таны аяллын төлөв энд харагдана."
            action="Жолооч хайх"
            href="/traveler/find-drivers"
          />
          <EmptyPanel
            icon={<CreditCard className="h-6 w-6" />}
            title="Төлбөрийн баримт"
            text="Жолооч хүсэлтийг зөвшөөрсний дараа төлбөрийн баримт оруулах алхам нээгдэнэ."
          />
          <EmptyPanel
            icon={<ShieldCheck className="h-6 w-6" />}
            title="Итгэлцэл"
            text="Утас баталгаажуулалт, profile мэдээлэл, аяллын status нь booking flow дээр ашиглагдана."
            action="Профайл шалгах"
            href="/dashboard/traveler/profile"
          />
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
