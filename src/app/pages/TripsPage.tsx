import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bus,
  Calendar,
  Car,
  CheckCircle2,
  Clock3,
  MapPin,
  Package,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Weight,
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Footer } from '../components/Footer';
import { LocationSelectGroup } from '../components/LocationSelectGroup';
import { Navbar } from '../components/Navbar';
import { Select } from '../components/Select';
import { locationMatchesText } from '../data/locations';

type TripRole = 'traveler' | 'driver';

interface Trip {
  id: number;
  role: TripRole;
  from: string;
  to: string;
  date: string;
  time: string;
  arrival: string;
  seats: number;
  allowsCargo: boolean;
  space: string;
  capacity: string;
  vehicle: string;
  cargoTypes: string[];
  pickupWindow: string;
  responseTime: string;
  price: number;
  owner: {
    name: string;
    rating: number;
    completedTrips: number;
    verified: boolean;
    avatar: string;
  };
}

const trips: Trip[] = [
  {
    id: 1,
    role: 'driver',
    from: 'Улаанбаатар',
    to: 'Дархан',
    date: '2026-05-25',
    time: '09:00',
    arrival: '12:00',
    seats: 3,
    allowsCargo: true,
    space: '10 кг',
    capacity: '2 хайрцаг',
    vehicle: 'SUV · хувийн машин',
    cargoTypes: ['Баримт бичиг', 'Хувцас', 'Электроник'],
    pickupWindow: '08:00-08:40',
    responseTime: '15 мин',
    price: 15000,
    owner: {
      name: 'Бат Болд',
      rating: 4.8,
      completedTrips: 23,
      verified: true,
      avatar: 'Б',
    },
  },
  {
    id: 2,
    role: 'driver',
    from: 'Улаанбаатар',
    to: 'Эрдэнэт',
    date: '2026-05-26',
    time: '14:00',
    arrival: '20:00',
    seats: 2,
    allowsCargo: true,
    space: '5 кг',
    capacity: '1 цүнх',
    vehicle: 'Автобус',
    cargoTypes: ['Баримт бичиг', 'Жижиг багц', 'Хүнс'],
    pickupWindow: '12:30-13:30',
    responseTime: '22 мин',
    price: 25000,
    owner: {
      name: 'Сарангэрэл Цэцэг',
      rating: 5.0,
      completedTrips: 45,
      verified: true,
      avatar: 'С',
    },
  },
  {
    id: 3,
    role: 'driver',
    from: 'Улаанбаатар',
    to: 'Сэлэнгэ',
    date: '2026-05-27',
    time: '10:30',
    arrival: '15:30',
    seats: 4,
    allowsCargo: true,
    space: '15 кг',
    capacity: '3 жижиг хайрцаг',
    vehicle: 'Фургон',
    cargoTypes: ['Бүх төрөл', 'Fragile биш бараа'],
    pickupWindow: '09:00-10:00',
    responseTime: '35 мин',
    price: 20000,
    owner: {
      name: 'Ганбат Дорж',
      rating: 4.5,
      completedTrips: 12,
      verified: true,
      avatar: 'Г',
    },
  },
  {
    id: 4,
    role: 'driver',
    from: 'Улаанбаатар',
    to: 'Мөрөн',
    date: '2026-05-29',
    time: '07:40',
    arrival: '19:20',
    seats: 1,
    allowsCargo: false,
    space: '3 кг',
    capacity: 'Баримтын хавтас, жижиг уут',
    vehicle: 'Онгоц + такси',
    cargoTypes: ['Баримт бичиг', 'Эмзэг биш жижиг бараа'],
    pickupWindow: '06:30-07:10',
    responseTime: '28 мин',
    price: 38000,
    owner: {
      name: 'Оюун Наран',
      rating: 4.9,
      completedTrips: 18,
      verified: true,
      avatar: 'О',
    },
  },
];

