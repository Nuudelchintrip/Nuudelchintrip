import { AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { AppFooter } from '../components/Footer';
import { Sidebar } from '../components/Sidebar';
import { getDashboardMenu } from '../navigation/dashboardMenus';

const prohibited = ['Хууль бус бараа', 'Зэвсэг', 'Мөнгө, үнэт эдлэл', 'Амьд амьтан', 'Муудаж болзошгүй хүнс', 'Буруу мэдүүлсэн ачаа'];

export function CargoRulesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar menuItems={getDashboardMenu('sender')} />
      <main className="min-w-0 flex-1 overflow-x-hidden p-3.5 sm:p-5 md:p-8">
        <div className="mb-8">
          <Badge variant="warning">Ачааны дүрэм</Badge>
          <h1 className="mt-4 text-3xl font-bold text-foreground">Ачааны дүрэм</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Дайвар ачаа нь жолоочийн нийтэлсэн чиглэл дээр суурилсан нэмэлт боломж. Зөвшөөрөгдөх хэмжээ, төрөл, төлбөрийн баримт болон хүргэлтийн явц тодорхой байх ёстой.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground">Хориглосон ачаа</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {prohibited.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-lg border border-border p-4">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <span className="font-medium text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-primary/20 bg-primary/5 p-6">
            <ShieldCheck className="h-9 w-9 text-primary" />
            <h2 className="mt-4 text-xl font-semibold text-foreground">Баталгаажуулах шаардлага</h2>
            <div className="mt-5 space-y-3">
              {['Төлбөрийн баримт', 'Ачаа авсан баталгаа', 'Хүргэсэн баталгаа', '6 оронтой хүргэлтийн код'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <AppFooter />
      </main>
    </div>
  );
}
