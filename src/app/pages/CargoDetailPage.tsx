import { AlertTriangle, Box, CheckCircle2, CreditCard, Flag, Package, Phone, ShieldCheck, Truck } from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { AppFooter } from '../components/Footer';
import { Sidebar } from '../components/Sidebar';
import { getDashboardMenu } from '../navigation/dashboardMenus';

const cargoSteps = [
  ['cargo_requested', 'Ачааны хүсэлт'],
  ['cargo_accepted', 'Зөвшөөрсөн'],
  ['waiting_payment', 'Төлбөр хүлээгдэж байна'],
  ['picked_up', 'Ачаа авсан'],
  ['in_transit', 'Замдаа'],
  ['delivered', 'Хүргэсэн'],
  ['completed', 'Дууссан'],
];

export function CargoDetailPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar menuItems={getDashboardMenu('sender')} />

      <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-8">
        <div className="mb-8">
          <Badge variant="warning">Дайвар ачаа</Badge>
          <h1 className="mt-4 text-3xl font-bold text-foreground">Дайвар ачааны дэлгэрэнгүй</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Жолоочийн чиглэл дээр суурилсан жижиг дайвар ачааны явц, баримт, хүргэлтийн кодоо нэг дор харна.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <Badge variant="warning">Замдаа явж байна</Badge>
                    <Badge variant="success">Төлбөр баталгаажсан</Badge>
                  </div>
                  <h2 className="text-2xl font-semibold text-foreground">Баримт бичиг</h2>
                  <p className="mt-2 text-muted-foreground">Улаанбаатар → Дархан · 2026-05-27 · 1.2 кг</p>
                </div>
                <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-center">
                  <p className="text-sm text-muted-foreground">Хүргэлтийн код</p>
                  <p className="mt-1 text-3xl font-bold tracking-widest text-foreground">482913</p>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-foreground">Ачааны явц</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {cargoSteps.map(([code, label], index) => {
                    const done = index <= 4;
                    return (
                      <div key={code} className="flex gap-4">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${done ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}`}>
                          {done ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                        </div>
                        <div className="min-w-0 flex-1 rounded-lg border border-border p-4">
                          <p className="font-semibold text-foreground">{label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>

            <div className="grid gap-5 md:grid-cols-2">
              <UploadBox title="Төлбөрийн баримт" icon={<CreditCard className="h-5 w-5" />} status="uploaded" />
              <UploadBox title="Ачаа авсан баталгаа" icon={<Package className="h-5 w-5" />} status="Жолооч баталгаа оруулсан" />
            </div>

            <Card className="border-destructive/20 bg-destructive/5 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-destructive" />
                  <div>
                    <p className="font-semibold text-foreground">Асуудал гарсан уу?</p>
                    <p className="text-sm text-muted-foreground">Асуудал мэдэгдсэнээр админ шалгах жагсаалтад орно.</p>
                  </div>
                </div>
                <Button variant="outline">
                  <Flag className="h-4 w-4" />
                  Асуудал мэдэгдэх
                </Button>
              </div>
            </Card>
          </div>

          <aside className="space-y-5">
            <Card className="p-5">
              <h2 className="text-xl font-semibold text-foreground">Жолооч</h2>
              <div className="mt-5 flex gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Бат Болд</p>
                  <p className="text-sm text-muted-foreground">Toyota Prius · ⭐ 4.8</p>
                </div>
              </div>
              <div className="mt-5 space-y-3 text-sm">
                <Info icon={<ShieldCheck className="h-4 w-4" />} label="Баталгаажсан жолооч" />
                <Info icon={<Phone className="h-4 w-4" />} label="+976 88•• ••••" />
                <Info icon={<Box className="h-4 w-4" />} label="5 кг хүртэл жижиг ачаа" />
              </div>
            </Card>

            <Card className="border-primary/20 bg-primary/5 p-5">
              <h2 className="text-xl font-semibold text-foreground">Хүлээн авагч</h2>
              <p className="mt-3 font-semibold text-foreground">Дорж Цэцэг</p>
              <p className="mt-1 text-muted-foreground">+976 99•• ••••</p>
            </Card>
          </aside>
        </div>

        <AppFooter />
      </main>
    </div>
  );
}

function UploadBox({ title, icon, status }: { title: string; icon: ReactNode; status: string }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2 text-primary">
        {icon}
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      </div>
      <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 text-center">
        <p className="font-medium text-foreground">{status}</p>
        <p className="mt-1 text-sm text-muted-foreground">Файл оруулах хэсэг дараагийн шатанд бүрэн холбогдоно.</p>
      </div>
    </Card>
  );
}

function Info({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      {icon}
      <span>{label}</span>
    </div>
  );
}
