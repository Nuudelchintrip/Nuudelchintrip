import { Clock, CreditCard, Package, ShieldCheck } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { AppFooter } from '../components/Footer';
import { Sidebar } from '../components/Sidebar';
import { getDashboardMenu } from '../navigation/dashboardMenus';
import { getStoredUser } from '../utils/auth';

export function SenderDashboard() {
  const user = getStoredUser();

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar menuItems={getDashboardMenu('sender')} />

      <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <Badge variant="warning" className="mb-3">Дайвар ачаа илгээгч</Badge>
          <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">
            {user?.full_name ? `${user.full_name}, ачаа авах чиглэл хайгаарай` : 'Ачаа авах чиглэл хайгаарай'}
          </h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Дайвар ачаа нь зөвхөн жолоочийн нийтэлсэн чиглэл дээр суурилна. Ачааны хүсэлт үүссэний дараа төлөв нь энд харагдана.
          </p>
        </div>

        <Card className="mb-8 border-warning/20 bg-warning/5">
          <CardBody className="p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning text-warning-foreground">
                  <Package className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-foreground">Таны эхний үйлдэл: ачаа авах чиглэл хайх</h2>
                <p className="mt-2 text-muted-foreground">
                  Зөвхөн дайвар ачаа авах боломжтой гэж нийтэлсэн жолоочийн чиглэлүүд харагдана.
                </p>
              </div>
              <Button className="w-full sm:w-auto" onClick={() => window.location.href = '/cargo/find-routes'}>
                Ачаа авах чиглэл хайх
              </Button>
            </div>
          </CardBody>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <EmptyPanel icon={<Package className="h-6 w-6" />} title="Миний ачаа" text="Ачааны хүсэлт үүссэний дараа төлөв нь энд харагдана." />
          <EmptyPanel icon={<CreditCard className="h-6 w-6" />} title="Төлбөрийн баримт" text="Жолооч зөвшөөрсний дараа төлбөрийн баримт оруулах алхам нээгдэнэ." />
          <EmptyPanel icon={<Clock className="h-6 w-6" />} title="Хүргэлтийн код" text="Ачаа хүргэгдэх шатанд 6 оронтой код ашиглах урсгал энд харагдана." />
        </div>

        <Card className="mt-6 border-primary/20 bg-primary/5 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <ShieldCheck className="h-5 w-5" />
                <h2 className="text-xl font-semibold text-foreground">Ачааны дүрэм</h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Хориглосон бараа, эрсдэлтэй ачаа, буруу мэдүүлсэн ачааны дүрмийг зөвшөөрсний дараа хүсэлт илгээнэ.
              </p>
            </div>
            <Button variant="outline" onClick={() => window.location.href = '/dashboard/cargo/rules'}>
              Дүрэм харах
            </Button>
          </div>
        </Card>

        <AppFooter />
      </main>
    </div>
  );
}

function EmptyPanel({ icon, title, text }: { icon: JSX.Element; title: string; text: string }) {
  return (
    <Card className="p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10 text-warning">
        {icon}
      </div>
      <h2 className="mt-5 text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-2 min-h-16 text-sm leading-6 text-muted-foreground">{text}</p>
    </Card>
  );
}