export function TripsPage() {
  const [fromAimag, setFromAimag] = useState('');
  const [fromSoum, setFromSoum] = useState('');
  const [toAimag, setToAimag] = useState('');
  const [toSoum, setToSoum] = useState('');
  const [role, setRole] = useState('all');
  const [cargoType, setCargoType] = useState('all');
  const [verifiedOnly, setVerifiedOnly] = useState(true);

  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      const matchesFrom = locationMatchesText(trip.from, fromAimag, fromSoum);
      const matchesTo = locationMatchesText(trip.to, toAimag, toSoum);
      const matchesRole = role === 'all' || trip.role === role;
      const matchesCargo = cargoType === 'all' || trip.cargoTypes.some((type) => type.toLowerCase().includes(cargoType.toLowerCase()));
      const matchesVerified = !verifiedOnly || trip.owner.verified;

      return matchesFrom && matchesTo && matchesRole && matchesCargo && matchesVerified;
    });
  }, [cargoType, fromAimag, fromSoum, role, toAimag, toSoum, verifiedOnly]);

  const resetFilters = () => {
    setFromAimag('');
    setFromSoum('');
    setToAimag('');
    setToSoum('');
    setRole('all');
    setCargoType('all');
    setVerifiedOnly(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-primary font-medium mb-3">
                <MapPin className="w-5 h-5" />
                <span>Чиглэл хайх</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Жолоочийн чиглэлүүд</h1>
              <p className="text-muted-foreground max-w-2xl">
                Жолоочийн нийтэлсэн чиглэлээс үнэ, сул суудал, баталгаажуулалт, дайвар ачаа авах боломжийг харьцуулж сонгоорой.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
              <div className="px-4 py-2">
                <p className="text-xs text-muted-foreground">Нийт</p>
                <p className="text-xl font-bold text-foreground">{trips.length}</p>
              </div>
              <div className="px-4 py-2">
                <p className="text-xs text-muted-foreground">Жолооч</p>
                <p className="text-xl font-bold text-foreground">{trips.filter((trip) => trip.role === 'driver').length}</p>
              </div>
              <div className="px-4 py-2">
                <p className="text-xs text-muted-foreground">Дайвар ачаа</p>
                <p className="text-xl font-bold text-foreground">{trips.length}</p>
              </div>
            </div>
          </div>
        </section>

        <Card className="p-5 md:p-6 mb-8">
          <div className="flex items-center gap-2 mb-5">
            <SlidersHorizontal className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Хайлт ба шүүлтүүр</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <LocationSelectGroup
              label="Хаанаас"
              aimag={fromAimag}
              soum={fromSoum}
              onAimagChange={setFromAimag}
              onSoumChange={setFromSoum}
            />
            <LocationSelectGroup
              label="Хаашаа"
              aimag={toAimag}
              soum={toSoum}
              onAimagChange={setToAimag}
              onSoumChange={setToSoum}
            />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_160px]">
            <Select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              options={[
                { value: 'all', label: 'Бүгд' },
                { value: 'driver', label: 'Жолооч' },
              ]}
            />
            <Select
              value={cargoType}
              onChange={(event) => setCargoType(event.target.value)}
              options={[
                { value: 'all', label: 'Дайвар ачаа бүгд' },
                { value: 'баримт', label: 'Баримт бичиг' },
                { value: 'хувцас', label: 'Хувцас' },
                { value: 'электроник', label: 'Электроник' },
                { value: 'хүнс', label: 'Хүнс' },
              ]}
            />
            <Button variant="primary">
              <Search className="w-5 h-5" />
              Хайх
            </Button>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(event) => setVerifiedOnly(event.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">Зөвхөн баталгаажсан хэрэглэгч</span>
            </label>
            <button type="button" onClick={resetFilters} className="text-sm font-medium text-primary hover:underline">
              Шүүлтүүр цэвэрлэх
            </button>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          <section>
            <div className="mb-5 flex items-center justify-between">
              <p className="text-muted-foreground">{filteredTrips.length} чиглэл олдлоо</p>
              <Badge variant="info">Баталгаажсан эхэнд</Badge>
            </div>

            <div className="space-y-5">
              {filteredTrips.map((trip) => {
                const isDriver = trip.role === 'driver';

                return (
                  <Card key={trip.id} hover className="overflow-hidden">
                    <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px]">
                      <div className="p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                              <Badge variant={isDriver ? 'success' : 'info'}>
                                <span className="inline-flex items-center gap-1">
                                  {isDriver ? <Car className="w-3.5 h-3.5" /> : <Bus className="w-3.5 h-3.5" />}
                                  {isDriver ? 'Жолооч' : 'Аялагч'}
                                </span>
                              </Badge>
                              {trip.owner.verified && (
                                <Badge variant="success">
                                  <span className="inline-flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    Баталгаажсан
                                  </span>
                                </Badge>
                              )}
                              <Badge variant="default">{trip.vehicle}</Badge>
                              {trip.allowsCargo && <Badge variant="warning">Дайвар ачаа авна</Badge>}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xl font-semibold text-foreground">
                              <span>{trip.from}</span>
                              <ArrowRight className="w-5 h-5 text-muted-foreground" />
                              <span>{trip.to}</span>
                            </div>
                          </div>

                          <div className="rounded-xl bg-primary/5 px-4 py-3 text-left sm:text-right">
                            <p className="text-xs text-muted-foreground">Нэг хүний үнэ</p>
                            <p className="text-2xl font-bold text-primary">₮{trip.price.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">+10% fee</p>
                          </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
                          <InfoTile icon={<Calendar className="w-4 h-4" />} label="Огноо" value={`${trip.date} · ${trip.time}`} />
                          <InfoTile icon={<Clock3 className="w-4 h-4" />} label="Сул суудал" value={`${trip.seats} суудал`} />
                          <InfoTile icon={<Weight className="w-4 h-4" />} label="Багтаамж" value={`${trip.space} · ${trip.capacity}`} />
                          <InfoTile icon={<Package className="w-4 h-4" />} label="Авах цаг" value={trip.pickupWindow} />
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          {trip.cargoTypes.map((type) => (
                            <Badge key={type} variant="default">{type}</Badge>
                          ))}
                        </div>

                        <div className="mt-5 flex items-center gap-3 rounded-xl bg-muted/40 p-4">
                          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="font-semibold text-primary">{trip.owner.avatar}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                className="font-medium text-foreground hover:text-primary"
                                onClick={() => window.location.href = `/profile/driver/${trip.id}`}
                              >
                                {trip.owner.name}
                              </button>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Star className="w-4 h-4 fill-warning text-warning" />
                                <span>{trip.owner.rating}</span>
                                <span>({trip.owner.completedTrips} аялал)</span>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">Дундаж хариу: {trip.responseTime}</p>
                          </div>
                          {trip.owner.verified && <CheckCircle2 className="w-5 h-5 text-success" />}
                        </div>
                      </div>

                      <div className="border-t border-border bg-muted/20 p-6 xl:border-l xl:border-t-0">
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Тохиромжтой</p>
                            <p className="mt-1 font-semibold text-foreground">
                              {isDriver ? (trip.allowsCargo ? 'Суудал + жижиг дайвар ачаа' : 'Зөвхөн суудал') : 'Аялагчийн чиглэлийн хүсэлт'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Итгэлцлийн түвшин</p>
                            <div className="mt-2 h-2 rounded-full bg-border">
                              <div className="h-2 rounded-full bg-success" style={{ width: `${Math.min(98, trip.owner.completedTrips + 55)}%` }} />
                            </div>
                          </div>
                          <Button
                            variant="primary"
                            fullWidth
                            onClick={() => window.location.href = '/dashboard/bookings/BK-001'}
                          >
                            Суудал захиалах
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            fullWidth
                            onClick={() => window.location.href = trip.allowsCargo ? '/cargo/new' : `/routes/${trip.id}`}
                          >
                            {trip.allowsCargo ? 'Ачаа илгээх' : 'Дэлгэрэнгүй харах'}
                          </Button>
                          <Button
                            variant="ghost"
                            fullWidth
                            onClick={() => window.location.href = `/routes/${trip.id}`}
                          >
                            Дэлгэрэнгүй харах
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {filteredTrips.length === 0 && (
              <Card className="p-12 text-center">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Чиглэл олдсонгүй</h3>
                <p className="text-muted-foreground mb-6">
                  Шүүлтүүрээ сулруулж дахин хайгаарай. Хэрвээ та аялагч эсвэл жолооч бол өөрийн чиглэлээ нэмж болно.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="outline" onClick={resetFilters}>Шүүлтүүр цэвэрлэх</Button>
                  <Button variant="primary" onClick={() => window.location.href = '/auth/register'}>Бүртгүүлэх</Button>
                </div>
              </Card>
            )}
          </section>

          <aside className="space-y-5">
            <Card className="p-5 bg-primary/5 border-primary/20">
              <h2 className="font-semibold text-foreground mb-3">Сонгохдоо анхаарах зүйл</h2>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                  <p>Баталгаажсан профайл, үнэлгээ, дууссан аяллыг хамтад нь хараарай.</p>
                </div>
                <div className="flex gap-3">
                  <Package className="w-5 h-5 text-primary shrink-0" />
                  <p>Ачааны хэмжээ, зөвшөөрсөн төрөл нь таны илгээх зүйлтэй таарч байгаа эсэхийг шалгаарай.</p>
                </div>
                <div className="flex gap-3">
                  <Clock3 className="w-5 h-5 text-primary shrink-0" />
                  <p>Авах цагийн цонх болон очих цаг таны төлөвлөгөөнд тохирч байвал хүсэлт илгээнэ.</p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="font-semibold text-foreground mb-4">Өнөөдрийн хандлага</h2>
              <div className="space-y-3">
                {['УБ → Дархан', 'УБ → Эрдэнэт', 'УБ → Сайншанд'].map((route, index) => (
                  <div key={route} className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">{route}</p>
                      <p className="text-xs text-muted-foreground">{index + 4} шинэ хүсэлт</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
