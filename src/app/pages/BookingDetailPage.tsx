import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle,
  Clock,
  CreditCard,
  FileCheck2,
  Flag,
  MapPin,
  MessageSquare,
  Shield,
  Upload,
  User,
} from 'lucide-react';
import { useParams } from 'react-router';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';
import { bookingStatusSteps, getBooking, getStatusIndex, type BookingStatus } from '../data/mockData';
import { createBookingReport, fetchBookingStatusHistory, fetchPassengerBookingById, updatePassengerBookingStatus, type BookingStatusLog, type PassengerBookingDetail } from '../services/tripService';
import { getRequestStatusLabel } from '../utils/bookingStatus';
import { getStoredUser } from '../utils/auth';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function BookingDetailPage() {
  const { id } = useParams();
  const [realBooking, setRealBooking] = useState<PassengerBookingDetail | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(Boolean(id && UUID_PATTERN.test(id)));
  const [bookingError, setBookingError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [history, setHistory] = useState<BookingStatusLog[]>([]);
  const [reportMessage, setReportMessage] = useState('');

  const handleReport = async () => {
    if (!realBooking) return;
    const reason = window.prompt('Ямар асуудал гарсныг товч бичнэ үү (админд маргаан мэдэгдэнэ):');
    if (!reason?.trim()) return;
    try {
      await createBookingReport({ bookingId: realBooking.id, tripId: realBooking.tripId, reason: reason.trim() });
      setReportMessage('Таны мэдэгдэл админд илгээгдлээ. Удахгүй шалгана.');
    } catch (err) {
      setReportMessage(err instanceof Error ? err.message : 'Гомдол илгээхэд алдаа гарлаа.');
    }
  };
  const booking = useMemo<ReturnType<typeof getBooking> | null>(() => realBooking ? mapRealBooking(realBooking) : null, [realBooking]);
  const isOwnBooking = Boolean(realBooking && getStoredUser()?.role === 'traveler');
  const canCancel = isOwnBooking && ['pending_request', 'accepted', 'waiting_payment'].includes(realBooking?.status || '');

  const handleCancel = async () => {
    if (!realBooking || !window.confirm('Энэ захиалгыг цуцлах уу? Суудал нь буцаан чөлөөлөгдөнө.')) return;
    setCancelling(true);
    setBookingError('');
    try {
      await updatePassengerBookingStatus(realBooking.id, 'cancelled');
      const [refreshed, logs] = await Promise.all([
        fetchPassengerBookingById(realBooking.id),
        fetchBookingStatusHistory(realBooking.id),
      ]);
      setRealBooking(refreshed);
      setHistory(logs);
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Захиалга цуцлахад алдаа гарлаа.');
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (!id || !UUID_PATTERN.test(id)) {
      setLoadingBooking(false);
      setBookingError('Энэ захиалга бодит өгөгдөлтэй холбогдоогүй байна.');
      return;
    }

    setLoadingBooking(true);
    fetchPassengerBookingById(id)
      .then((item) => {
        if (!active) return;
        setRealBooking(item);
        setBookingError(item ? '' : 'Захиалга олдсонгүй.');
      })
      .catch((error) => {
        if (!active) return;
        setBookingError(error instanceof Error ? error.message : 'Захиалгын дэлгэрэнгүй мэдээлэл уншихад алдаа гарлаа.');
      })
      .finally(() => {
        if (active) setLoadingBooking(false);
      });

    fetchBookingStatusHistory(id).then((logs) => {
      if (active) setHistory(logs);
    });

    return () => {
      active = false;
    };
  }, [id]);

  if (!booking) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => window.location.href = '/dashboard/traveler'}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Самбар руу буцах
          </button>

          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold text-foreground">
              {loadingBooking ? 'Захиалгын мэдээлэл уншиж байна...' : 'Захиалга олдсонгүй'}
            </h1>
            <p className="mx-auto mt-3 max-w-xl leading-7 text-muted-foreground">
              Захиалгын дэлгэрэнгүй зөвхөн өгөгдлийн санд хадгалагдсан бодит захиалга дээр харагдана. Эхлээд жолоочийн чиглэл сонгож суудлын хүсэлт илгээнэ үү.
            </p>
            {bookingError && (
              <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm font-medium text-destructive">
                {bookingError}
              </div>
            )}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={() => window.location.href = '/traveler/find-drivers'}>Жолооч хайх</Button>
              <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>Самбар руу очих</Button>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const currentIndex = getStatusIndex(booking.status);
  const currentStep = bookingStatusSteps[currentIndex] ?? bookingStatusSteps[0];
  const nextAction = getNextAction(booking.status, booking.id);
  const progress = Math.max(12, Math.round(((currentIndex + 1) / bookingStatusSteps.length) * 100));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-3.5 py-5 sm:px-6 sm:py-8 lg:px-8">
        <button
          type="button"
          onClick={() => window.location.href = '/dashboard/traveler'}
          className="mb-4 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary sm:mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Самбар руу буцах
        </button>

        {loadingBooking && (
          <div className="mb-6 rounded-lg border border-border bg-card p-4 text-muted-foreground">
            Захиалгын мэдээллийг уншиж байна...
          </div>
        )}

        {bookingError && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
            {bookingError}
          </div>
        )}

        <section className="mb-5 rounded-lg border border-border bg-card p-4 shadow-sm sm:mb-8 sm:rounded-2xl sm:p-6">
          <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Badge variant={booking.status === 'waiting_payment' ? 'warning' : 'info'} className="mb-3">
                {currentStep.label}
              </Badge>
              <h1 className="mb-1.5 text-2xl font-bold leading-tight text-foreground sm:mb-2 sm:text-3xl">Захиалгын дэлгэрэнгүй</h1>
              <p className="break-all text-sm text-muted-foreground sm:text-base">Захиалгын дугаар: {booking.id}</p>
            </div>

            <div className="w-full max-w-md rounded-xl bg-muted/40 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Явц</span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-border">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{currentStep.description}</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4 sm:space-y-6">
            <Card className="border-primary/20 bg-primary/5">
              <CardBody className="p-4 sm:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex gap-3 sm:gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground sm:h-12 sm:w-12 sm:rounded-xl">
                      {nextAction.icon}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold leading-tight text-foreground sm:text-xl">{nextAction.title}</h2>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{nextAction.description}</p>
                    </div>
                  </div>
                  <Button variant="primary" onClick={() => window.location.href = nextAction.href}>
                    {nextAction.button}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-foreground">Захиалгын явц</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {bookingStatusSteps.map((step, index) => {
                    const completed = index < currentIndex;
                    const current = index === currentIndex;

                    return (
                      <div key={step.code} className="grid grid-cols-[36px_1fr] gap-3 sm:grid-cols-[44px_1fr] sm:gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full sm:h-11 sm:w-11 ${
                              completed
                                ? 'bg-success text-success-foreground'
                                : current
                                  ? 'bg-warning text-warning-foreground'
                                  : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {completed ? <CheckCircle className="w-5 h-5" /> : current ? <Clock className="w-5 h-5" /> : <div className="w-2 h-2 bg-current rounded-full" />}
                          </div>
                          {index < bookingStatusSteps.length - 1 && (
                            <div className={`h-10 w-0.5 sm:h-12 ${completed ? 'bg-success' : 'bg-muted'}`} />
                          )}
                        </div>
                        <div className={`rounded-lg border p-3.5 sm:rounded-xl sm:p-4 ${current ? 'border-warning/30 bg-warning/5' : 'border-border bg-card'}`}>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={`font-semibold ${completed || current ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>

            {history.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold text-foreground">Төлвийн түүх</h2>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {history.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{getRequestStatusLabel(log.status)}</p>
                          {log.note && <p className="mt-0.5 text-sm text-muted-foreground">{log.note}</p>}
                          <p className="mt-0.5 text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString('mn-MN')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-foreground">Чиглэл ба аяллын мэдээлэл</h2>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="rounded-lg border border-border bg-muted/30 p-4 sm:rounded-xl sm:p-5">
                    <div className="mb-4 flex items-center gap-2 text-primary">
                      <MapPin className="w-5 h-5" />
                      <span className="font-semibold">Чиглэл</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{booking.route.from}</p>
                        <p className="text-sm text-muted-foreground">{booking.route.fromDetail}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="font-semibold text-foreground">{booking.route.to}</p>
                        <p className="text-sm text-muted-foreground">{booking.route.toDetail}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">{booking.route.date} · {booking.route.time}</p>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/30 p-4 sm:rounded-xl sm:p-5">
                    <div className="mb-4 flex items-center gap-2 text-accent">
                      <User className="w-5 h-5" />
                      <span className="font-semibold">Аялагчийн хүсэлт</span>
                    </div>
                    <p className="font-semibold text-foreground">{booking.ride.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{booking.ride.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="default">{booking.ride.seats} суудал</Badge>
                      <Badge variant="info">{booking.ride.luggage}</Badge>
                      <Badge variant="info">{booking.driver.vehicle}</Badge>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-foreground">Баталгаажуулах зүйлс</h2>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <EvidenceItem icon={<CreditCard className="w-5 h-5" />} title="Төлбөрийн баримт" status={booking.payment.status === 'approved' ? 'Баталгаажсан' : 'Хүлээгдэж байна'} active={booking.payment.status === 'approved'} />
                  <EvidenceItem icon={<Camera className="w-5 h-5" />} title="Аяллын баталгаа" status={currentIndex >= getStatusIndex('on_trip') ? 'Баталгаа орсон' : 'Жолооч оруулах боломжтой'} active={currentIndex >= getStatusIndex('on_trip')} />
                  <EvidenceItem icon={<FileCheck2 className="w-5 h-5" />} title="6 оронтой аяллын код" status="Бэлэн" active />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Захиалгын тэмдэглэл</h2>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {booking.messages.map((message) => (
                    <div key={`${message.author}-${message.time}`} className={`${message.own ? 'ml-3 bg-primary/10 sm:ml-8' : 'bg-muted/50'} rounded-lg p-3.5 sm:p-4`}>
                      <p className="text-sm font-medium text-foreground mb-1">{message.author}</p>
                      <p className="text-sm text-muted-foreground">{message.body}</p>
                      <p className="text-xs text-muted-foreground mt-2">{message.time}</p>
                    </div>
                  ))}
                  {booking.messages.length === 0 && (
                    <p className="text-sm text-muted-foreground">Захиалга үүсгэх үед оруулсан тэмдэглэл энд харагдана.</p>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          <aside className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-foreground">Оролцогчид</h3>
              </CardHeader>
              <CardBody className="space-y-5">
                <PersonCard title="Аялагч" name={booking.passenger.name} phone={booking.passenger.phone} verified={booking.passenger.verified} tone="primary" profileHref={`/profile/traveler/${realBooking?.travelerId}`} />
                <PersonCard title="Жолооч" name={booking.driver.name} phone={booking.driver.phone} verified={booking.driver.verified} tone="accent" meta={`Үнэлгээ: ${booking.driver.rating}/5.0`} profileHref={`/profile/driver/${realBooking?.trip.driverId}`} />
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Авах / буулгах цэг</p>
                  <p className="mt-1 font-semibold text-foreground">{booking.ride.pickupNote}</p>
                  <p className="text-sm text-muted-foreground">{booking.ride.dropoffNote}</p>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <h3 className="font-semibold text-foreground">Аяллын код</h3>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-muted-foreground mb-4">
                  Аялал дуусах үед аялагч энэ кодоор баталгаажуулна.
                </p>
                <div className="rounded-lg border border-border bg-card py-4 text-center text-3xl font-bold tracking-widest text-primary sm:rounded-xl sm:py-5 sm:text-4xl">
                  {booking.tripCode}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="font-semibold text-foreground">Төлбөрийн дэлгэрэнгүй</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-3 mb-5">
                  <PriceRow label="Аялалын үнэ" value={booking.price.agreed} />
                  <div className="border-t border-border pt-3">
                    <PriceRow label="Нийт төлөх" value={booking.price.total} strong />
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">Платформын 10% шимтгэлийг жолоочийн орлогоос суутгана.</p>
                </div>
                <Button variant="primary" fullWidth onClick={() => window.location.href = `/dashboard/bookings/${booking.id}/payment-proof`}>
                  <Upload className="w-4 h-4" />
                  Төлбөрийн баримт
                </Button>
                <Button variant="outline" fullWidth className="mt-3" onClick={() => window.location.href = `/dashboard/bookings/${booking.id}/delivery-proof`}>
                  <Shield className="w-4 h-4" />
                  Аяллын баталгаа
                </Button>
              </CardBody>
            </Card>

            <Card className="border-destructive/20">
              <CardBody>
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">Маргаан гарвал төлбөрийн баримт, аяллын баталгаа, тэмдэглэл админд нотолгоо болно.</p>
                </div>
                {reportMessage && (
                  <p className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">{reportMessage}</p>
                )}
                <Button variant="ghost" fullWidth className="mt-4 text-destructive hover:bg-destructive/10" onClick={handleReport}>
                  <Flag className="w-4 h-4" />
                  Асуудал мэдэгдэх
                </Button>
                {canCancel && (
                  <Button
                    variant="ghost"
                    fullWidth
                    className="mt-2 text-destructive hover:bg-destructive/10"
                    onClick={handleCancel}
                    disabled={cancelling}
                  >
                    {cancelling ? 'Цуцалж байна...' : 'Захиалга цуцлах'}
                  </Button>
                )}
              </CardBody>
            </Card>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function getNextAction(status: string, bookingId: string) {
  if (status === 'accepted' || status === 'waiting_payment') {
    return {
      icon: <CreditCard className="w-6 h-6" />,
      title: 'Дараагийн алхам: төлбөрийн баримт илгээх',
      description: 'Төлбөрөө шилжүүлээд screenshot эсвэл гүйлгээний код оруулна. Админ баталгаажуулсны дараа аялал баталгаажна.',
      button: 'Төлбөрийн баримт',
      href: `/dashboard/bookings/${bookingId}/payment-proof`,
    };
  }

  if (status === 'payment_review') {
    return {
      icon: <CreditCard className="w-6 h-6" />,
      title: 'Төлбөрийн баримт шалгагдаж байна',
      description: 'Таны баримт админы шалгалтад орсон. Баталгаажсаны дараа захиалга баталгаажсан төлөв рүү шилжинэ.',
      button: 'Баримтаа харах',
      href: `/dashboard/bookings/${bookingId}/payment-proof`,
    };
  }

  if (status === 'confirmed' || status === 'on_trip') {
    return {
      icon: <Camera className="w-6 h-6" />,
      title: 'Дараагийн алхам: аяллын баталгаа бүрдүүлэх',
      description: 'Аялал эхэлсэн болон дууссан баталгаа, аялагчийн 6 оронтой кодоор аяллыг баталгаажуулна.',
      button: 'Аяллын баталгаа',
      href: `/dashboard/bookings/${bookingId}/delivery-proof`,
    };
  }

  return {
    icon: <CheckCircle className="w-6 h-6" />,
    title: 'Захиалгын явц хянагдаж байна',
    description: 'Одоогийн төлөв дээр шаардлагатай баримт, мессеж, дараагийн алхмаа шалгаарай.',
    button: 'Дэлгэрэнгүй',
    href: `/dashboard/bookings/${bookingId}`,
  };
}

function EvidenceItem({ icon, title, status, active }: { icon: ReactNode; title: string; status: string; active: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${active ? 'border-success/20 bg-success/5' : 'border-border bg-muted/30'}`}>
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
        {icon}
      </div>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{status}</p>
    </div>
  );
}

