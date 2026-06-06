import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowLeft, Banknote, Box, Calendar, Car, CheckCircle2, Clock3, Eye, FileCheck2, Filter, ListChecks, MapPin, PackageCheck, Plus, Route, Search, ShieldCheck, Star, UsersRound, X } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { AppFooter } from '../components/Footer';
import { Input } from '../components/Input';
import { LocationSelectGroup } from '../components/LocationSelectGroup';
import { SeatPicker } from '../components/SeatPicker';
import { Select } from '../components/Select';
import { Sidebar } from '../components/Sidebar';
import { bookings, reports, users } from '../data/mockData';
import { getDefaultSeatIds } from '../data/seats';
import { locationMatchesText } from '../data/locations';
import { isSupabaseConfigured } from '../lib/supabase';
import { getDashboardMenu } from '../navigation/dashboardMenus';
import { refreshLocalProfileFromSupabase } from '../services/supabaseAuth';
import {
  canCurrentDriverCreateTrip,
  createDriverTrip,
  fetchActiveTrips,
  fetchCargoEnabledTrips,
  fetchCurrentDriverCargoRequests,
  fetchCurrentDriverPassengerRequests,
  fetchCurrentDriverTrips,
  updateCargoRequestStatus,
  updatePassengerBookingStatus,
  type DriverCargoRequest,
  type DriverPassengerRequest,
  type MarketplaceTrip,
} from '../services/tripService';
import {
  addActionLog,
  getActionLogs,
  getIdentityRequests,
  getStoredUser,
  updateIdentityRequestStatus,
  type ActionLogEntry,
  type IdentityVerificationRequest,
  type MockUserProfile,
} from '../utils/auth';

type WorkRole = 'traveler' | 'driver';
type SenderView = 'cargo' | 'proof' | 'status';
type AdminView = 'payments' | 'users' | 'reports' | 'verifications' | 'cargo' | 'routes' | 'bookings' | 'logs';

const roleCopy = {
  traveler: {
    badge: 'Аялагчийн самбар',
    title: 'Унаа хайх',
    requests: 'Жолоочийн саналууд',
    routes: 'Миний аяллууд',
    earnings: 'Аяллын орлого',
    reviews: 'Аялагчийн үнэлгээ',
    createText: 'Хаашаа, хэзээ, хэдэн хүн явах гэж байгаагаа хайгаад баталгаажсан жолоочийн санал, сул суудал, үнийг харна.',
    routeName: 'Унаа хайх хүсэлт',
    primaryMatch: 'Таарсан жолооч',
    base: '/dashboard/traveler',
  },
  driver: {
    badge: 'Жолоочийн самбар',
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
  { name: 'Бат Болд', route: 'Улаанбаатар → Дархан', date: '2026-05-25', type: 'Жолоочийн санал', detail: '09:00 хөдөлнө, 2 сул суудалтай, баталгаажсан жолооч.', price: '₮35,000' },
  { name: 'Ганбаатар Дорж', route: 'Улаанбаатар → Эрдэнэт', date: '2026-05-26', type: 'Жолоочийн санал', detail: '14:00 хөдөлнө, авах цэг уян хатан.', price: '₮42,000' },
  { name: 'Ганбаатар Дорж', route: 'Улаанбаатар → Сэлэнгэ', date: '2026-05-27', type: 'Чиглэл тохирсон', detail: 'Маршрут болон цаг давхцаж байна. Баталгаажсан хэрэглэгч.', price: '₮20,000' },
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
    pickup: trip.pickupNote || 'Авах цэг тохиролцоно',
    source: 'supabase',
  };
}

const driverMatchRequests = [
  { name: 'Оюун Наран', route: 'Улаанбаатар → Дархан', date: '2026-05-25', type: 'Аялагч хүсэлт', detail: '1 суудал хайж байна. 09:00 орчим хөдөлвөл тохирно, жижиг цүнхтэй.', price: '₮18,000' },
  { name: 'Мөнх-Эрдэнэ', route: 'Улаанбаатар → Эрдэнэт', date: '2026-05-26', type: 'Чиглэл тохирсон', detail: 'Эрдэнэт хүртэл хамт явах жолооч хайж байна. Авах цэг уян хатан.', price: '₮22,000' },
  { name: 'Сарангэрэл Цэцэг', route: 'Улаанбаатар → Сэлэнгэ', date: '2026-05-27', type: 'Аялагчийн санал', detail: 'Чиглэл давхцаж байна. Суудал, авах цагийн тохирол хамгийн чухал.', price: '₮20,000' },
];

const routeRows = [
  { route: 'Улаанбаатар → Дархан', date: '2026-05-25', status: 'Идэвхтэй', matches: 8, proof: 'Профайл баталгаажсан' },
  { route: 'Улаанбаатар → Эрдэнэт', date: '2026-05-28', status: 'Хүлээгдэж буй', matches: 4, proof: 'Админ шалгаж байна' },
  { route: 'Улаанбаатар → Мөрөн', date: '2026-06-02', status: 'Дууссан', matches: 11, proof: 'Дууссан' },
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
    status: 'Чиглэл дээр тохирно',
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
    status: 'Авах цаг хүлээж байна',
  },
];

const adminVerificationQueue = [
  {
    id: 'DRV-204',
    user: 'Мөнх-Эрдэнэ',
    role: 'Жолооч',
    phone: '+976 9090 9090',
    submitted: '2026-05-25 09:48',
    evidence: 'Иргэний үнэмлэх, B ангиллын үнэмлэх, Toyota Prius зураг',
    next: 'Жолооны үнэмлэх болон улсын дугаар давхар шалгах',
  },
  {
    id: 'DRV-118',
    user: 'Оюунбат Ням',
    role: 'Жолооч',
    phone: '+976 9191 2020',
    submitted: '2026-05-24 18:20',
    evidence: 'Машины гэрчилгээ, профайл зураг',
    next: 'Профайл зураг тод биш тул буцаах тайлбар бичих',
  },
];

const adminCargoQueue = [
  {
    id: 'CR-018',
    sender: 'Дорж Цэцэг',
    driver: 'Бат Болд',
    route: 'Улаанбаатар → Дархан',
    status: 'Жолооч зөвшөөрөх хүлээгдэж байна',
    proof: 'Ачаа авсан баталгаа ороогүй',
    code: '482913',
  },
  {
    id: 'CR-021',
    sender: 'Мөнх-Эрдэнэ',
    driver: 'Ганбат Дорж',
    route: 'Улаанбаатар → Эрдэнэт',
    status: 'Замд явж байна',
    proof: 'Хүргэлтийн баталгаа хүлээгдэж байна',
    code: '391204',
  },
];

function readableError(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    const record = error as { message?: string; details?: string; hint?: string; code?: string; name?: string };
    const parts = [
      record.message,
      record.details,
      record.hint,
      record.code ? `code: ${record.code}` : undefined,
      record.name,
    ].filter(Boolean);
    if (parts.length) return parts.join(' | ');
  }
  if (typeof error === 'string') return error;
  return fallback;
}

