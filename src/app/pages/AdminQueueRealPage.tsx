import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, CheckCircle2, CreditCard, ExternalLink, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { AppFooter } from '../components/Footer';
import { Sidebar } from '../components/Sidebar';
import { getDashboardMenu } from '../navigation/dashboardMenus';
import {
  approvePayment,
  fetchAdminDriverVerifications,
  fetchAdminPayments,
  rejectPayment,
  updateDriverVerification,
  type AdminDriverVerificationItem,
  type AdminPaymentItem,
} from '../services/adminService';

type AdminView = 'payments' | 'users' | 'reports' | 'verifications' | 'cargo' | 'routes' | 'bookings' | 'logs';

const pageCopy: Record<AdminView, { title: string; description: string }> = {
  payments: {
    title: 'Төлбөрийн баримт',
    description: 'Аялагч болон ачаа илгээгчийн илгээсэн төлбөрийн баримтыг шалгаад зөвшөөрөх эсвэл буцаана.',
  },
  verifications: {
    title: 'Жолоочийн баталгаажуулалт',
    description: 'Жолоочийн profile, машины мэдээлэл, суудлын тоог шалгаад чиглэл нийтлэх эрхийг нээнэ.',
  },
  users: {
    title: 'Хэрэглэгчид',
    description: 'Бүртгэлтэй хэрэглэгчдийн үндсэн мэдээлэл болон role-ийг харах хэсэг.',
  },
  reports: {
    title: 'Гомдол, маргаан',
    description: 'Хэрэглэгчийн мэдэгдэл, маргааныг шалгах хэсэг.',
  },
  cargo: {
    title: 'Ачааны хүсэлтүүд',
    description: 'Дайвар ачааны хүсэлтүүд болон хүргэлтийн явцыг хянах хэсэг.',
  },
  routes: {
    title: 'Чиглэлүүд',
    description: 'Жолоочийн нийтэлсэн чиглэлүүдийг хянах хэсэг.',
  },
  bookings: {
    title: 'Захиалгууд',
    description: 'Аялагч-жолоочийн захиалгын төлөвийг харах хэсэг.',
  },
  logs: {
    title: 'Үйлдлийн түүх',
    description: 'Системийн гол үйлдлүүдийн audit log харах хэсэг.',
  },
};

export function AdminQueuePage({ view }: { view: AdminView }) {
  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar menuItems={getDashboardMenu('admin')} accountRole="admin" />
      <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-8">
        <PageHeader view={view} />
        {view === 'payments' ? <AdminPaymentsQueue /> : view === 'verifications' ? <AdminVerificationsQueue /> : <ComingSoonQueue view={view} />}
        <AppFooter />
      </main>
    </div>
  );
}

function PageHeader({ view }: { view: AdminView }) {
  const copy = pageCopy[view];
  return (
    <div className="mb-6 md:mb-8">
      <button
        type="button"
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        onClick={() => { window.location.href = '/admin'; }}
      >
        <ArrowLeft className="h-4 w-4" />
        Админ самбар руу буцах
      </button>
      <Badge variant="info">Админ</Badge>
      <h1 className="mt-4 text-3xl font-bold leading-tight text-foreground sm:text-4xl">{copy.title}</h1>
      <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{copy.description}</p>
    </div>
  );
}

