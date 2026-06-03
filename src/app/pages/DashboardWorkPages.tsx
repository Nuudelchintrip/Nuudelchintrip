import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowLeft, Banknote, Box, Calendar, Car, CheckCircle2, Clock3, Eye, FileCheck2, MapPin, PackageCheck, Plus, Search, ShieldCheck, Star, UsersRound, X } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { AppFooter } from '../components/Footer';
import { Input } from '../components/Input';
import { LocationSelectGroup } from '../components/LocationSelectGroup';
import { Select } from '../components/Select';
import { Sidebar } from '../components/Sidebar';
import { bookings, reports, users } from '../data/mockData';
import { locationMatchesText } from '../data/locations';
import { isSupabaseConfigured } from '../lib/supabase';
import { getDashboardMenu } from '../navigation/dashboardMenus';
import { canCurrentDriverCreateTrip, createDriverTrip, fetchActiveTrips, type MarketplaceTrip } from '../services/tripService';
import { getStoredUser } from '../utils/auth';

type WorkRole = 'traveler' | 'driver';
type SenderView = 'cargo' | 'proof' | 'status';
type AdminView = 'payments' | 'users' | 'reports' | 'verifications' | 'cargo' | 'routes' | 'bookings';

const roleCopy = {
  traveler: {
    badge: 'Аялагч dashboard',
    title: 'Унаа хайх',
    requests: 'Жолоочийн саналууд',
    routes: 'Миний аяллууд',
    earnings: 'Аяллын орлого',
    reviews: 'Аялагчийн үнэлгээ',
    createText: 'Хаашаа, хэзээ, хэдэн хүн явах гэж байгаагаа хайгаад баталгаажсан жолоочийн саналуудыг харна.',
    routeName: 'Унаа хайх хүсэлт',
    primaryMatch: 'Таарсан жолооч',
    base: '/dashboard/traveler',
  },
  driver: {
    badge: 'Жолооч dashboard',
    title: 'Аяллын чиглэл нэмэх',
    requests: 'Аялагчийн хүсэлтүүд',
    routes: 'Миний маршрутууд',
    earnings: 'Жолоочийн орлого',
    reviews: 'Жолоочийн үнэлгээ',
    createText: 'Машинаар явах чиглэл, сул суудал, үнэ, цагийн мэдээллээ оруулаад аялагчийн хүсэлтүүдийг авна.',
    routeName: 'Жолоочийн аяллын санал',
    primaryMatch: 'Таарсан аялагч',
    base: '/dashboard/driver',
  },
};

const travelerMatchRequests = [
  { name: 'Бат Болд', route: 'Улаанбаатар → Дархан', date: '2026-05-25', type: 'Жолооч санал', detail: '09:00 хөдөлнө, 2 сул суудалтай, verified driver.', price: '₮35,000' },
  { name: 'Ганбаатар Дорж', route: 'Улаанбаатар → Эрдэнэт', date: '2026-05-26', type: 'Жолооч санал', detail: '14:00 хөдөлнө, pickup цэг уян хатан.', price: '₮42,000' },
  { name: 'Ганбаатар Дорж', route: 'Улаанбаатар → Сэлэнгэ', date: '2026-05-27', type: 'Route match', detail: 'Маршрут болон цаг давхцаж байна. Баталгаажсан хэрэглэгч.', price: '₮20,000' },
];

type DriverOffer = {
  id: string | number;
  driver: string;
  route: string;
  from: string;
  to: string;
  date: string;
  time: string;
  seats: number;
  price: number;
  vehicle: string;
  rating: number;
  trips: number;
  allowsCargo: boolean;
  cargoNote: string;
  pickup: string;
  source?: 'mock' | 'supabase';
};

const driverOffers: DriverOffer[] = [
  {
    id: 1,
    driver: 'Бат Болд',
    route: 'Улаанбаатар → Дархан',
    from: 'Улаанбаатар',
    to: 'Дархан',
    date: '2026-05-25',
    time: '09:00',
    seats: 2,
    price: 35000,
    vehicle: 'Toyota Prius',
    rating: 4.8,
    trips: 23,
    allowsCargo: true,
    cargoNote: '1 жижиг хайрцаг, 5 кг хүртэл',
    pickup: 'Баянзүрх / Сансар орчим',
  },
  {
    id: 2,
    driver: 'Ганбаатар Дорж',
    route: 'Улаанбаатар → Эрдэнэт',
    from: 'Улаанбаатар',
    to: 'Эрдэнэт',
    date: '2026-05-26',
    time: '14:00',
    seats: 3,
    price: 42000,
    vehicle: 'Hyundai Starex',
    rating: 4.7,
    trips: 18,
    allowsCargo: true,
    cargoNote: 'Бичиг баримт, жижиг цүнх',
    pickup: 'Сүхбаатар талбай орчим',
  },
  {
    id: 3,
    driver: 'Оюунбат Ням',
    route: 'Улаанбаатар → Сэлэнгэ',
    from: 'Улаанбаатар',
    to: 'Сэлэнгэ',
    date: '2026-05-27',
    time: '10:30',
    seats: 1,
    price: 30000,
    vehicle: 'SUV',
    rating: 4.9,
    trips: 31,
    allowsCargo: false,
    cargoNote: 'Зөвхөн зорчигч',
    pickup: 'Драгон төв',
  },
];

function toDriverOffer(trip: MarketplaceTrip): DriverOffer {
  const departure = new Date(trip.departureAt);
  const date = Number.isNaN(departure.getTime()) ? trip.departureAt.slice(0, 10) : departure.toISOString().slice(0, 10);
  const time = Number.isNaN(departure.getTime())
    ? ''
    : departure.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit', hour12: false });

  return {
    id: trip.id,
    driver: trip.driver.fullName,
    route: `${trip.fromLocation} → ${trip.toLocation}`,
    from: trip.fromLocation,
    to: trip.toLocation,
    date,
    time,
    seats: trip.seatsAvailable,
    price: trip.pricePerSeat,
    vehicle: trip.driver.carModel || 'Машины мэдээлэл хүлээгдэж байна',
    rating: trip.driver.rating || 0,
    trips: trip.driver.completedTrips || 0,
    allowsCargo: trip.allowsCargo,
    cargoNote: trip.allowsCargo
      ? trip.cargoPriceNote || `${trip.cargoCapacityKg || 0} кг хүртэл`
      : 'Зөвхөн зорчигч',
    pickup: trip.pickupNote || 'Pickup тохиролцоно',
    source: 'supabase',
  };
}

