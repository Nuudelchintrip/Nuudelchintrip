import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, Boxes, CheckCircle2, CreditCard, ExternalLink, Map, RefreshCw, ShieldCheck, Ticket, Users, X } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { AppFooter } from '../components/Footer';
import { Sidebar } from '../components/Sidebar';
import { getDashboardMenu } from '../navigation/dashboardMenus';
import {
  approvePayment,
  fetchAdminBookings,
  fetchAdminCargoRequests,
  fetchAdminDriverVerifications,
  fetchAdminPayments,
  fetchAdminTrips,
  fetchAdminUsers,
  rejectPayment,
  setUserSuspended,
  updateDriverVerification,
  updateTripStatus,
  type AdminBookingItem,
  type AdminCargoItem,
  type AdminDriverVerificationItem,
  type AdminPaymentItem,
  type AdminTripItem,
  type AdminUserItem,
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
        {view === 'payments' ? (
          <AdminPaymentsQueue />
        ) : view === 'verifications' ? (
          <AdminVerificationsQueue />
        ) : view === 'users' ? (
          <AdminUsersQueue />
        ) : view === 'routes' ? (
          <AdminTripsQueue />
        ) : view === 'bookings' ? (
          <AdminBookingsQueue />
        ) : view === 'cargo' ? (
          <AdminCargoQueue />
        ) : (
          <ComingSoonQueue view={view} />
        )}
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

function AdminUsersQueue() {
  const [items, setItems] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await fetchAdminUsers());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Хэрэглэгчдийн жагсаалт уншихад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const toggleSuspend = async (item: AdminUserItem) => {
    setBusyId(item.id);
    setError('');
    setMessage('');
    try {
      await setUserSuspended(item.id, !item.isSuspended);
      setMessage(item.isSuspended ? 'Хэрэглэгчийн эрхийг сэргээлээ.' : 'Хэрэглэгчийг түр түдгэлзүүллээ.');
      await load();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Хэрэглэгчийн төлөв шинэчлэхэд алдаа гарлаа.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-5">
      <QueueToolbar icon={<Users className="h-5 w-5" />} title="Бүртгэлтэй хэрэглэгчид" count={items.length} loading={loading} onRefresh={load} />
      {error && <Notice tone="danger" text={error} />}
      {message && <Notice tone="success" text={message} />}

      {loading ? (
        <Card className="p-6 text-muted-foreground">Хэрэглэгчдийг уншиж байна...</Card>
      ) : items.length === 0 ? (
        <EmptyQueue title="Одоогоор хэрэглэгч алга" text="Хэрэглэгч бүртгүүлмэгц энд бодитоор гарч ирнэ." />
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id} className="p-4 sm:p-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_200px] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="info">{roleLabel(item.role)}</Badge>
                    {item.isSuspended && <Badge variant="danger">Түдгэлзсэн</Badge>}
                    {item.phoneVerified && <Badge variant="success">Утас баталгаажсан</Badge>}
                    {item.onboardingCompleted && <Badge variant="default">Onboarding дууссан</Badge>}
                  </div>
                  <h2 className="mt-3 break-words text-xl font-semibold text-foreground">{item.fullName}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {[item.phone, item.email].filter(Boolean).join(' · ') || 'Холбоо барих мэдээлэл алга'}
                    {item.createdAt ? ` · ${new Date(item.createdAt).toLocaleDateString('mn-MN')}` : ''}
                  </p>
                </div>
                {item.role !== 'admin' && (
                  <Button
                    variant="outline"
                    disabled={busyId === item.id}
                    onClick={() => toggleSuspend(item)}
                  >
                    {item.isSuspended ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    {item.isSuspended ? 'Эрх сэргээх' : 'Түдгэлзүүлэх'}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminTripsQueue() {
  const [items, setItems] = useState<AdminTripItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await fetchAdminTrips());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Чиглэлийн жагсаалт уншихад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const setStatus = async (item: AdminTripItem, status: 'active' | 'cancelled') => {
    setBusyId(item.id);
    setError('');
    setMessage('');
    try {
      await updateTripStatus(item.id, status);
      setMessage(status === 'cancelled' ? 'Чиглэлийг цуцаллаа.' : 'Чиглэлийг идэвхжүүллээ.');
      await load();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Чиглэлийн төлөв шинэчлэхэд алдаа гарлаа.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-5">
      <QueueToolbar icon={<Map className="h-5 w-5" />} title="Нийтлэгдсэн чиглэлүүд" count={items.length} loading={loading} onRefresh={load} />
      {error && <Notice tone="danger" text={error} />}
      {message && <Notice tone="success" text={message} />}

      {loading ? (
        <Card className="p-6 text-muted-foreground">Чиглэлүүдийг уншиж байна...</Card>
      ) : items.length === 0 ? (
        <EmptyQueue title="Одоогоор чиглэл алга" text="Баталгаажсан жолооч чиглэл нийтэлмэгц энд бодитоор гарч ирнэ." />
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id} className="p-4 sm:p-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_200px] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={item.status} />
                    {item.allowsCargo && <Badge variant="info">Ачаа зөвшөөрнө</Badge>}
                  </div>
                  <h2 className="mt-3 break-words text-xl font-semibold text-foreground">{item.route}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.driverName}{item.driverPhone ? ` · ${item.driverPhone}` : ''} · {new Date(item.departureAt).toLocaleString('mn-MN')}
                  </p>
                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                    <Info label="Суудал" value={`${item.seatsAvailable}/${item.seatsTotal} сул`} />
                    <Info label="Үнэ" value={`₮${item.pricePerSeat.toLocaleString()}`} />
                    <Info label="Төлөв" value={tripStatusLabel(item.status)} />
                  </div>
                </div>
                {item.status !== 'completed' && (
                  item.status === 'cancelled' ? (
                    <Button variant="outline" disabled={busyId === item.id} onClick={() => setStatus(item, 'active')}>
                      <CheckCircle2 className="h-4 w-4" />
                      Идэвхжүүлэх
                    </Button>
                  ) : (
                    <Button variant="outline" disabled={busyId === item.id} onClick={() => setStatus(item, 'cancelled')}>
                      <X className="h-4 w-4" />
                      Цуцлах
                    </Button>
                  )
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminBookingsQueue() {
  const [items, setItems] = useState<AdminBookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await fetchAdminBookings());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Захиалгын жагсаалт уншихад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-5">
      <QueueToolbar icon={<Ticket className="h-5 w-5" />} title="Аяллын захиалгууд" count={items.length} loading={loading} onRefresh={load} />
      {error && <Notice tone="danger" text={error} />}

      {loading ? (
        <Card className="p-6 text-muted-foreground">Захиалгуудыг уншиж байна...</Card>
      ) : items.length === 0 ? (
        <EmptyQueue title="Одоогоор захиалга алга" text="Аялагч суудал захиалмагц энд бодитоор гарч ирнэ." />
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id} className="p-4 sm:p-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={item.status} />
                  <Badge variant="default">{item.seatsRequested} суудал</Badge>
                </div>
                <h2 className="mt-3 break-words text-xl font-semibold text-foreground">{item.route}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Аялагч: {item.travelerName}{item.travelerPhone ? ` · ${item.travelerPhone}` : ''} · Жолооч: {item.driverName}
                </p>
                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <Info label="Дүн" value={`₮${item.totalAmount.toLocaleString()}`} />
                  <Info label="Төлөв" value={bookingStatusLabel(item.status)} />
                  <Info label="Огноо" value={new Date(item.createdAt).toLocaleString('mn-MN')} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminCargoQueue() {
  const [items, setItems] = useState<AdminCargoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await fetchAdminCargoRequests());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Ачааны хүсэлтүүд уншихад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-5">
      <QueueToolbar icon={<Boxes className="h-5 w-5" />} title="Ачааны хүсэлтүүд" count={items.length} loading={loading} onRefresh={load} />
      {error && <Notice tone="danger" text={error} />}

      {loading ? (
        <Card className="p-6 text-muted-foreground">Ачааны хүсэлтүүдийг уншиж байна...</Card>
      ) : items.length === 0 ? (
        <EmptyQueue title="Одоогоор ачааны хүсэлт алга" text="Ачаа илгээгч хүсэлт үүсгэмэгц энд бодитоор гарч ирнэ." />
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id} className="p-4 sm:p-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={item.status} />
                  {item.weightKg ? <Badge variant="default">{item.weightKg} кг</Badge> : null}
                </div>
                <h2 className="mt-3 break-words text-xl font-semibold text-foreground">{item.cargoName}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.route}</p>
                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <Info label="Илгээгч" value={`${item.senderName}${item.senderPhone ? ` · ${item.senderPhone}` : ''}`} />
                  <Info label="Хүлээн авагч" value={`${item.receiverName} · ${item.receiverPhone}`} />
                  <Info label="Огноо" value={new Date(item.createdAt).toLocaleString('mn-MN')} />
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

const successStatuses = new Set(['approved', 'active', 'confirmed', 'completed', 'delivered', 'cargo_accepted', 'accepted']);
const dangerStatuses = new Set(['rejected', 'cancelled', 'disputed']);
const warningStatuses = new Set([
  'proof_uploaded', 'pending', 'pending_request', 'waiting_payment', 'payment_review',
  'cargo_requested', 'picked_up', 'in_transit', 'on_trip', 'full', 'draft',
]);

const statusLabels: Record<string, string> = {
  approved: 'Баталгаажсан',
  rejected: 'Буцаасан',
  proof_uploaded: 'Баримт ирсэн',
  pending: 'Хүлээгдэж байна',
  pending_request: 'Хүсэлт ирсэн',
  accepted: 'Зөвшөөрсөн',
  waiting_payment: 'Төлбөр хүлээж байна',
  payment_review: 'Төлбөр шалгаж байна',
  confirmed: 'Баталгаажсан',
  on_trip: 'Аялалд гарсан',
  completed: 'Дууссан',
  cancelled: 'Цуцалсан',
  disputed: 'Маргаантай',
  active: 'Идэвхтэй',
  full: 'Дүүрсэн',
  draft: 'Ноорог',
  cargo_requested: 'Хүсэлт ирсэн',
  cargo_accepted: 'Зөвшөөрсөн',
  picked_up: 'Ачигдсан',
  in_transit: 'Замд яваа',
  delivered: 'Хүргэгдсэн',
};

function bookingStatusLabel(status: string) {
  return statusLabels[status] || status;
}

function tripStatusLabel(status: string) {
  return statusLabels[status] || status;
}

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    driver: 'Жолооч',
    traveler: 'Аялагч',
    cargo_sender: 'Ачаа илгээгч',
    admin: 'Админ',
  };
  return labels[role] || role;
}

function StatusBadge({ status }: { status: string }) {
  const label = statusLabels[status] || status;
  if (successStatuses.has(status)) return <Badge variant="success">{label}</Badge>;
  if (dangerStatuses.has(status)) return <Badge variant="danger">{label}</Badge>;
  if (warningStatuses.has(status)) return <Badge variant="warning">{label}</Badge>;
  return <Badge variant="default">{label}</Badge>;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-semibold text-foreground">{value}</p>
    </div>
  );
}
