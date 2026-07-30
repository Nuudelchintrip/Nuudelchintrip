import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle, Clock, Copy, CreditCard, FileImage, ReceiptText, Upload } from 'lucide-react';
import { useParams } from 'react-router';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Footer } from '../components/Footer';
import { Input } from '../components/Input';
import { Navbar } from '../components/Navbar';
import { isSupabaseConfigured } from '../lib/supabase';
import { fetchPlatformPaymentInfo, uploadPaymentProof, type PlatformPaymentInfo } from '../services/paymentService';
import { fetchCurrentTravelerBookings, fetchPassengerBookingById, type PassengerBookingDetail } from '../services/tripService';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const fallbackPayment: PlatformPaymentInfo = {
  holder: import.meta.env.VITE_PLATFORM_BANK_HOLDER || 'NuudelchinTrip админ',
  bankName: import.meta.env.VITE_PLATFORM_BANK_NAME || 'Админы данс',
  account: import.meta.env.VITE_PLATFORM_BANK_ACCOUNT || 'Дансны мэдээллийг админ тохируулна',
};

const statusLabels: Record<string, string> = {
  pending_request: 'Хүсэлт илгээгдсэн',
  accepted: 'Зөвшөөрсөн',
  waiting_payment: 'Төлбөр хүлээгдэж байна',
  payment_review: 'Баримт шалгаж байна',
  confirmed: 'Баталгаажсан',
  on_trip: 'Аялал эхэлсэн',
  completed: 'Дууссан',
  cancelled: 'Цуцлагдсан',
  disputed: 'Маргаантай',
};

const PAYABLE_STATUSES = new Set(['accepted', 'waiting_payment', 'payment_review']);

