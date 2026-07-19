import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, Car, CreditCard, Megaphone, Search, ShieldCheck, Star, UsersRound } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Footer } from '../components/Footer';
import { Input } from '../components/Input';
import { LocationSelectGroup } from '../components/LocationSelectGroup';
import { Navbar } from '../components/Navbar';
import { fetchPublicTrips, type PublicTrip } from '../services/tripService';
import { getStoredUser } from '../utils/auth';

function formatLocation(aimag: string, soum: string) {
  if (!aimag) return '';
  return soum ? `${aimag} - ${soum}` : aimag;
}

function formatDeparture(departureAt: string) {
  const date = new Date(departureAt);
  if (Number.isNaN(date.getTime())) return departureAt;
  return `${date.toISOString().slice(0, 10)} · ${date.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
}

export function TripsPage() {
  const [fromAimag, setFromAimag] = useState('');
  const [fromSoum, setFromSoum] = useState('');
  const [toAimag, setToAimag] = useState('');
  const [toSoum, setToSoum] = useState('');
  const [date, setDate] = useState('');
  const [trips, setTrips] = useState<PublicTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);
  const isLoggedIn = Boolean(getStoredUser());

  const runSearch = (filters?: { from?: string; to?: string; date?: string }) => {
    setLoading(true);
    fetchPublicTrips(filters)
      .then(setTrips)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    document.title = 'Чиглэл хайх | NuudelchinTrip';
    runSearch();
  }, []);

  const handleSearch = () => {
    setSearched(true);
    runSearch({
      from: formatLocation(fromAimag, fromSoum) || undefined,
      to: formatLocation(toAimag, toSoum) || undefined,
      date: date || undefined,
    });
  };

  const handleClear = () => {
    setFromAimag('');
    setFromSoum('');
    setToAimag('');
    setToSoum('');
    setDate('');
    setSearched(false);
    runSearch();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-5xl px-3.5 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-5 sm:mb-8">
          <Badge variant="info">Чиглэл хайх</Badge>
          <h1 className="mt-4 text-3xl font-bold leading-tight text-foreground sm:text-4xl">
            Идэвхтэй чиглэлүүд
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            Баталгаажсан жолоочдын нийтэлсэн чиглэл, сул суудал, үнийг эндээс хараарай.
            Суудал захиалахад нэвтрэх шаардлагатай.
          </p>
        </div>

        <Card className="p-4 sm:p-5">
          <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
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
          <div className="mt-3 flex flex-col gap-3 sm:mt-4 sm:flex-row sm:items-end">
            <div className="sm:w-56">
              <Input label="Явах огноо" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4" />
                Хайх
              </Button>
              {(searched || fromAimag || toAimag || date) && (
                <Button variant="outline" onClick={handleClear}>Цэвэрлэх</Button>
              )}
            </div>
          </div>
        </Card>

        <div className="mt-5 sm:mt-6">
          {loading && (
            <Card className="p-6 text-sm text-muted-foreground">Чиглэлүүдийг уншиж байна...</Card>
          )}

          {!loading && trips.length === 0 && (
            <Card className="p-6 text-center sm:p-8">
              <h2 className="text-xl font-semibold text-foreground">
                {searched ? 'Энэ хайлтад таарах чиглэл олдсонгүй' : 'Одоогоор идэвхтэй чиглэл алга байна'}
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
                Чиглэл хүсэх зараа нийтэлбэл таны чиглэлээр явах жолооч гарч ирмэгц
                зарыг чинь хараад холбогдоно.
              </p>
              <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                <Button onClick={() => window.location.href = '/jolooch-haih'}>
                  <Megaphone className="h-4 w-4" />
                  Чиглэл хүсэх зар нийтлэх
                </Button>
                {!isLoggedIn && (
                  <Button variant="outline" onClick={() => window.location.href = '/auth/register?role=traveler'}>
                    Аялагчаар бүртгүүлэх
                  </Button>
                )}
              </div>
            </Card>
          )}

          {!loading && trips.length > 0 && (
            <div className="space-y-3 sm:space-y-4">
              <p className="text-sm text-muted-foreground">{trips.length} чиглэл олдлоо</p>
              {trips.map((trip) => (
                <Card key={trip.id} className="p-4 transition hover:border-primary/40 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold text-foreground">
                          <span>{trip.fromLocation}</span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span>{trip.toLocation}</span>
                        </h2>
                        {trip.genderPreference === 'female' && <Badge variant="info">Зөвхөн эмэгтэй</Badge>}
                        {trip.genderPreference === 'male' && <Badge variant="info">Зөвхөн эрэгтэй</Badge>}
                        {trip.allowsCargo && <Badge variant="warning">Дайвар ачаа авна</Badge>}
                      </div>

                      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{formatDeparture(trip.departureAt)}</span>
                        <span className="flex items-center gap-1.5"><UsersRound className="h-4 w-4" />{trip.seatsAvailable} сул суудал</span>
                        <span className="flex items-center gap-1.5 font-medium text-primary"><CreditCard className="h-4 w-4" />₮{trip.pricePerSeat.toLocaleString()} / хүн</span>
                      </div>

                      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-success" />
                          {trip.driverFullName}
                        </span>
                        {trip.driverCarModel && (
                          <span className="flex items-center gap-1.5"><Car className="h-4 w-4" />{trip.driverCarModel}</span>
                        )}
                        {(trip.driverRating > 0 || trip.driverCompletedTrips > 0) && (
                          <span className="flex items-center gap-1.5">
                            <Star className="h-4 w-4 text-warning" />
                            {trip.driverRating}/5 · {trip.driverCompletedTrips} аялал
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      className="shrink-0"
                      onClick={() => window.location.href = `/routes/${trip.id}`}
                    >
                      Дэлгэрэнгүй
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {!isLoggedIn && trips.length > 0 && (
          <Card className="mt-5 border-primary/20 bg-primary/5 p-4 sm:mt-6 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-foreground">
                Суудал захиалах, жолоочтой холбогдохын тулд бүртгүүлээд утасны дугаараа баталгаажуулна.
              </p>
              <Button className="shrink-0" onClick={() => window.location.href = '/auth/register?role=traveler'}>
                Аялагчаар бүртгүүлэх
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
