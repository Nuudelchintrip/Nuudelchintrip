import { useEffect, useState } from 'react';
import { Banknote, Car, Inbox, Megaphone, Phone, Plus, Route, ShieldCheck, Wallet, XCircle } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { AppFooter } from '../components/Footer';
import { Sidebar } from '../components/Sidebar';
import { StatCard } from '../components/StatCard';
import { getDashboardMenu } from '../navigation/dashboardMenus';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  fetchCurrentDriverTrips,
  fetchCurrentDriverPassengerRequests,
  fetchActiveRouteRequests,
  type MarketplaceTrip,
  type DriverPassengerRequest,
  type RouteRequest,
} from '../services/tripService';
import { fetchMyDriverEarnings, type DriverEarnings } from '../services/payoutService';
import { fetchMyDriverVerification, type MyDriverVerification } from '../services/supabaseAuth';
import { getStoredUser } from '../utils/auth';
import { getBookingBadgeVariant, getRequestStatusLabel } from '../utils/bookingStatus';

const TRIP_STATUS_LABELS: Record<string, string> = {
  active: 'Идэвхтэй',
  full: 'Дүүрсэн',
  cancelled: 'Цуцлагдсан',
  completed: 'Дууссан',
};

export function DriverDashboard() {
  const user = getStoredUser();
  const [verification, setVerification] = useState<MyDriverVerification | null>(null);
  const [trips, setTrips] = useState<MarketplaceTrip[]>([]);
  const [requests, setRequests] = useState<DriverPassengerRequest[]>([]);
  const [earnings, setEarnings] = useState<DriverEarnings | null>(null);
  const [routeAds, setRouteAds] = useState<RouteRequest[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    void fetchMyDriverVerification().then(setVerification);
  }, []);

  useEffect(() => {
    let active = true;
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      fetchCurrentDriverTrips().catch(() => []),
      fetchCurrentDriverPassengerRequests().catch(() => []),
      fetchMyDriverEarnings().catch(() => null),
      fetchActiveRouteRequests().catch(() => []),
    ])
      .then(([tripItems, requestItems, earningItems, routeAdItems]) => {
        if (!active) return;
        setTrips(tripItems as MarketplaceTrip[]);
        setRequests(requestItems as DriverPassengerRequest[]);
        setEarnings(earningItems as DriverEarnings | null);
        setRouteAds(routeAdItems as RouteRequest[]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const status = verification?.status ?? user?.verification_status;
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';

  const activeRoutes = trips.filter((trip) => trip.status === 'active').length;
  const pendingRequests = requests.filter((request) => request.status === 'pending_request');
  const recentTrips = trips.slice(0, 3);
  const recentRequests = pendingRequests.slice(0, 3);

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar menuItems={getDashboardMenu('driver')} />

      <main className="min-w-0 flex-1 overflow-x-hidden p-3.5 sm:p-5 md:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between md:mb-8">
          <div>
            <Badge variant="success" className="mb-3">Жолоочийн самбар</Badge>
            <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
              {user?.full_name ? `Сайн уу, ${user.full_name}` : 'Жолоочийн самбар'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Таны чиглэл, ирсэн хүсэлт, орлогын бодит тойм.</p>
          </div>
          <Button className="w-full sm:w-auto" onClick={() => window.location.href = '/driver/add-route'} disabled={!isApproved}>
            <Plus className="h-4 w-4" />
            Чиглэл нэмэх
          </Button>
        </div>

        {isRejected && (
          <Card className="mb-5 border-destructive/30 bg-destructive/5">
            <CardBody className="p-4 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-destructive" />
                    <h2 className="text-lg font-semibold text-foreground">Баталгаажуулалт буцаагдсан</h2>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {verification?.rejectionReason
                      ? `Шалтгаан: ${verification.rejectionReason}`
                      : 'Админ таны бичиг баримтыг буцаалаа. Засаад дахин илгээнэ үү.'}
                  </p>
                </div>
                <Button variant="outline" onClick={() => window.location.href = '/onboarding/driver'}>Дахин илгээх</Button>
              </div>
            </CardBody>
          </Card>
        )}

        {!isApproved && !isRejected && (
          <Card className="mb-5 border-warning/30 bg-warning/5">
            <CardBody className="p-4 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-foreground">Баталгаажуулалт хүлээгдэж байна</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Админ таны бичиг баримтыг шалгаж байна. Зөвшөөрсний дараа чиглэл нийтлэх эрх нээгдэнэ.
                  </p>
                </div>
                <Button variant="outline" onClick={() => window.location.href = '/dashboard/driver/verification'}>Шалгах</Button>
              </div>
            </CardBody>
          </Card>
        )}

        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard icon={<Route className="h-5 w-5" />} label="Нийт чиглэл" value={trips.length} hint={`${activeRoutes} идэвхтэй`} />
          <StatCard icon={<Car className="h-5 w-5" />} label="Дууссан аялал" value={earnings?.completedCount ?? 0} accent="success" />
          <StatCard icon={<Inbox className="h-5 w-5" />} label="Ирсэн хүсэлт" value={pendingRequests.length} hint="Хүлээгдэж буй" accent="warning" />
          <StatCard icon={<Wallet className="h-5 w-5" />} label="Цэвэр орлого" value={`₮${(earnings?.netEarned ?? 0).toLocaleString()}`} hint={`Шилжүүлээгүй ₮${(earnings?.pending ?? 0).toLocaleString()}`} accent="success" />
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Сүүлийн чиглэлүүд</h2>
              <button type="button" onClick={() => window.location.href = '/dashboard/driver/routes'} className="text-sm font-medium text-primary hover:underline">Бүгд</button>
            </div>
            {loading ? (
              <Card className="p-5 text-sm text-muted-foreground">Уншиж байна...</Card>
            ) : recentTrips.length === 0 ? (
              <Card className="p-5 text-center text-sm text-muted-foreground">
                <Route className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                Одоогоор нийтэлсэн чиглэл алга. “Чиглэл нэмэх” товчоор эхэлнэ үү.
              </Card>
            ) : (
              <div className="space-y-3">
                {recentTrips.map((trip) => (
                  <Card key={trip.id} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{trip.fromLocation} → {trip.toLocation}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {new Date(trip.departureAt).toLocaleString('mn-MN')} · {trip.seatsAvailable}/{trip.seatsTotal} сул · ₮{trip.pricePerSeat.toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={trip.status === 'active' ? 'success' : trip.status === 'cancelled' ? 'danger' : 'default'}>
                        {TRIP_STATUS_LABELS[trip.status] ?? trip.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Ирсэн хүсэлтүүд</h2>
              <button type="button" onClick={() => window.location.href = '/driver/requests'} className="text-sm font-medium text-primary hover:underline">Бүгд</button>
            </div>
            {loading ? (
              <Card className="p-5 text-sm text-muted-foreground">Уншиж байна...</Card>
            ) : recentRequests.length === 0 ? (
              <Card className="p-5 text-center text-sm text-muted-foreground">
                <Inbox className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                Хүлээгдэж буй суудлын хүсэлт алга.
              </Card>
            ) : (
              <div className="space-y-3">
                {recentRequests.map((request) => (
                  <Card key={request.id} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{request.travelerName}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {request.route} · {request.seatsRequested} суудал · ₮{request.totalAmount.toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={getBookingBadgeVariant(request.status)}>{getRequestStatusLabel(request.status)}</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>

        {routeAds.length > 0 && (
          <section className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Аялагчдын чиглэл хүсэлтүүд</h2>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              Эдгээр чиглэлээр аялагчид жолооч хайж байна — таарах чиглэлээр маршрут нийтэлбэл зар эзэнд нь мэдэгдэл очно.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {routeAds.slice(0, 4).map((ad) => (
                <Card key={ad.id} className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="info">Чиглэл хүсэлт</Badge>
                    <span className="text-sm text-muted-foreground">{ad.travelDate}</span>
                  </div>
                  <p className="mt-2 font-semibold text-foreground">{ad.fromLocation} → {ad.toLocation}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{ad.seats} суудал хэрэгтэй</p>
                  {ad.contactPhone && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      {ad.contactPhone}
                    </p>
                  )}
                  {ad.note && <p className="mt-2 text-sm leading-6 text-muted-foreground">{ad.note}</p>}
                </Card>
              ))}
            </div>
          </section>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Button variant="outline" onClick={() => window.location.href = '/dashboard/driver/earnings'}><Banknote className="h-4 w-4" />Орлого</Button>
          <Button variant="outline" onClick={() => window.location.href = '/dashboard/driver/cargo-requests'}><Inbox className="h-4 w-4" />Дайвар ачаа</Button>
          <Button variant="outline" onClick={() => window.location.href = '/dashboard/driver/verification'}><ShieldCheck className="h-4 w-4" />Баталгаажуулалт</Button>
        </div>

        <AppFooter />
      </main>
    </div>
  );
}
