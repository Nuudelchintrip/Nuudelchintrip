import { useEffect, useState } from 'react';
import { CheckCircle2, Package, PackagePlus, Truck } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { AppFooter } from '../components/Footer';
import { Sidebar } from '../components/Sidebar';
import { StatCard } from '../components/StatCard';
import { getDashboardMenu } from '../navigation/dashboardMenus';
import { isSupabaseConfigured } from '../lib/supabase';
import { fetchCurrentSenderCargoRequests, type SenderCargoRequest } from '../services/tripService';
import { getStoredUser } from '../utils/auth';

const CARGO_STATUS_LABELS: Record<string, string> = {
  cargo_requested: 'Хүсэлт илгээсэн',
  cargo_accepted: 'Зөвшөөрсөн',
  rejected: 'Татгалзсан',
  waiting_payment: 'Төлбөр хүлээгдэж байна',
  payment_review: 'Баримт шалгаж байна',
  picked_up: 'Ачаа авсан',
  in_transit: 'Замдаа',
  delivered: 'Хүргэгдсэн',
  completed: 'Дууссан',
  cancelled: 'Цуцлагдсан',
  disputed: 'Маргаантай',
};

const DONE = new Set(['completed', 'delivered']);
const CLOSED = new Set(['completed', 'cancelled', 'rejected']);

function cargoBadge(status: string): 'success' | 'warning' | 'danger' | 'info' | 'default' {
  if (DONE.has(status)) return 'success';
  if (status === 'rejected' || status === 'cancelled' || status === 'disputed') return 'danger';
  if (status === 'cargo_requested' || status === 'waiting_payment' || status === 'payment_review') return 'warning';
  return 'info';
}

export function SenderDashboard() {
  const user = getStoredUser();
  const [cargos, setCargos] = useState<SenderCargoRequest[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchCurrentSenderCargoRequests()
      .then((items) => {
        if (active) setCargos(items);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Ачааны мэдээлэл уншихад алдаа гарлаа.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const activeCount = cargos.filter((cargo) => !CLOSED.has(cargo.status)).length;
  const deliveredCount = cargos.filter((cargo) => DONE.has(cargo.status)).length;
  const recentCargos = cargos.slice(0, 5);

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar menuItems={getDashboardMenu('sender')} />

      <main className="min-w-0 flex-1 overflow-x-hidden p-3.5 sm:p-5 md:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between md:mb-8 md:pr-14">
          <div>
            <Badge variant="warning" className="mb-3">Ачаа илгээгчийн самбар</Badge>
            <h1 className="text-xl font-bold leading-tight text-foreground sm:text-2xl">
              {user?.full_name ? `Сайн уу, ${user.full_name}` : 'Ачаа илгээгчийн самбар'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Таны илгээсэн ачаа, төлөв, хүргэлтийн кодын бодит тойм.</p>
          </div>
          <Button className="w-full sm:w-auto" onClick={() => window.location.href = '/cargo/find-routes'}>
            <PackagePlus className="h-4 w-4" />
            Ачаа илгээх
          </Button>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
          <StatCard icon={<Package className="h-5 w-5" />} label="Нийт ачаа" value={cargos.length} accent="warning" />
          <StatCard icon={<Truck className="h-5 w-5" />} label="Идэвхтэй" value={activeCount} accent="primary" />
          <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Хүргэгдсэн" value={deliveredCount} accent="success" />
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Миний ачаа</h2>
            {cargos.length > 5 && (
              <button type="button" onClick={() => window.location.href = '/dashboard/cargo/requests'} className="text-sm font-medium text-primary hover:underline">Бүгд</button>
            )}
          </div>

          {loading ? (
            <Card className="p-5 text-sm text-muted-foreground">Ачааны мэдээллийг уншиж байна...</Card>
          ) : error ? (
            <Card className="border-destructive/20 bg-destructive/5 p-5 text-sm font-medium text-destructive">{error}</Card>
          ) : recentCargos.length === 0 ? (
            <Card className="p-6 text-center sm:p-8">
              <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">Илгээсэн ачаа хараахан алга</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Дайвар ачаа авах чиглэл хайж, хүсэлт илгээсний дараа таны ачаа энд харагдана.
              </p>
              <Button className="mt-5" onClick={() => window.location.href = '/cargo/find-routes'}>Ачаа авах чиглэл хайх</Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentCargos.map((cargo) => (
                <Card key={cargo.id} className="p-4 sm:p-5">
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_170px_150px] lg:items-center">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{cargo.cargoName}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {cargo.route}{cargo.weightKg ? ` · ${cargo.weightKg} кг` : ''} · Хүлээн авагч: {cargo.receiverName}
                      </p>
                    </div>
                    <Badge variant={cargoBadge(cargo.status)}>{CARGO_STATUS_LABELS[cargo.status] ?? cargo.status}</Badge>
                    {cargo.deliveryCode ? (
                      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-center">
                        <p className="text-xs text-muted-foreground">Хүргэлтийн код</p>
                        <p className="font-mono text-base font-bold tracking-widest text-foreground">{cargo.deliveryCode}</p>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <AppFooter />
      </main>
    </div>
  );
}
