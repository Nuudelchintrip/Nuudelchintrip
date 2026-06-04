import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle, Copy, CreditCard, FileImage, ReceiptText, Upload } from 'lucide-react';
import { useParams } from 'react-router';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { AppFooter } from '../components/Footer';
import { Input } from '../components/Input';
import { Sidebar } from '../components/Sidebar';
import { getBooking } from '../data/mockData';
import { getDashboardMenu } from '../navigation/dashboardMenus';
import { isSupabaseConfigured } from '../lib/supabase';
import { uploadPaymentProof } from '../services/paymentService';
import { fetchPassengerBookingById, type PassengerBookingDetail } from '../services/tripService';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function PaymentProofPage() {
  const { id } = useParams();
  const mockBooking = getBooking(id);
  const isRealBooking = Boolean(id && UUID_PATTERN.test(id));
  const [realBooking, setRealBooking] = useState<PassengerBookingDetail | null>(null);
  const [loading, setLoading] = useState(isRealBooking);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [transactionNote, setTransactionNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    if (!id || !UUID_PATTERN.test(id)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchPassengerBookingById(id)
      .then((booking) => {
        if (!active) return;
        setRealBooking(booking);
        setError(booking ? '' : 'Booking олдсонгүй.');
      })
      .catch((fetchError) => {
        if (!active) return;
        setError(fetchError instanceof Error ? fetchError.message : 'Booking уншихад алдаа гарлаа.');
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
      return {
        bookingId: mockBooking.id,
        routeLabel: `${mockBooking.route.from} → ${mockBooking.route.to}`,
        driverName: mockBooking.driver.name,
        driverBankName: mockBooking.driver.bankName || 'Банк / QPay',
        driverBankAccount: mockBooking.driver.bankAccount || 'Жолоочтой тохиролцоно',
        agreed: mockBooking.price.agreed,
        serviceFee: mockBooking.price.serviceFee,
        total: mockBooking.price.total,
        status: mockBooking.status,
      };
    }

    const agreed = realBooking.totalAmount || realBooking.trip.pricePerSeat * realBooking.seatsRequested;
    const serviceFee = Math.round(agreed * 0.1);

    return {
      bookingId: realBooking.id,
      routeLabel: `${realBooking.trip.fromLocation} → ${realBooking.trip.toLocation}`,
      driverName: realBooking.driver.fullName,
      driverBankName: 'Банк / QPay',
      driverBankAccount: 'Жолоочтой тохиролцсон данс',
      agreed,
      serviceFee,
      total: agreed + serviceFee,
      status: realBooking.status,
    };
  }, [mockBooking, realBooking]);

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!file) {
      setError('Screenshot эсвэл PDF баримтаа сонгоно уу.');
      return;
    }

    if (!isRealBooking || !id || !isSupabaseConfigured) {
      setSuccess('Demo mode: баримт амжилттай илгээгдсэн гэж тэмдэглэлээ.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await uploadPaymentProof({
        target: 'booking',
        targetId: id,
        amount: payment.total,
        file,
        note: transactionNote,
      });

      setSuccess(`Төлбөрийн баримт Supabase-д хадгалагдлаа. Payment: ${result.paymentId.slice(0, 8)}...`);
      setRealBooking((current) => current ? { ...current, status: 'payment_review' } : current);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Төлбөрийн баримт хадгалахад алдаа гарлаа.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyAccount = () => {
    if (payment.driverBankAccount && payment.driverBankAccount !== 'Жолоочтой тохиролцсон данс') {
      void navigator.clipboard.writeText(payment.driverBankAccount);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar
        menuItems={getDashboardMenu('traveler')}
        accountRole="traveler"
        activeHref={`/dashboard/bookings/${payment.bookingId}/payment-proof`}
      />

      <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-8">
        <button
          type="button"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
          onClick={() => window.location.href = `/dashboard/bookings/${payment.bookingId}`}
        >
          <ArrowLeft className="h-4 w-4" />
          Booking руу буцах
        </button>

        <section className="mb-8 rounded-lg border border-warning/20 bg-warning/5 p-5 md:p-6">
          <Badge variant="warning" className="mb-4">Manual payment v1</Badge>
          <h1 className="mb-3 text-2xl font-bold text-foreground md:text-3xl">Төлбөрийн баримт илгээх</h1>
          <p className="max-w-3xl leading-7 text-muted-foreground">
            Төлбөрөө шилжүүлсний дараа screenshot, PDF эсвэл transaction code оруулна.
            Баримт илгээгдмэгц booking төлөв <strong>payment_review</strong> болж admin баталгаажуулалтад орно.
          </p>
        </section>

        {loading && (
          <div className="mb-5 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            Booking мэдээллийг Supabase-аас уншиж байна...
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Төлбөр төлөх заавар</h2>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  {[
                    'Нийт төлөх дүнг жолоочтой тохирсон данс эсвэл QPay-р шилжүүлнэ.',
                    `Гүйлгээний утга дээр ${payment.bookingId} гэж бичвэл шалгахад амар.`,
                    'Screenshot эсвэл transaction code-оо энэ хуудсанд оруулна.',
                    'Admin approve хийсний дараа аялал confirmed төлөв рүү шилжинэ.',
                  ].map((item, index) => (
                    <div key={item} className="rounded-xl border border-border bg-muted/30 p-4">
                      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
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
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="mb-1 text-sm text-muted-foreground">Данс / note</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-foreground">{payment.driverBankAccount}</p>
                      <Button variant="ghost" size="sm" onClick={copyAccount} disabled={payment.driverBankAccount === 'Жолоочтой тохиролцсон данс'}>
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
                  <h2 className="text-xl font-semibold text-foreground">Баримтаа upload хийх</h2>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-5">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-foreground">Гүйлгээний screenshot / PDF</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="sr-only"
                      onChange={(event) => setFile(event.target.files?.[0] || null)}
                    />
                    <div className="cursor-pointer rounded-xl border-2 border-dashed border-border bg-muted/20 p-8 text-center transition-colors hover:border-primary">
                      <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <p className="mb-2 text-foreground">{file ? file.name : 'Файл сонгох эсвэл энд дарна уу'}</p>
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
                    Real booking дээр файл `payment-proofs` storage bucket-д, metadata нь `payments` болон `proofs` table-д хадгалагдана.
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-foreground">Payment summary</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <SummaryField label="Booking" value={payment.bookingId} />
                  <SummaryField label="Чиглэл" value={payment.routeLabel} />
                  <SummaryField label="Одоогийн төлөв" value={payment.status} />
                  <div className="border-t border-border pt-4 space-y-3">
                    <PriceRow label="Жолоочийн үнэ" value={payment.agreed} />
                    <PriceRow label="Үйлчилгээний шимтгэл" value={payment.serviceFee} />
                    <div className="border-t border-border pt-3">
                      <PriceRow label="Нийт" value={payment.total} strong />
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardBody>
                <h3 className="mb-2 font-semibold text-foreground">Admin approval</h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Proof илгээсний дараа admin төлбөрийг шалгаж approve/reject хийнэ.
                  Approve хийвэл booking `confirmed`, reject хийвэл дахин upload хийх action нээгдэнэ.
                </p>
              </CardBody>
            </Card>
          </aside>
        </div>

        <AppFooter />
      </main>
    </div>
  );
}

function BankField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
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