export function TripFormPage({ role }: { role: WorkRole }) {
  const copy = roleCopy[role];
  const [permissionProfile, setPermissionProfile] = useState<MockUserProfile | null>(() => getStoredUser());
  const [canCreateTrip, setCanCreateTrip] = useState(role !== 'driver');
  const [permissionLoading, setPermissionLoading] = useState(role === 'driver');
  const [permissionMessage, setPermissionMessage] = useState('');
  const [fromAimag, setFromAimag] = useState('Улаанбаатар');
  const [fromSoum, setFromSoum] = useState('');
  const [toAimag, setToAimag] = useState('');
  const [toSoum, setToSoum] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [seatsTotal, setSeatsTotal] = useState('');
  const [availableSeatLabels, setAvailableSeatLabels] = useState<string[]>([]);
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
      ? 'Чиглэл нийтлэхийн тулд жолоочийн баталгаажуулалт зөвшөөрөгдсөн байх хэрэгтэй.'
      : '';

  const describePermission = useCallback((profile: MockUserProfile | null) => {
    if (!profile) {
      return 'Нэвтрэлтийн мэдээлэл олдсонгүй. Жолоочийн бүртгэлээрээ дахин нэвтэрнэ үү.';
    }

    return [
      `Бүртгэл: ${profile.email || 'и-мэйл байхгүй'}`,
      `Төрөл: ${profile.role === 'driver' ? 'жолооч' : profile.role}`,
      `Утас: ${profile.phone_verified ? 'баталгаажсан' : 'баталгаажаагүй'}`,
      `Профайл: ${profile.onboarding_completed ? 'дууссан' : 'дутуу'}`,
      `Жолоочийн баталгаажуулалт: ${profile.verification_status || 'олдоогүй'}`,
    ].join(' · ');
  }, []);

  const refreshDriverPermission = useCallback(async () => {
    if (role !== 'driver') return;
    setPermissionLoading(true);
    setPermissionMessage('');
    setError('');

    try {
      const refreshedProfile = await refreshLocalProfileFromSupabase();
      setPermissionProfile(refreshedProfile);

      const allowed = await canCurrentDriverCreateTrip();
      setCanCreateTrip(allowed);

      if (!allowed) {
        setPermissionMessage(describePermission(refreshedProfile));
      }
    } catch (err) {
      setCanCreateTrip(false);
      const message = readableError(err, '');
      setPermissionMessage(
        message.toLowerCase().includes('auth session missing')
          ? 'Нэвтрэлтийн мэдээлэл олдсонгүй. Жолоочийн бүртгэлээрээ дахин нэвтэрнэ үү.'
          : message || 'Жолоочийн эрх шалгахад алдаа гарлаа.',
      );
    } finally {
      setPermissionLoading(false);
    }
  }, [describePermission, role]);

  useEffect(() => {
    refreshDriverPermission();
  }, [refreshDriverPermission]);

  const formatLocation = (aimag: string, soum: string) => {
    if (!aimag) return '';
    return soum ? `${aimag} - ${soum}` : aimag;
  };

  const handleSeatsTotalChange = (value: string) => {
    setSeatsTotal(value);
    const count = Number(value);
    if (role === 'driver' && Number.isFinite(count) && count >= 0) {
      setAvailableSeatLabels(getDefaultSeatIds(count));
    }
  };

  const handleAvailableSeatsChange = (seats: string[]) => {
    setAvailableSeatLabels(seats);
    setSeatsTotal(seats.length ? String(seats.length) : '');
  };

  const handleSubmit = async () => {
    setError('');
    setSubmittedTripId('');

    if (role !== 'driver') return;
    if (driverBlocked) {
      setError('Жолоочийн баталгаажуулалт зөвшөөрөгдсөний дараа чиглэл нийтлэх боломжтой.');
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

    const seats = role === 'driver' && availableSeatLabels.length ? availableSeatLabels.length : Number(seatsTotal);
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
        availableSeatLabels: availableSeatLabels.length ? availableSeatLabels : getDefaultSeatIds(seats),
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
                    Админ таны жолооны үнэмлэх, машины мэдээллийг шалгасны дараа чиглэл нийтлэх боломж нээгдэнэ.
                  </p>
                  {(permissionMessage || permissionProfile) && (
                    <p className="mt-2 rounded-md bg-background/70 px-3 py-2 text-xs leading-5 text-muted-foreground">
                      {permissionMessage || describePermission(permissionProfile)}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:min-w-36">
                  <Button variant="outline" onClick={refreshDriverPermission} disabled={permissionLoading}>
                    Дахин шалгах
                  </Button>
                  <Button variant="ghost" onClick={() => { window.location.href = '/dashboard/driver/verification'; }}>
                    Баталгаажуулалт
                  </Button>
                </div>
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
                  <p className="font-semibold text-foreground">Чиглэл амжилттай нийтлэгдлээ</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Дугаар: <span className="font-mono text-foreground">{submittedTripId}</span>. Одоо энэ чиглэл аялагчийн хайлт дээр харагдах боломжтой.
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
            <Input label={role === 'driver' ? 'Сул суудлын тоо' : 'Зорчих хүний тоо'} type="number" min="1" placeholder={role === 'driver' ? '3' : '1'} value={seatsTotal} onChange={(event) => handleSeatsTotalChange(event.target.value)} />
            <Input label="Нэг хүний үнэ" type="number" min="0" placeholder="35000" value={pricePerSeat} onChange={(event) => setPricePerSeat(event.target.value)} />
            {role === 'driver' && (
              <div className="md:col-span-2">
                <SeatPicker
                  mode="driver"
                  label="Сул суудлаа сонгох"
                  description="Аялагч захиалга хийхдээ таны энд сонгосон суудлуудаас өөрөө сонгоно."
                  selectedSeats={availableSeatLabels}
                  onChange={handleAvailableSeatsChange}
                  disabled={driverBlocked || permissionLoading}
                />
              </div>
            )}
            <Input label="Авах цэгийн тайлбар" placeholder="Жишээ: Драмын театрын урд" value={pickupNote} onChange={(event) => setPickupNote(event.target.value)} />
            <Input label="Буух цэгийн тайлбар" placeholder="Жишээ: Дархан захын ойролцоо" value={dropoffNote} onChange={(event) => setDropoffNote(event.target.value)} />
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
            <Button variant="outline" onClick={() => window.location.href = copy.base}>Самбар руу буцах</Button>
          </div>
          {disabledReason && (
            <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">{disabledReason}</p>
              <p className="mt-1">Админ зөвшөөрсний дараа “Дахин шалгах” дарж шинэ төлөвөө татна уу.</p>
              {(permissionMessage || permissionProfile) && (
                <p className="mt-2 rounded-md bg-background/70 px-3 py-2 text-xs leading-5">
                  {permissionMessage || describePermission(permissionProfile)}
                </p>
              )}
            </div>
          )}
        </Card>
        <Card className="p-6 bg-primary/5 border-primary/20">
          <h2 className="text-xl font-semibold text-foreground">Нийтлэхээс өмнө</h2>
          <div className="mt-5 space-y-4">
            {['Хэрэглэгчийн төрөл тодорхой харагдана', 'Аялагч/жолоочийн тохирол эхэнд гарна', 'Үнэ, суудал, цагийн мэдээлэл тодорхой байна', role === 'driver' ? 'Дайвар ачаа авч болох чиглэл дээр ачааны хүсэлт авах боломжтой' : 'Дайвар ачаа нь чиглэл дээр суурилсан нэмэлт боломж хэвээр байна'].map((item) => (
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
  const [driverRequests, setDriverRequests] = useState<DriverPassengerRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(role === 'driver' && isSupabaseConfigured);
  const [requestError, setRequestError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    let active = true;
    if (role !== 'driver' || !isSupabaseConfigured) return;

    setLoadingRequests(true);
    fetchCurrentDriverPassengerRequests()
      .then((items) => {
        if (!active) return;
        setDriverRequests(items);
        setRequestError('');
      })
      .catch((error) => {
        if (!active) return;
        setRequestError(error instanceof Error ? error.message : 'Ирсэн хүсэлт уншихад алдаа гарлаа.');
      })
      .finally(() => {
        if (active) setLoadingRequests(false);
      });

    return () => {
      active = false;
    };
  }, [role]);

  const changeBookingStatus = async (bookingId: string, nextStatus: 'accepted' | 'rejected') => {
    setActionMessage('');
    setRequestError('');

    try {
      await updatePassengerBookingStatus(bookingId, nextStatus);
      setDriverRequests((current) => current.map((item) => (
        item.id === bookingId ? { ...item, status: nextStatus } : item
      )));
      setActionMessage(nextStatus === 'accepted' ? 'Хүсэлт зөвшөөрөгдлөө. Аялагч төлбөрийн баримт илгээх шат руу орно.' : 'Хүсэлт татгалзагдлаа.');
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Status шинэчлэхэд алдаа гарлаа.');
    }
  };

  return (
    <DashboardFrame role={role} active="requests">
      <PageTop badge={copy.badge} title={action ? (action === 'accept' ? 'Хүсэлт зөвшөөрөх' : 'Хүсэлт татгалзах') : copy.requests} description={`${copy.primaryMatch}, чиглэл, үнэ, суудал, цагийн тохирлыг тусад нь харуулна.`} backHref={copy.base} />
      {action && (
        <Card className={`mb-6 p-5 ${action === 'accept' ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Badge variant={action === 'accept' ? 'success' : 'danger'}>{action === 'accept' ? 'Зөвшөөрөх үйлдэл' : 'Татгалзах үйлдэл'}</Badge>
              <p className="mt-3 text-lg font-semibold text-foreground">{action === 'accept' ? 'Хүсэлт зөвшөөрөхөд захиалга үүсэж төлбөрийн баримтын алхам нээгдэнэ.' : 'Татгалзвал хэрэглэгчид богино тайлбар очно.'}</p>
            </div>
            <Button variant={action === 'accept' ? 'primary' : 'outline'}>{action === 'accept' ? 'Баталгаажуулах' : 'Татгалзах'}</Button>
          </div>
        </Card>
      )}
      {loadingRequests && (
        <Card className="mb-5 p-4">
          <p className="text-sm text-muted-foreground">Ирсэн суудлын хүсэлтүүдийг өгөгдлийн сангаас уншиж байна...</p>
        </Card>
      )}
      {requestError && (
        <Card className="mb-5 border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive">{requestError}</p>
        </Card>
      )}
      {actionMessage && (
        <Card className="mb-5 border-success/20 bg-success/5 p-4">
          <p className="text-sm font-medium text-success">{actionMessage}</p>
        </Card>
      )}
      {role === 'driver' && driverRequests.length > 0 ? (
        <div className="grid gap-5">
          {driverRequests.map((request) => (
            <Card key={request.id} className="p-6">
              <div className="grid gap-5 lg:grid-cols-[1fr_240px] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="success">Суудлын хүсэлт</Badge>
                    <Badge variant={request.status === 'accepted' ? 'success' : request.status === 'rejected' ? 'danger' : 'warning'}>
                      {getRequestStatusLabel(request.status)}
                    </Badge>
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold text-foreground">{request.route}</h2>
                  <p className="mt-2 text-muted-foreground">
                    {request.travelerName} · {request.seatsRequested} суудал · {new Date(request.departureAt).toLocaleString('mn-MN')}
                  </p>
                  {request.note && <p className="mt-2 text-sm leading-6 text-muted-foreground">{request.note}</p>}
                </div>
                <div className="rounded-lg bg-muted/40 p-4">
                  <p className="text-sm text-muted-foreground">Нийт дүн</p>
                  <p className="mt-1 text-2xl font-bold text-primary">₮{request.totalAmount.toLocaleString()}</p>
                  <div className="mt-4 grid gap-2">
                    <Button size="sm" onClick={() => changeBookingStatus(request.id, 'accepted')} disabled={request.status === 'accepted'}>
                      Зөвшөөрөх
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => changeBookingStatus(request.id, 'rejected')} disabled={request.status === 'rejected'}>
                      Татгалзах
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
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
      )}
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
  const [offers, setOffers] = useState<DriverOffer[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(isSupabaseConfigured);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;

    if (!isSupabaseConfigured) {
      setOffers([]);
      setLoadError('Өгөгдлийн сангийн холболт тохируулагдаагүй тул бодит чиглэл унших боломжгүй байна.');
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
        badge="Аялагчийн самбар"
        title="Унаа хайх"
        description="Хаанаас, хаашаа, огноо, хүний тоогоо оруулаад боломжтой жолоочийн чиглэлүүдийг шүүнэ."
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
            Дайвар ачаа авч болох чиглэл
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

function getRequestStatusLabel(status: string) {
  if (status === 'accepted') return 'Зөвшөөрсөн';
  if (status === 'rejected') return 'Татгалзсан';
  if (status === 'waiting_payment') return 'Төлбөр хүлээгдэж байна';
  if (status === 'confirmed') return 'Баталгаажсан';
  return 'Хүлээгдэж байна';
}

export function DriverOffersPage() {
  return (
    <DashboardFrame role="traveler">
      <PageTop
        badge="Аялагчийн самбар"
        title="Жолоочийн саналууд"
        description="Энэ хэсэгт хайлтаас олдсон бодит жолоочийн чиглэлүүд харагдана."
        backHref="/dashboard/traveler"
      />

      <Card className="p-10 text-center">
        <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">Одоогоор тусдаа саналын жагсаалт байхгүй</h2>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          Жолоочийн саналууд “Унаа хайх” хэсэгт өгөгдлийн сангаас уншигдсан бодит чиглэлүүдээр бүрдэнэ.
        </p>
        <Button className="mt-5" onClick={() => window.location.href = '/traveler/find-drivers'}>
          Унаа хайх
        </Button>
      </Card>
    </DashboardFrame>
  );
}

export function CargoFindRoutesPage() {
  const [fromAimag, setFromAimag] = useState('');
  const [fromSoum, setFromSoum] = useState('');
  const [toAimag, setToAimag] = useState('');
  const [toSoum, setToSoum] = useState('');
  const [cargoOffers, setCargoOffers] = useState<DriverOffer[]>([]);
  const [loadingCargoRoutes, setLoadingCargoRoutes] = useState(isSupabaseConfigured);
  const [cargoRouteError, setCargoRouteError] = useState('');

  useEffect(() => {
    let active = true;
    if (!isSupabaseConfigured) {
      setCargoOffers([]);
      setCargoRouteError('Өгөгдлийн сангийн холболт тохируулагдаагүй тул бодит чиглэл унших боломжгүй байна.');
      setLoadingCargoRoutes(false);
      return;
    }

    setLoadingCargoRoutes(true);
    fetchCargoEnabledTrips()
      .then((trips) => {
        if (!active) return;
        setCargoOffers(trips.map(toDriverOffer));
        setCargoRouteError('');
      })
      .catch((error) => {
        if (!active) return;
        setCargoRouteError(error instanceof Error ? error.message : 'Дайвар ачаа авч болох чиглэл уншихад алдаа гарлаа.');
      })
      .finally(() => {
        if (active) setLoadingCargoRoutes(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const cargoRoutes = cargoOffers.filter((offer) => {
    const matchesFrom = locationMatchesText(`${offer.from} ${offer.pickup}`, fromAimag, fromSoum);
    const matchesTo = locationMatchesText(offer.to, toAimag, toSoum);
    return offer.allowsCargo && matchesFrom && matchesTo;
  });

  return (
    <DashboardFrame sender active="find-routes">
      <PageTop
        badge="Дайвар ачааны нэмэлт боломж"
        title="Ачаа авах жолооч хайх"
        description="Зөвхөн дайвар ачаа авч болох чиглэлүүдийг харуулна. Чиглэл сонгоод ачааны хүсэлт илгээнэ."
        backHref="/dashboard/cargo"
      />

      <Card className="mb-6 p-6">
        <div className="mb-5 flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Чиглэл шүүх</h2>
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

      {loadingCargoRoutes && (
        <Card className="mb-5 p-4">
          <p className="text-sm text-muted-foreground">Дайвар ачаа авч болох чиглэлүүдийг уншиж байна...</p>
        </Card>
      )}

      {cargoRouteError && (
        <Card className="mb-5 border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive">{cargoRouteError}</p>
        </Card>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-1">
        <Card className="p-5">
          <Badge variant="warning">Дайвар ачаа авч болно</Badge>
          <p className="mt-3 text-3xl font-bold text-foreground">{cargoRoutes.length}</p>
          <p className="text-sm text-muted-foreground">чиглэл боломжтой</p>
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
          <h2 className="text-xl font-semibold text-foreground">Дайвар ачаа авах чиглэл олдсонгүй</h2>
          <p className="mt-2 text-muted-foreground">Аймаг, сумын шүүлтүүрээ өөрчлөөд дахин шалгаарай.</p>
        </Card>
      )}
    </DashboardFrame>
  );
}

export function MyRoutesPage({ role }: { role: WorkRole }) {
  const copy = roleCopy[role];
  const [driverTrips, setDriverTrips] = useState<MarketplaceTrip[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(role === 'driver' && isSupabaseConfigured);
  const [routesError, setRoutesError] = useState('');

  useEffect(() => {
    let active = true;
    if (role !== 'driver' || !isSupabaseConfigured) return;

    setLoadingRoutes(true);
    fetchCurrentDriverTrips()
      .then((trips) => {
        if (!active) return;
        setDriverTrips(trips);
        setRoutesError('');
      })
      .catch((error) => {
        if (!active) return;
        setRoutesError(error instanceof Error ? error.message : 'Миний чиглэлүүдийг уншихад алдаа гарлаа.');
      })
      .finally(() => {
        if (active) setLoadingRoutes(false);
      });

    return () => {
      active = false;
    };
  }, [role]);

  return (
    <DashboardFrame role={role} active="routes">
      <PageTop badge={copy.badge} title={copy.routes} description="Өөрийн нийтэлсэн чиглэлүүд, таарсан хүмүүс, захиалгын урсгалыг нэг дор харна." backHref={copy.base} />
      {loadingRoutes && (
        <Card className="mb-5 p-4">
          <p className="text-sm text-muted-foreground">Таны чиглэлүүдийг уншиж байна...</p>
        </Card>
      )}
      {routesError && (
        <Card className="mb-5 border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive">{routesError}</p>
        </Card>
      )}
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
          {role === 'driver' && driverTrips.length > 0 ? (
            <div className="space-y-4">
              {driverTrips.map((trip) => (
                <div key={trip.id} className="grid gap-4 rounded-lg border border-border p-4 md:grid-cols-[1fr_160px_140px_160px] md:items-center">
                  <div>
                    <p className="font-semibold text-foreground">{trip.fromLocation} → {trip.toLocation}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(trip.departureAt).toLocaleString('mn-MN')} · {trip.seatsAvailable}/{trip.seatsTotal} сул · ₮{trip.pricePerSeat.toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={trip.status === 'active' ? 'success' : trip.status === 'cancelled' ? 'danger' : 'default'}>{trip.status}</Badge>
                  <p className="text-sm text-muted-foreground">{trip.allowsCargo ? 'Дайвар ачаа авна' : 'Зөвхөн зорчигч'}</p>
                  <Button variant="outline" size="sm" onClick={() => window.location.href = `/routes/${trip.id}`}>Дэлгэрэнгүй</Button>
                </div>
              ))}
            </div>
          ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center">
            <Route className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Чиглэл хараахан алга</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {role === 'driver'
                ? 'Шинэ чиглэл нийтэлсний дараа энд харагдана.'
                : 'Захиалга үүссэний дараа таны аяллын жагсаалт энд харагдана.'}
            </p>
          </div>
          )}
        </CardBody>
      </Card>
    </DashboardFrame>
  );
}

export function DriverCargoRequestsPage() {
  const [cargoRequests, setCargoRequests] = useState<DriverCargoRequest[]>([]);
  const [loadingCargoRequests, setLoadingCargoRequests] = useState(isSupabaseConfigured);
  const [cargoRequestError, setCargoRequestError] = useState('');
  const [cargoActionMessage, setCargoActionMessage] = useState('');

  useEffect(() => {
    let active = true;
    if (!isSupabaseConfigured) return;

    setLoadingCargoRequests(true);
    fetchCurrentDriverCargoRequests()
      .then((items) => {
        if (!active) return;
        setCargoRequests(items);
        setCargoRequestError('');
      })
      .catch((error) => {
        if (!active) return;
        setCargoRequestError(error instanceof Error ? error.message : 'Дайвар ачааны хүсэлт уншихад алдаа гарлаа.');
      })
      .finally(() => {
        if (active) setLoadingCargoRequests(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const changeCargoStatus = async (requestId: string, nextStatus: 'cargo_accepted' | 'rejected') => {
    setCargoActionMessage('');
    setCargoRequestError('');

    try {
      await updateCargoRequestStatus(requestId, nextStatus);
      setCargoRequests((current) => current.map((item) => (
        item.id === requestId ? { ...item, status: nextStatus } : item
      )));
      setCargoActionMessage(nextStatus === 'cargo_accepted'
        ? 'Дайвар ачааны хүсэлт зөвшөөрөгдлөө. Илгээгч төлбөрийн баримтын шат руу орно.'
        : 'Дайвар ачааны хүсэлт татгалзагдлаа.');
    } catch (error) {
      setCargoRequestError(error instanceof Error ? error.message : 'Ачааны төлөв шинэчлэхэд алдаа гарлаа.');
    }
  };

  return (
    <DashboardFrame role="driver">
      <PageTop
        badge="Жолоочийн самбар"
        title="Дайвар ачааны хүсэлт"
        description="Таны 'дайвар ачаа авч болно' гэж тэмдэглэсэн чиглэл дээр ирсэн жижиг ачааны хүсэлтүүд. Энэ нь зорчигчийн захиалгаас тусдаа нэмэлт урсгал хэвээр байна."
        backHref="/dashboard/driver"
      />

      <Card className="mb-6 border-warning/20 bg-warning/5 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <PackageCheck className="mt-1 h-5 w-5 shrink-0 text-warning" />
            <div>
              <h2 className="font-semibold text-foreground">Зөвхөн таны чиглэлд таарсан хүсэлт</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Аялагчийн суудлын хүсэлт хамгийн эхэнд байна. Дайвар ачааг зөвшөөрсөн чиглэл дээр л жолооч шийдвэрлэнэ.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => window.location.href = '/dashboard/driver/routes/new'}>
            Чиглэлийн тохиргоо
          </Button>
        </div>
      </Card>

      {loadingCargoRequests && (
        <Card className="mb-5 p-4">
          <p className="text-sm text-muted-foreground">Дайвар ачааны хүсэлтүүдийг өгөгдлийн сангаас уншиж байна...</p>
        </Card>
      )}

      {cargoRequestError && (
        <Card className="mb-5 border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive">{cargoRequestError}</p>
        </Card>
      )}

      {cargoActionMessage && (
        <Card className="mb-5 border-success/20 bg-success/5 p-4">
          <p className="text-sm font-medium text-success">{cargoActionMessage}</p>
        </Card>
      )}

      <div className="grid gap-5">
        {cargoRequests.map((request) => (
          <Card key={request.id} className="p-6">
            <div className="grid gap-5 xl:grid-cols-[1fr_220px] xl:items-center">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="warning">{request.id}</Badge>
                  <Badge variant="default">{request.status}</Badge>
                </div>
                <h2 className="text-2xl font-semibold text-foreground">{request.route}</h2>
                <p className="mt-2 text-muted-foreground">
                  {request.senderName} илгээгчээс {request.cargoName.toLowerCase()} дайх хүсэлт ирсэн.
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <InfoPill icon={<Box className="h-4 w-4" />} label="Ачаа" value={request.cargoName} />
                  <InfoPill icon={<PackageCheck className="h-4 w-4" />} label="Хэмжээ" value={`${request.weightKg || '-'} кг · ${request.sizeNote || request.cargoType || 'төрөл ороогүй'}`} />
                  <InfoPill icon={<MapPin className="h-4 w-4" />} label="Авах цэг" value={request.pickupNote || 'Тохиролцоно'} />
                  <InfoPill icon={<MapPin className="h-4 w-4" />} label="Хүлээн авагч" value={`${request.receiverName} · ${request.receiverPhone}`} />
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm text-muted-foreground">Хүргэлтийн код</p>
                <p className="mt-1 text-3xl font-bold text-primary">{request.deliveryCode}</p>
                <div className="mt-5 grid gap-2">
                  <Button
                    fullWidth
                    disabled={request.status === 'cargo_accepted'}
                    onClick={() => changeCargoStatus(request.id, 'cargo_accepted')}
                  >
                    Зөвшөөрөх
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    disabled={request.status === 'rejected'}
                    onClick={() => changeCargoStatus(request.id, 'rejected')}
                  >
                    Татгалзах
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {!loadingCargoRequests && cargoRequests.length === 0 && (
        <Card className="mt-6 p-10 text-center">
          <PackageCheck className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground">Дайвар ачааны хүсэлт ирээгүй байна</h2>
          <p className="mt-2 text-muted-foreground">Allows-cargo чиглэл нийтэлсний дараа ачааны хүсэлтүүд энд харагдана.</p>
        </Card>
      )}
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
            <InfoPill icon={<MapPin className="h-4 w-4" />} label="Авах цэг" value={offer.pickup} />
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
          <p className="text-sm text-muted-foreground">{isCargoMode ? 'Дайвар ачааны чиглэл' : 'Нэг суудлын үнэ'}</p>
          <p className="mt-1 text-3xl font-bold text-primary">₮{offer.price.toLocaleString()}</p>
          <p className="mt-1 text-xs text-muted-foreground">{isCargoMode ? offer.cargoNote : '+ үйлчилгээний шимтгэл'}</p>
          <div className="mt-5 grid gap-2">
            <Button fullWidth onClick={() => window.location.href = isCargoMode ? `/cargo/new?tripId=${offer.id}` : `/routes/${offer.id}`}>
              {isCargoMode ? 'Ачааны хүсэлт илгээх' : 'Хүсэлт илгээх'}
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
      <PageTop badge={copy.badge} title={copy.earnings} description="Орлого зөвхөн бодит захиалга, бодит төлбөр баталгаажсаны дараа харагдана." backHref={copy.base} />
      <Card className="p-8 text-center">
        <Banknote className="mx-auto mb-4 h-12 w-12 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">Одоогоор орлогын бодит мэдээлэл алга</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Зохиомол дүн, зохиомол гүйлгээ харуулахгүй. Жолоочийн аялал эсвэл дайвар ачааны захиалга төлбөртэй баталгаажсаны дараа энд орлого бүртгэгдэнэ.
        </p>
      </Card>
    </DashboardFrame>
  );

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
      <PageTop badge={role === 'sender' ? 'Дайвар ачааны самбар' : roleCopy[role].badge} title={title} description="Үнэлгээ зөвхөн бодит дууссан аялал, бодит захиалга дээр нээгдэнэ." backHref={base} />
      <Card className="p-8 text-center">
        <Star className="mx-auto mb-4 h-12 w-12 text-warning" />
        <h2 className="text-xl font-semibold text-foreground">Одоогоор үнэлгээ алга</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Зохиомол оноо, зохиомол сэтгэгдэл харуулахгүй. Аялал дууссаны дараа хэрэглэгчид бие биедээ үнэлгээ өгвөл энд харагдана.
        </p>
      </Card>
    </DashboardFrame>
  );

  return (
    <DashboardFrame role={role === 'sender' ? undefined : role} sender={role === 'sender'} active="reviews">
      <PageTop badge={role === 'sender' ? 'Дайвар ачааны самбар' : roleCopy[role].badge} title={title} description="Итгэлцэл үүсгэдэг үнэлгээ, сэтгэгдэл, дууссан захиалгын тойм." backHref={base} />
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <Card className="p-6 text-center">
          <Star className="mx-auto h-10 w-10 fill-warning text-warning" />
          <p className="mt-4 text-5xl font-bold text-foreground">4.8</p>
          <p className="mt-2 text-muted-foreground">32 үнэлгээнээс</p>
        </Card>
        <div className="space-y-4">
          {['Маш тодорхой мэдээлэлтэй, цагтаа хариу өгсөн.', 'Чиглэл болон авах цэгийн нөхцөл ойлгомжтой байсан.', 'Төлбөрийн баримт, аяллын явц ойлгомжтой байсан.'].map((text, index) => (
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
  const title = isProof ? 'Төлбөрийн баримт ба ачааны нотолгоо' : isStatus ? 'Хүргэлтийн код ба төлөв' : 'Дайвар ачаа';
  const description = isProof
    ? 'Төлбөрийн баримт, ачаа авсан зураг, хүргэсэн зураг тусдаа хадгалагдаж маргаан гарвал админд нотолгоо болно.'
    : isStatus
      ? 'Хүлээн авагчийн 6 оронтой код болон хүргэлтийн төлөвөө нэг дор хянана.'
      : 'Дайвар ачаа нь жолоочийн чиглэл дээр суурилсан нэмэлт боломж.';
  return (
    <DashboardFrame sender active={view}>
      <PageTop badge="Дайвар ачааны нэмэлт боломж" title={title} description={description} backHref="/dashboard/cargo" />
      <Card className="p-8 text-center">
        <PackageCheck className="mx-auto mb-4 h-12 w-12 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">Одоогоор бодит ачааны хүсэлт алга</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Зохиомол захиалга, зохиомол хүргэлтийн код, зохиомол төлбөрийн баримт харуулахгүй. Ачаа авах боломжтой чиглэл сонгож хүсэлт үүсгэсний дараа энэ хэсэг дүүрнэ.
        </p>
        <Button className="mt-5" onClick={() => window.location.href = '/cargo/find-routes'}>
          Ачаа авах чиглэл хайх
        </Button>
      </Card>
    </DashboardFrame>
  );

  return (
    <DashboardFrame sender active={view}>
      <PageTop badge="Дайвар ачааны нэмэлт боломж" title={title} description={description} backHref="/dashboard/cargo" />
      <div className="grid gap-5">
        {['BK-001', 'BK-002', 'BK-003'].map((id, index) => (
          <Card key={id} className="p-6">
            <div className="grid gap-4 md:grid-cols-[1fr_180px_160px] md:items-center">
              <div>
                <Badge variant={index === 0 ? 'warning' : index === 1 ? 'info' : 'success'}>
                  {isStatus
                    ? index === 0 ? 'Код хүлээгдэж байна' : index === 1 ? 'Замд явж байна' : 'Хүлээлгэн өгсөн'
                    : index === 0 ? 'Баримт хүлээгдэж байна' : index === 1 ? 'Админ шалгаж байна' : 'Баталгаажсан'}
                </Badge>
                <h2 className="mt-3 text-xl font-semibold text-foreground">{id} - УБ → Дархан</h2>
                <p className="mt-1 text-muted-foreground">
                  {isStatus ? 'Хүлээн авагчийн код: 482913. Хүргэлтийн баталгаажуулалт хүлээгдэж байна.' : 'Ачаа авсан болон хүргэсэн баталгааг тусдаа оруулна.'}
                </p>
              </div>
              <p className="text-2xl font-bold text-primary">₮{(18000 + index * 4000).toLocaleString()}</p>
              <Button variant="outline" onClick={() => window.location.href = isStatus ? '/dashboard/cargo' : '/dashboard/bookings/BK-001/delivery-proof'}>
                {isStatus ? 'Самбар' : 'Баталгаа оруулах'}
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
    reports: 'Гомдол, маргаан',
    verifications: 'Баталгаажуулалт',
    cargo: 'Дайвар ачааны хяналт',
    routes: 'Чиглэлийн хяналт',
    bookings: 'Захиалгын хяналт',
    logs: 'Үйлдлийн түүх',
  };

  const descriptions = {
    payments: 'Аялагчийн төлбөрийн баримтыг шалгаж зөвшөөрөх эсвэл буцаавал захиалгын төлөв дараагийн шат руу шилжинэ.',
    users: 'Хэрэглэгчийн төрөл, баталгаажуулалт, бүртгэлийн төлөв, дууссан аяллын мэдээллийг нэг дор хянана.',
    reports: 'Маргаан, мэдэгдэл, ирээгүй тохиолдол, төлбөрийн асуудлыг захиалгын нотолгоотой холбож шалгана.',
    verifications: 'Иргэний үнэмлэх, жолоочийн бичиг баримт, машины мэдээлэл, профайлын баталгаажуулалтыг зөвшөөрөх эсвэл буцаана.',
    cargo: 'Дайвар ачааны хүсэлт, авсан/хүргэсэн баталгаа, 6 оронтой кодын төлөвийг хянана.',
    routes: 'Хуурамч, давхардсан, дүрэм зөрчсөн чиглэлүүдийг шалгаж хаах боломжтой.',
    bookings: 'Аялагч-жолоочийн захиалгын төлөв, дараагийн алхам, төлбөрийн шалгалт, маргааны эрсдэлийг хянана.',
    logs: 'Нэвтрэлт, OTP, баталгаажуулалт, төлбөр, админы шийдвэр зэрэг гол үйлдлийг шүүж харна.',
  };

  return (
    <DashboardFrame admin active={view}>
      <PageTop badge="Админ самбар" title={titles[view]} description={descriptions[view]} backHref="/admin" />
      <Card className="p-8 text-center">
        <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">Одоогоор хүлээгдэж буй бодит мэдээлэл алга</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Энэ жагсаалт өгөгдлийн санд бодит төлбөрийн баримт, баталгаажуулалтын хүсэлт, гомдол, чиглэл, захиалга үүссэний дараа дүүрнэ.
          Зохиомол хэрэглэгч, захиалга, төлбөр харуулахгүй.
        </p>
        <Button className="mt-5" variant="outline" onClick={() => window.location.href = '/admin'}>
          Админ самбар руу буцах
        </Button>
      </Card>
    </DashboardFrame>
  );
}

function AdminPaymentsTable() {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-foreground">Төлбөрийн баримтын жагсаалт</h2>
          <Badge variant="warning">{bookings.filter((booking) => booking.payment.status === 'pending').length} хүлээгдэж байна</Badge>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <AdminTh>Захиалга</AdminTh>
                <AdminTh>Талууд</AdminTh>
                <AdminTh>Дүн</AdminTh>
                <AdminTh>Баримт</AdminTh>
                <AdminTh>Төлөв</AdminTh>
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
                      {booking.payment.status === 'approved' ? 'Баталгаажсан' : 'Хүлээгдэж байна'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="ghost" onClick={() => window.location.href = `/dashboard/bookings/${booking.id}/payment-proof`}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm">
                        <CheckCircle2 className="h-4 w-4" />
                        Зөвшөөрөх
                      </Button>
                      <Button size="sm" variant="outline">
                        <X className="h-4 w-4" />
                        Буцаах
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
        <h2 className="text-xl font-semibold text-foreground">Хэрэглэгчийн удирдлага</h2>
      </CardHeader>
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <AdminTh>Хэрэглэгч</AdminTh>
                <AdminTh>Төрөл</AdminTh>
                <AdminTh>Баталгаажуулалт</AdminTh>
                <AdminTh>Төлөв</AdminTh>
                <AdminTh>Үйлдэл</AdminTh>
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
                  <td className="px-6 py-4">{user.verified ? <Badge variant="success">Баталгаажсан</Badge> : <Badge variant="warning">Хүлээгдэж байна</Badge>}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{user.status}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline">Профайл</Button>
                      <Button size="sm">{user.verified ? 'Шалгах' : 'Баталгаажуулах'}</Button>
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
                {report.reportedBy} хэрэглэгч {report.reportedUser}-г {report.bookingId} захиалга дээр мэдэгдсэн.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{report.date}</p>
            </div>
            <div className="grid gap-2">
              <Button onClick={() => window.location.href = `/dashboard/bookings/${report.bookingId}`}>
                <FileCheck2 className="h-4 w-4" />
                Нотолгоо харах
              </Button>
              <Button variant="outline">Шийдвэрийн түүх</Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

const seedIdentityVerificationRequests: IdentityVerificationRequest[] = [
  {
    id: 'IDV-DEMO-1',
    role: 'driver',
    userName: 'Бат Болд',
    phone: '+976 9090 9090',
    email: 'driver@nuudelchintrip.mn',
    familyName: 'Бат',
    fullName: 'Бат Болд',
    registerNumber: 'УБ99112233',
    documentName: 'irgenii-unemleh-front.jpg',
    selfieName: 'nuurnii-zurag.jpg',
    status: 'pending',
    submittedAt: '2026-06-03T09:20:00.000Z',
  },
  {
    id: 'IDV-DEMO-2',
    role: 'traveler',
    userName: 'Сарангэрэл Цэцэг',
    phone: '+976 8088 3461',
    email: 'traveler@nuudelchintrip.mn',
    familyName: 'Дорж',
    fullName: 'Сарангэрэл Цэцэг',
    registerNumber: 'АР00112233',
    documentName: 'passport-photo.pdf',
    status: 'approved',
    submittedAt: '2026-06-02T14:10:00.000Z',
    reviewedAt: '2026-06-02T15:20:00.000Z',
    reviewedBy: 'Админ',
  },
];

function AdminVerificationList() {
  const [requests, setRequests] = useState<IdentityVerificationRequest[]>(() => {
    const storedRequests = getIdentityRequests();
    return storedRequests.length ? storedRequests : seedIdentityVerificationRequests;
  });
  const [reasonById, setReasonById] = useState<Record<string, string>>({});

  const handleDecision = (id: string, decision: 'approved' | 'rejected') => {
    const reason = reasonById[id]?.trim();
    const realRequest = getIdentityRequests().some((request) => request.id === id);
    const updated = realRequest ? updateIdentityRequestStatus(id, decision, reason) : null;

    setRequests((current) =>
      current.map((request) => {
        if (request.id !== id) return request;
        const next: IdentityVerificationRequest = {
          ...request,
          status: decision,
          reviewedAt: new Date().toISOString(),
          reviewedBy: 'Админ',
          rejectionReason: decision === 'rejected' ? reason || 'Баримтын зураг тодорхойгүй байна.' : undefined,
        };
        return updated || next;
      }),
    );

    if (!realRequest) {
      const target = requests.find((request) => request.id === id);
      addActionLog({
        actor: 'Админ',
        user: target?.fullName || target?.userName || id,
        actionType: 'Иргэний үнэмлэхний баталгаажуулалт',
        status: decision === 'approved' ? 'Амжилттай' : 'Татгалзсан',
        details:
          decision === 'approved'
            ? 'Demo хүсэлтийг зөвшөөрсөн.'
            : `Demo хүсэлтийг буцаасан. Шалтгаан: ${reason || 'Баримтын зураг тодорхойгүй байна.'}`,
      });
    }
  };

  return (
    <div className="grid gap-5">
      <Card className="border-primary/20 bg-primary/5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Иргэний үнэмлэхний шалгалт</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Хэрэглэгчийн илгээсэн мэдээллийг шалгаад зөвшөөрөх эсвэл тодорхой шалтгаантай буцаана.
            </p>
          </div>
          <Badge variant="warning">{requests.filter((request) => request.status === 'pending').length} шалгах</Badge>
        </div>
      </Card>

      {requests.map((item) => (
        <Card key={item.id} className="p-5 sm:p-6">
          <div className="grid gap-5 xl:grid-cols-[1fr_280px] xl:items-start">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="info">{item.id}</Badge>
                <Badge variant="default">{getAdminRoleLabel(item.role)}</Badge>
                <AdminStatusBadge status={item.status} />
              </div>
              <h2 className="mt-3 text-xl font-semibold text-foreground">{item.fullName}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{item.phone} · {formatAdminDate(item.submittedAt)}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <InfoLine label="Овог" value={item.familyName} />
                <InfoLine label="Регистр" value={item.registerNumber} />
                <InfoLine label="Үнэмлэхний файл" value={item.documentName} />
                <InfoLine label="Нүүрний зураг" value={item.selfieName || 'Илгээгээгүй'} />
              </div>
              {item.rejectionReason && (
                <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                  Буцаасан шалтгаан: {item.rejectionReason}
                </div>
              )}
            </div>
            <div className="grid gap-3">
              <textarea
                className="min-h-24 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                placeholder="Буцаах шалтгаан бичих"
                value={reasonById[item.id] || ''}
                onChange={(event) => setReasonById((current) => ({ ...current, [item.id]: event.target.value }))}
              />
              <Button disabled={item.status === 'approved'} onClick={() => handleDecision(item.id, 'approved')}>
                <ShieldCheck className="h-4 w-4" />
                Зөвшөөрөх
              </Button>
              <Button variant="outline" disabled={item.status === 'rejected'} onClick={() => handleDecision(item.id, 'rejected')}>
                <X className="h-4 w-4" />
                Шалтгаантай буцаах
              </Button>
            </div>
          </div>
        </Card>
      ))}

      <Card className="p-5 sm:p-6">
        <h2 className="text-xl font-semibold text-foreground">Жолоочийн бичиг баримтын queue</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {adminVerificationQueue.map((item) => (
            <div key={item.id} className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="info">{item.id}</Badge>
                <Badge variant="default">{item.role}</Badge>
              </div>
              <h3 className="mt-3 font-semibold text-foreground">{item.user}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.phone} · {item.submitted}</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.evidence}</p>
              <p className="mt-2 text-sm font-medium text-warning">{item.next}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AdminActionLogsList() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const logs = getActionLogs();

  const filteredLogs = logs.filter((log) => {
    const matchesQuery = `${log.actor} ${log.user} ${log.actionType} ${log.details}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === 'all' || log.status === status;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="grid gap-5">
      <Card className="p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
          <div className="relative">
            <Input
              label="Хайлт"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Хэрэглэгч, үйлдэл, тайлбар..."
            />
            <Search className="absolute bottom-3 right-4 h-5 w-5 text-muted-foreground" />
          </div>
          <Select
            label="Төлөв"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            options={[
              { value: 'all', label: 'Бүх төлөв' },
              { value: 'Амжилттай', label: 'Амжилттай' },
              { value: 'Амжилтгүй', label: 'Амжилтгүй' },
              { value: 'Хүлээгдэж байна', label: 'Хүлээгдэж байна' },
              { value: 'Татгалзсан', label: 'Татгалзсан' },
            ]}
          />
        </div>
      </Card>

      {filteredLogs.length ? (
        filteredLogs.map((log) => <ActionLogCard key={log.id} log={log} />)
      ) : (
        <Card className="p-8 text-center">
          <ListChecks className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-3 text-xl font-semibold text-foreground">Илэрц олдсонгүй</h2>
          <p className="mt-2 text-muted-foreground">Шүүлтүүрээ өөрчлөөд дахин хайна уу.</p>
        </Card>
      )}
    </div>
  );
}

function ActionLogCard({ log }: { log: ActionLogEntry }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="info">{log.id}</Badge>
            <AdminLogStatusBadge status={log.status} />
          </div>
          <h2 className="mt-3 text-xl font-semibold text-foreground">{log.actionType}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{log.details}</p>
          <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
            <InfoLine label="Хэрэглэгч" value={log.user} />
            <InfoLine label="Үйлдэл хийсэн" value={log.actor} />
            <InfoLine label="Огноо" value={formatAdminDate(log.createdAt)} />
          </div>
        </div>
        <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm font-medium text-foreground">
          <Filter className="mr-2 inline h-4 w-4 text-primary" />
          Үйлдлийн мөр
        </div>
      </div>
    </Card>
  );
}

function AdminStatusBadge({ status }: { status: IdentityVerificationRequest['status'] }) {
  if (status === 'approved') return <Badge variant="success">Баталгаажсан</Badge>;
  if (status === 'rejected') return <Badge variant="danger">Татгалзсан</Badge>;
  if (status === 'pending') return <Badge variant="warning">Шалгаж байна</Badge>;
  return <Badge variant="default">Илгээгээгүй</Badge>;
}

function AdminLogStatusBadge({ status }: { status: ActionLogEntry['status'] }) {
  if (status === 'Амжилттай') return <Badge variant="success">{status}</Badge>;
  if (status === 'Амжилтгүй') return <Badge variant="danger">{status}</Badge>;
  if (status === 'Татгалзсан') return <Badge variant="danger">{status}</Badge>;
  return <Badge variant="warning">{status}</Badge>;
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function getAdminRoleLabel(role: IdentityVerificationRequest['role']) {
  if (role === 'driver') return 'Жолооч';
  if (role === 'cargo_sender') return 'Дайвар ачаа';
  if (role === 'admin') return 'Админ';
  return 'Аялагч';
}

function formatAdminDate(value: string) {
  return new Intl.DateTimeFormat('mn-MN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
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
              <p className="mt-1 text-sm text-muted-foreground">{item.proof} · Хүргэлтийн код: {item.code}</p>
            </div>
            <div className="grid gap-2">
              <Button>
                <PackageCheck className="h-4 w-4" />
                Баримт шалгах
              </Button>
              <Button variant="outline">Маргаан нээх</Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function AdminRoutesList() {
  const routes = [
    { id: 'RT-001', route: 'Улаанбаатар → Дархан', driver: 'Бат-Эрдэнэ', seats: 3, cargo: 'Дайвар ачаа авна', status: 'Идэвхтэй' },
    { id: 'RT-002', route: 'Улаанбаатар → Эрдэнэт', driver: 'Ганбат', seats: 2, cargo: 'Дайвар ачаа авна', status: 'Шалгах шаардлагатай' },
    { id: 'RT-003', route: 'Дархан → Улаанбаатар', driver: 'Мөнх-Оргил', seats: 1, cargo: 'Зөвхөн зорчигч', status: 'Идэвхтэй' },
  ];

  return (
    <div className="grid gap-5">
      {routes.map((route) => (
        <Card key={route.id} className="p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_220px] lg:items-center">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="info">{route.id}</Badge>
                <Badge variant={route.status === 'Идэвхтэй' ? 'success' : 'warning'}>{route.status}</Badge>
              </div>
              <h2 className="mt-3 text-xl font-semibold text-foreground">{route.route}</h2>
              <p className="mt-2 text-muted-foreground">Жолооч: {route.driver} · {route.seats} сул суудал · {route.cargo}</p>
            </div>
            <div className="grid gap-2">
              <Button onClick={() => window.location.href = '/routes/1'}>Чиглэл харах</Button>
              <Button variant="outline">Чиглэл хаах</Button>
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
        <h2 className="text-xl font-semibold text-foreground">Захиалгын төлөвийн жагсаалт</h2>
      </CardHeader>
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <AdminTh>Захиалга</AdminTh>
                <AdminTh>Чиглэл</AdminTh>
                <AdminTh>Төлөв</AdminTh>
                <AdminTh>Дараагийн алхам</AdminTh>
                <AdminTh>Үйлдэл</AdminTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4 font-semibold text-foreground">{booking.id}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{booking.route.from} → {booking.route.to}</td>
                  <td className="px-6 py-4"><Badge variant={booking.status === 'confirmed' ? 'success' : 'warning'}>{booking.status === 'confirmed' ? 'Баталгаажсан' : booking.status === 'waiting_payment' ? 'Төлбөр хүлээгдэж байна' : 'Хянагдаж байна'}</Badge></td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {booking.status === 'waiting_payment' ? 'Аялагч төлбөрийн баримт илгээх ёстой' : 'Аяллын сануулга эсвэл дуусгах үйлдэл'}
                  </td>
                  <td className="px-6 py-4">
                    <Button size="sm" onClick={() => window.location.href = `/dashboard/bookings/${booking.id}`}>
                      Нотолгоо харах
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
        Самбар руу буцах
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
