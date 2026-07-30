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
  refundPayment,
  fetchAdminBookings,
  fetchAdminCargoRequests,
  fetchAdminDriverVerifications,
  fetchAdminPayments,
  fetchAdminReports,
  fetchAdminAuditLogs,
  fetchAdminTrips,
  fetchAdminUsers,
  fetchAdminUserDetail,
  openDriverDocument,
  type AdminUserDetail,
  rejectPayment,
  resolveReport,
  setUserSuspended,
  updateDriverVerification,
  updateTripStatus,
  type AdminBookingItem,
  type AdminCargoItem,
  type AdminDriverVerificationItem,
  type AdminPaymentItem,
  type AdminReportItem,
  type AdminAuditLogItem,
  type AdminTripItem,
  type AdminUserItem,
} from '../services/adminService';
import { fetchAdminSupportRequests, updateSupportStatus, type AdminSupportItem } from '../services/supportService';
import { fetchAdminDriverPayouts, recordDriverPayout, type AdminDriverPayout } from '../services/payoutService';

type AdminView = 'payments' | 'users' | 'reports' | 'verifications' | 'cargo' | 'routes' | 'bookings' | 'logs' | 'support' | 'payouts';

const pageCopy: Record<AdminView, { title: string; description: string }> = {
  payments: {
    title: 'Төлбөрийн баримт',
    description: 'Аялагч болон ачаа илгээгчийн илгээсэн төлбөрийн баримтыг шалгаад зөвшөөрөх эсвэл буцаана.',
  },
  verifications: {
    title: 'Жолоочийн баталгаажуулалт',
    description: 'Жолоочийн хувийн мэдээлэл, машины мэдээлэл, суудлын тоог шалгаад чиглэл нийтлэх эрхийг нээнэ.',
  },
  users: {
    title: 'Хэрэглэгчид',
    description: 'Бүртгэлтэй хэрэглэгчдийн үндсэн мэдээлэл болон үүргийг харах хэсэг.',
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
    description: 'Системд хийгдсэн гол үйлдлүүдийн бүртгэлийг харах хэсэг.',
  },
  support: {
    title: 'Дэмжлэгийн хүсэлт',
    description: 'Хэрэглэгчдээс ирсэн дэмжлэгийн хүсэлтийг хянах хэсэг.',
  },
  payouts: {
    title: 'Жолоочийн төлбөр',
    description: 'Жолоочдод шилжүүлэх орлого (90%), шилжүүлсэн дүн, үлдэгдлийг хянаж шилжүүлэг бүртгэнэ.',
  },
};

