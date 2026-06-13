import { useEffect, useState } from 'react';
import { Bus, CheckCircle2, CreditCard, Route, Search, Wallet } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { AppFooter } from '../components/Footer';
import { Sidebar } from '../components/Sidebar';
import { StatCard } from '../components/StatCard';
import { getDashboardMenu } from '../navigation/dashboardMenus';
import { isSupabaseConfigured } from '../lib/supabase';
import { fetchCurrentTravelerBookings, type TravelerBookingSummary } from '../services/tripService';
import { getBookingBadgeVariant, getRequestStatusLabel } from '../utils/bookingStatus';
import { getStoredUser } from '../utils/auth';

const CLOSED = new Set(['completed', 'cancelled', 'rejected']);
const PAID = new Set(['confirmed', 'on_trip', 'completed']);

export function TravelerDashboard() {
  const user = getStoredUser();
  const [bookings, setBookings] = useState<TravelerBookingSummary[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchCurrentTravelerBookings()
      .then((items) => {
        if (active) setBookings(items);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Аяллын захиалгуудыг уншихад алдаа гарлаа.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const recentBookings = bookings.slice(0, 4);
  const awaitingPayment = bookings.filter((booking) => booking.status === 'waiting_payment');
  const activeCount = bookings.filter((booking) => !CLOSED.has(booking.status)).length;
  const completedCount = bookings.filter((booking) => booking.status === 'completed').length;
  const spent = bookings
    .filter((booking) => PAID.has(booking.status))
    .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar menuItems={getDashboardMenu('traveler')} />

      <main className="min-w-0 flex-1 overflow-x-hidden p-3.5 sm:p-5 md:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between md:mb-8">
          <div>
            <Badge variant="info" className="mb-3">Аялагчийн самбар</Badge>
            <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
              {user?.full_name ? `Сайн уу, ${user.full_name}` : 'Аялагчийн самбар'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Таны захиалга, төлбөр, аяллын төлвийн бодит тойм.</p>
          </div>
          <Button className="w-full sm:w-auto" onClick={() => window.location.href = '/traveler/find-drivers'}>
            <Search className="h-4 w-4" />
            Жолооч хайх
          </Button>
        </div>

        {awaitingPayment.length > 0 && (
          <Card className="mb-5 border-warning/30 bg-warning/5 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-warning" />
                <p className="text-sm font-medium text-foreground">
                  {awaitingPayment.length} захиалга төлбөрийн баримт оруулахыг хүлээж байна.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.location.href = `/dashboard/bookings/${awaitingPayment[0].id}/payment-proof`}>
                Баримт оруулах
              </Button>
            </div>
          </Card>
        )}

        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard icon={<Route className="h-5 w-5" />} label="Нийт захиалга" value={bookings.length} />
          <StatCard icon={<Bus className="h-5 w-5" />} label="Идэвхтэй" value={activeCount} accent="warning" />
          <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Дууссан аялал" value={completedCount} accent="success" />
          <StatCard icon={<Wallet className="h-5 w-5" />} label="Зарцуулсан" value={`₮${spent.toLocaleString()}`} accent="success" />
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Миний аялал</h2>
            {bookings.length > 0 && (
              <button type="button" onClick={() => window.location.href = '/dashboard/traveler/trips'} className="text-sm font-medium text-primary hover:underline">Бүгд</button>
            )}
          </div>

          {loading ? (
            <Card className="p-5 text-sm text-muted-foreground">Аяллын захиалгуудыг уншиж байна...</Card>
          ) : error ? (
            <Card className="border-destructive/20 bg-destructive/5 p-5 text-sm font-medium text-destructive">{error}</Card>
          ) : recentBookings.length === 0 ? (
            <Card className="p-6 text-center sm:p-8">
              <Bus className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">Аяллын захиалга хараахан алга</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Жолооч хайж, суудлын хүсэлт илгээсний дараа таны аялал энд харагдана.
              </p>
              <Button className="mt-5" onClick={() => window.location.href = '/traveler/find-drivers'}>Жолооч хайх</Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <Card key={booking.id} className="p-4 sm:p-5">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_170px_160px] lg:items-center">
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
                    <Badge variant={getBookingBadgeVariant(booking.status)}>{getRequestStatusLabel(booking.status)}</Badge>
                    <Button
                      variant={booking.status === 'waiting_payment' ? 'primary' : 'outline'}
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
                </Card>
              ))}
            </div>
          )}
        </section>

        <AppFooter />
      </main>
    </div>
  );
}
