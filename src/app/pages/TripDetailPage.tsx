import { useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Calendar, Car, CheckCircle2, CreditCard, MapPin, Package, ShieldCheck, Star, UsersRound, X } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Footer } from '../components/Footer';
import { Input } from '../components/Input';
import { Navbar } from '../components/Navbar';

const route = {
  id: 1,
  from: 'Улаанбаатар',
  to: 'Дархан',
  date: '2026-05-27',
  time: '09:00',
  seats: 3,
  price: 35000,
  vehicle: 'Toyota Prius 30',
  pickup: 'Баянзүрх / Сансар орчим',
  dropoff: 'Дархан төв зам дагуу',
  allowsCargo: true,
  cargoNote: '5 кг хүртэл жижиг хайрцаг, бичиг баримт, хувцас',
  driver: {
    name: 'Бат Болд',
    rating: 4.8,
    trips: 42,
    phone: '+976 88•• ••••',
  },
};

export function TripDetailPage() {
  const [modal, setModal] = useState<'booking' | 'cargo' | null>(null);
  const [success, setSuccess] = useState('');

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
            <CheckCircle2 className="mr-2 inline h-5 w-5" />
            {success}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="bg-primary/5 p-6 md:p-8">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="success">Баталгаажсан жолооч</Badge>
                  <Badge variant="default">{route.vehicle}</Badge>
                  {route.allowsCargo && <Badge variant="warning">Дайвар ачаа авна</Badge>}
                </div>
                <h1 className="mt-5 flex flex-wrap items-center gap-3 text-3xl font-bold text-foreground">
                  <span>{route.from}</span>
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  <span>{route.to}</span>
                </h1>
                <p className="mt-4 max-w-3xl text-muted-foreground">
                  Сул суудалтай жолоочийн mock route. Аялагч суудал захиалах, cargo sender route дээр жижиг дайвар ачааны хүсэлт илгээх боломжтой.
                </p>
              </div>
              <CardBody className="p-6 md:p-8">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Info icon={<Calendar className="h-5 w-5" />} label="Огноо / цаг" value={`${route.date}, ${route.time}`} />
                  <Info icon={<UsersRound className="h-5 w-5" />} label="Сул суудал" value={`${route.seats} суудал`} />
                  <Info icon={<CreditCard className="h-5 w-5" />} label="Үнэ" value={`₮${route.price.toLocaleString()} / хүн`} />
                  <Info icon={<Package className="h-5 w-5" />} label="Cargo" value={route.allowsCargo ? route.cargoNote : 'Авахгүй'} />
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <Info icon={<MapPin className="h-5 w-5" />} label="Pickup" value={route.pickup} />
                  <Info icon={<MapPin className="h-5 w-5" />} label="Dropoff" value={route.dropoff} />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-foreground">Reviews preview</h2>
              </CardHeader>
              <CardBody>
                <div className="grid gap-4 md:grid-cols-2">
                  {['Цагтаа хөдөлсөн, мэдээлэл тодорхой байсан.', 'Машин цэвэрхэн, pickup тохирол ойлгомжтой.'].map((text) => (
                    <div key={text} className="rounded-lg border border-border p-4">
                      <div className="mb-2 flex text-warning">
                        {Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-4 w-4 fill-warning" />)}
                      </div>
                      <p className="text-sm text-muted-foreground">{text}</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>

          <aside className="space-y-5">
            <Card className="p-5">
              <h2 className="text-xl font-semibold text-foreground">Driver public profile</h2>
              <div className="mt-5 flex gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Car className="h-7 w-7" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{route.driver.name}</p>
                  <p className="text-sm text-muted-foreground">{route.vehicle}</p>
                  <p className="mt-1 text-sm text-muted-foreground">⭐ {route.driver.rating} · {route.driver.trips} аялал</p>
                </div>
              </div>
              <div className="mt-5 space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" /> Утас баталгаажсан</p>
                <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" /> Жолооч баталгаажсан</p>
              </div>
            </Card>

            <Card className="p-5">
              <p className="text-sm text-muted-foreground">Нийт төлбөр</p>
              <p className="mt-1 text-3xl font-bold text-primary">₮{route.price.toLocaleString()}</p>
              <p className="mt-1 text-xs text-muted-foreground">+ service fee дараагийн proof шатанд харагдана</p>
              <div className="mt-5 grid gap-3">
                <Button size="lg" fullWidth onClick={() => setModal('booking')}>
                  Суудал захиалах
                </Button>
                {route.allowsCargo && (
                  <Button size="lg" variant="outline" fullWidth onClick={() => setModal('cargo')}>
                    Дайвар ачаа илгээх
                  </Button>
                )}
              </div>
            </Card>
          </aside>
        </div>
      </main>

      {modal && (
        <RequestModal
          type={modal}
          onClose={() => setModal(null)}
          onSubmit={() => {
            setSuccess(modal === 'booking' ? 'Booking request mock амжилттай илгээгдлээ.' : 'Cargo request mock амжилттай илгээгдлээ.');
            setModal(null);
          }}
        />
      )}

      <Footer />
    </div>
  );
}

function RequestModal({ type, onClose, onSubmit }: { type: 'booking' | 'cargo'; onClose: () => void; onSubmit: () => void }) {
  const isCargo = type === 'cargo';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-4">
      <Card className="w-full max-w-lg p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">{isCargo ? 'Cargo request' : 'Booking request'}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-muted">
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
              <Input label="Суудлын тоо" placeholder="1" />
              <Input label="Pickup note" placeholder="Сансар орчим авах боломжтой" />
              <Input label="Утас" placeholder="+976 9999 9999" />
            </>
          )}
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>Болих</Button>
          <Button onClick={onSubmit}>Mock submit</Button>
        </div>
      </Card>
    </div>
  );
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-primary">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="font-semibold text-foreground">{value}</p>
    </div>
  );
}