const driverMatchRequests = [
  { name: 'Оюун Наран', route: 'Улаанбаатар → Дархан', date: '2026-05-25', type: 'Аялагч хүсэлт', detail: '1 суудал хайж байна. 09:00 орчим хөдөлвөл тохирно, жижиг цүнхтэй.', price: '₮18,000' },
  { name: 'Мөнх-Эрдэнэ', route: 'Улаанбаатар → Эрдэнэт', date: '2026-05-26', type: 'Route match', detail: 'Эрдэнэт хүртэл хамт явах жолооч хайж байна. Pickup цэг уян хатан.', price: '₮22,000' },
  { name: 'Сарангэрэл Цэцэг', route: 'Улаанбаатар → Сэлэнгэ', date: '2026-05-27', type: 'Аялагч санал', detail: 'Route давхцаж байна. Суудал, pickup цагийн тохирол хамгийн чухал.', price: '₮20,000' },
];

const routeRows = [
  { route: 'Улаанбаатар → Дархан', date: '2026-05-25', status: 'Идэвхтэй', matches: 8, proof: 'Profile verified' },
  { route: 'Улаанбаатар → Эрдэнэт', date: '2026-05-28', status: 'Хүлээгдэж буй', matches: 4, proof: 'Admin review' },
  { route: 'Улаанбаатар → Мөрөн', date: '2026-06-02', status: 'Дууссан', matches: 11, proof: 'Completed' },
];

const driverCargoRequests = [
  {
    id: 'CR-018',
    sender: 'Дорж Цэцэг',
    route: 'Улаанбаатар → Дархан',
    cargo: 'Баримт бичиг',
    size: '1 кг, дугтуй',
    pickup: 'Баянзүрх, 13-р хороолол',
    dropoff: 'Дархан төв',
    offer: '₮15,000',
    status: 'Route дээр тохирно',
  },
  {
    id: 'CR-021',
    sender: 'Мөнх-Эрдэнэ',
    route: 'Улаанбаатар → Эрдэнэт',
    cargo: 'Жижиг хайрцаг',
    size: '4 кг, 30 x 20 x 15 см',
    pickup: 'Драгон төв',
    dropoff: 'Эрдэнэт вокзал',
    offer: '₮22,000',
    status: 'Pickup цаг хүлээж байна',
  },
];

const adminVerificationQueue = [
  {
    id: 'DRV-204',
    user: 'Мөнх-Эрдэнэ',
    role: 'Жолооч',
    phone: '+976 9090 9090',
    submitted: '2026-05-25 09:48',
    evidence: 'ID card, license B, Toyota Prius зураг',
    next: 'Жолооны үнэмлэх болон улсын дугаар давхар шалгах',
  },
  {
    id: 'DRV-118',
    user: 'Оюунбат Ням',
    role: 'Жолооч',
    phone: '+976 9191 2020',
    submitted: '2026-05-24 18:20',
    evidence: 'Vehicle registration, profile photo',
    next: 'Profile photo тод биш тул reject reason бичих',
  },
];

const adminCargoQueue = [
  {
    id: 'CR-018',
    sender: 'Дорж Цэцэг',
    driver: 'Бат Болд',
    route: 'Улаанбаатар → Дархан',
    status: 'Жолооч accept хүлээгдэж байна',
    proof: 'Pickup proof ороогүй',
    code: '482913',
  },
  {
    id: 'CR-021',
    sender: 'Мөнх-Эрдэнэ',
    driver: 'Ганбат Дорж',
    route: 'Улаанбаатар → Эрдэнэт',
    status: 'Замд явж байна',
    proof: 'Delivery proof хүлээгдэж байна',
    code: '391204',
  },
];