function PersonCard({ title, name, phone, verified, tone, meta, profileHref }: { title: string; name: string; phone: string; verified: boolean; tone: 'primary' | 'accent'; meta?: string; profileHref?: string }) {
  const toneClasses = tone === 'primary' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent';

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${toneClasses}`}>
        <User className="w-6 h-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground">{name}</p>
          {verified && <CheckCircle className="w-4 h-4 text-success" />}
        </div>
        <p className="text-sm text-muted-foreground">{phone}</p>
        {meta && <p className="text-sm text-muted-foreground">{meta}</p>}
        {profileHref && (
          <button
            type="button"
            className="mt-2 text-sm font-medium text-primary hover:underline"
            onClick={() => { window.location.href = profileHref; }}
          >
            Профайл харах
          </button>
        )}
      </div>
    </div>
  );
}

function PriceRow({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? 'font-semibold text-foreground' : 'text-sm text-muted-foreground'}>{label}</span>
      <span className={strong ? 'text-2xl font-bold text-primary' : 'font-semibold text-foreground'}>
        ₮{value.toLocaleString()}
      </span>
    </div>
  );
}

function mapRealBooking(detail: PassengerBookingDetail): ReturnType<typeof getBooking> {
  const departure = new Date(detail.trip.departureAt);
  const date = Number.isNaN(departure.getTime()) ? detail.trip.departureAt.slice(0, 10) : departure.toISOString().slice(0, 10);
  const time = Number.isNaN(departure.getTime())
    ? ''
    : departure.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const agreed = detail.totalAmount || detail.trip.pricePerSeat * detail.seatsRequested;
  const serviceFee = Math.round(agreed * 0.1);

  return {
    id: detail.id,
    status: detail.status as BookingStatus,
    ride: {
      title: `${detail.seatsRequested} суудал`,
      description: detail.note || 'Аялагч жолоочид суудлын захиалгын хүсэлт илгээсэн.',
      seats: detail.seatsRequested,
      luggage: 'Хувийн жижиг цүнх',
      pickupNote: detail.trip.pickupNote || 'Авах цэг тохиролцоно',
      dropoffNote: detail.trip.dropoffNote || 'Буулгах цэг тохиролцоно',
    },
    cargo: {
      name: `${detail.seatsRequested} суудал`,
      description: 'Зорчигчийн захиалга. Дайвар ачаанаас тусдаа зорчигчийн хүсэлт.',
      weight: 'Хувийн ачаа',
      size: `${detail.seatsRequested} суудал`,
      type: 'Аялагч',
      receiverName: detail.traveler.fullName,
      receiverPhone: detail.traveler.phone || '+976 •••• ••••',
    },
    route: {
      from: detail.trip.fromLocation,
      fromDetail: detail.trip.pickupNote || 'Авах цэг тохиролцоно',
      to: detail.trip.toLocation,
      toDetail: detail.trip.dropoffNote || 'Буулгах цэг тохиролцоно',
      date,
      time,
    },
    sender: {
      name: detail.traveler.fullName,
      phone: detail.traveler.phone || '+976 •••• ••••',
      email: detail.traveler.email || '',
      verified: detail.traveler.phoneVerified,
    },
    passenger: {
      name: detail.traveler.fullName,
      phone: detail.traveler.phone || '+976 •••• ••••',
      email: detail.traveler.email || '',
      verified: detail.traveler.phoneVerified,
    },
    traveler: {
      name: detail.driver.fullName,
      phone: detail.driver.phone || '+976 •••• ••••',
      email: detail.driver.email || '',
      rating: detail.driver.rating,
      verified: detail.driver.verificationStatus === 'approved',
      bankAccount: '',
      bankName: '',
    },
    driver: {
      name: detail.driver.fullName,
      phone: detail.driver.phone || '+976 •••• ••••',
      email: detail.driver.email || '',
      rating: detail.driver.rating,
      verified: detail.driver.verificationStatus === 'approved',
      vehicle: detail.driver.carModel || 'Машины мэдээлэл хүлээгдэж байна',
      completedTrips: detail.driver.completedTrips,
      bankAccount: '',
      bankName: '',
    },
    price: {
      agreed,
      serviceFee,
      total: agreed,
    },
    payment: {
      method: 'Банкны шилжүүлэг',
      transactionCode: '',
      screenshotName: '',
      status: detail.status === 'confirmed' || detail.status === 'on_trip' || detail.status === 'completed' ? 'approved' : 'pending',
    },
    tripCode: detail.tripCode || detail.id.slice(0, 6).toUpperCase(),
    deliveryCode: detail.tripCode || detail.id.slice(0, 6).toUpperCase(),
    messages: detail.note
      ? [{ author: detail.traveler.fullName, body: detail.note, time: 'Захиалга үүсэх үед', own: false }]
      : [],
  };
}
