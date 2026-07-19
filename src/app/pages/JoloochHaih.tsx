import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, MapPin, Megaphone, Phone, Trash2, UsersRound } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Footer } from '../components/Footer';
import { Input } from '../components/Input';
import { Navbar } from '../components/Navbar';

type RouteRequestAd = {
  id: string;
  from: string;
  to: string;
  date: string;
  seats: string;
  phone: string;
  note: string;
  createdAt: string;
};

const ROUTE_REQUESTS_KEY = 'nuudelchin_route_requests';

function loadRouteRequests(): RouteRequestAd[] {
  try {
    const raw = localStorage.getItem(ROUTE_REQUESTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRouteRequests(items: RouteRequestAd[]) {
  try {
    localStorage.setItem(ROUTE_REQUESTS_KEY, JSON.stringify(items));
  } catch {
    // localStorage хаагдсан үед зар түр санах ойд л үлдэнэ.
  }
}

export default function JoloochHaih() {
  const [requests, setRequests] = useState<RouteRequestAd[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [seats, setSeats] = useState('1');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    document.title = 'Жолооч хайх | NuudelchinTrip';
    const meta = document.querySelector("meta[name='description']");
    meta?.setAttribute(
      'content',
      'Орон нутаг, хот хооронд явах жолооч хайж, сул суудалтай чиглэл болон маршрутыг NuudelchinTrip дээрээс олоорой.',
    );
    setRequests(loadRouteRequests());
  }, []);

  const submitRouteRequest = () => {
    setFormSuccess('');
    if (!from.trim() || !to.trim()) {
      setFormError('Хаанаас, хаашаа явахаа оруулна уу.');
      return;
    }
    if (!date) {
      setFormError('Явах огноогоо сонгоно уу.');
      return;
    }
    const seatCount = Number(seats);
    if (!Number.isInteger(seatCount) || seatCount < 1 || seatCount > 12) {
      setFormError('Суудлын тоо 1-12 хооронд байх ёстой.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Холбоо барих утсаа оруулна уу.');
      return;
    }

    const nextAd: RouteRequestAd = {
      id: `${Date.now()}`,
      from: from.trim(),
      to: to.trim(),
      date,
      seats: String(seatCount),
      phone: phone.trim(),
      note: note.trim(),
      createdAt: new Date().toISOString(),
    };
    const next = [nextAd, ...requests];
    setRequests(next);
    saveRouteRequests(next);
    setFormError('');
    setFormSuccess('Таны чиглэл хүсэх зар нийтлэгдлээ. Энэ чиглэлээр явах жолооч тантай холбогдоно.');
    setFrom('');
    setTo('');
    setDate('');
    setSeats('1');
    setPhone('');
    setNote('');
  };

  const removeRouteRequest = (id: string) => {
    const next = requests.filter((item) => item.id !== id);
    setRequests(next);
    saveRouteRequests(next);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="bg-primary/5 py-12 sm:py-16">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <Badge variant="info">Жолооч хайх</Badge>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-foreground sm:text-5xl">
              Чиглэл таарах жолооч хайх
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
              Орон нутаг руу явахдаа сул суудалтай жолоочийн маршрутыг хайж,
              суудал, үнэ, явах өдөр болон буух цэгийн мэдээллийг харьцуулна.
              Таарсан чиглэл олдохгүй бол доороос чиглэл хүсэх зараа нийтлээрэй.
            </p>
            <div className="mt-7 flex justify-center">
              <Button onClick={() => window.location.href = '/routes'}>
                Жолооч хайх
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <Megaphone className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Чиглэл хүсэх зар</h2>
            </div>
            <p className="mt-2 max-w-3xl leading-7 text-muted-foreground">
              Таны явах чиглэлээр жолооч олдоогүй юу? Чиглэл хүсэх зараа нийтэлбэл
              тухайн чиглэлээр явах жолооч таны зарыг хараад холбогдоно.
            </p>

            <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_380px]">
              <div className="space-y-4">
                {requests.length === 0 && (
                  <Card className="p-6">
                    <p className="font-medium text-foreground">Одоогоор идэвхтэй зар алга байна.</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Хамгийн түрүүнд зараа нийтэлж, жолооч нартаа чиглэлээ мэдэгдээрэй.
                    </p>
                  </Card>
                )}
                {requests.map((item) => (
                  <Card key={item.id} className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="info">Чиглэл хүсэлт</Badge>
                          <Badge variant="success">Идэвхтэй</Badge>
                        </div>
                        <h3 className="mt-3 flex flex-wrap items-center gap-2 text-lg font-semibold text-foreground">
                          <span>{item.from}</span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span>{item.to}</span>
                        </h3>
                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{item.date}</span>
                          <span className="flex items-center gap-1.5"><UsersRound className="h-4 w-4" />{item.seats} суудал</span>
                          <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" />{item.phone}</span>
                        </div>
                        {item.note && <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.note}</p>}
                      </div>
                      <button
                        type="button"
                        aria-label="Зар устгах"
                        onClick={() => removeRouteRequest(item.id)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Зар нийтлэх</h3>
                  </div>
                </CardHeader>
                <CardBody>
                  {formError && (
                    <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-sm font-medium text-destructive">
                      {formError}
                    </div>
                  )}
                  {formSuccess && (
                    <div className="mb-4 rounded-lg border border-success/30 bg-success/5 px-3.5 py-2.5 text-sm font-medium text-success">
                      {formSuccess}
                    </div>
                  )}
                  <div className="grid gap-3.5">
                    <Input label="Хаанаас" placeholder="Улаанбаатар" value={from} onChange={(event) => { setFrom(event.target.value); setFormError(''); }} />
                    <Input label="Хаашаа" placeholder="Ховд - Ховд" value={to} onChange={(event) => { setTo(event.target.value); setFormError(''); }} />
                    <div className="grid grid-cols-2 gap-3.5">
                      <Input label="Явах огноо" type="date" value={date} onChange={(event) => { setDate(event.target.value); setFormError(''); }} />
                      <Input label="Суудал" type="number" min="1" max="12" value={seats} onChange={(event) => { setSeats(event.target.value); setFormError(''); }} />
                    </div>
                    <Input label="Холбоо барих утас" placeholder="+976 99999999" value={phone} onChange={(event) => { setPhone(event.target.value); setFormError(''); }} />
                    <Input label="Нэмэлт тайлбар" placeholder="Ачаа багатай, өглөө эрт гарахыг хүсэж байна" value={note} onChange={(event) => setNote(event.target.value)} />
                    <Button fullWidth onClick={submitRouteRequest}>
                      <Megaphone className="h-4 w-4" />
                      Зар нийтлэх
                    </Button>
                    <p className="text-xs leading-5 text-muted-foreground">
                      Зар нийтлэгдсэний дараа ижил чиглэлээр маршрут нээсэн жолооч танд мэдэгдэл илгээх боломжтой.
                    </p>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </section>

        <section className="bg-muted/40 py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground">Жолооч хайхдаа шалгах мэдээлэл</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {[
                ['Маршрут', 'Жолоочийн явах чиглэл таны суух, буух газартай ойр эсэхийг шалгана.'],
                ['Суудал', 'Сул суудлын тоо болон нэг хүний үнэ тодорхой харагдана.'],
                ['Төлөв', 'Хүсэлт илгээх, зөвшөөрөх, төлбөр шалгах, аялал эхлэх төлөвүүд дарааллаар явна.'],
              ].map(([title, text]) => (
                <Card key={title} className="p-6">
                  <h2 className="text-xl font-semibold text-foreground">{title}</h2>
                  <p className="mt-3 leading-7 text-muted-foreground">{text}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground">Түгээмэл асуулт</h2>
            <div className="mt-6 space-y-4">
              {[
                ['Жолооч шууд баталгаажих уу?', 'Зорчигч хүсэлт илгээсний дараа жолооч зөвшөөрөх эсвэл татгалзах боломжтой.'],
                ['Жолоочийн мэдээлэл харагдах уу?', 'Маршрут, үнэ, суудал болон жолоочийн бүртгэлийн мэдээлэл платформын боломжит хэсэгт харагдана.'],
                ['Би өөрийн чиглэлд жолооч олдохгүй бол яах вэ?', 'Чиглэл хүсэх зараа нийтлээрэй — тухайн чиглэлээр явах жолооч таны зарыг хараад холбогдоно.'],
              ].map(([question, answer]) => (
                <Card key={question} className="p-5">
                  <h2 className="font-semibold text-foreground">{question}</h2>
                  <p className="mt-2 leading-7 text-muted-foreground">{answer}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
