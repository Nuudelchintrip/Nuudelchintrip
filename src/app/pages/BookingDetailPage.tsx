import type { ReactNode } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle,
  Clock,
  CreditCard,
  FileCheck2,
  Flag,
  MapPin,
  MessageSquare,
  Shield,
  Upload,
  User,
} from 'lucide-react';
import { useParams } from 'react-router';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Footer } from '../components/Footer';
import { Input } from '../components/Input';
import { Navbar } from '../components/Navbar';
import { bookingStatusSteps, getBooking, getStatusIndex } from '../data/mockData';

export function BookingDetailPage() {
  const { id } = useParams();
  const booking = getBooking(id);
  const currentIndex = getStatusIndex(booking.status);
  const currentStep = bookingStatusSteps[currentIndex] ?? bookingStatusSteps[0];
  const nextAction = getNextAction(booking.status, booking.id);
  const progress = Math.max(12, Math.round(((currentIndex + 1) / bookingStatusSteps.length) * 100));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          type="button"
          onClick={() => window.location.href = '/dashboard/traveler'}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard руу буцах
        </button>

        <section className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Badge variant={booking.status === 'waiting_payment' ? 'warning' : 'info'} className="mb-3">
                {currentStep.label}
              </Badge>
              <h1 className="text-3xl font-bold text-foreground mb-2">Захиалгын дэлгэрэнгүй</h1>
              <p className="text-muted-foreground">Захиалгын дугаар: {booking.id}</p>
            </div>

            <div className="w-full max-w-md rounded-xl bg-muted/40 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Явц</span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-border">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{currentStep.description}</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-6">
            <Card className="border-primary/20 bg-primary/5">
              <CardBody className="p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                      {nextAction.icon}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">{nextAction.title}</h2>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{nextAction.description}</p>
                    </div>
                  </div>
                  <Button variant="primary" onClick={() => window.location.href = nextAction.href}>
                    {nextAction.button}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-foreground">Booking status timeline</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {bookingStatusSteps.map((step, index) => {
                    const completed = index < currentIndex;
                    const current = index === currentIndex;

                    return (
                      <div key={step.code} className="grid grid-cols-[44px_1fr] gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-11 h-11 rounded-full flex items-center justify-center ${
                              completed
                                ? 'bg-success text-success-foreground'
                                : current
                                  ? 'bg-warning text-warning-foreground'
                                  : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {completed ? <CheckCircle className="w-5 h-5" /> : current ? <Clock className="w-5 h-5" /> : <div className="w-2 h-2 bg-current rounded-full" />}
                          </div>
                          {index < bookingStatusSteps.length - 1 && (
                            <div className={`w-0.5 h-12 ${completed ? 'bg-success' : 'bg-muted'}`} />
                          )}
                        </div>
                        <div className={`rounded-xl border p-4 ${current ? 'border-warning/30 bg-warning/5' : 'border-border bg-card'}`}>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={`font-semibold ${completed || current ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
                            <span className="text-xs font-mono text-muted-foreground">{step.code}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-foreground">Чиглэл ба аяллын мэдээлэл</h2>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="rounded-xl border border-border bg-muted/30 p-5">
                    <div className="mb-4 flex items-center gap-2 text-primary">
                      <MapPin className="w-5 h-5" />
                      <span className="font-semibold">Чиглэл</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{booking.route.from}</p>
                        <p className="text-sm text-muted-foreground">{booking.route.fromDetail}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="font-semibold text-foreground">{booking.route.to}</p>
                        <p className="text-sm text-muted-foreground">{booking.route.toDetail}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">{booking.route.date} · {booking.route.time}</p>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-5">
                    <div className="mb-4 flex items-center gap-2 text-accent">
                      <User className="w-5 h-5" />
                      <span className="font-semibold">Аялагчийн хүсэлт</span>
                    </div>
                    <p className="font-semibold text-foreground">{booking.ride.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{booking.ride.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="default">{booking.ride.seats} суудал</Badge>
                      <Badge variant="info">{booking.ride.luggage}</Badge>
                      <Badge variant="info">{booking.driver.vehicle}</Badge>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-foreground">Evidence checklist</h2>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <EvidenceItem icon={<CreditCard className="w-5 h-5" />} title="Төлбөрийн proof" status={booking.payment.status === 'approved' ? 'Баталгаажсан' : 'Хүлээгдэж байна'} active={booking.payment.status === 'approved'} />
                  <EvidenceItem icon={<Camera className="w-5 h-5" />} title="Аяллын баталгаа" status={currentIndex >= getStatusIndex('on_trip') ? 'Proof орсон' : 'Жолооч оруулах боломжтой'} active={currentIndex >= getStatusIndex('on_trip')} />
                  <EvidenceItem icon={<FileCheck2 className="w-5 h-5" />} title="6 оронтой trip code" status="Хадгалагдсан" active />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Мессеж / тэмдэглэл</h2>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-4 mb-4">
                  {booking.messages.map((message) => (
                    <div key={`${message.author}-${message.time}`} className={`${message.own ? 'bg-primary/10 ml-8' : 'bg-muted/50'} p-4 rounded-lg`}>
                      <p className="text-sm font-medium text-foreground mb-1">{message.author}</p>
                      <p className="text-sm text-muted-foreground">{message.body}</p>
                      <p className="text-xs text-muted-foreground mt-2">{message.time}</p>
                    </div>
                  ))}
                  {booking.messages.length === 0 && (
                    <p className="text-sm text-muted-foreground">Энэ booking дээр мессеж хараахан алга.</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Мессеж бичих..." />
                  <Button variant="primary">Илгээх</Button>
                </div>
              </CardBody>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-foreground">Оролцогчид</h3>
              </CardHeader>
              <CardBody className="space-y-5">
                <PersonCard title="Аялагч" name={booking.passenger.name} phone={booking.passenger.phone} verified={booking.passenger.verified} tone="primary" />
                <PersonCard title="Жолооч" name={booking.driver.name} phone={booking.driver.phone} verified={booking.driver.verified} tone="accent" meta={`Үнэлгээ: ${booking.driver.rating}/5.0`} />
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Pickup / dropoff</p>
                  <p className="mt-1 font-semibold text-foreground">{booking.ride.pickupNote}</p>
                  <p className="text-sm text-muted-foreground">{booking.ride.dropoffNote}</p>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <h3 className="font-semibold text-foreground">Trip code</h3>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-muted-foreground mb-4">
                  Аялал дуусах үед аялагч энэ кодоор баталгаажуулна.
                </p>
                <div className="rounded-xl bg-card border border-border py-5 text-center text-4xl font-bold tracking-widest text-primary">
                  {booking.tripCode}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="font-semibold text-foreground">Төлбөрийн дэлгэрэнгүй</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-3 mb-5">
                  <PriceRow label="Тохиролцсон үнэ" value={booking.price.agreed} />
                  <PriceRow label="Service fee (10%)" value={booking.price.serviceFee} />
                  <div className="border-t border-border pt-3">
                    <PriceRow label="Нийт" value={booking.price.total} strong />
                  </div>
                </div>
                <Button variant="primary" fullWidth onClick={() => window.location.href = `/dashboard/bookings/${booking.id}/payment-proof`}>
                  <Upload className="w-4 h-4" />
                  Төлбөрийн баримт
                </Button>
                <Button variant="outline" fullWidth className="mt-3" onClick={() => window.location.href = `/dashboard/bookings/${booking.id}/delivery-proof`}>
                  <Shield className="w-4 h-4" />
                  Аяллын баталгаа
                </Button>
              </CardBody>
            </Card>

            <Card className="border-destructive/20">
              <CardBody>
                <div className="flex gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">Маргаан гарвал төлбөрийн баримт, trip proof, мессеж admin-д evidence болно.</p>
                </div>
                <Button variant="ghost" fullWidth className="text-destructive hover:bg-destructive/10">
                  <Flag className="w-4 h-4" />
                  Асуудал мэдэгдэх
                </Button>
              </CardBody>
            </Card>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function getNextAction(status: string, bookingId: string) {
  if (status === 'waiting_payment') {
    return {
      icon: <CreditCard className="w-6 h-6" />,
      title: 'Дараагийн алхам: төлбөрийн proof илгээх',
      description: 'Төлбөрөө шилжүүлээд screenshot эсвэл transaction code оруулна. Admin баталгаажуулсны дараа аялал confirmed болно.',
      button: 'Төлбөрийн баримт',
      href: `/dashboard/bookings/${bookingId}/payment-proof`,
    };
  }

  if (status === 'confirmed' || status === 'on_trip') {
    return {
      icon: <Camera className="w-6 h-6" />,
      title: 'Дараагийн алхам: аяллын баталгаа бүрдүүлэх',
      description: 'Pickup/эхэлсэн болон completed proof, аялагчийн 6 оронтой кодыг оруулж аяллыг баталгаажуулна.',
      button: 'Аяллын баталгаа',
      href: `/dashboard/bookings/${bookingId}/delivery-proof`,
    };
  }

  return {
    icon: <CheckCircle className="w-6 h-6" />,
    title: 'Booking явц хянагдаж байна',
    description: 'Одоогийн төлөв дээр шаардлагатай proof, message, status мэдээллээ шалгаарай.',
    button: 'Дэлгэрэнгүй',
    href: `/dashboard/bookings/${bookingId}`,
  };
}

function EvidenceItem({ icon, title, status, active }: { icon: ReactNode; title: string; status: string; active: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${active ? 'border-success/20 bg-success/5' : 'border-border bg-muted/30'}`}>
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
        {icon}
      </div>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{status}</p>
    </div>
  );
}

function PersonCard({ title, name, phone, verified, tone, meta }: { title: string; name: string; phone: string; verified: boolean; tone: 'primary' | 'accent'; meta?: string }) {
  const toneClasses = tone === 'primary' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent';

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${toneClasses}`}>
        <User className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground">{name}</p>
          {verified && <CheckCircle className="w-4 h-4 text-success" />}
        </div>
        <p className="text-sm text-muted-foreground">{phone}</p>
        {meta && <p className="text-sm text-muted-foreground">{meta}</p>}
      </div>
    </div>
  );
}

function PriceRow({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? 'font-semibold text-foreground' : 'text-sm text-muted-foreground'}>{label}</span>
      <span className={strong ? 'text-2xl font-bold text-primary' : 'font-semibold text-foreground'}>
        ₮{value.toLocaleString()}
      </span>
    </div>
  );
}