export function PaymentProofPage() {
  const { id } = useParams();
  const isRealBooking = Boolean(id && UUID_PATTERN.test(id));
  const [realBooking, setRealBooking] = useState<PassengerBookingDetail | null>(null);
  const [loading, setLoading] = useState(isRealBooking);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [transactionNote, setTransactionNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [platformPayment, setPlatformPayment] = useState<PlatformPaymentInfo>(fallbackPayment);

  useEffect(() => {
    let active = true;
    fetchPlatformPaymentInfo().then((info) => {
      if (!active || !info) return;
      // Use DB-configured values when present, otherwise keep the env fallback.
      setPlatformPayment({
        holder: info.holder || fallbackPayment.holder,
        bankName: info.bankName || fallbackPayment.bankName,
        account: info.account || fallbackPayment.account,
      });
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!id || !UUID_PATTERN.test(id)) {
      setLoading(true);
      fetchCurrentTravelerBookings()
        .then(async (bookings) => {
          if (!active) return;
          const payable = bookings.find((booking) => PAYABLE_STATUSES.has(booking.status));
          const pendingRequest = payable ? undefined : bookings.find((booking) => booking.status === 'pending_request');
          const target = payable ?? pendingRequest;
          if (!target) {
            setRealBooking(null);
            setError('Төлбөрийн баримт оруулах боломжтой захиалга олдсонгүй.');
            return;
          }

          const booking = await fetchPassengerBookingById(target.id);
          if (!active) return;
          setRealBooking(booking);
          setError(booking ? '' : 'Захиалга олдсонгүй.');
          window.history.replaceState(null, '', `/dashboard/bookings/${target.id}/payment-proof`);
        })
        .catch((fetchError) => {
          if (!active) return;
          setError(fetchError instanceof Error ? fetchError.message : 'Захиалгын мэдээлэл уншихад алдаа гарлаа.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return;
    }

    setLoading(true);
    fetchPassengerBookingById(id)
      .then((booking) => {
        if (!active) return;
        setRealBooking(booking);
        setError(booking ? '' : 'Захиалга олдсонгүй.');
      })
      .catch((fetchError) => {
        if (!active) return;
        setError(fetchError instanceof Error ? fetchError.message : 'Захиалгын мэдээлэл уншихад алдаа гарлаа.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const payment = useMemo(() => {
    if (!realBooking) {
      return null;
    }

    const agreed = realBooking.totalAmount || realBooking.trip.pricePerSeat * realBooking.seatsRequested;
    const serviceFee = Math.round(agreed * 0.1);

    return {
      bookingId: realBooking.id,
      routeLabel: `${realBooking.trip.fromLocation} → ${realBooking.trip.toLocation}`,
      driverName: platformPayment.holder,
      driverBankName: platformPayment.bankName,
      driverBankAccount: platformPayment.account,
      agreed,
      serviceFee,
      total: agreed,
      status: realBooking.status,
    };
  }, [realBooking, platformPayment]);

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!payment) {
      setError('Бодит захиалга олдсонгүй.');
      return;
    }

    if (!file) {
      setError('Төлбөрийн зураг эсвэл PDF баримтаа сонгоно уу.');
      return;
    }

    if (!UUID_PATTERN.test(payment.bookingId) || !isSupabaseConfigured) {
      setError('Төлбөрийн баримт илгээхийн тулд бодит захиалга шаардлагатай.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await uploadPaymentProof({
        target: 'booking',
        targetId: payment.bookingId,
        amount: payment.total,
        file,
        note: transactionNote,
      });

      setSuccess(`Төлбөрийн баримт амжилттай илгээгдлээ. Баримтын дугаар: ${result.paymentId.slice(0, 8)}...`);
      setRealBooking((current) => current ? { ...current, status: 'payment_review' } : current);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Төлбөрийн баримт хадгалахад алдаа гарлаа.');
    } finally {
      setSubmitting(false);
    }
  };

  if (realBooking && realBooking.status === 'pending_request') {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="mx-auto w-full flex-1 max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <button
            type="button"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
            onClick={() => window.location.href = '/dashboard'}
          >
            <ArrowLeft className="h-4 w-4" />
            Самбар руу буцах
          </button>

          <Card className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warning/10">
              <Clock className="h-7 w-7 text-warning" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Жолооч хараахан зөвшөөрөөгүй байна</h1>
            <p className="mx-auto mt-3 max-w-xl leading-7 text-muted-foreground">
              Таны {realBooking.trip.fromLocation} → {realBooking.trip.toLocation} чиглэлийн суудлын хүсэлт жолоочид илгээгдсэн.
              Жолооч зөвшөөрсний дараа төлбөрийн баримт оруулах боломжтой болно. Та түр хүлээнэ үү.
            </p>
            <div className="mt-5 rounded-lg border border-warning/30 bg-warning/5 p-4 text-sm font-medium text-warning">
              Одоогийн төлөв: {statusLabels[realBooking.status] ?? realBooking.status}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={() => window.location.href = `/dashboard/bookings/${realBooking.id}`}>Захиалга харах</Button>
              <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>Самбар руу очих</Button>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="mx-auto w-full flex-1 max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <button
            type="button"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
            onClick={() => window.location.href = '/dashboard'}
          >
            <ArrowLeft className="h-4 w-4" />
            Самбар руу буцах
          </button>

          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold text-foreground">
              {loading ? 'Захиалгын мэдээлэл уншиж байна...' : 'Төлбөрийн баримт оруулах захиалга олдсонгүй'}
            </h1>
            <p className="mx-auto mt-3 max-w-xl leading-7 text-muted-foreground">
              Төлбөрийн баримт зөвхөн өгөгдлийн санд хадгалагдсан бодит захиалга дээр ажиллана. Эхлээд жолоочийн чиглэл сонгож суудлын хүсэлт илгээнэ үү.
            </p>
            {error && (
              <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm font-medium text-destructive">
                {error}
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

  const copyAccount = () => {
    if (payment.driverBankAccount && payment.driverBankAccount !== 'Дансны мэдээллийг админ тохируулна') {
      void navigator.clipboard.writeText(payment.driverBankAccount);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="mx-auto w-full flex-1 max-w-7xl px-3.5 py-5 sm:px-6 sm:py-8 lg:px-8">
        <button
          type="button"
          className="mb-4 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary sm:mb-6"
          onClick={() => window.location.href = `/dashboard/bookings/${payment.bookingId}`}
        >
          <ArrowLeft className="h-4 w-4" />
          Захиалга руу буцах
        </button>

        <section className="mb-5 rounded-lg border border-warning/20 bg-warning/5 p-4 sm:mb-8 sm:p-5 md:p-6">
          <Badge variant="warning" className="mb-3 sm:mb-4">Төлбөрийн баталгаажуулалт</Badge>
          <h1 className="mb-2 text-2xl font-bold leading-tight text-foreground sm:mb-3 md:text-3xl">Төлбөрийн баримт илгээх</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            Төлбөрөө шилжүүлсний дараа зураг, PDF эсвэл гүйлгээний код оруулна.
            Баримт илгээгдмэгц захиалгын төлөв <strong>шалгаж байна</strong> болж админы баталгаажуулалтад орно.
          </p>
        </section>

        {loading && (
          <div className="mb-5 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            Захиалгын мэдээллийг уншиж байна...
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm font-medium text-destructive">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-lg border border-success/30 bg-success/5 p-4 text-sm font-medium text-success">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Төлбөр төлөх дараалал</h2>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  {[
                    'Нийт төлөх дүнг платформын админы данс руу шилжүүлнэ.',
                    `Гүйлгээний утга дээр ${payment.bookingId} гэж бичвэл шалгахад амар.`,
                    'Төлбөрийн зураг эсвэл гүйлгээний кодоо энэ хуудсанд оруулна.',
                    'Админ баталгаажуулсны дараа аялал баталгаажсан төлөв рүү шилжинэ.',
                  ].map((item, index) => (
                    <div key={item} className="rounded-lg border border-border bg-muted/30 p-3.5 sm:p-4">
                      <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground sm:mb-3 sm:h-9 sm:w-9 sm:text-base">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-6 text-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Дансны мэдээлэл</h2>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <BankField label="Хүлээн авагч" value={payment.driverName} />
                  <BankField label="Төлөх суваг" value={payment.driverBankName} />
                  <div className="rounded-lg border border-border bg-muted/30 p-3.5 sm:p-4">
                    <p className="mb-1 text-sm text-muted-foreground">Данс эсвэл тэмдэглэл</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-foreground">{payment.driverBankAccount}</p>
                      <Button variant="ghost" size="sm" onClick={copyAccount} disabled={payment.driverBankAccount === 'Дансны мэдээллийг админ тохируулна'}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ReceiptText className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Баримтаа оруулах</h2>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-5">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-foreground">Гүйлгээний зураг эсвэл PDF</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="sr-only"
                      onChange={(event) => setFile(event.target.files?.[0] || null)}
                    />
                    <div className="cursor-pointer rounded-lg border-2 border-dashed border-border bg-muted/20 p-5 text-center transition-colors hover:border-primary sm:p-8">
                      <Upload className="mx-auto mb-3 h-9 w-9 text-muted-foreground sm:mb-4 sm:h-12 sm:w-12" />
                      <p className="mb-1.5 break-all text-sm text-foreground sm:mb-2 sm:text-base">{file ? file.name : 'Файл сонгох эсвэл энд дарна уу'}</p>
                      <p className="text-sm text-muted-foreground">PNG, JPG эсвэл PDF. Дээд хэмжээ 10MB.</p>
                    </div>
                  </label>

                  <Input
                    label="Гүйлгээний код / лавлагаа"
                    placeholder="Жишээ: TXN123456789"
                    value={transactionNote}
                    onChange={(event) => setTransactionNote(event.target.value)}
                  />

                  <Button variant="primary" size="lg" fullWidth onClick={handleSubmit} disabled={submitting || loading}>
                    {submitting ? <FileImage className="h-5 w-5 animate-pulse" /> : <CheckCircle className="h-5 w-5" />}
                    {submitting ? 'Баримт хадгалж байна...' : 'Төлбөрийн баримт илгээх'}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    Баримтыг админ шалгасны дараа захиалга баталгаажсан төлөв рүү шилжинэ.
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>

          <aside className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-foreground">Төлбөрийн хураангуй</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <SummaryField label="Захиалга" value={payment.bookingId} />
                  <SummaryField label="Чиглэл" value={payment.routeLabel} />
                  <SummaryField label="Одоогийн төлөв" value={statusLabels[payment.status] ?? payment.status} />
                  <div className="space-y-3 border-t border-border pt-4">
                    <div className="border-t border-border pt-3">
                      <PriceRow label="Нийт төлөх дүн" value={payment.total} strong />
                    </div>
                    <p className="text-xs leading-5 text-muted-foreground">
                      Энэ дүнг платформын данс руу шилжүүлнэ. Платформын 10% шимтгэлийг жолоочийн орлогоос суутган, үлдсэнийг жолоочид шилжүүлнэ.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardBody>
                <h3 className="mb-2 font-semibold text-foreground">Админы шалгалт</h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Баримт илгээсний дараа админ төлбөрийг шалгаж зөвшөөрөх эсвэл буцаана.
                  Зөвшөөрөгдвөл захиалга баталгаажсан төлөв рүү шилжинэ.
                </p>
              </CardBody>
            </Card>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function BankField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <p className="mb-1 text-sm text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground">{value}</p>
    </div>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-sm text-muted-foreground">{label}</p>
      <p className="break-words font-medium text-foreground">{value}</p>
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
