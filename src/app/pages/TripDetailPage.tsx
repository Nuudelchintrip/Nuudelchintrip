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
import { SeatPicker } from '../components/SeatPicker';
import { formatSeatList, normalizeSeatIds } from '../data/seats';
import { createPassengerBooking, cancelDriverTrip, fetchTripById } from '../services/tripService';
import { supabase } from '../lib/supabase';

type RouteDetailView = {
  id: string | number;
  driverId: string;
  from: string;
  to: string;
  date: string;
  time: string;
  seats: number;
  availableSeatLabels: string[];
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
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [bookingNote, setBookingNote] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase?.auth.getUser().then(({ data }) => {
      if (active) setCurrentUserId(data.user?.id ?? null);
    });
    return () => {
      active = false;
    };
  }, []);

  const isOwner = Boolean(route && currentUserId && route.driverId === currentUserId);

  const handleDeleteOwnTrip = async () => {
    if (!route) return;
    if (!window.confirm('Энэ чиглэлийг устгах уу? Энэ үйлдлийг буцаах боломжгүй.')) return;
    try {
      await cancelDriverTrip(String(route.id));
      window.location.href = '/dashboard/driver/routes';
    } catch (error) {
      setRouteError(error instanceof Error ? error.message : 'Чиглэл устгахад алдаа гарлаа.');
    }
  };

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
        const availableSeatLabels = normalizeSeatIds(trip.availableSeatLabels, trip.seatsAvailable);
        setRoute({
          id: trip.id,
          driverId: trip.driverId,
          from: trip.fromLocation,
          to: trip.toLocation,
          date: Number.isNaN(departure.getTime()) ? trip.departureAt.slice(0, 10) : departure.toISOString().slice(0, 10),
          time: Number.isNaN(departure.getTime())
            ? ''
            : departure.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit', hour12: false }),
          seats: trip.seatsAvailable,
          availableSeatLabels,
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
        setSelectedSeats(availableSeatLabels.slice(0, 1));
        setBookingSeats(availableSeatLabels.length ? '1' : '');
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
        <div className="grid gap-5 sm:gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4 sm:space-y-6">
            <Card className="overflow-hidden">
              <div className="bg-primary/5 p-4 sm:p-6 md:p-8">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="success">Баталгаажсан жолооч</Badge>
                  <Badge variant="default">{route.vehicle}</Badge>
                  {route.allowsCargo && <Badge variant="warning">Дайвар ачаа авна</Badge>}
                </div>
                <h1 className="mt-4 flex flex-wrap items-center gap-2 text-2xl font-bold leading-tight text-foreground sm:mt-5 sm:gap-3 sm:text-3xl">
                  <span>{route.from}</span>
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  <span>{route.to}</span>
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:mt-4 sm:text-base">
                  Баталгаажсан жолоочийн сул суудал, үнэ, цаг болон дайвар ачаа авах боломжийг нэг дор харуулж байна.
                </p>
              </div>
              <CardBody className="p-4 sm:p-6 md:p-8">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Info icon={<Calendar className="h-5 w-5" />} label="Огноо / цаг" value={`${route.date}, ${route.time}`} />
                  <Info icon={<UsersRound className="h-5 w-5" />} label="Сул суудал" value={`${route.seats} суудал`} />
                  <Info icon={<CreditCard className="h-5 w-5" />} label="Үнэ" value={`₮${route.price.toLocaleString()} / хүн`} />
                  <Info icon={<Package className="h-5 w-5" />} label="Дайвар ачаа" value={route.allowsCargo ? route.cargoNote : 'Авахгүй'} />
                </div>
                <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-semibold text-foreground">Сонгож болох суудал</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{formatSeatList(route.availableSeatLabels)}</p>
                </div>
                <div className="mt-4 grid gap-3 sm:mt-6 sm:gap-4 md:grid-cols-2">
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

          <aside className="space-y-4 sm:space-y-5">
            <Card className="p-4 sm:p-5">
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">Жолоочийн танилцуулга</h2>
              <div className="mt-4 flex gap-3 sm:mt-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-14 sm:w-14">
                  <Car className="h-6 w-6 sm:h-7 sm:w-7" />
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
              <Button
                variant="outline"
                fullWidth
                className="mt-4"
                onClick={() => { window.location.href = `/profile/driver/${route.driverId}`; }}
              >
                Жолоочийн профайл харах
              </Button>
            </Card>

            <Card className="p-4 sm:p-5">
              <p className="text-sm text-muted-foreground">Нийт төлбөр</p>
              <p className="mt-1 text-2xl font-bold text-primary sm:text-3xl">₮{route.price.toLocaleString()}</p>
              <p className="mt-1 text-xs text-muted-foreground">10% үйлчилгээний шимтгэл энэ дүнд багтсан</p>
              <div className="mt-5 grid gap-3">
                {isOwner ? (
                  <>
                    <Button
                      size="lg"
                      fullWidth
                      onClick={() => { window.location.href = `/dashboard/driver/routes/new?id=${route.id}`; }}
                    >
                      Чиглэл засах
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      fullWidth
                      className="text-destructive hover:text-destructive"
                      onClick={handleDeleteOwnTrip}
                    >
                      Чиглэл устгах
                    </Button>
                  </>
                ) : (
                  <>
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
                  </>
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
              const seats = selectedSeats.length;
              if (!Number.isFinite(seats) || seats < 1) {
                setRouteError('Захиалах суудлаа сонгоно уу.');
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
                  selectedSeats,
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
          availableSeats={route.availableSeatLabels}
          selectedSeats={selectedSeats}
          onSelectedSeatsChange={(nextSeats) => {
            setSelectedSeats(nextSeats);
            setBookingSeats(String(nextSeats.length));
          }}
          note={bookingNote}
          onNoteChange={setBookingNote}
          pricePerSeat={route.price}
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
  availableSeats = [],
  selectedSeats = [],
  onSelectedSeatsChange,
  note = '',
  onNoteChange,
  pricePerSeat = 0,
}: {
  type: 'booking' | 'cargo';
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
  submitting?: boolean;
  seats?: string;
  availableSeats?: string[];
  selectedSeats?: string[];
  onSelectedSeatsChange?: (value: string[]) => void;
  note?: string;
  onNoteChange?: (value: string) => void;
  pricePerSeat?: number;
}) {
  const isCargo = type === 'cargo';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-3 sm:p-4">
      <Card className="max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto p-4 sm:max-h-[calc(100dvh-2rem)] sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
          <h2 className="text-lg font-semibold leading-tight text-foreground sm:text-xl">{isCargo ? 'Дайвар ачааны хүсэлт' : 'Суудал захиалах хүсэлт'}</h2>
          <button type="button" aria-label="Хаах" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-muted">
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
              <SeatPicker
                label="Суудлаа сонгох"
                description="Зөвхөн жолоочийн сул гэж нийтэлсэн суудлуудыг сонгоно."
                selectedSeats={selectedSeats}
                availableSeats={availableSeats}
                onChange={(nextSeats) => onSelectedSeatsChange?.(nextSeats)}
              />
              <div className="rounded-lg border border-border bg-muted/30 p-3.5 sm:p-4">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">Суудлын тоо</span>
                  <span className="font-semibold text-foreground">{seats || selectedSeats.length}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">Нийт төлбөр</span>
                  <span className="font-semibold text-primary">₮{(pricePerSeat * selectedSeats.length).toLocaleString()}</span>
                </div>
              </div>
              <Input label="Авах цэгийн тэмдэглэл" placeholder="Сансар орчим авах боломжтой" value={note} onChange={(event) => onNoteChange?.(event.target.value)} />
            </>
          )}
        </div>
        <div className="mt-4 flex flex-col-reverse gap-2 border-t border-border pt-4 sm:mt-6 sm:flex-row sm:justify-end sm:gap-3">
          <Button variant="outline" onClick={onClose}>Болих</Button>
          <Button onClick={onSubmit} disabled={submitting}>{submitting ? 'Илгээж байна...' : 'Илгээх'}</Button>
        </div>
      </Card>
    </div>
  );
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3.5 sm:p-4">
      <div className="mb-2 flex items-center gap-2 text-primary">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="font-semibold text-foreground">{value}</p>
    </div>
  );
}