export function TripFormPage({ role }: { role: WorkRole }) {
  const copy = roleCopy[role];
  const user = getStoredUser();
  const [canCreateTrip, setCanCreateTrip] = useState(user?.verification_status === 'approved');
  const [permissionLoading, setPermissionLoading] = useState(role === 'driver');
  const [fromAimag, setFromAimag] = useState('Улаанбаатар');
  const [fromSoum, setFromSoum] = useState('');
  const [toAimag, setToAimag] = useState('');
  const [toSoum, setToSoum] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [seatsTotal, setSeatsTotal] = useState('');
  const [pricePerSeat, setPricePerSeat] = useState('');
  const [pickupNote, setPickupNote] = useState('');
  const [dropoffNote, setDropoffNote] = useState('');
  const [allowsCargo, setAllowsCargo] = useState('no');
  const [cargoCapacityKg, setCargoCapacityKg] = useState('');
  const [allowedCargoTypes, setAllowedCargoTypes] = useState('');
  const [cargoPriceNote, setCargoPriceNote] = useState('');
  const [formNote, setFormNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedTripId, setSubmittedTripId] = useState('');
  const [error, setError] = useState('');
  const driverBlocked = role === 'driver' && !canCreateTrip;
  const disabledReason = permissionLoading
    ? 'Жолоочийн эрхийг шалгаж байна...'
    : driverBlocked
      ? 'Чиглэл нийтлэхийн тулд driver verification approved байх хэрэгтэй.'
      : '';

  useEffect(() => {
    let alive = true;

    async function checkPermission() {
      if (role !== 'driver') return;
      setPermissionLoading(true);
      try {
        const allowed = await canCurrentDriverCreateTrip();
        if (alive) setCanCreateTrip(allowed);
      } catch {
        if (alive) setCanCreateTrip(user?.verification_status === 'approved');
      } finally {
        if (alive) setPermissionLoading(false);
      }
    }

    checkPermission();
    return () => {
      alive = false;
    };
  }, [role, user?.verification_status]);

  const formatLocation = (aimag: string, soum: string) => {
    if (!aimag) return '';
    return soum ? `${aimag} - ${soum}` : aimag;
  };

  const handleSubmit = async () => {
    setError('');
    setSubmittedTripId('');

    if (role !== 'driver') return;
    if (driverBlocked) {
      setError('Жолоочийн verification approved болсны дараа чиглэл нийтлэх боломжтой.');
      return;
    }
    if (!fromAimag || !toAimag) {
      setError('Хаанаас, хаашаа явах чиглэлээ сонгоно уу.');
      return;
    }
    if (!departureDate || !departureTime) {
      setError('Явах огноо болон цагийг оруулна уу.');
      return;
    }

    const seats = Number(seatsTotal);
    const price = Number(pricePerSeat);
    if (!Number.isFinite(seats) || seats < 1) {
      setError('Сул суудлын тоо 1-ээс их байх ёстой.');
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setError('Нэг хүний үнийг зөв оруулна уу.');
      return;
    }

    const cargoCapacity = cargoCapacityKg ? Number(cargoCapacityKg) : undefined;
    if (allowsCargo === 'yes' && cargoCapacityKg && (!Number.isFinite(cargoCapacity) || Number(cargoCapacity) < 0)) {
      setError('Ачааны багтаамжийг кг-аар зөв оруулна уу.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createDriverTrip({
        fromLocation: formatLocation(fromAimag, fromSoum),
        toLocation: formatLocation(toAimag, toSoum),
        departureAt: new Date(`${departureDate}T${departureTime}`).toISOString(),
        seatsTotal: seats,
        pricePerSeat: price,
        pickupNote: pickupNote || formNote,
        dropoffNote,
        allowsCargo: allowsCargo === 'yes',
        cargoCapacityKg: cargoCapacity,
        allowedCargoTypes: allowedCargoTypes
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        cargoPriceNote,
      });
      setSubmittedTripId(result.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Чиглэл хадгалахад алдаа гарлаа.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardFrame role={role} active="routes">
      <PageTop badge={copy.badge} title={copy.title} description={copy.createText} backHref={copy.base} />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="p-6">
          {driverBlocked && !permissionLoading && (
            <div className="mb-5 rounded-lg border border-warning/30 bg-warning/10 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-foreground">Жолоочийн баталгаажуулалт хүлээгдэж байна</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Admin таны жолооны үнэмлэх, машины мэдээллийг шалгасны дараа чиглэл нийтлэх боломж нээгдэнэ.
                  </p>
                </div>
                <Button variant="outline" onClick={() => { window.location.href = '/dashboard/driver/verification'; }}>
                  Verification
                </Button>
              </div>
            </div>
          )}
          {error && (
            <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
              {error}
            </div>
          )}
          {submittedTripId && (
            <div className="mb-5 rounded-lg border border-success/30 bg-success/10 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                <div>
                  <p className="font-semibold text-foreground">Чиглэл Supabase trips table-д хадгалагдлаа</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Trip ID: <span className="font-mono text-foreground">{submittedTripId}</span>. Одоо энэ route traveler search дээр active route байдлаар уншигдах боломжтой.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <LocationSelectGroup
              label="Хаанаас"
              aimag={fromAimag}
              soum={fromSoum}
              onAimagChange={setFromAimag}
              onSoumChange={setFromSoum}
              className="md:col-span-2"
            />
            <LocationSelectGroup
              label="Хаашаа"
              aimag={toAimag}
              soum={toSoum}
              onAimagChange={setToAimag}
              onSoumChange={setToSoum}
              className="md:col-span-2"
            />
            <Input label="Огноо" type="date" value={departureDate} onChange={(event) => setDepartureDate(event.target.value)} />
            <Input label="Хөдлөх цаг" type="time" value={departureTime} onChange={(event) => setDepartureTime(event.target.value)} />
            <Select label="Төрөл" options={[
              { value: 'car', label: copy.routeName },
              { value: 'bus', label: 'Нийтийн тээврийн аялал' },
              { value: 'shared', label: 'Хамт явах санал' },
            ]} />
            <Input label={role === 'driver' ? 'Сул суудал' : 'Зорчих хүний тоо'} type="number" min="1" placeholder={role === 'driver' ? '3' : '1'} value={seatsTotal} onChange={(event) => setSeatsTotal(event.target.value)} />
            <Input label="Нэг хүний үнэ" type="number" min="0" placeholder="35000" value={pricePerSeat} onChange={(event) => setPricePerSeat(event.target.value)} />
            <Input label="Pickup note" placeholder="Жишээ: Драмын театрын урд" value={pickupNote} onChange={(event) => setPickupNote(event.target.value)} />
            <Input label="Dropoff note" placeholder="Жишээ: Дархан захын ойролцоо" value={dropoffNote} onChange={(event) => setDropoffNote(event.target.value)} />
            {role === 'driver' && (
              <>
                <Select label="Дайвар ачаа авах эсэх" value={allowsCargo} onChange={(event) => setAllowsCargo(event.target.value)} options={[
                  { value: 'yes', label: 'Авч болно' },
                  { value: 'no', label: 'Авахгүй' },
                ]} />
                <Input label="Ачааны багтаамж (кг)" type="number" min="0" placeholder="5" value={cargoCapacityKg} onChange={(event) => setCargoCapacityKg(event.target.value)} disabled={allowsCargo !== 'yes'} />
                <Input label="Зөвшөөрөх ачааны төрөл" placeholder="Бичиг баримт, жижиг хайрцаг, хувцас" value={allowedCargoTypes} onChange={(event) => setAllowedCargoTypes(event.target.value)} disabled={allowsCargo !== 'yes'} />
                <Input label="Ачааны үнийн тэмдэглэл" placeholder="Тохиролцоно / ₮10,000-аас" value={cargoPriceNote} onChange={(event) => setCargoPriceNote(event.target.value)} disabled={allowsCargo !== 'yes'} />
              </>
            )}
          </div>
          <label className="mt-4 block text-sm font-medium text-foreground">Тайлбар</label>
          <textarea className="mt-2 min-h-32 w-full rounded-lg border border-input bg-input-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring" placeholder="Нэмэлт тайлбар..." value={formNote} onChange={(event) => setFormNote(event.target.value)} />
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button disabled={driverBlocked || permissionLoading || submitting} onClick={handleSubmit}>
              <Plus className="h-4 w-4" />
              {submitting ? 'Хадгалж байна...' : 'Чиглэл нийтлэх'}
            </Button>
            <Button variant="outline" onClick={() => window.location.href = copy.base}>Dashboard руу буцах</Button>
          </div>
          {disabledReason && (
            <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">{disabledReason}</p>
              <p className="mt-1">Supabase дээр approved болгосон бол driver account-аасаа гараад дахин нэвтэрч үзнэ үү.</p>
            </div>
          )}
        </Card>
        <Card className="p-6 bg-primary/5 border-primary/20">
          <h2 className="text-xl font-semibold text-foreground">Нийтлэхээс өмнө</h2>
          <div className="mt-5 space-y-4">
            {['Role тань тодорхой харагдана', 'Аялагч/жолоочийн match эхэнд гарна', 'Үнэ, суудал, цагийн мэдээлэл тодорхой байна', role === 'driver' ? 'Allows-cargo route дээр дайвар ачааны request авах боломжтой' : 'Дайвар ачаа нь route дээрх secondary module хэвээр байна'].map((item) => (
              <div key={item} className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                <p className="text-sm leading-6 text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardFrame>
  );
}

export function RoleRequestsPage({ role, action }: { role: WorkRole; action?: 'accept' | 'reject' }) {
  const copy = roleCopy[role];
  const requests = role === 'driver' ? driverMatchRequests : travelerMatchRequests;

  return (
    <DashboardFrame role={role} active="requests">
      <PageTop badge={copy.badge} title={action ? (action === 'accept' ? 'Хүсэлт зөвшөөрөх' : 'Хүсэлт татгалзах') : copy.requests} description={`${copy.primaryMatch}, route match, үнэ, суудал, цагийн тохирлыг тусад нь харуулна.`} backHref={copy.base} />
      {action && (
        <Card className={`mb-6 p-5 ${action === 'accept' ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Badge variant={action === 'accept' ? 'success' : 'danger'}>{action === 'accept' ? 'Зөвшөөрөх үйлдэл' : 'Татгалзах үйлдэл'}</Badge>
              <p className="mt-3 text-lg font-semibold text-foreground">{action === 'accept' ? 'Хүсэлт зөвшөөрөхөд booking үүсэж дараагийн proof алхам нээгдэнэ.' : 'Татгалзвал хэрэглэгчид богино тайлбар очно.'}</p>
            </div>
            <Button variant={action === 'accept' ? 'primary' : 'outline'}>{action === 'accept' ? 'Баталгаажуулах' : 'Татгалзах'}</Button>
          </div>
        </Card>
      )}
      <div className="grid gap-5">
        {requests.map((request, index) => (
          <Card key={`${request.name}-${index}`} className="p-6">
            <div className="grid gap-5 lg:grid-cols-[1fr_220px] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={index === 0 ? 'success' : 'info'}>{index === 0 ? copy.primaryMatch : request.type}</Badge>
                  <Badge variant="default">{request.date}</Badge>
                </div>
                <h2 className="mt-3 text-2xl font-semibold text-foreground">{request.route}</h2>
                <p className="mt-2 text-muted-foreground">{request.name} - {request.detail}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-4">
                <p className="text-sm text-muted-foreground">Санал болгосон үнэ</p>
                <p className="mt-1 text-2xl font-bold text-primary">{request.price}</p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={() => window.location.href = `${copy.base}/requests/${index + 1}/accept`}>Зөвшөөрөх</Button>
                  <Button size="sm" variant="outline" onClick={() => window.location.href = `${copy.base}/requests/${index + 1}/reject`}>Татгалзах</Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </DashboardFrame>
  );
}

export function FindDriversPage() {
  const [fromAimag, setFromAimag] = useState('');
  const [fromSoum, setFromSoum] = useState('');
  const [toAimag, setToAimag] = useState('');
  const [toSoum, setToSoum] = useState('');
  const [date, setDate] = useState('');
  const [passengers, setPassengers] = useState('1');
  const [cargoOnly, setCargoOnly] = useState(false);
  const [offers, setOffers] = useState<DriverOffer[]>(isSupabaseConfigured ? [] : driverOffers);
  const [loadingTrips, setLoadingTrips] = useState(isSupabaseConfigured);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;

    if (!isSupabaseConfigured) {
      setOffers(driverOffers);
      setLoadingTrips(false);
      return;
    }

    setLoadingTrips(true);
    fetchActiveTrips()
      .then((trips) => {
        if (!active) return;
        setOffers(trips.map(toDriverOffer));
        setLoadError('');
      })
      .catch((error) => {
        if (!active) return;
        setOffers([]);
        setLoadError(error instanceof Error ? error.message : 'Trip мэдээлэл уншихад алдаа гарлаа.');
      })
      .finally(() => {
        if (active) setLoadingTrips(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      const matchesFrom = locationMatchesText(`${offer.from} ${offer.pickup}`, fromAimag, fromSoum);
      const matchesTo = locationMatchesText(offer.to, toAimag, toSoum);
      const matchesDate = date === '' || offer.date === date;
      const matchesSeats = offer.seats >= Number(passengers || 1);
      const matchesCargo = !cargoOnly || offer.allowsCargo;
      return matchesFrom && matchesTo && matchesDate && matchesSeats && matchesCargo;
    });
  }, [cargoOnly, date, fromAimag, fromSoum, offers, passengers, toAimag, toSoum]);

  return (
    <DashboardFrame role="traveler">
      <PageTop
        badge="Аялагч dashboard"
        title="Унаа хайх"
        description="Хаанаас, хаашаа, огноо, хүний тоогоо оруулаад боломжтой жолоочийн route-уудыг шүүнэ."
        backHref="/dashboard/traveler"
      />

      <Card className="mb-6 p-6">
        <div className="mb-5 flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Хайлт ба шүүлтүүр</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
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
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_170px]">
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <Select
            value={passengers}
            onChange={(event) => setPassengers(event.target.value)}
            options={[
              { value: '1', label: '1 хүн' },
              { value: '2', label: '2 хүн' },
              { value: '3', label: '3 хүн' },
            ]}
          />
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={cargoOnly}
              onChange={(event) => setCargoOnly(event.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            Дайвар ачаа авч болох route
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button className="w-full sm:w-auto" variant="outline" onClick={() => { setFromAimag(''); setFromSoum(''); setToAimag(''); setToSoum(''); setDate(''); setPassengers('1'); setCargoOnly(false); }}>
              Цэвэрлэх
            </Button>
            <Button className="w-full sm:w-auto" onClick={() => window.location.href = '/dashboard/traveler/offers'}>
              Жолоочийн саналууд
              <UsersRound className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">{filteredOffers.length} боломжит жолооч олдлоо</p>
        <Badge variant="info">Баталгаажсан эхэнд</Badge>
      </div>

      {loadingTrips && (
        <Card className="mb-5 p-4">
          <p className="text-sm text-muted-foreground">Жолоочийн чиглэлүүдийг уншиж байна...</p>
        </Card>
      )}

      {loadError && (
        <Card className="mb-5 border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive">{loadError}</p>
        </Card>
      )}

      <div className="grid gap-5">
        {filteredOffers.map((offer) => (
          <DriverOfferCard key={offer.id} offer={offer} />
        ))}
      </div>

      {filteredOffers.length === 0 && (
        <Card className="mt-6 p-10 text-center">
          <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground">Тохирох унаа олдсонгүй</h2>
          <p className="mt-2 text-muted-foreground">Шүүлтүүрээ сулруулаад дахин хайгаарай.</p>
        </Card>
      )}
    </DashboardFrame>
  );
}

export function DriverOffersPage() {
  return (
    <DashboardFrame role="traveler">
      <PageTop
        badge="Аялагч dashboard"
        title="Жолоочийн саналууд"
        description="Баталгаажсан жолоочийн route, сул суудал, үнэ, rating, дайвар ачааны боломжийг харьцуулна."
        backHref="/dashboard/traveler"
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <Badge variant="success">Нээлттэй</Badge>
          <p className="mt-3 text-3xl font-bold text-foreground">{driverOffers.length}</p>
          <p className="text-sm text-muted-foreground">жолоочийн санал</p>
        </Card>
        <Card className="p-5">
          <Badge variant="info">Дундаж үнэ</Badge>
          <p className="mt-3 text-3xl font-bold text-foreground">₮35k</p>
          <p className="text-sm text-muted-foreground">нэг суудал</p>
        </Card>
        <Card className="p-5">
          <Badge variant="warning">Дайвар ачаа</Badge>
          <p className="mt-3 text-3xl font-bold text-foreground">{driverOffers.filter((offer) => offer.allowsCargo).length}</p>
          <p className="text-sm text-muted-foreground">route боломжтой</p>
        </Card>
      </div>

      <div className="grid gap-5">
        {driverOffers.map((offer) => (
          <DriverOfferCard key={offer.id} offer={offer} featured={offer.id === 1} />
        ))}
      </div>
    </DashboardFrame>
  );
}

export function CargoFindRoutesPage() {
  const [fromAimag, setFromAimag] = useState('');
  const [fromSoum, setFromSoum] = useState('');
  const [toAimag, setToAimag] = useState('');
  const [toSoum, setToSoum] = useState('');

  const cargoRoutes = driverOffers.filter((offer) => {
    const matchesFrom = locationMatchesText(`${offer.from} ${offer.pickup}`, fromAimag, fromSoum);
    const matchesTo = locationMatchesText(offer.to, toAimag, toSoum);
    return offer.allowsCargo && matchesFrom && matchesTo;
  });

  return (
    <DashboardFrame sender active="find-routes">
      <PageTop
        badge="Дайвар ачаа add-on"
        title="Ачаа авах жолооч хайх"
        description="Зөвхөн дайвар ачаа авч болох route-уудыг харуулна. Route сонгоод cargo request илгээнэ."
        backHref="/dashboard/cargo"
      />

      <Card className="mb-6 p-6">
        <div className="mb-5 flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Route шүүх</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
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
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => { setFromAimag(''); setFromSoum(''); setToAimag(''); setToSoum(''); }}
        >
          Шүүлтүүр цэвэрлэх
        </Button>
      </Card>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <Badge variant="warning">Allows cargo</Badge>
          <p className="mt-3 text-3xl font-bold text-foreground">{cargoRoutes.length}</p>
          <p className="text-sm text-muted-foreground">route боломжтой</p>
        </Card>
        <Card className="p-5">
          <Badge variant="info">Pickup window</Badge>
          <p className="mt-3 text-3xl font-bold text-foreground">08:00+</p>
          <p className="text-sm text-muted-foreground">хамгийн ойрын боломж</p>
        </Card>
        <Card className="p-5">
          <Badge variant="success">Verified</Badge>
          <p className="mt-3 text-3xl font-bold text-foreground">100%</p>
          <p className="text-sm text-muted-foreground">баталгаажсан жолооч</p>
        </Card>
      </div>

      <div className="grid gap-5">
        {cargoRoutes.map((offer) => (
          <DriverOfferCard key={offer.id} offer={offer} mode="cargo" />
        ))}
      </div>

      {cargoRoutes.length === 0 && (
        <Card className="mt-6 p-10 text-center">
          <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground">Дайвар ачаа авах route олдсонгүй</h2>
          <p className="mt-2 text-muted-foreground">Аймаг, сумын шүүлтүүрээ өөрчлөөд дахин шалгаарай.</p>
        </Card>
      )}
    </DashboardFrame>
  );
}

export function MyRoutesPage({ role }: { role: WorkRole }) {
  const copy = roleCopy[role];

  return (
    <DashboardFrame role={role} active="routes">
      <PageTop badge={copy.badge} title={copy.routes} description="Өөрийн нийтэлсэн чиглэлүүд, таарсан хүмүүс, booking болсон урсгалыг нэг дор харна." backHref={copy.base} />
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-foreground">Чиглэлийн жагсаалт</h2>
            <Button className="w-full sm:w-auto" size="sm" onClick={() => window.location.href = role === 'driver' ? '/dashboard/driver/routes/new' : '/dashboard/traveler/trips/new'}>
              <Plus className="h-4 w-4" />
              Нэмэх
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {routeRows.map((row) => (
              <div key={row.route} className="grid gap-4 rounded-lg border border-border p-4 md:grid-cols-[1fr_160px_140px_160px] md:items-center">
                <div>
                  <p className="font-semibold text-foreground">{row.route}</p>
                  <p className="text-sm text-muted-foreground">{row.date} - {row.proof}</p>
                </div>
                <Badge variant={row.status === 'Идэвхтэй' ? 'success' : row.status === 'Хүлээгдэж буй' ? 'warning' : 'default'}>{row.status}</Badge>
                <p className="text-sm text-muted-foreground">{row.matches} match</p>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard/bookings/BK-001'}>Дэлгэрэнгүй</Button>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </DashboardFrame>
  );
}

export function DriverCargoRequestsPage() {
  return (
    <DashboardFrame role="driver">
      <PageTop
        badge="Жолооч dashboard"
        title="Дайвар ачааны хүсэлт"
        description="Таны 'дайвар ачаа авч болно' гэж тэмдэглэсэн route дээр ирсэн жижиг ачааны хүсэлтүүд. Энэ нь зорчигчийн booking-оос тусдаа, secondary урсгал хэвээр байна."
        backHref="/dashboard/driver"
      />

      <Card className="mb-6 border-warning/20 bg-warning/5 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <PackageCheck className="mt-1 h-5 w-5 shrink-0 text-warning" />
            <div>
              <h2 className="font-semibold text-foreground">Зөвхөн таны route-д таарсан хүсэлт</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Аялагчийн суудлын хүсэлт эхний priority. Дайвар ачааг зөвшөөрсөн route дээр л жолооч шийдвэрлэнэ.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => window.location.href = '/dashboard/driver/routes/new'}>
            Route тохиргоо
          </Button>
        </div>
      </Card>

      <div className="grid gap-5">
        {driverCargoRequests.map((request) => (
          <Card key={request.id} className="p-6">
            <div className="grid gap-5 xl:grid-cols-[1fr_220px] xl:items-center">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="warning">{request.id}</Badge>
                  <Badge variant="default">{request.status}</Badge>
                </div>
                <h2 className="text-2xl font-semibold text-foreground">{request.route}</h2>
                <p className="mt-2 text-muted-foreground">
                  {request.sender} илгээгчээс {request.cargo.toLowerCase()} дайх хүсэлт ирсэн.
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <InfoPill icon={<Box className="h-4 w-4" />} label="Ачаа" value={request.cargo} />
                  <InfoPill icon={<PackageCheck className="h-4 w-4" />} label="Хэмжээ" value={request.size} />
                  <InfoPill icon={<MapPin className="h-4 w-4" />} label="Pickup" value={request.pickup} />
                  <InfoPill icon={<MapPin className="h-4 w-4" />} label="Dropoff" value={request.dropoff} />
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm text-muted-foreground">Санал болгосон үнэ</p>
                <p className="mt-1 text-3xl font-bold text-primary">{request.offer}</p>
                <div className="mt-5 grid gap-2">
                  <Button fullWidth>Зөвшөөрөх</Button>
                  <Button variant="outline" fullWidth>Татгалзах</Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </DashboardFrame>
  );
}

function DriverOfferCard({ offer, featured = false, mode = 'booking' }: { offer: DriverOffer; featured?: boolean; mode?: 'booking' | 'cargo' }) {
  const isCargoMode = mode === 'cargo';

  return (
    <Card className={`p-6 ${featured ? 'border-primary/30 bg-primary/5' : ''}`}>
      <div className="grid gap-5 xl:grid-cols-[1fr_230px] xl:items-center">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {featured && <Badge variant="success">Хамгийн тохиромжтой</Badge>}
            <Badge variant="success">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Баталгаажсан жолооч
              </span>
            </Badge>
            <Badge variant="default">{offer.vehicle}</Badge>
            {offer.allowsCargo && <Badge variant="warning">Дайвар ачаа авч болно</Badge>}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-2xl font-semibold text-foreground">
            <span>{offer.from}</span>
            <ArrowLeft className="h-5 w-5 rotate-180 text-muted-foreground" />
            <span>{offer.to}</span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <InfoPill icon={<Calendar className="h-4 w-4" />} label="Огноо" value={offer.date} />
            <InfoPill icon={<Clock3 className="h-4 w-4" />} label="Цаг" value={offer.time} />
            <InfoPill icon={<UsersRound className="h-4 w-4" />} label="Сул суудал" value={`${offer.seats} суудал`} />
            <InfoPill icon={<MapPin className="h-4 w-4" />} label="Pickup" value={offer.pickup} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Car className="h-4 w-4" />
              {offer.driver}
            </span>
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 fill-warning text-warning" />
              {offer.rating} ({offer.trips} аялал)
            </span>
            <span>{offer.cargoNote}</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">{isCargoMode ? 'Cargo route' : 'Нэг суудлын үнэ'}</p>
          <p className="mt-1 text-3xl font-bold text-primary">₮{offer.price.toLocaleString()}</p>
          <p className="mt-1 text-xs text-muted-foreground">{isCargoMode ? offer.cargoNote : '+ platform fee'}</p>
          <div className="mt-5 grid gap-2">
            <Button fullWidth onClick={() => window.location.href = isCargoMode ? '/cargo/new' : `/routes/${offer.id}`}>
              {isCargoMode ? 'Cargo request илгээх' : 'Хүсэлт илгээх'}
            </Button>
            <Button variant="outline" fullWidth onClick={() => window.location.href = `/routes/${offer.id}`}>
              Дэлгэрэнгүй харах
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function InfoPill({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="mb-1 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export function EarningsPage({ role }: { role: WorkRole }) {
  const copy = roleCopy[role];
  return (
    <DashboardFrame role={role} active="earnings">
      <PageTop badge={copy.badge} title={copy.earnings} description="Хүлээгдэж буй, баталгаажсан, дууссан орлогын тойм." backHref={copy.base} />
      <div className="grid gap-5 md:grid-cols-3">
        {[
          ['Аялагчийн booking', role === 'driver' ? '₮620,000' : '₮450,000', 'success'],
          ['Дайвар ачаа', '₮84,000', 'warning'],
          ['Үйлчилгээний шимтгэл', role === 'driver' ? '5-10% / cargo 10%' : '5-10%', 'info'],
        ].map(([label, value, tone]) => (
          <Card key={label} className="p-6">
            <Badge variant={tone as 'success' | 'warning' | 'info'}>{label}</Badge>
            <p className="mt-4 text-4xl font-bold text-foreground">{value}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-6 p-6">
        <h2 className="text-xl font-semibold text-foreground">Гүйлгээний түүх</h2>
        <div className="mt-5 space-y-3">
          {routeRows.map((row) => (
            <div key={row.route} className="flex flex-col gap-2 rounded-lg bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-foreground">{row.route}</p>
                <p className="text-sm text-muted-foreground">{row.date}</p>
              </div>
              <p className="font-semibold text-primary">₮{(row.matches * 15000).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </Card>
    </DashboardFrame>
  );
}

export function ReviewsPage({ role }: { role: WorkRole | 'sender' }) {
  const title = role === 'sender' ? 'Аялагчийн үнэлгээ' : roleCopy[role].reviews;
  const base = role === 'sender' ? '/dashboard/sender' : roleCopy[role].base;
  return (
    <DashboardFrame role={role === 'sender' ? undefined : role} sender={role === 'sender'} active="reviews">
      <PageTop badge={role === 'sender' ? 'Аялагч dashboard' : roleCopy[role].badge} title={title} description="Итгэлцэл үүсгэдэг үнэлгээ, сэтгэгдэл, дууссан booking-ийн тойм." backHref={base} />
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <Card className="p-6 text-center">
          <Star className="mx-auto h-10 w-10 fill-warning text-warning" />
          <p className="mt-4 text-5xl font-bold text-foreground">4.8</p>
          <p className="mt-2 text-muted-foreground">32 үнэлгээнээс</p>
        </Card>
        <div className="space-y-4">
          {['Маш тодорхой мэдээлэлтэй, цагтаа хариу өгсөн.', 'Route болон pickup нөхцөл ойлгомжтой байсан.', 'Төлбөрийн баримт, аяллын timeline ойлгомжтой байсан.'].map((text, index) => (
            <Card key={text} className="p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold text-foreground">Хэрэглэгч #{index + 1}</p>
                <Badge variant="success">5.0</Badge>
              </div>
              <p className="mt-3 text-muted-foreground">{text}</p>
            </Card>
          ))}
        </div>
      </div>
    </DashboardFrame>
  );
}

export function SenderCargoPage({ view }: { view: SenderView }) {
  const isProof = view === 'proof';
  const isStatus = view === 'status';
  const title = isProof ? 'Төлбөрийн баримт ба ачааны нотолгоо' : isStatus ? 'Delivery code/status' : 'Дайвар ачаа';
  const description = isProof
    ? 'Төлбөрийн баримт, pickup зураг, delivery зураг тусдаа хадгалагдаж маргаан гарвал admin-д нотолгоо болно.'
    : isStatus
      ? 'Хүлээн авагчийн 6 оронтой код болон delivery status-аа нэг дор хянана.'
      : 'Дайвар ачаа нь жолоочийн route дээр суурилсан secondary module.';
  return (
    <DashboardFrame sender active={view}>
      <PageTop badge="Дайвар ачаа add-on" title={title} description={description} backHref="/dashboard/cargo" />
      <div className="grid gap-5">
        {['BK-001', 'BK-002', 'BK-003'].map((id, index) => (
          <Card key={id} className="p-6">
            <div className="grid gap-4 md:grid-cols-[1fr_180px_160px] md:items-center">
              <div>
                <Badge variant={index === 0 ? 'warning' : index === 1 ? 'info' : 'success'}>
                  {isStatus
                    ? index === 0 ? 'Код хүлээгдэж байна' : index === 1 ? 'Замд явж байна' : 'Хүлээлгэн өгсөн'
                    : index === 0 ? 'Proof хүлээгдэж байна' : index === 1 ? 'Admin шалгаж байна' : 'Баталгаажсан'}
                </Badge>
                <h2 className="mt-3 text-xl font-semibold text-foreground">{id} - УБ → Дархан</h2>
                <p className="mt-1 text-muted-foreground">
                  {isStatus ? 'Хүлээн авагчийн код: 482913. Хүргэлтийн баталгаажуулалт хүлээгдэж байна.' : 'Pickup болон delivery proof-ийг тусдаа оруулна.'}
                </p>
              </div>
              <p className="text-2xl font-bold text-primary">₮{(18000 + index * 4000).toLocaleString()}</p>
              <Button variant="outline" onClick={() => window.location.href = isStatus ? '/dashboard/cargo' : '/dashboard/bookings/BK-001/delivery-proof'}>
                {isStatus ? 'Dashboard' : 'Proof оруулах'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </DashboardFrame>
  );
}

export function AdminQueuePage({ view }: { view: AdminView }) {
  const titles = {
    payments: 'Төлбөр батлах',
    users: 'Хэрэглэгчид',
    reports: 'Reports & disputes',
    verifications: 'Driver verification',
    cargo: 'Дайвар ачааны moderation',
    routes: 'Route moderation',
    bookings: 'Booking moderation',
  };

  const descriptions = {
    payments: 'Аялагчийн payment proof-ийг шалгаж approve/reject хийвэл booking status дараагийн шат руу шилжинэ.',
    users: 'Role, verification, account status, completed trip мэдээллийг нэг дор хянана.',
    reports: 'Маргаан, report, no-show, payment issue-г booking evidence-тэй холбож шалгана.',
    verifications: 'Жолоочийн бичиг баримт, машины мэдээлэл, profile verification-г approve/reject хийнэ.',
    cargo: 'Дайвар ачааны request, pickup proof, delivery proof, 6 оронтой code status-г хянана.',
    routes: 'Fake route, duplicate route, cargo policy зөрчсөн route-уудыг шалгаж suspend/delete хийнэ.',
    bookings: 'Passenger-driver booking status, next action, payment review, dispute эрсдэлийг хянана.',
  };

  return (
    <DashboardFrame admin active={view}>
      <PageTop badge="Admin dashboard" title={titles[view]} description={descriptions[view]} backHref="/admin" />

      {view === 'payments' && <AdminPaymentsTable />}
      {view === 'users' && <AdminUsersTable />}
      {view === 'reports' && <AdminReportsList />}
      {view === 'verifications' && <AdminVerificationList />}
      {view === 'cargo' && <AdminCargoList />}
      {view === 'routes' && <AdminRoutesList />}
      {view === 'bookings' && <AdminBookingsList />}
    </DashboardFrame>
  );
}

function AdminPaymentsTable() {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-foreground">Payment proof queue</h2>
          <Badge variant="warning">{bookings.filter((booking) => booking.payment.status === 'pending').length} pending</Badge>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <AdminTh>Booking</AdminTh>
                <AdminTh>Талууд</AdminTh>
                <AdminTh>Дүн</AdminTh>
                <AdminTh>Proof</AdminTh>
                <AdminTh>Status</AdminTh>
                <AdminTh>Үйлдэл</AdminTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-foreground">{booking.id}</p>
                    <p className="text-xs text-muted-foreground">{booking.route.from} → {booking.route.to}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-foreground">{booking.passenger.name}</p>
                    <p className="text-xs text-muted-foreground">{booking.driver.name}</p>
                  </td>
                  <td className="px-6 py-4 font-semibold text-primary">₮{booking.price.total.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-mono text-foreground">{booking.payment.transactionCode}</p>
                    <p className="text-xs text-muted-foreground">{booking.payment.screenshotName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={booking.payment.status === 'approved' ? 'success' : 'warning'}>
                      {booking.payment.status === 'approved' ? 'Approved' : 'Pending'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="ghost" onClick={() => window.location.href = `/dashboard/bookings/${booking.id}/payment-proof`}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm">
                        <CheckCircle2 className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline">
                        <X className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}

function AdminUsersTable() {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold text-foreground">User management</h2>
      </CardHeader>
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <AdminTh>Хэрэглэгч</AdminTh>
                <AdminTh>Role</AdminTh>
                <AdminTh>Verification</AdminTh>
                <AdminTh>Status</AdminTh>
                <AdminTh>Action</AdminTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.phone} · {user.email}</p>
                  </td>
                  <td className="px-6 py-4"><Badge variant="default">{user.role}</Badge></td>
                  <td className="px-6 py-4">{user.verified ? <Badge variant="success">Verified</Badge> : <Badge variant="warning">Pending</Badge>}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{user.status}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline">Profile</Button>
                      <Button size="sm">{user.verified ? 'Review' : 'Verify'}</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}

function AdminReportsList() {
  return (
    <div className="grid gap-5">
      {reports.map((report) => (
        <Card key={report.id} className="p-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px] lg:items-center">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="danger">{report.id}</Badge>
                <Badge variant="warning">{report.status}</Badge>
              </div>
              <h2 className="mt-3 text-xl font-semibold text-foreground">{report.reason}</h2>
              <p className="mt-2 text-muted-foreground">
                {report.reportedBy} хэрэглэгч {report.reportedUser}-г {report.bookingId} booking дээр мэдэгдсэн.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{report.date}</p>
            </div>
            <div className="grid gap-2">
              <Button onClick={() => window.location.href = `/dashboard/bookings/${report.bookingId}`}>
                <FileCheck2 className="h-4 w-4" />
                Evidence харах
              </Button>
              <Button variant="outline">Decision log</Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function AdminVerificationList() {
  return (
    <div className="grid gap-5">
      {adminVerificationQueue.map((item) => (
        <Card key={item.id} className="p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_240px] lg:items-center">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="info">{item.id}</Badge>
                <Badge variant="default">{item.role}</Badge>
              </div>
              <h2 className="mt-3 text-xl font-semibold text-foreground">{item.user}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{item.phone} · {item.submitted}</p>
              <p className="mt-3 text-muted-foreground">{item.evidence}</p>
              <p className="mt-2 text-sm text-warning">{item.next}</p>
            </div>
            <div className="grid gap-2">
              <Button>
                <ShieldCheck className="h-4 w-4" />
                Approve driver
              </Button>
              <Button variant="outline">
                <X className="h-4 w-4" />
                Reject reason
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function AdminCargoList() {
  return (
    <div className="grid gap-5">
      {adminCargoQueue.map((item) => (
        <Card key={item.id} className="p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_220px] lg:items-center">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="warning">{item.id}</Badge>
                <Badge variant="info">{item.status}</Badge>
              </div>
              <h2 className="mt-3 text-xl font-semibold text-foreground">{item.route}</h2>
              <p className="mt-2 text-muted-foreground">
                Илгээгч: {item.sender} · Жолооч: {item.driver}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{item.proof} · Delivery code: {item.code}</p>
            </div>
            <div className="grid gap-2">
              <Button>
                <PackageCheck className="h-4 w-4" />
                Proof шалгах
              </Button>
              <Button variant="outline">Dispute нээх</Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function AdminRoutesList() {
  const routes = [
    { id: 'RT-001', route: 'Улаанбаатар -> Дархан', driver: 'Бат-Эрдэнэ', seats: 3, cargo: 'Allowed', status: 'active' },
    { id: 'RT-002', route: 'Улаанбаатар -> Эрдэнэт', driver: 'Ганбат', seats: 2, cargo: 'Allowed', status: 'needs_review' },
    { id: 'RT-003', route: 'Дархан -> Улаанбаатар', driver: 'Мөнх-Оргил', seats: 1, cargo: 'No cargo', status: 'active' },
  ];

  return (
    <div className="grid gap-5">
      {routes.map((route) => (
        <Card key={route.id} className="p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_220px] lg:items-center">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="info">{route.id}</Badge>
                <Badge variant={route.status === 'active' ? 'success' : 'warning'}>{route.status}</Badge>
              </div>
              <h2 className="mt-3 text-xl font-semibold text-foreground">{route.route}</h2>
              <p className="mt-2 text-muted-foreground">Жолооч: {route.driver} · {route.seats} сул суудал · {route.cargo}</p>
            </div>
            <div className="grid gap-2">
              <Button onClick={() => window.location.href = '/routes/1'}>Route харах</Button>
              <Button variant="outline">Fake route устгах</Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function AdminBookingsList() {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold text-foreground">Booking status queue</h2>
      </CardHeader>
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <AdminTh>Booking</AdminTh>
                <AdminTh>Route</AdminTh>
                <AdminTh>Status</AdminTh>
                <AdminTh>Next action</AdminTh>
                <AdminTh>Action</AdminTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4 font-semibold text-foreground">{booking.id}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{booking.route.from} → {booking.route.to}</td>
                  <td className="px-6 py-4"><Badge variant={booking.status === 'confirmed' ? 'success' : 'warning'}>{booking.status}</Badge></td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {booking.status === 'waiting_payment' ? 'Аялагч төлбөрийн баримт илгээх ёстой' : 'Trip reminder / completed action'}
                  </td>
                  <td className="px-6 py-4">
                    <Button size="sm" onClick={() => window.location.href = `/dashboard/bookings/${booking.id}`}>
                      Evidence харах
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}

function AdminTh({ children }: { children: ReactNode }) {
  return <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{children}</th>;
}

function PageTop({ badge, title, description, backHref }: { badge: string; title: string; description: string; backHref: string }) {
  return (
    <div className="mb-6 md:mb-8">
      <button className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground" onClick={() => window.location.href = backHref}>
        <ArrowLeft className="h-4 w-4" />
        Dashboard руу буцах
      </button>
      <Badge variant="info">{badge}</Badge>
      <h1 className="mt-4 text-3xl font-bold leading-tight text-foreground sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{description}</p>
    </div>
  );
}

function DashboardFrame({ children, role, sender, admin }: { children: ReactNode; role?: WorkRole; sender?: boolean; admin?: boolean; active?: string }) {
  const menuItems = admin ? getDashboardMenu('admin') : sender ? getDashboardMenu('sender') : getDashboardMenu(role ?? 'traveler');
  const accountRole = admin ? 'admin' : sender ? 'sender' : role;
  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar menuItems={menuItems} accountRole={accountRole} />
      <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-8">
        {children}
        <AppFooter />
      </main>
    </div>
  );
}