export function AdminQueuePage({ view }: { view: AdminView }) {
  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar menuItems={getDashboardMenu('admin')} accountRole="admin" />
      <main className="flex min-w-0 flex-1 flex-col overflow-x-hidden p-3.5 sm:p-5 md:p-8">
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
        ) : view === 'reports' ? (
          <AdminReportsQueue />
        ) : view === 'logs' ? (
          <AdminLogsQueue />
        ) : view === 'support' ? (
          <AdminSupportQueue />
        ) : view === 'payouts' ? (
          <AdminPayoutsQueue />
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
    <div className="mb-4 md:mb-6">
      <button
        type="button"
        className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        onClick={() => { window.location.href = '/admin'; }}
      >
        <ArrowLeft className="h-4 w-4" />
        Админ самбар руу буцах
      </button>
      <Badge variant="info">Админ</Badge>
      <h1 className="mt-2 text-xl font-bold leading-tight text-foreground sm:text-2xl">{copy.title}</h1>
      <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted-foreground">{copy.description}</p>
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

  const refund = async (item: AdminPaymentItem) => {
    const reason = window.prompt('Төлбөрийг буцаах шалтгаан (захиалга цуцлагдаж суудал чөлөөлөгдөнө):');
    if (!reason?.trim()) return;
    setBusyId(item.id);
    setError('');
    setMessage('');
    try {
      await refundPayment(item.id, reason.trim());
      setMessage('Төлбөр буцаагдаж захиалга цуцлагдлаа.');
      await load();
    } catch (refundError) {
      setError(refundError instanceof Error ? refundError.message : 'Төлбөр буцаахад алдаа гарлаа.');
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
        <EmptyQueue title="Одоогоор шалгах төлбөр алга" text="Хэрэглэгч төлбөрийн баримт оруулмагц энд бодитоор гарч ирнэ." />
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
                  {item.bookingId && item.status === 'approved' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10"
                      disabled={busyId === item.id}
                      onClick={() => refund(item)}
                    >
                      Төлбөр буцаах (refund)
                    </Button>
                  )}
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
  const [reasons, setReasons] = useState<Record<string, string>>({});

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
    const reason = reasons[item.userId]?.trim() || '';
    if (status === 'rejected' && !reason) {
      setError('Буцаахын тулд татгалзах шалтгааныг бичнэ үү.');
      return;
    }
    setBusyId(item.userId);
    setError('');
    setMessage('');
    try {
      await updateDriverVerification(item.userId, status, reason);
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
        <EmptyQueue title="Одоогоор жолоочийн хүсэлт алга" text="Жолооч бүртгэлээ бөглөхөд энд бодитоор гарч ирнэ." />
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

                  <div className="mt-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Бичиг баримт</p>
                    {item.documents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Бичиг баримт оруулаагүй байна.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {item.documents.map((doc) => (
                          <a
                            key={doc.label}
                            href={doc.signedUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-sm font-medium text-foreground hover:border-primary hover:text-primary"
                          >
                            <ExternalLink className="h-4 w-4" />
                            {doc.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {item.status === 'rejected' && item.rejectionReason && (
                    <p className="mt-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                      Татгалзсан шалтгаан: {item.rejectionReason}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Button
                    disabled={busyId === item.userId || item.status === 'approved'}
                    onClick={() => decide(item, 'approved')}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Зөвшөөрөх
                  </Button>
                  <textarea
                    value={reasons[item.userId] || ''}
                    onChange={(event) => setReasons((prev) => ({ ...prev, [item.userId]: event.target.value }))}
                    placeholder="Буцаах шалтгаан (заавал)"
                    rows={2}
                    className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
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
  const [expandedId, setExpandedId] = useState('');
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const toggleDetail = async (item: AdminUserItem) => {
    if (expandedId === item.id) {
      setExpandedId('');
      setDetail(null);
      return;
    }
    setExpandedId(item.id);
    setDetail(null);
    setDetailLoading(true);
    try {
      setDetail(await fetchAdminUserDetail(item.id));
    } catch (detailError) {
      setError(detailError instanceof Error ? detailError.message : 'Дэлгэрэнгүй мэдээлэл уншихад алдаа гарлаа.');
      setExpandedId('');
    } finally {
      setDetailLoading(false);
    }
  };

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
                    {item.onboardingCompleted && <Badge variant="default">Бүртгэл дууссан</Badge>}
                  </div>
                  <h2 className="mt-3 break-words text-xl font-semibold text-foreground">{item.fullName}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {[item.phone, item.email].filter(Boolean).join(' · ') || 'Холбоо барих мэдээлэл алга'}
                    {item.createdAt ? ` · ${new Date(item.createdAt).toLocaleDateString('mn-MN')}` : ''}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" onClick={() => toggleDetail(item)}>
                    {expandedId === item.id ? 'Хаах' : 'Дэлгэрэнгүй'}
                  </Button>
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
              </div>

              {expandedId === item.id && (
                <div className="mt-4 border-t border-border pt-4">
                  {detailLoading ? (
                    <p className="text-sm text-muted-foreground">Дэлгэрэнгүй мэдээлэл уншиж байна...</p>
                  ) : detail ? (
                    <AdminUserDetailPanel detail={detail} />
                  ) : (
                    <p className="text-sm text-muted-foreground">Мэдээлэл олдсонгүй.</p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function computeAge(birthDate?: string) {
  if (!birthDate) return undefined;
  const born = new Date(birthDate);
  if (Number.isNaN(born.getTime())) return undefined;
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const m = now.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < born.getDate())) age -= 1;
  return age;
}

function AdminUserDetailPanel({ detail }: { detail: AdminUserDetail }) {
  const isDriver = detail.role === 'driver';
  const age = computeAge(detail.birthDate);
  const genderLabel = detail.gender === 'male' ? 'Эрэгтэй' : detail.gender === 'female' ? 'Эмэгтэй' : '—';
  const fullName = [detail.lastName, detail.fullName].filter(Boolean).join(' ');

  const docs: Array<[string, string | undefined]> = [
    ['Жолооны үнэмлэх', detail.driverLicenseUrl],
    ['Машины гэрчилгээ', detail.vehicleCertificateUrl],
    ['Машины зураг', detail.vehiclePhotoUrl],
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">Хувийн мэдээлэл</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <DetailField label="Овог, нэр" value={fullName || '—'} />
          <DetailField label="Хүйс" value={genderLabel} />
          <DetailField label="Нас" value={age !== undefined ? `${age}` : '—'} />
          <DetailField label="Төрсөн огноо" value={detail.birthDate || '—'} />
          <DetailField label="Регистрийн дугаар" value={detail.registerNumber || '—'} />
          <DetailField label="Утас" value={detail.phone || '—'} />
          <DetailField label="И-мэйл" value={detail.email || '—'} />
          <DetailField label="Утас баталгаажсан" value={detail.phoneVerified ? 'Тийм' : 'Үгүй'} />
          <DetailField label="Яаралтай холбоо" value={[detail.emergencyContactName, detail.emergencyContactPhone].filter(Boolean).join(' · ') || '—'} />
        </div>
      </div>

      {isDriver && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">Жолоочийн мэдээлэл</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField label="Баталгаажуулалт" value={
              detail.driverVerificationStatus === 'approved' ? 'Баталгаажсан'
              : detail.driverVerificationStatus === 'rejected' ? 'Татгалзсан'
              : detail.driverVerificationStatus === 'pending' ? 'Хүлээгдэж буй'
              : 'Илгээгээгүй'
            } />
            <DetailField label="Машин" value={detail.carModel || '—'} />
            <DetailField label="Улсын дугаар" value={detail.plateNumber || '—'} />
            <DetailField label="Суудал" value={detail.seats !== undefined ? `${detail.seats}` : '—'} />
            <DetailField label="Үнэлгээ" value={`${detail.rating ?? 0}/5 · ${detail.completedTrips ?? 0} аялал`} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {docs.map(([label, url]) => (
              <Button
                key={label}
                size="sm"
                variant="outline"
                disabled={!url}
                onClick={() => void openDriverDocument(url)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-foreground">{value}</p>
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

function AdminReportsQueue() {
  const [items, setItems] = useState<AdminReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await fetchAdminReports());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Гомдол уншихад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const decide = async (item: AdminReportItem, status: 'reviewing' | 'resolved' | 'rejected') => {
    setBusyId(item.id);
    setError('');
    setMessage('');
    try {
      await resolveReport(item.id, status);
      setMessage('Гомдлын төлөв шинэчлэгдлээ.');
      await load();
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : 'Гомдол шинэчлэхэд алдаа гарлаа.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-5">
      <QueueToolbar icon={<ShieldCheck className="h-5 w-5" />} title="Гомдол, маргаан" count={items.length} loading={loading} onRefresh={load} />
      {error && <Notice tone="danger" text={error} />}
      {message && <Notice tone="success" text={message} />}

      {loading ? (
        <Card className="p-6 text-muted-foreground">Гомдлуудыг уншиж байна...</Card>
      ) : items.length === 0 ? (
        <EmptyQueue title="Одоогоор гомдол алга" text="Хэрэглэгч маргаан мэдэгдсэн үед энд бодитоор гарч ирнэ." />
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id} className="p-4 sm:p-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={item.status} />
                    {item.bookingId && <Badge variant="default">Аяллын захиалга</Badge>}
                    {item.cargoRequestId && <Badge variant="default">Дайвар ачаа</Badge>}
                  </div>
                  <h2 className="mt-3 break-words text-xl font-semibold text-foreground">{item.reason}</h2>
                  {item.details && <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.details}</p>}
                  <p className="mt-2 text-sm text-muted-foreground">
                    Мэдэгдсэн: {item.reporterName}{item.targetName ? ` · Хариуцагч: ${item.targetName}` : ''} · {new Date(item.createdAt).toLocaleString('mn-MN')}
                  </p>
                </div>
                <div className="grid gap-2">
                  {item.bookingId && (
                    <Button variant="ghost" onClick={() => { window.location.href = `/dashboard/bookings/${item.bookingId}`; }}>Захиалга харах</Button>
                  )}
                  <Button size="sm" variant="outline" disabled={busyId === item.id || item.status === 'reviewing'} onClick={() => decide(item, 'reviewing')}>
                    Шалгаж байна
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" disabled={busyId === item.id || item.status === 'resolved'} onClick={() => decide(item, 'resolved')}>
                      <CheckCircle2 className="h-4 w-4" />
                      Шийдвэрлэх
                    </Button>
                    <Button size="sm" variant="outline" disabled={busyId === item.id || item.status === 'rejected'} onClick={() => decide(item, 'rejected')}>
                      <X className="h-4 w-4" />
                      Татгалзах
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

function AdminLogsQueue() {
  const [items, setItems] = useState<AdminAuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await fetchAdminAuditLogs());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Үйлдлийн түүх уншихад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-5">
      <QueueToolbar icon={<Ticket className="h-5 w-5" />} title="Үйлдлийн түүх" count={items.length} loading={loading} onRefresh={load} />
      {error && <Notice tone="danger" text={error} />}

      {loading ? (
        <Card className="p-6 text-muted-foreground">Үйлдлийн түүхийг уншиж байна...</Card>
      ) : items.length === 0 ? (
        <EmptyQueue title="Одоогоор үйлдэл бүртгэгдээгүй" text="Захиалга, төлбөр, аяллын төлөв өөрчлөгдөх бүрт энд бодит лог үүснэ." />
      ) : (
        <div className="grid gap-2">
          {items.map((item) => (
            <Card key={item.id} className="p-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={item.status} />
                    {item.source === 'security' && <Badge variant="warning">Хамгаалалт</Badge>}
                    {item.cargoRequestId ? <Badge variant="default">Ачаа</Badge> : item.bookingId ? <Badge variant="default">Захиалга</Badge> : null}
                  </div>
                  {item.note && <p className="mt-2 text-sm text-foreground">{item.note}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.actorName ? `${item.actorName} · ` : ''}{new Date(item.createdAt).toLocaleString('mn-MN')}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminPayoutsQueue() {
  const [items, setItems] = useState<AdminDriverPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await fetchAdminDriverPayouts());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Жолоочийн төлбөр уншихад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const pay = async (item: AdminDriverPayout) => {
    const input = window.prompt(`${item.driverName}-д шилжүүлэх дүн (₮). Үлдэгдэл: ₮${item.pending.toLocaleString()}`, String(item.pending));
    const amount = Number((input || '').replace(/[^0-9]/g, ''));
    if (!amount || amount <= 0) return;
    setBusyId(item.driverId);
    setError('');
    setMessage('');
    try {
      await recordDriverPayout(item.driverId, amount, 'Админ гараар шилжүүлэв.');
      setMessage(`${item.driverName}-д ₮${amount.toLocaleString()} төлбөр бүртгэгдлээ.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Төлбөр бүртгэхэд алдаа гарлаа.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-5">
      <QueueToolbar icon={<CreditCard className="h-5 w-5" />} title="Жолоочийн төлбөр" count={items.length} loading={loading} onRefresh={load} />
      {error && <Notice tone="danger" text={error} />}
      {message && <Notice tone="success" text={message} />}

      {loading ? (
        <Card className="p-6 text-muted-foreground">Уншиж байна...</Card>
      ) : items.length === 0 ? (
        <EmptyQueue title="Одоогоор шилжүүлэх орлого алга" text="Аялал дууссаны дараа жолоочийн орлого энд гарч ирнэ." />
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.driverId} className="p-4 sm:p-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_200px] lg:items-center">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-foreground">{item.driverName}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{item.phone || 'Утас алга'}</p>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <span className="text-muted-foreground">Цэвэр орлого: <span className="font-semibold text-foreground">₮{item.netEarned.toLocaleString()}</span></span>
                    <span className="text-muted-foreground">Шилжүүлсэн: <span className="font-semibold text-foreground">₮{item.paidOut.toLocaleString()}</span></span>
                    <span className="text-muted-foreground">Үлдэгдэл: <span className="font-semibold text-primary">₮{item.pending.toLocaleString()}</span></span>
                  </div>
                </div>
                <Button disabled={busyId === item.driverId || item.pending <= 0} onClick={() => pay(item)}>
                  <CheckCircle2 className="h-4 w-4" />
                  Payout бүртгэх
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminSupportQueue() {
  const [items, setItems] = useState<AdminSupportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await fetchAdminSupportRequests());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Дэмжлэгийн хүсэлт уншихад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const setStatus = async (item: AdminSupportItem, status: 'reviewing' | 'resolved') => {
    setBusyId(item.id);
    try {
      await updateSupportStatus(item.id, status);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Шинэчлэхэд алдаа гарлаа.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-5">
      <QueueToolbar icon={<CreditCard className="h-5 w-5" />} title="Дэмжлэгийн хүсэлт" count={items.length} loading={loading} onRefresh={load} />
      {error && <Notice tone="danger" text={error} />}

      {loading ? (
        <Card className="p-6 text-muted-foreground">Хүсэлтүүдийг уншиж байна...</Card>
      ) : items.length === 0 ? (
        <EmptyQueue title="Одоогоор дэмжлэгийн хүсэлт алга" text="Хэрэглэгч тусламжийн форм бөглөхөд энд гарч ирнэ." />
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id} className="p-4 sm:p-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_200px] lg:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={item.status} />
                    {item.category && <Badge variant="default">{item.category}</Badge>}
                  </div>
                  <p className="mt-3 break-words text-foreground">{item.message}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.name || 'Нэргүй'}{item.phone ? ` · ${item.phone}` : ''}{item.bookingRef ? ` · ${item.bookingRef}` : ''} · {new Date(item.createdAt).toLocaleString('mn-MN')}
                  </p>
                </div>
                <div className="grid gap-2">
                  <Button size="sm" variant="outline" disabled={busyId === item.id || item.status === 'reviewing'} onClick={() => setStatus(item, 'reviewing')}>
                    Шалгаж байна
                  </Button>
                  <Button size="sm" disabled={busyId === item.id || item.status === 'resolved'} onClick={() => setStatus(item, 'resolved')}>
                    <CheckCircle2 className="h-4 w-4" />
                    Шийдвэрлэх
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

function ComingSoonQueue({ view }: { view: AdminView }) {
  const copy = pageCopy[view];
  return (
    <EmptyQueue
      title={`${copy.title} хэсэгт одоогоор бодит үйлдэл нэмэгдээгүй`}
      text="Энэ хэсгийг дараагийн шатанд өгөгдлийн сантай бүрэн холбоно. Одоогоор төлбөрийн баталгаажуулалт болон жолоочийн баталгаажуулалт хамгийн түрүүнд ажиллаж байна."
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

const successStatuses = new Set(['approved', 'active', 'confirmed', 'completed', 'delivered', 'cargo_accepted', 'accepted', 'resolved']);
const dangerStatuses = new Set(['rejected', 'cancelled', 'disputed']);
const warningStatuses = new Set([
  'proof_uploaded', 'pending', 'pending_request', 'waiting_payment', 'payment_review',
  'cargo_requested', 'picked_up', 'in_transit', 'on_trip', 'full', 'draft', 'open', 'reviewing',
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
  open: 'Нээлттэй',
  reviewing: 'Шалгаж байна',
  resolved: 'Шийдвэрлэсэн',
  closed: 'Хаагдсан',
  refunded: 'Төлбөр буцаасан',
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