function AdminPaymentsQueue() {
  const [items, setItems] = useState<AdminPaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await fetchAdminPayments();
      setItems(rows);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Төлбөрийн жагсаалт уншихад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const decide = async (item: AdminPaymentItem, decision: 'approve' | 'reject') => {
    setBusyId(item.id);
    setError('');
    setMessage('');
    try {
      if (decision === 'approve') {
        await approvePayment(item.id);
        setMessage('Төлбөр баталгаажлаа. Холбогдох захиалгын төлөв шинэчлэгдсэн.');
      } else {
        await rejectPayment(item.id);
        setMessage('Төлбөрийн баримтыг буцаалаа. Хэрэглэгч дахин баримт илгээх боломжтой.');
      }
      await load();
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : 'Шийдвэр хадгалахад алдаа гарлаа.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-5">
      <QueueToolbar
        icon={<CreditCard className="h-5 w-5" />}
        title="Илгээсэн баримтууд"
        count={items.length}
        loading={loading}
        onRefresh={load}
      />

      {error && <Notice tone="danger" text={error} />}
      {message && <Notice tone="success" text={message} />}

      {loading ? (
        <Card className="p-6 text-muted-foreground">Төлбөрийн баримтуудыг уншиж байна...</Card>
      ) : items.length === 0 ? (
        <EmptyQueue title="Одоогоор шалгах төлбөр алга" text="Хэрэглэгч төлбөрийн баримт upload хиймэгц энд бодитоор гарч ирнэ." />
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id} className="p-4 sm:p-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={item.status} />
                    <Badge variant="default">{item.targetLabel}</Badge>
                  </div>
                  <h2 className="mt-3 break-words text-xl font-semibold text-foreground">
                    {item.routeLabel || item.bookingId || item.cargoRequestId || item.id}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.payerName}{item.payerPhone ? ` · ${item.payerPhone}` : ''} · {new Date(item.createdAt).toLocaleString('mn-MN')}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-primary">₮{item.amount.toLocaleString()}</p>
                </div>

                <div className="grid gap-2">
                  {item.signedProofUrl ? (
                    <Button
                      variant="outline"
                      onClick={() => window.open(item.signedProofUrl, '_blank', 'noopener,noreferrer')}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Баримт харах
                    </Button>
                  ) : (
                    <Button variant="outline" disabled>Баримтын файл алга</Button>
                  )}
                  {item.bookingId && (
                    <Button variant="ghost" onClick={() => { window.location.href = `/dashboard/bookings/${item.bookingId}`; }}>
                      Захиалга харах
                    </Button>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      disabled={busyId === item.id || item.status === 'approved'}
                      onClick={() => decide(item, 'approve')}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Зөвшөөрөх
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === item.id || item.status === 'rejected'}
                      onClick={() => decide(item, 'reject')}
                    >
                      <X className="h-4 w-4" />
                      Буцаах
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminVerificationsQueue() {
  const [items, setItems] = useState<AdminDriverVerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await fetchAdminDriverVerifications();
      setItems(rows);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Жолоочийн баталгаажуулалт уншихад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const decide = async (item: AdminDriverVerificationItem, status: 'approved' | 'rejected') => {
    setBusyId(item.userId);
    setError('');
    setMessage('');
    try {
      await updateDriverVerification(item.userId, status);
      setMessage(status === 'approved' ? 'Жолоочийн эрх нээгдлээ. Одоо чиглэл нийтлэх боломжтой.' : 'Жолоочийн баталгаажуулалтыг буцаалаа.');
      await load();
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : 'Шийдвэр хадгалахад алдаа гарлаа.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-5">
      <QueueToolbar
        icon={<ShieldCheck className="h-5 w-5" />}
        title="Жолоочийн хүсэлтүүд"
        count={items.length}
        loading={loading}
        onRefresh={load}
      />

      {error && <Notice tone="danger" text={error} />}
      {message && <Notice tone="success" text={message} />}

      {loading ? (
        <Card className="p-6 text-muted-foreground">Баталгаажуулалтын хүсэлтүүдийг уншиж байна...</Card>
      ) : items.length === 0 ? (
        <EmptyQueue title="Одоогоор жолоочийн хүсэлт алга" text="Жолооч onboarding бөглөхөд энд бодитоор гарч ирнэ." />
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.userId} className="p-4 sm:p-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={item.status} />
                    <Badge variant="default">{item.seats ? `${item.seats} суудал` : 'Суудал оруулаагүй'}</Badge>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-foreground">{item.fullName}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.phone || item.email || 'Холбоо барих мэдээлэл алга'}
                  </p>
                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                    <Info label="Машин" value={item.carModel || 'Оруулаагүй'} />
                    <Info label="Улсын дугаар" value={item.plateNumber || 'Оруулаагүй'} />
                    <Info label="Илгээсэн" value={item.createdAt ? new Date(item.createdAt).toLocaleDateString('mn-MN') : 'Тодорхойгүй'} />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Button
                    disabled={busyId === item.userId || item.status === 'approved'}
                    onClick={() => decide(item, 'approved')}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Зөвшөөрөх
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busyId === item.userId || item.status === 'rejected'}
                    onClick={() => decide(item, 'rejected')}
                  >
                    <X className="h-4 w-4" />
                    Буцаах
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function QueueToolbar({
  icon,
  title,
  count,
  loading,
  onRefresh,
}: {
  icon: ReactNode;
  title: string;
  count: number;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{title}</h2>
              <p className="text-sm text-muted-foreground">{count} мөр</p>
            </div>
          </div>
          <Button variant="outline" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Дахин унших
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}

function ComingSoonQueue({ view }: { view: AdminView }) {
  const copy = pageCopy[view];
  return (
    <EmptyQueue
      title={`${copy.title} хэсэгт одоогоор бодит action нэмэгдээгүй`}
      text="Энэ хэсгийг дараагийн шатанд Supabase хүснэгттэй бүрэн холбоно. Одоогоор үндсэн MVP-д төлбөрийн баталгаажуулалт болон жолоочийн verification хамгийн түрүүнд ажиллаж байна."
    />
  );
}

function EmptyQueue({ title, text }: { title: string; text: string }) {
  return (
    <Card className="p-8 text-center">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{text}</p>
    </Card>
  );
}

function Notice({ tone, text }: { tone: 'success' | 'danger'; text: string }) {
  const classes = tone === 'success'
    ? 'border-success/30 bg-success/5 text-success'
    : 'border-destructive/30 bg-destructive/5 text-destructive';
  return <div className={`rounded-lg border p-4 text-sm font-medium ${classes}`}>{text}</div>;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'approved') return <Badge variant="success">Баталгаажсан</Badge>;
  if (status === 'rejected') return <Badge variant="danger">Буцаасан</Badge>;
  if (status === 'proof_uploaded') return <Badge variant="warning">Баримт ирсэн</Badge>;
  if (status === 'pending') return <Badge variant="warning">Хүлээгдэж байна</Badge>;
  return <Badge variant="default">{status}</Badge>;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-semibold text-foreground">{value}</p>
    </div>
  );
}
