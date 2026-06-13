import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowLeft, Banknote, Box, Bus, Calendar, Car, CheckCircle2, Clock3, Eye, FileCheck2, Filter, ListChecks, MapPin, PackageCheck, Plus, Route, Search, ShieldCheck, Star, UsersRound, X } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { AppFooter } from '../components/Footer';
import { Input } from '../components/Input';
import { LocationSelectGroup } from '../components/LocationSelectGroup';
import { SeatPicker } from '../components/SeatPicker';
import { Select } from '../components/Select';
import { Sidebar } from '../components/Sidebar';
import { getDefaultSeatIds } from '../data/seats';
import { locationMatchesText } from '../data/locations';
import { isSupabaseConfigured } from '../lib/supabase';
import { getBookingBadgeVariant, getCargoStatusLabel, getRequestStatusLabel } from '../utils/bookingStatus';
import { fetchMyDriverEarnings, type DriverEarnings } from '../services/payoutService';
import { getDashboardMenu } from '../navigation/dashboardMenus';
import { refreshLocalProfileFromSupabase } from '../services/supabaseAuth';
import {
  canCurrentDriverCreateTrip,
  createDriverTrip,
  updateDriverTrip,
  fetchTripById,
  fetchActiveTrips,
  fetchCargoEnabledTrips,
  fetchCurrentDriverCargoRequests,
  fetchCurrentSenderCargoRequests,
  fetchCurrentDriverPassengerRequests,
  fetchCurrentDriverTrips,
  fetchCurrentTravelerBookings,
  startPassengerTrip,
  completePassengerTrip,
  completeCargoDelivery,
  updateCargoRequestStatus,
  updatePassengerBookingStatus,
  deleteDriverTrip,
  submitReview,
  fetchReceivedReviews,
  fetchPendingReviews,
  type ReceivedReview,
  type PendingReview,
  type DriverCargoRequest,
  type DriverPassengerRequest,
  type SenderCargoRequest,
  type MarketplaceTrip,
  type TravelerBookingSummary,
} from '../services/tripService';
import {
  getStoredUser,
  type MockUserProfile,
} from '../utils/auth';

type WorkRole = 'traveler' | 'driver';
type SenderView = 'cargo' | 'proof' | 'status';

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

