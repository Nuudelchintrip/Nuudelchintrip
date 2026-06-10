import { useEffect, useState } from 'react';
import { ArrowRight, Bus, CreditCard, Search, ShieldCheck } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { AppFooter } from '../components/Footer';
import { Sidebar } from '../components/Sidebar';
import { getDashboardMenu } from '../navigation/dashboardMenus';
import { isSupabaseConfigured } from '../lib/supabase';
import { fetchCurrentTravelerBookings, type TravelerBookingSummary } from '../services/tripService';
import { getBookingBadgeVariant, getRequestStatusLabel } from '../utils/bookingStatus';
import { getStoredUser } from '../utils/auth';

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

  const recentBookings = bookings.slice(0, 3);
  const awaitingPayment = bookings.filter((booking) => booking.status === 'waiting_payment');

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar menuItems={getDashboardMenu('traveler')} />

      <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <Badge variant="info" className="mb-3">Аялагчийн самбар</Badge>
          <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">
            {user?.full_name ? `${user.full_name}, жолооч хайж эхлээрэй` : 'Жолооч хайж эхлээрэй'}
          </h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Энэ самбар дээр зөвхөн таны бодитоор үүсгэсэн захиалга, төлбөрийн баримт, аяллын төлөв харагдана.
          </p>
        </div>

        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardBody className="p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Search className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-foreground">Таны эхний үйлдэл: жолооч хайх</h2>
                <p className="mt-2 text-muted-foreground">
                  Хаанаас, хаашаа, хэдэн хүн явах мэдээллээ оруулаад зөвхөн бодитоор нийтлэгдсэн чиглэлүүдээс сонгоно.
                </p>
              </div>
              <Button className="w-full sm:w-auto" onClick={() => window.location.href = '/traveler/find-drivers'}>
                Жолооч хайх
              </Button>
            </div>
          </CardBody>
        </Card>

        {awaitingPayment.length > 0 && (
          <Card className="mb-8 border-warning/30 bg-warning/5">
            <CardBody className="p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-warning" />
                    <h2 className="text-xl font-semibold text-foreground">Төлбөрийн баримт хүлээгдэж байна</h2>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {awaitingPayment.length} захиалга төлбөрийн баримт оруулахыг хүлээж байна.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = `/dashboard/bookings/${awaitingPayment[0].id}/payment-proof`}
                >
                  Баримт оруулах
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Миний аялал</h2>
            {bookings.length > 0 && (
              <button
                type="button"
                onClick={() => window.location.href = '/dashboard/traveler/trips'}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Бүгдийг харах
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {loading ? (
            <Card className="p-6 text-sm text-muted-foreground">Аяллын захиалгуудыг уншиж байна...</Card>
          ) : error ? (
            <Card className="border-destructive/20 bg-destructive/5 p-6 text-sm font-medium text-destructive">{error}</Card>
          ) : recentBookings.length === 0 ? (
            <Card className="p-8 text-center">
              <Bus className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">Аяллын захиалга хараахан алга</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Жолооч хайж, суудлын хүсэлт илгээсний дараа таны аялал энд харагдана.
              </p>
              <Button className="mt-5" onClick={() => window.location.href = '/traveler/find-drivers'}>
                Жолооч хайх
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
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
                </Card>
              ))}
            </div>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <EmptyPanel
            icon={<ShieldCheck className="h-6 w-6" />}
            title="Итгэлцэл"
            text="Утас баталгаажуулалт, profile мэдээлэл, аяллын status нь booking flow дээр ашиглагдана."
            action="Профайл шалгах"
            href="/dashboard/traveler/profile"
          />
          <EmptyPanel
            icon={<Search className="h-6 w-6" />}
            title="Шинэ жолооч хайх"
            text="Хаанаас хаашаа явахаа оруулаад бодитоор нийтлэгдсэн чиглэлүүдээс сонгоно."
            action="Жолооч хайх"
            href="/traveler/find-drivers"
          />
        </div>

        <AppFooter />
      </main>
    </div>
  );
}

function EmptyPanel({ icon, title, text, action, href }: { icon: JSX.Element; title: string; text: string; action?: string; href?: string }) {
  return (
    <Card className="p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h2 className="mt-5 text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-2 min-h-16 text-sm leading-6 text-muted-foreground">{text}</p>
      {action && href && (
        <Button className="mt-5" variant="outline" fullWidth onClick={() => window.location.href = href}>
          {action}
        </Button>
      )}
    </Card>
  );
}
