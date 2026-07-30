import { ArrowLeft, Camera, ShieldCheck } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { AppFooter } from '../components/Footer';
import { Sidebar } from '../components/Sidebar';
import { getDashboardMenu } from '../navigation/dashboardMenus';

export function DeliveryProofPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar menuItems={getDashboardMenu('driver')} accountRole="driver" />

      <main className="mx-auto w-full max-w-6xl min-w-0 flex-1 overflow-x-hidden p-3.5 sm:p-5 md:p-8">
        <button
          type="button"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
          onClick={() => window.location.href = '/dashboard/driver'}
        >
          <ArrowLeft className="h-4 w-4" />
          Самбар руу буцах
        </button>

        <Card className="mx-auto max-w-3xl p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Camera className="h-9 w-9" />
          </div>
          <Badge variant="info" className="mt-5">Аяллын баталгаа</Badge>
          <h1 className="mt-4 text-3xl font-bold text-foreground">Аяллын нотолгоо бодит захиалга дээр ажиллана</h1>
          <p className="mx-auto mt-3 max-w-xl leading-7 text-muted-foreground">
            Ачаа авсан баталгаа, хүргэсэн баталгаа, 6 оронтой код нь өгөгдлийн санд хадгалагдсан бодит захиалга дээр холбогдох ёстой.
            Одоогоор зохиомол захиалга, зохиомол код харуулахгүй.
          </p>
          <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
            {['Захиалга баталгаажсан байх', 'Аялал эхэлсэн төлөвтэй байх', 'Код аялагчид үүссэн байх'].map((item) => (
              <div key={item} className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                <ShieldCheck className="mb-2 h-5 w-5 text-success" />
                {item}
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => window.location.href = '/driver/requests'}>Ирсэн хүсэлтүүд</Button>
            <Button variant="outline" onClick={() => window.location.href = '/dashboard/driver'}>Самбар руу очих</Button>
          </div>
        </Card>

        <AppFooter />
      </main>
    </div>
  );
}