function getLocalDateInputValue(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
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
  const [editId] = useState<string | null>(() =>
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : null,
  );
  const isEditing = Boolean(editId);
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

  useEffect(() => {
    if (!editId || role !== 'driver') return;
    let active = true;
    fetchTripById(editId)
      .then((trip) => {
        if (!active || !trip) return;
        const [fromA, ...fromRest] = trip.fromLocation.split(' - ');
        const [toA, ...toRest] = trip.toLocation.split(' - ');
        const pad = (n: number) => String(n).padStart(2, '0');
        const dep = new Date(trip.departureAt);
        setFromAimag(fromA || '');
        setFromSoum(fromRest.join(' - '));
        setToAimag(toA || '');
        setToSoum(toRest.join(' - '));
        if (!Number.isNaN(dep.getTime())) {
          setDepartureDate(`${dep.getFullYear()}-${pad(dep.getMonth() + 1)}-${pad(dep.getDate())}`);
          setDepartureTime(`${pad(dep.getHours())}:${pad(dep.getMinutes())}`);
        }
        setSeatsTotal(String(trip.seatsTotal));
        setAvailableSeatLabels(trip.availableSeatLabels ?? []);
        setPricePerSeat(String(trip.pricePerSeat));
        setPickupNote(trip.pickupNote ?? '');
        setDropoffNote(trip.dropoffNote ?? '');
        setAllowsCargo(trip.allowsCargo ? 'yes' : 'no');
        setCargoCapacityKg(trip.cargoCapacityKg != null ? String(trip.cargoCapacityKg) : '');
        setAllowedCargoTypes((trip.allowedCargoTypes ?? []).join(', '));
        setCargoPriceNote(trip.cargoPriceNote ?? '');
      })
      .catch(() => {
        if (active) setError('Засах чиглэлийн мэдээлэл уншихад алдаа гарлаа.');
      });
    return () => {
      active = false;
    };
  }, [editId, role]);

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

    const departure = new Date(`${departureDate}T${departureTime}`);
    if (Number.isNaN(departure.getTime()) || departure.getTime() <= Date.now()) {
      setError('Өнгөрсөн огноо, цаг сонгох боломжгүй. Ирээдүйн огноо, цаг сонгоно уу.');
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

    const payload = {
      fromLocation: formatLocation(fromAimag, fromSoum),
      toLocation: formatLocation(toAimag, toSoum),
      departureAt: departure.toISOString(),
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
    };

    setSubmitting(true);
    try {
      const result = editId
        ? await updateDriverTrip(editId, payload)
        : await createDriverTrip(payload);
      setSubmittedTripId(result.id);
    } catch (err) {
      const message = readableError(err, 'Чиглэл хадгалахад алдаа гарлаа.');
      setError(
        message.includes('future_departure_required')
          ? 'Өнгөрсөн огноо, цаг сонгох боломжгүй. Ирээдүйн огноо, цаг сонгоно уу.'
          : message.includes('trip_has_bookings')
            ? 'Захиалга авсан чиглэлийг засах боломжгүй. Шинэ чиглэл үүсгэнэ үү.'
            : message.includes('not_trip_owner')
              ? 'Зөвхөн өөрийн чиглэлээ засах боломжтой.'
              : message,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardFrame role={role} active="routes">
      <PageTop badge={copy.badge} title={isEditing ? 'Чиглэл засах' : copy.title} description={copy.createText} backHref={copy.base} />
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="p-4 sm:p-6">
          {driverBlocked && !permissionLoading && (
            <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 p-3.5 sm:mb-5 sm:p-4">
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
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <LocationSelectGroup
              label="Суух байршил"
              aimag={fromAimag}
              soum={fromSoum}
              onAimagChange={setFromAimag}
              onSoumChange={setFromSoum}
              className="col-span-2 md:col-span-1"
            />
            <LocationSelectGroup
              label="Буух байршил"
              aimag={toAimag}
              soum={toSoum}
              onAimagChange={setToAimag}
              onSoumChange={setToSoum}
              className="col-span-2 md:col-span-1"
            />
            <Input label="Огноо" type="date" min={getLocalDateInputValue()} value={departureDate} onChange={(event) => setDepartureDate(event.target.value)} />
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
          <textarea className="mt-2 min-h-24 w-full rounded-lg border border-input bg-input-background px-3.5 py-3 text-base outline-none focus:ring-2 focus:ring-ring sm:min-h-32 sm:px-4" placeholder="Нэмэлт тайлбар..." value={formNote} onChange={(event) => setFormNote(event.target.value)} />
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
        <Card className="border-primary/20 bg-primary/5 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground sm:text-xl">Нийтлэхээс өмнө</h2>
          <div className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
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
  const [driverRequests, setDriverRequests] = useState<DriverPassengerRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(role === 'driver' && isSupabaseConfigured);
  const [requestError, setRequestError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [codeInputs, setCodeInputs] = useState<Record<string, string>>({});
  const [tripBusyId, setTripBusyId] = useState('');

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

  const startTrip = async (bookingId: string) => {
    setActionMessage('');
    setRequestError('');
    setTripBusyId(bookingId);
    try {
      await startPassengerTrip(bookingId);
      setDriverRequests((current) => current.map((item) => (item.id === bookingId ? { ...item, status: 'on_trip' } : item)));
      setActionMessage('Аялал эхэллээ. Дуусгахдаа аялагчийн 6 оронтой кодыг оруулна.');
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Аялал эхлүүлэхэд алдаа гарлаа.');
    } finally {
      setTripBusyId('');
    }
  };

  const completeTrip = async (bookingId: string) => {
    const code = codeInputs[bookingId]?.trim() || '';
    if (code.length !== 6) {
      setRequestError('Аялагчийн 6 оронтой баталгаажуулах кодыг оруулна уу.');
      return;
    }
    setActionMessage('');
    setRequestError('');
    setTripBusyId(bookingId);
    try {
      await completePassengerTrip(bookingId, code);
      setDriverRequests((current) => current.map((item) => (item.id === bookingId ? { ...item, status: 'completed' } : item)));
      setActionMessage('Аялал амжилттай дууслаа.');
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Аялал дуусгахад алдаа гарлаа.');
    } finally {
      setTripBusyId('');
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
                    {request.status === 'pending_request' && (
                      <>
                        <Button size="sm" onClick={() => changeBookingStatus(request.id, 'accepted')}>
                          Зөвшөөрөх
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => changeBookingStatus(request.id, 'rejected')}>
                          Татгалзах
                        </Button>
                      </>
                    )}
                    {request.status === 'confirmed' && (
                      <Button size="sm" disabled={tripBusyId === request.id} onClick={() => startTrip(request.id)}>
                        Аялал эхлүүлэх
                      </Button>
                    )}
                    {request.status === 'on_trip' && (
                      <>
                        <Input
                          label="Аялагчийн 6 оронтой код"
                          value={codeInputs[request.id] || ''}
                          onChange={(event) => setCodeInputs((prev) => ({ ...prev, [request.id]: event.target.value.replace(/\D/g, '').slice(0, 6) }))}
                          inputMode="numeric"
                          placeholder="123456"
                        />
                        <Button size="sm" disabled={tripBusyId === request.id} onClick={() => completeTrip(request.id)}>
                          Аялал дуусгах
                        </Button>
                      </>
                    )}
                    {['accepted', 'waiting_payment', 'payment_review'].includes(request.status) && (
                      <p className="text-center text-xs text-muted-foreground">Төлбөр баталгаажихыг хүлээж байна</p>
                    )}
                    {request.status === 'completed' && (
                      <p className="text-center text-xs font-medium text-success">Аялал дууссан</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : !loadingRequests ? (
        <Card className="p-10 text-center">
          {role === 'driver' ? <UsersRound className="mx-auto mb-4 h-12 w-12 text-muted-foreground" /> : <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />}
          <h2 className="text-xl font-semibold text-foreground">
            {role === 'driver' ? 'Одоогоор ирсэн хүсэлт алга' : 'Идэвхтэй хүсэлт алга'}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {role === 'driver'
              ? 'Аялагч таны нийтэлсэн чиглэл дээр суудлын хүсэлт илгээхэд энд бодитоор гарч ирнэ.'
              : 'Жолооч хайж суудлын хүсэлт илгээсний дараа төлөв энд харагдана.'}
          </p>
          <Button className="mt-5" onClick={() => window.location.href = role === 'driver' ? '/dashboard/driver/routes/new' : '/traveler/find-drivers'}>
            {role === 'driver' ? 'Чиглэл нэмэх' : 'Жолооч хайх'}
          </Button>
        </Card>
      ) : null}
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

      <Card className="mb-4 p-3 sm:mb-6 sm:p-5">
        <div className="mb-4 flex items-center gap-2 sm:mb-5">
          <Search className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground sm:text-xl">Хайлт ба шүүлтүүр</h2>
        </div>
        <div className="grid max-w-5xl gap-3 md:grid-cols-2">
          <LocationSelectGroup
            label="Суух байршил"
            aimag={fromAimag}
            soum={fromSoum}
            onAimagChange={setFromAimag}
            onSoumChange={setFromSoum}
          />
          <LocationSelectGroup
            label="Буух байршил"
            aimag={toAimag}
            soum={toSoum}
            onAimagChange={setToAimag}
            onSoumChange={setToSoum}
          />
        </div>
        <div className="mt-3 grid max-w-xl grid-cols-[minmax(0,1fr)_110px] gap-2.5 sm:mt-4 sm:grid-cols-[minmax(240px,420px)_140px] sm:gap-3">
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
        <div className="mt-4 flex flex-col gap-3 sm:mt-5 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex min-h-10 items-center gap-2 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={cargoOnly}
              onChange={(event) => setCargoOnly(event.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            Дайвар ачаа авч болох чиглэл
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button className="!min-h-9 w-full !px-3 !py-1.5 !text-xs sm:!min-h-8 sm:w-auto sm:!py-1" size="sm" variant="outline" onClick={() => { setFromAimag(''); setFromSoum(''); setToAimag(''); setToSoum(''); setDate(''); setPassengers('1'); setCargoOnly(false); }}>
              Цэвэрлэх
            </Button>
            <Button className="!min-h-9 w-full !px-3 !py-1.5 !text-xs sm:!min-h-8 sm:w-auto sm:!py-1" size="sm" onClick={() => document.getElementById('driver-search-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
              Жолоочийн саналууд
              <UsersRound className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <div id="driver-search-results" className="mb-4 scroll-mt-24 flex items-center justify-between gap-3 sm:mb-5">
        <p className="text-sm text-muted-foreground sm:text-base">{filteredOffers.length} боломжит жолооч олдлоо</p>
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
        <Card className="mt-5 p-6 text-center sm:mt-6 sm:p-10">
          <Search className="mx-auto mb-3 h-9 w-9 text-muted-foreground sm:mb-4 sm:h-12 sm:w-12" />
          <h2 className="text-lg font-semibold text-foreground sm:text-xl">Тохирох унаа олдсонгүй</h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">Шүүлтүүрээ сулруулаад дахин хайгаарай.</p>
        </Card>
      )}
    </DashboardFrame>
  );
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

      <Card className="mb-4 p-3 sm:mb-6 sm:p-5">
        <div className="mb-4 flex items-center gap-2 sm:mb-5">
          <Search className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground sm:text-xl">Чиглэл шүүх</h2>
        </div>
        <div className="grid max-w-5xl gap-3 md:grid-cols-2">
          <LocationSelectGroup
            label="Суух байршил"
            aimag={fromAimag}
            soum={fromSoum}
            onAimagChange={setFromAimag}
            onSoumChange={setFromSoum}
          />
          <LocationSelectGroup
            label="Буух байршил"
            aimag={toAimag}
            soum={toSoum}
            onAimagChange={setToAimag}
            onSoumChange={setToSoum}
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          className="mt-3 !min-h-9 w-full !px-3 !py-1.5 !text-xs sm:w-auto"
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

      <div className="mb-4 grid gap-4 sm:mb-6 md:grid-cols-1">
        <Card className="p-4 sm:p-5">
          <Badge variant="warning">Дайвар ачаа авч болно</Badge>
          <p className="mt-2 text-2xl font-bold text-foreground sm:mt-3 sm:text-3xl">{cargoRoutes.length}</p>
          <p className="text-sm text-muted-foreground">чиглэл боломжтой</p>
        </Card>
      </div>

      <div className="grid gap-5">
        {cargoRoutes.map((offer) => (
          <DriverOfferCard key={offer.id} offer={offer} mode="cargo" />
        ))}
      </div>

      {cargoRoutes.length === 0 && (
        <Card className="mt-5 p-6 text-center sm:mt-6 sm:p-10">
          <Search className="mx-auto mb-3 h-9 w-9 text-muted-foreground sm:mb-4 sm:h-12 sm:w-12" />
          <h2 className="text-lg font-semibold text-foreground sm:text-xl">Дайвар ачаа авах чиглэл олдсонгүй</h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">Аймаг, сумын шүүлтүүрээ өөрчлөөд дахин шалгаарай.</p>
        </Card>
      )}
    </DashboardFrame>
  );
}

const TRIP_STATUS_LABELS: Record<string, string> = {
  active: 'Идэвхтэй',
  full: 'Дүүрсэн',
  cancelled: 'Цуцлагдсан',
  completed: 'Дууссан',
};

function tripStatusLabel(status: string) {
  return TRIP_STATUS_LABELS[status] ?? status;
}

export function MyRoutesPage({ role }: { role: WorkRole }) {
  const copy = roleCopy[role];
  const [driverTrips, setDriverTrips] = useState<MarketplaceTrip[]>([]);
  const [travelerBookings, setTravelerBookings] = useState<TravelerBookingSummary[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(isSupabaseConfigured);
  const [routesError, setRoutesError] = useState('');

  const handleDeleteTrip = async (tripId: string) => {
    if (!window.confirm('Энэ чиглэлийг устгах уу? Энэ үйлдлийг буцаах боломжгүй.')) return;
    try {
      const { action } = await deleteDriverTrip(tripId);
      if (action === 'cancelled') {
        setDriverTrips((prev) => prev.map((trip) => (trip.id === tripId ? { ...trip, status: 'cancelled' } : trip)));
      } else {
        setDriverTrips((prev) => prev.filter((trip) => trip.id !== tripId));
      }
    } catch (err) {
      setRoutesError(err instanceof Error ? err.message : 'Чиглэл устгахад алдаа гарлаа.');
    }
  };

  useEffect(() => {
    let active = true;
    if (!isSupabaseConfigured) {
      setLoadingRoutes(false);
      return;
    }

    setLoadingRoutes(true);
    const request = role === 'driver'
      ? fetchCurrentDriverTrips()
      : fetchCurrentTravelerBookings();

    request
      .then((items) => {
        if (!active) return;
        if (role === 'driver') {
          setDriverTrips(items as MarketplaceTrip[]);
        } else {
          setTravelerBookings(items as TravelerBookingSummary[]);
        }
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
      <PageTop
        badge={copy.badge}
        title={copy.routes}
        description={role === 'driver'
          ? 'Өөрийн нийтэлсэн чиглэлүүд болон суудлын хүсэлтүүдээ нэг дор хянана.'
          : 'Захиалсан аяллын чиглэл, жолооч, суудал, төлбөр болон явцын төлөвөө хянана.'}
        backHref={copy.base}
      />
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
            <h2 className="text-xl font-semibold text-foreground">
              {role === 'driver' ? 'Чиглэлийн жагсаалт' : 'Аяллын захиалгууд'}
            </h2>
            <Button className="w-full sm:w-auto" size="sm" onClick={() => window.location.href = role === 'driver' ? '/dashboard/driver/routes/new' : '/traveler/find-drivers'}>
              {role === 'driver' ? <Plus className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              {role === 'driver' ? 'Чиглэл нэмэх' : 'Жолооч хайх'}
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
                  <Badge variant={trip.status === 'active' ? 'success' : trip.status === 'cancelled' ? 'danger' : 'default'}>{tripStatusLabel(trip.status)}</Badge>
                  <p className="text-sm text-muted-foreground">{trip.allowsCargo ? 'Дайвар ачаа авна' : 'Зөвхөн зорчигч'}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.location.href = `/dashboard/driver/routes/new?id=${trip.id}`}>Засах</Button>
                    <Button variant="ghost" size="sm" onClick={() => window.location.href = `/routes/${trip.id}`}>Дэлгэрэнгүй</Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteTrip(trip.id)}>Устгах</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : role === 'traveler' && travelerBookings.length > 0 ? (
            <div className="space-y-4">
              {travelerBookings.map((booking) => (
                <div key={booking.id} className="grid gap-4 rounded-lg border border-border p-4 lg:grid-cols-[minmax(0,1fr)_180px_170px] lg:items-center">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{booking.route}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(booking.departureAt).toLocaleString('mn-MN')} · {booking.driverName}
                      {booking.carModel ? ` · ${booking.carModel}` : ''}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {booking.selectedSeats.length > 0
                        ? `Суудал: ${booking.selectedSeats.join(', ')}`
                        : `${booking.seatsRequested} суудал`}
                      {' · '}₮{booking.totalAmount.toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={getBookingBadgeVariant(booking.status)}>
                    {getRequestStatusLabel(booking.status)}
                  </Badge>
                  <Button
                    variant={booking.status === 'waiting_payment' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      window.location.href = booking.status === 'waiting_payment'
                        ? `/dashboard/bookings/${booking.id}/payment-proof`
                        : `/dashboard/bookings/${booking.id}`;
                    }}
                  >
                    {booking.status === 'waiting_payment' ? 'Баримт оруулах' : 'Дэлгэрэнгүй'}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center">
            {role === 'driver'
              ? <Route className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              : <Bus className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />}
            <h3 className="text-lg font-semibold text-foreground">
              {role === 'driver' ? 'Чиглэл хараахан алга' : 'Аяллын захиалга хараахан алга'}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {role === 'driver'
                ? 'Шинэ чиглэл нийтэлсний дараа энд харагдана.'
                : 'Жолооч хайж, суудлын хүсэлт илгээсний дараа таны аялал энд харагдана.'}
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
  const [cargoCodeInputs, setCargoCodeInputs] = useState<Record<string, string>>({});
  const [cargoBusyId, setCargoBusyId] = useState('');

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

  const changeCargoStatus = async (
    requestId: string,
    nextStatus: 'cargo_accepted' | 'rejected' | 'in_transit',
  ) => {
    setCargoActionMessage('');
    setCargoRequestError('');
    setCargoBusyId(requestId);
    try {
      await updateCargoRequestStatus(requestId, nextStatus);
      setCargoRequests((current) => current.map((item) => (
        item.id === requestId ? { ...item, status: nextStatus } : item
      )));
      const messages: Record<string, string> = {
        cargo_accepted: 'Дайвар ачааны хүсэлт зөвшөөрөгдлөө. Илгээгч төлбөрийн баримтын шат руу орно.',
        rejected: 'Дайвар ачааны хүсэлт татгалзагдлаа.',
        in_transit: 'Ачаа тээвэрлэгдэж эхэллээ.',
      };
      setCargoActionMessage(messages[nextStatus] || 'Ачааны төлөв шинэчлэгдлээ.');
    } catch (error) {
      setCargoRequestError(error instanceof Error ? error.message : 'Ачааны төлөв шинэчлэхэд алдаа гарлаа.');
    } finally {
      setCargoBusyId('');
    }
  };

  const completeDelivery = async (requestId: string) => {
    const code = cargoCodeInputs[requestId]?.trim() || '';
    if (code.length !== 6) {
      setCargoRequestError('Хүлээн авагчийн 6 оронтой хүргэлтийн кодыг оруулна уу.');
      return;
    }
    setCargoActionMessage('');
    setCargoRequestError('');
    setCargoBusyId(requestId);
    try {
      await completeCargoDelivery(requestId, code);
      setCargoRequests((current) => current.map((item) => (
        item.id === requestId ? { ...item, status: 'delivered' } : item
      )));
      setCargoActionMessage('Ачаа амжилттай хүргэгдлээ.');
    } catch (error) {
      setCargoRequestError(error instanceof Error ? error.message : 'Хүргэлт баталгаажуулахад алдаа гарлаа.');
    } finally {
      setCargoBusyId('');
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
                <p className="text-sm text-muted-foreground">Төлөв</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{getCargoStatusLabel(request.status)}</p>
                <div className="mt-5 grid gap-2">
                  {request.status === 'cargo_requested' && (
                    <>
                      <Button fullWidth disabled={cargoBusyId === request.id} onClick={() => changeCargoStatus(request.id, 'cargo_accepted')}>
                        Зөвшөөрөх
                      </Button>
                      <Button variant="outline" fullWidth disabled={cargoBusyId === request.id} onClick={() => changeCargoStatus(request.id, 'rejected')}>
                        Татгалзах
                      </Button>
                    </>
                  )}
                  {request.status === 'picked_up' && (
                    <Button fullWidth disabled={cargoBusyId === request.id} onClick={() => changeCargoStatus(request.id, 'in_transit')}>
                      Тээвэрлэж эхлэх
                    </Button>
                  )}
                  {request.status === 'in_transit' && (
                    <>
                      <Input
                        label="Хүлээн авагчийн код"
                        value={cargoCodeInputs[request.id] || ''}
                        onChange={(event) => setCargoCodeInputs((prev) => ({ ...prev, [request.id]: event.target.value.replace(/\D/g, '').slice(0, 6) }))}
                        inputMode="numeric"
                        placeholder="123456"
                      />
                      <Button fullWidth disabled={cargoBusyId === request.id} onClick={() => completeDelivery(request.id)}>
                        Хүргэлт баталгаажуулах
                      </Button>
                    </>
                  )}
                  {['cargo_accepted', 'waiting_payment', 'payment_review'].includes(request.status) && (
                    <p className="text-center text-xs text-muted-foreground">Төлбөр баталгаажихыг хүлээж байна</p>
                  )}
                  {['delivered', 'completed'].includes(request.status) && (
                    <p className="text-center text-xs font-medium text-success">Хүргэгдсэн</p>
                  )}
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
    <Card className={`p-4 sm:p-6 ${featured ? 'border-primary/30 bg-primary/5' : ''}`}>
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
  const [earnings, setEarnings] = useState<DriverEarnings | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    fetchMyDriverEarnings()
      .then(setEarnings)
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardFrame role={role} active="earnings">
      <PageTop badge={copy.badge} title={copy.earnings} description="Дууссан аяллын орлого, платформын 10% шимтгэл, шилжүүлсэн дүнгийн тойм." backHref={copy.base} />

      {loading ? (
        <Card className="p-6 text-sm text-muted-foreground">Орлогыг уншиж байна...</Card>
      ) : !earnings || earnings.completedCount === 0 ? (
        <Card className="p-8 text-center">
          <Banknote className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Одоогоор орлого алга</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Аялал төлбөртэй баталгаажиж дуусмагц орлого энд бодитоор бүртгэгдэнэ.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-4">
            <Card className="p-6">
              <Badge variant="success">Цэвэр орлого</Badge>
              <p className="mt-4 text-3xl font-bold text-foreground">₮{earnings.netEarned.toLocaleString()}</p>
              <p className="mt-1 text-sm text-muted-foreground">{earnings.completedCount} дууссан аялал</p>
            </Card>
            <Card className="p-6">
              <Badge variant="warning">Шилжүүлэхээр хүлээгдэж буй</Badge>
              <p className="mt-4 text-3xl font-bold text-primary">₮{earnings.pending.toLocaleString()}</p>
            </Card>
            <Card className="p-6">
              <Badge variant="info">Шилжүүлсэн</Badge>
              <p className="mt-4 text-3xl font-bold text-foreground">₮{earnings.paidOut.toLocaleString()}</p>
            </Card>
            <Card className="p-6">
              <Badge variant="default">Платформ шимтгэл (10%)</Badge>
              <p className="mt-4 text-3xl font-bold text-muted-foreground">₮{earnings.commission.toLocaleString()}</p>
            </Card>
          </div>

          <Card className="mt-6 p-6">
            <h2 className="text-xl font-semibold text-foreground">Дууссан аяллын орлого</h2>
            <div className="mt-5 space-y-3">
              {earnings.trips.map((t) => (
                <div key={t.id} className="flex flex-col gap-2 rounded-lg bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-foreground">{t.route}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(t.date).toLocaleDateString('mn-MN')} · Төлбөр ₮{t.amount.toLocaleString()}
                    </p>
                  </div>
                  <p className="font-semibold text-primary">+₮{t.net.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </DashboardFrame>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} од`}>
          <Star className={`h-7 w-7 ${n <= value ? 'fill-warning text-warning' : 'text-muted-foreground'}`} />
        </button>
      ))}
    </div>
  );
}

function PendingReviewCard({ item, onDone }: { item: PendingReview; onDone: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await submitReview(item.bookingId, rating, comment);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Үнэлгээ өгөхөд алдаа гарлаа.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-5">
      <p className="font-semibold text-foreground">{item.route}</p>
      <p className="mt-1 text-sm text-muted-foreground">{item.otherName}-г үнэлэх · {new Date(item.completedAt).toLocaleDateString('mn-MN')}</p>
      <div className="mt-3"><StarRating value={rating} onChange={setRating} /></div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="Сэтгэгдэл (сонголтоор)"
        className="mt-3 w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
      />
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <Button className="mt-3" size="sm" disabled={busy} onClick={submit}>Үнэлгээ илгээх</Button>
    </Card>
  );
}

export function ReviewsPage({ role }: { role: WorkRole | 'sender' }) {
  const title = role === 'sender' ? 'Аялагчийн үнэлгээ' : roleCopy[role].reviews;
  const base = role === 'sender' ? '/dashboard/sender' : roleCopy[role].base;
  const [received, setReceived] = useState<ReceivedReview[]>([]);
  const [pending, setPending] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const load = () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([fetchReceivedReviews(), fetchPendingReviews()])
      .then(([r, p]) => {
        setReceived(r);
        setPending(p);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const avg = received.length
    ? (received.reduce((s, r) => s + r.rating, 0) / received.length).toFixed(1)
    : '—';

  return (
    <DashboardFrame role={role === 'sender' ? undefined : role} sender={role === 'sender'} active="reviews">
      <PageTop badge={role === 'sender' ? 'Дайвар ачааны самбар' : roleCopy[role].badge} title={title} description="Дууссан аяллын дараа оролцогчид бие биенээ үнэлнэ." backHref={base} />

      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Үнэлгээ өгөх ({pending.length})</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {pending.map((item) => (
              <PendingReviewCard key={item.bookingId} item={item} onDone={load} />
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <Card className="p-6 text-sm text-muted-foreground">Үнэлгээг уншиж байна...</Card>
      ) : received.length === 0 ? (
        <Card className="p-8 text-center">
          <Star className="mx-auto mb-4 h-12 w-12 text-warning" />
          <h2 className="text-xl font-semibold text-foreground">Одоогоор үнэлгээ алга</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Аялал дууссаны дараа хэрэглэгчид бие биедээ үнэлгээ өгвөл энд харагдана.
          </p>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <Card className="p-6 text-center">
            <Star className="mx-auto h-10 w-10 fill-warning text-warning" />
            <p className="mt-4 text-5xl font-bold text-foreground">{avg}</p>
            <p className="mt-2 text-muted-foreground">{received.length} үнэлгээнээс</p>
          </Card>
          <div className="space-y-4">
            {received.map((r) => (
              <Card key={r.id} className="p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-semibold text-foreground">{r.reviewerName}</p>
                  <Badge variant="success">{r.rating.toFixed(1)}</Badge>
                </div>
                {r.comment && <p className="mt-3 text-muted-foreground">{r.comment}</p>}
                <p className="mt-2 text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString('mn-MN')}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
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

  const [items, setItems] = useState<SenderCargoRequest[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    let active = true;
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    fetchCurrentSenderCargoRequests()
      .then((rows) => {
        if (active) setItems(rows);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <DashboardFrame sender active={view}>
      <PageTop badge="Дайвар ачааны нэмэлт боломж" title={title} description={description} backHref="/dashboard/cargo" />

      {loading ? (
        <Card className="p-6 text-sm text-muted-foreground">Ачааны хүсэлтүүдийг уншиж байна...</Card>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center">
          <PackageCheck className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Одоогоор бодит ачааны хүсэлт алга</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Ачаа авах боломжтой чиглэл сонгож хүсэлт үүсгэсний дараа энэ хэсэг дүүрнэ.
          </p>
          <Button className="mt-5" onClick={() => window.location.href = '/cargo/find-routes'}>
            Ачаа авах чиглэл хайх
          </Button>
        </Card>
      ) : (
        <div className="grid gap-5">
          {items.map((item) => {
            const showCode = isStatus && ['picked_up', 'in_transit'].includes(item.status);
            return (
              <Card key={item.id} className="p-6">
                <div className="grid gap-4 md:grid-cols-[1fr_200px] md:items-center">
                  <div>
                    <Badge variant={getCargoBadgeVariant(item.status)}>{getCargoStatusLabel(item.status)}</Badge>
                    <h2 className="mt-3 text-xl font-semibold text-foreground">{item.cargoName} · {item.route}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Хүлээн авагч: {item.receiverName} · {item.receiverPhone}
                      {item.weightKg ? ` · ${item.weightKg} кг` : ''}
                    </p>
                    {isStatus && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {showCode
                          ? 'Доорх 6 оронтой кодыг хүлээн авагчид өгнө үү. Жолооч хүргэх үед энэ кодыг оруулж баталгаажуулна.'
                          : 'Ачаа авагдаж замдаа гармагц хүргэлтийн код идэвхжинэ.'}
                      </p>
                    )}
                  </div>
                  {isStatus ? (
                    <div className="rounded-xl border border-border bg-card p-4 text-center">
                      <p className="text-sm text-muted-foreground">Хүргэлтийн код</p>
                      <p className="mt-1 text-3xl font-bold tracking-widest text-primary">
                        {showCode ? item.deliveryCode : '••••••'}
                      </p>
                    </div>
                  ) : (
                    <Button variant="outline" onClick={() => window.location.href = `/cargo/${item.id}`}>
                      Дэлгэрэнгүй
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardFrame>
  );
}

function getCargoBadgeVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'default' {
  if (['delivered', 'completed'].includes(status)) return 'success';
  if (['rejected', 'cancelled', 'disputed'].includes(status)) return 'danger';
  if (['waiting_payment', 'payment_review'].includes(status)) return 'warning';
  if (['picked_up', 'in_transit', 'cargo_accepted'].includes(status)) return 'info';
  return 'default';
}

function PageTop({ badge, title, description, backHref }: { badge: string; title: string; description: string; backHref: string }) {
  return (
    <div className="mb-5 md:mb-8">
      <button className="mb-3 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground sm:mb-5" onClick={() => window.location.href = backHref}>
        <ArrowLeft className="h-4 w-4" />
        Самбар руу буцах
      </button>
      <Badge variant="info">{badge}</Badge>
      <h1 className="mt-3 text-2xl font-bold leading-tight text-foreground sm:mt-4 sm:text-4xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:mt-3 sm:text-base sm:leading-7">{description}</p>
    </div>
  );
}

function DashboardFrame({ children, role, sender, admin }: { children: ReactNode; role?: WorkRole; sender?: boolean; admin?: boolean; active?: string }) {
  const menuItems = admin ? getDashboardMenu('admin') : sender ? getDashboardMenu('sender') : getDashboardMenu(role ?? 'traveler');
  const accountRole = admin ? 'admin' : sender ? 'sender' : role;
  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar menuItems={menuItems} accountRole={accountRole} />
      <main className="min-w-0 flex-1 overflow-x-hidden p-3.5 sm:p-5 md:p-8">
        {children}
        <AppFooter />
      </main>
    </div>
  );
}
