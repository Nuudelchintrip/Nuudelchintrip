import { ArrowLeft, PackageCheck, ShieldCheck } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { AppFooter } from '../components/Footer';
import { Sidebar } from '../components/Sidebar';
import { getDashboardMenu } from '../navigation/dashboardMenus';

export function CargoDetailPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar menuItems={getDashboardMenu('sender')} />

      <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-8">
        <button
          type="button"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
          onClick={() => window.location.href = '/dashboard/cargo'}
        >
          <ArrowLeft className="h-4 w-4" />
          Самбар руу буцах
        </button>

        <Card className="mx-auto max-w-3xl p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-warning/10 text-warning">
            <PackageCheck className="h-9 w-9" />
          </div>
          <Badge variant="warning" className="mt-5">Дайвар ачааны дэлгэрэнгүй</Badge>
          <h1 className="mt-4 text-3xl font-bold text-foreground">Ачааны дэлгэрэнгүй бодит хүсэлт дээр харагдана</h1>
          <p className="mx-auto mt-3 max-w-xl leading-7 text-muted-foreground">
            Энэ хэсэгт ачааны хүсэлт, төлбөрийн баримт, ачаа авсан баталгаа, хүргэлтийн код зэрэг мэдээлэл өгөгдлийн сангаас уншигдах ёстой.
            Одоогоор зохиомол ачаа, жолооч, хүргэлтийн код харуулахгүй.
          </p>
          <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
            {['Ачааны хүсэлт үүссэн байх', 'Жолооч зөвшөөрсөн байх', 'Төлбөрийн баримт орсон байх'].map((item) => (
              <div key={item} className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                <ShieldCheck className="mb-2 h-5 w-5 text-success" />
                {item}
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => window.location.href = '/cargo/find-routes'}>Ачаа авах чиглэл хайх</Button>
            <Button variant="outline" onClick={() => window.location.href = '/dashboard/cargo'}>Самбар руу очих</Button>
          </div>
        </Card>

        <AppFooter />
      </main>
    </div>
  );
}
