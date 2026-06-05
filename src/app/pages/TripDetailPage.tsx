import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Calendar, Car, CheckCircle2, CreditCard, MapPin, Package, ShieldCheck, Star, UsersRound, X } from 'lucide-react';
import { useParams } from 'react-router';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Footer } from '../components/Footer';
import { Input } from '../components/Input';
import { Navbar } from '../components/Navbar';
import { createPassengerBooking, fetchTripById } from '../services/tripService';

type RouteDetailView = {
  id: string | number;
  from: string;
  to: string;
  date: string;
  time: string;
  seats: number;
  price: number;
  vehicle: string;
  pickup: string;
  dropoff: string;
  allowsCargo: boolean;
  cargoNote: string;
  source: 'supabase';
  driver: {
    name: string;
    rating: number;
    trips: number;
    phone: string;
  };
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function TripDetailPage() {
  const { id } = useParams();
  const [modal, setModal] = useState<'booking' | 'cargo' | null>(null);
  const [success, setSuccess] = useState('');
  const [createdBookingId, setCreatedBookingId] = useState('');
  const [route, setRoute] = useState<RouteDetailView | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(Boolean(id && UUID_PATTERN.test(id)));
  const [routeError, setRouteError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingSeats, setBookingSeats] = useState('1');
  const [bookingNote, setBookingNote] = useState('');

  useEffect(() => {
    let active = true;
    if (!id || !UUID_PATTERN.test(id)) {
      setRoute(null);
      setLoadingRoute(false);
      setRouteError('Энэ чиглэл бодит өгөгдөлтэй холбогдоогүй байна.');
      return;
    }

    setLoadingRoute(true);
    fetchTripById(id)
      .then((trip) => {
        if (!active) return;
        if (!trip) {
          setRoute(null);
          setRouteError('Чиглэл олдсонгүй.');
          return;
        }
        const departure = new Date(trip.departureAt);
        setRoute({
          id: trip.id,
          from: trip.fromLocation,
          to: trip.toLocation,
          date: Number.isNaN(departure.getTime()) ? trip.departureAt.slice(0, 10) : departure.toISOString().slice(0, 10),
          time: Number.isNaN(departure.getTime())
            ? ''
            : departure.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit', hour12: false }),
          seats: trip.seatsAvailable,
          price: trip.pricePerSeat,
          vehicle: trip.driver.carModel || 'Машины мэдээлэл хүлээгдэж байна',
          pickup: trip.pickupNote || 'Авах цэг тохиролцоно',
          dropoff: trip.dropoffNote || 'Буулгах цэг тохиролцоно',
          allowsCargo: trip.allowsCargo,
          cargoNote: trip.allowsCargo
            ? trip.cargoPriceNote || `${trip.cargoCapacityKg || 0} кг хүртэл`
            : 'Авахгүй',
          source: 'supabase',
          driver: {
            name: trip.driver.fullName,
            rating: trip.driver.rating || 0,
            trips: trip.driver.completedTrips || 0,
            phone: trip.driver.phone ? `${trip.driver.phone.slice(0, 8)}••••` : '+976 •••• ••••',
          },
        });
        setRouteError('');
      })
      .catch((error) => {
        if (!active) return;
        setRouteError(error instanceof Error ? error.message : 'Чиглэлийн мэдээлэл уншихад алдаа гарлаа.');
      })
      .finally(() => {
        if (active) setLoadingRoute(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <button type="button" onClick={() => history.back()} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          Буцах
        </button>

        {success && (
          <div className="mb-6 rounded-lg border border-success/30 bg-success/5 p-4 text-success">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>
                <CheckCircle2 className="mr-2 inline h-5 w-5" />
                {success}
              </p>
              {createdBookingId && (
                <Button size="sm" onClick={() => { window.location.href = `/dashboard/bookings/${createdBookingId}`; }}>
                  Захиалгаа харах
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {loadingRoute && (
          <div className="mb-6 rounded-lg border border-border bg-card p-4 text-muted-foreground">
            Чиглэлийн мэдээлэл уншиж байна...
          </div>
        )}

        {routeError && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
            {routeError}
          </div>
        )}

        {!route && !loadingRoute && (
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold text-foreground">Чиглэлийн мэдээлэл олдсонгүй</h1>
            <p className="mx-auto mt-3 max-w-xl leading-7 text-muted-foreground">
              Энэ хуудас зөвхөн өгөгдлийн санд хадгалагдсан бодит чиглэл дээр ажиллана. Жолооч хайх хэсгээс байгаа чиглэл сонгох эсвэл жолоочоор нэвтэрч шинэ чиглэл нийтлээрэй.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={() => window.location.href = '/traveler/find-drivers'}>Жолооч хайх</Button>
              <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>Самбар руу очих</Button>
            </div>
          </Card>
        )}

        {route && (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="bg-primary/5 p-6 md:p-8">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="success">Баталгаажсан жолооч</Badge>
                  <Badge variant="default">{route.vehicle}</Badge>
                  {route.allowsCargo && <Badge variant="warning">Дайвар ачаа авна</Badge>}
                </div>
                <h1 className="mt-5 flex flex-wrap items-center gap-3 text-3xl font-bold text-foreground">
                  <span>{route.from}</span>
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  <span>{route.to}</span>
                </h1>
                <p className="mt-4 max-w-3xl text-muted-foreground">
                  Баталгаажсан жолоочийн сул суудал, үнэ, цаг болон дайвар ачаа авах боломжийг нэг дор харуулж байна.
                </p>
              </div>
              <CardBody className="p-6 md:p-8">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Info icon={<Calendar className="h-5 w-5" />} label="Огноо / цаг" value={`${route.date}, ${route.time}`} />
                  <Info icon={<UsersRound className="h-5 w-5" />} label="Сул суудал" value={`${route.seats} суудал`} />
                  <Info icon={<CreditCard className="h-5 w-5" />} label="Үнэ" value={`₮${route.price.toLocaleString()} / хүн`} />
                  <Info icon={<Package className="h-5 w-5" />} label="Дайвар ачаа" value={route.allowsCargo ? route.cargoNote : 'Авахгүй'} />
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <Info icon={<MapPin className="h-5 w-5" />} label="Авах цэг" value={route.pickup} />
                  <Info icon={<MapPin className="h-5 w-5" />} label="Буулгах цэг" value={route.dropoff} />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-foreground">Сэтгэгдлийн тойм</h2>
              </CardHeader>
              <CardBody>
                <div className="rounded-lg border border-border bg-muted/30 p-5">
                  <div className="mb-2 flex items-center gap-2 text-warning">
                    <Star className="h-4 w-4" />
                    <span className="font-medium text-foreground">
                      {route.driver.rating > 0 ? `${route.driver.rating}/5 үнэлгээ` : 'Үнэлгээ хараахан алга'}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Бодит аялал дууссаны дараа аялагчийн өгсөн сэтгэгдэл энд харагдана.
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>

          <aside className="space-y-5">
            <Card className="p-5">
              <h2 className="text-xl font-semibold text-foreground">Жолоочийн танилцуулга</h2>
              <div className="mt-5 flex gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Car className="h-7 w-7" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{route.driver.name}</p>
                  <p className="text-sm text-muted-foreground">{route.vehicle}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {route.driver.rating > 0 || route.driver.trips > 0
                      ? `Үнэлгээ ${route.driver.rating}/5 · ${route.driver.trips} аялал`
                      : 'Үнэлгээ хараахан алга'}
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" /> Утас баталгаажсан</p>
                <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" /> Жолооч баталгаажсан</p>
              </div>
            </Card>

            <Card className="p-5">
              <p className="text-sm text-muted-foreground">Нийт төлбөр</p>
              <p className="mt-1 text-3xl font-bold text-primary">₮{route.price.toLocaleString()}</p>
              <p className="mt-1 text-xs text-muted-foreground">Үйлчилгээний шимтгэл төлбөрийн шатанд тусдаа харагдана</p>
              <div className="mt-5 grid gap-3">
                <Button size="lg" fullWidth onClick={() => setModal('booking')}>
                  Суудал захиалах
                </Button>
                {route.allowsCargo && (
                  <Button
                    size="lg"
                    variant="outline"
                    fullWidth
                    onClick={() => { window.location.href = `/cargo/new?tripId=${route.id}`; }}
                  >
                    Дайвар ачаа илгээх
                  </Button>
                )}
              </div>
            </Card>
          </aside>
        </div>
        )}
      </main>

      {modal && route && (
        <RequestModal
          type={modal}
          onClose={() => setModal(null)}
          submitting={submitting}
          onSubmit={async () => {
            if (modal === 'booking' && route.source === 'supabase') {
              const seats = Number(bookingSeats);
              if (!Number.isFinite(seats) || seats < 1) {
                setRouteError('Суудлын тоог зөв оруулна уу.');
                return;
              }
              if (seats > route.seats) {
                setRouteError('Сонгосон суудлын тоо сул суудлаас их байна.');
                return;
              }

              setSubmitting(true);
              try {
                const booking = await createPassengerBooking({
                  tripId: String(route.id),
                  seatsRequested: seats,
                  note: bookingNote.trim() || undefined,
                });
                setCreatedBookingId(booking.id);
                setSuccess(`Захиалгын хүсэлт илгээгдлээ. Дугаар: ${booking.id}`);
                setModal(null);
                setRouteError('');
              } catch (error) {
                setSuccess('');
                setCreatedBookingId('');
                setRouteError(error instanceof Error ? error.message : 'Захиалгын хүсэлт илгээхэд алдаа гарлаа.');
              } finally {
                setSubmitting(false);
              }
              return;
            }
            setCreatedBookingId('');
            setSuccess('');
            setRouteError('Энэ үйлдэл зөвхөн бодит чиглэл дээр ажиллана.');
            setModal(null);
          }}
          seats={bookingSeats}
          onSeatsChange={setBookingSeats}
          note={bookingNote}
          onNoteChange={setBookingNote}
        />
      )}

      <Footer />
    </div>
  );
}

function RequestModal({
  type,
  onClose,
  onSubmit,
  submitting = false,
  seats = '1',
  onSeatsChange,
  note = '',
  onNoteChange,
}: {
  type: 'booking' | 'cargo';
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
  submitting?: boolean;
  seats?: string;
  onSeatsChange?: (value: string) => void;
  note?: string;
  onNoteChange?: (value: string) => void;
}) {
  const isCargo = type === 'cargo';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-4">
      <Card className="w-full max-w-lg p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">{isCargo ? 'Дайвар ачааны хүсэлт' : 'Суудал захиалах хүсэлт'}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-4">
          {isCargo ? (
            <>
              <Input label="Ачааны нэр" placeholder="Баримт бичиг" />
              <Input label="Жин" placeholder="1 кг" />
              <Input label="Хүлээн авагчийн утас" placeholder="+976 9999 9999" />
            </>
          ) : (
            <>
              <Input label="Суудлын тоо" placeholder="1" inputMode="numeric" value={seats} onChange={(event) => onSeatsChange?.(event.target.value)} />
              <Input label="Авах цэгийн тэмдэглэл" placeholder="Сансар орчим авах боломжтой" value={note} onChange={(event) => onNoteChange?.(event.target.value)} />
              <Input label="Утас" placeholder="+976 9999 9999" />
            </>
          )}
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>Болих</Button>
          <Button onClick={onSubmit} disabled={submitting}>{submitting ? 'Илгээж байна...' : 'Илгээх'}</Button>
        </div>
      </Card>
    </div>
  );
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-primary">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="font-semibold text-foreground">{value}</p>
    </div>
  );
}
