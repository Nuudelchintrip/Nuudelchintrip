import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, MapPin, PackageCheck, Phone, Star, User } from 'lucide-react';
import { useParams } from 'react-router';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { AppFooter } from '../components/Footer';
import { Sidebar } from '../components/Sidebar';
import { getDashboardMenu } from '../navigation/dashboardMenus';
import {
  fetchCargoRequestById,
  updateCargoRequestStatus,
  submitCargoReview,
  type CargoRequestDetail,
} from '../services/tripService';
import { getCargoStatusLabel } from '../utils/bookingStatus';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Hide raw "old_status → new_status" enum transitions from the timeline note. */
function visibleNote(note: string | null | undefined): string | null {
  if (!note) return null;
  if (/^[a-z_]+\s*(→|->)\s*[a-z_]+$/.test(note.trim())) return null;
  return note;
}

function badgeVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'default' {
  if (['delivered', 'completed'].includes(status)) return 'success';
  if (['rejected', 'cancelled', 'disputed'].includes(status)) return 'danger';
  if (['waiting_payment', 'payment_review'].includes(status)) return 'warning';
  if (['picked_up', 'in_transit', 'cargo_accepted'].includes(status)) return 'info';
  return 'default';
}

export function CargoDetailPage() {
  const { id } = useParams();
  const [cargo, setCargo] = useState<CargoRequestDetail | null>(null);
  const [loading, setLoading] = useState(Boolean(id && UUID_PATTERN.test(id)));
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    let active = true;
    if (!id || !UUID_PATTERN.test(id)) {
      setLoading(false);
      setError('Энэ ачаа бодит өгөгдөлтэй холбогдоогүй байна.');
      return;
    }
    setLoading(true);
    fetchCargoRequestById(id)
      .then((item) => {
        if (!active) return;
        setCargo(item);
        setError(item ? '' : 'Ачааны хүсэлт олдсонгүй.');
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
  }, [id]);

  const showCode = cargo && ['picked_up', 'in_transit'].includes(cargo.status);

  const confirmCargoReceived = async () => {
    if (!cargo || cargo.status !== 'delivered') return;
    if (!window.confirm('Ачаагаа бүрэн хүлээн авснаа баталгаажуулах уу?')) return;

    setCompleting(true);
    setError('');
    setActionMessage('');
    try {
      await updateCargoRequestStatus(cargo.id, 'completed');
      const refreshed = await fetchCargoRequestById(cargo.id);
      setCargo(refreshed || { ...cargo, status: 'completed' });
      setActionMessage('Ачаа хүлээн авсан нь баталгаажиж, захиалга дууслаа.');
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Ачааны захиалгыг дуусгахад алдаа гарлаа.');
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar menuItems={getDashboardMenu('sender')} />

      <main className="flex min-w-0 flex-1 flex-col overflow-x-hidden p-3.5 sm:p-5 md:p-8">
        <button
          type="button"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
          onClick={() => window.location.href = '/dashboard/cargo/requests'}
        >
          <ArrowLeft className="h-4 w-4" />
          Миний ачаа руу буцах
        </button>

        {loading ? (
          <Card className="mx-auto max-w-3xl p-6 text-sm text-muted-foreground">Ачааны мэдээллийг уншиж байна...</Card>
        ) : !cargo ? (
          <Card className="mx-auto max-w-3xl p-8 text-center">
            <PackageCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h1 className="text-2xl font-bold text-foreground">Ачаа олдсонгүй</h1>
            <p className="mx-auto mt-3 max-w-xl leading-7 text-muted-foreground">
              {error || 'Дэлгэрэнгүй зөвхөн бодит ачааны хүсэлт дээр харагдана.'}
            </p>
            <Button className="mt-6" onClick={() => window.location.href = '/cargo/find-routes'}>Ачаа авах чиглэл хайх</Button>
          </Card>
        ) : (
          <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_340px]">
            <div className="space-y-6">
              {error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
                  {error}
                </div>
              )}
              {actionMessage && (
                <div className="flex items-start gap-3 rounded-lg border border-success/20 bg-success/5 px-4 py-3 text-sm font-medium text-success">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  {actionMessage}
                </div>
              )}
              <Card>
                <CardBody className="p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={badgeVariant(cargo.status)}>{getCargoStatusLabel(cargo.status)}</Badge>
                    {cargo.weightKg ? <Badge variant="default">{cargo.weightKg} кг</Badge> : null}
                  </div>
                  <h1 className="mt-3 text-2xl font-bold text-foreground">{cargo.cargoName}</h1>
                  <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">{cargo.trip.fromLocation} → {cargo.trip.toLocation}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {new Date(cargo.trip.departureAt).toLocaleString('mn-MN')}
                  </p>
                </CardBody>
              </Card>

              <Card>
                <CardHeader><h2 className="text-lg font-semibold text-foreground">Ачаа ба хүлээн авагч</h2></CardHeader>
                <CardBody className="grid gap-4 sm:grid-cols-2">
                  <Info label="Ачааны нэр" value={cargo.cargoName} />
                  <Info label="Төрөл" value={cargo.cargoType || 'Тодорхойгүй'} />
                  <Info label="Хэмжээ / тэмдэглэл" value={cargo.sizeNote || '—'} />
                  <Info label="Жин" value={cargo.weightKg ? `${cargo.weightKg} кг` : '—'} />
                  <Info label="Хүлээн авагч" value={cargo.receiverName} />
                  <Info label="Хүлээн авагчийн утас" value={cargo.receiverPhone} />
                  <Info label="Авах цэг" value={cargo.pickupNote || 'Тохиролцоно'} />
                </CardBody>
              </Card>

              {cargo.history.length > 0 && (
                <Card>
                  <CardHeader><h2 className="text-lg font-semibold text-foreground">Төлвийн түүх</h2></CardHeader>
                  <CardBody>
                    <div className="space-y-3">
                      {cargo.history.map((log) => (
                        <div key={log.id} className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3">
                          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">{getCargoStatusLabel(log.status)}</p>
                            {visibleNote(log.note) && <p className="mt-0.5 text-sm text-muted-foreground">{visibleNote(log.note)}</p>}
                            <p className="mt-0.5 text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString('mn-MN')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>

            <aside className="space-y-6">
              <Card>
                <CardHeader><h3 className="font-semibold text-foreground">Жолооч</h3></CardHeader>
                <CardBody className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{cargo.driver.fullName}</p>
                      {cargo.driver.carModel && <p className="text-sm text-muted-foreground">{cargo.driver.carModel}</p>}
                    </div>
                  </div>
                  {cargo.driver.phone && (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-4 w-4" />{cargo.driver.phone}</p>
                  )}
                  <p className="flex items-center gap-2 text-sm text-muted-foreground"><Star className="h-4 w-4 text-warning" />Үнэлгээ: {cargo.driver.rating}/5.0</p>
                </CardBody>
              </Card>

              <Card className="bg-primary/5 border-primary/20">
                <CardHeader><h3 className="font-semibold text-foreground">Хүргэлтийн код</h3></CardHeader>
                <CardBody>
                  <p className="mb-3 text-sm text-muted-foreground">
                    {showCode
                      ? 'Энэ кодыг хүлээн авагчид өг. Жолооч хүргэх үед уг кодоор баталгаажуулна.'
                      : 'Ачаа авагдаж замдаа гармагц код идэвхжинэ.'}
                  </p>
                  <div className="rounded-xl border border-border bg-card py-5 text-center text-3xl font-bold tracking-widest text-primary">
                    {showCode ? cargo.deliveryCode : '••••••'}
                  </div>
                </CardBody>
              </Card>

              {cargo.isSender && ['cargo_accepted', 'waiting_payment'].includes(cargo.status) && (
                <Button fullWidth onClick={() => window.location.href = `/dashboard/cargo/${cargo.id}/payment-proof`}>
                  Төлбөрийн баримт оруулах
                </Button>
              )}

              {cargo.isSender && cargo.status === 'delivered' && (
                <Card className="border-success/20 bg-success/5 p-5">
                  <CheckCircle2 className="h-7 w-7 text-success" />
                  <h3 className="mt-3 font-semibold text-foreground">Ачаа хүргэгдсэн</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Ачаагаа бүрэн хүлээн авсан бол захиалгыг дуусгаж баталгаажуулна уу.
                  </p>
                  <Button className="mt-4" fullWidth disabled={completing} onClick={confirmCargoReceived}>
                    {completing ? 'Баталгаажуулж байна...' : 'Ачаагаа хүлээн авсан'}
                  </Button>
                </Card>
              )}

              {cargo.status === 'completed' && (
                <Card className="border-success/20 bg-success/5 p-5">
                  <CheckCircle2 className="h-7 w-7 text-success" />
                  <h3 className="mt-3 font-semibold text-foreground">Ачааны захиалга дууссан</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Илгээгч ачаагаа хүлээн авснаа баталгаажуулсан.
                  </p>
                </Card>
              )}

              {cargo.status === 'completed' && cargo.isSender && (
                <CargoReviewCard cargoId={cargo.id} />
              )}
            </aside>
          </div>
        )}

        <AppFooter />
      </main>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-medium text-foreground">{value}</p>
    </div>
  );
}

function CargoReviewCard({ cargoId }: { cargoId: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const submit = async () => {
    if (rating < 1) {
      setReviewError('Одоор үнэлгээгээ өгнө үү.');
      return;
    }
    setSubmitting(true);
    setReviewError('');
    try {
      await submitCargoReview(cargoId, rating, comment);
      setDone(true);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Үнэлгээ өгөхөд алдаа гарлаа.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Card className="border-success/20 bg-success/5 p-5">
        <CheckCircle2 className="h-7 w-7 text-success" />
        <h3 className="mt-3 font-semibold text-foreground">Үнэлгээ илгээгдлээ</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Жолоочид өгсөн үнэлгээнд баярлалаа.</p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <h3 className="font-semibold text-foreground">Жолоочоо үнэлэх</h3>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">Ачаагаа хэрхэн хүргэснийг үнэлээрэй.</p>
      <div className="mt-3 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5"
            aria-label={`${n} од`}
          >
            <Star className={`h-7 w-7 transition-colors ${(hover || rating) >= n ? 'fill-warning text-warning' : 'text-muted-foreground'}`} />
          </button>
        ))}
      </div>
      <textarea
        className="mt-3 min-h-20 w-full rounded-lg border border-input bg-input-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        placeholder="Сэтгэгдэл (заавал биш)"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
      />
      {reviewError && <p className="mt-2 text-sm font-medium text-destructive">{reviewError}</p>}
      <Button className="mt-3" fullWidth disabled={submitting} onClick={submit}>
        {submitting ? 'Илгээж байна...' : 'Үнэлгээ өгөх'}
      </Button>
    </Card>
  );
}
