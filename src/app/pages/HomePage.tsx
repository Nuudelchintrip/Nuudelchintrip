import {
  ArrowRight,
  BadgeCheck,
  Car,
  CheckCircle2,
  CreditCard,
  Flag,
  HelpCircle,
  MapPin,
  Package,
  Route,
  ShieldCheck,
  Star,
  UserRound,
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';

const roles = [
  {
    title: 'Аялагч',
    text: 'Орон нутаг руу явах жолооч, сул суудал, үнэ, verification мэдээллийг харж хүсэлт илгээнэ.',
    icon: <UserRound className="h-6 w-6" />,
    href: '/auth/register?role=traveler',
    cta: 'Жолооч хайж эхлэх',
  },
  {
    title: 'Жолооч',
    text: 'Чиглэл, цаг, сул суудал, үнээ нийтэлж аялагчийн хүсэлтүүдийг хүлээн авна.',
    icon: <Car className="h-6 w-6" />,
    href: '/auth/register?role=driver',
    cta: 'Чиглэл нэмэх',
  },
  {
    title: 'Дайвар ачаа',
    text: 'Дайвар ачаа нь зөвхөн жолоочийн route дээр суурилсан жижиг нэмэлт боломж.',
    icon: <Package className="h-6 w-6" />,
    href: '/auth/register?role=cargo_sender',
    cta: 'Ачаа авах route хайх',
  },
];

const steps = [
  { title: 'Бүртгүүлнэ', text: 'Role-оо сонгоод basic account үүсгэнэ.' },
  { title: 'Утсаа баталгаажуулна', text: 'MVP дээр demo баталгаажуулалт, production үед SMS webhook.' },
  { title: 'Role setup хийнэ', text: 'Аялагч, жолооч, ачаа илгээгч тус бүр өөр setup-тэй.' },
  { title: 'Хүсэлт илгээнэ', text: 'Аялагч суудал захиална, жолооч accept/reject хийнэ.' },
  { title: 'Status хянана', text: 'Payment proof, trip timeline, report/support нэг урсгалд байна.' },
];

const routePreviews = [
  { route: 'Улаанбаатар → Дархан', detail: 'Жишээ route card · 3 сул суудал', tag: 'Verified driver' },
  { route: 'Улаанбаатар → Эрдэнэт', detail: 'Жишээ route card · дайвар ачаа авч болно', tag: 'Cargo add-on' },
  { route: 'Дархан → Улаанбаатар', detail: 'Жишээ route card · payment proof flow', tag: 'Proof ready' },
];

const trust = [
  { title: 'Баталгаажсан жолооч', text: 'Утас, машины мэдээлэл, жолоочийн verification status харагдана.', icon: <ShieldCheck className="h-6 w-6" /> },
  { title: 'Төлбөрийн баримт', text: 'Manual payment proof upload болон admin review хийхэд бэлэн бүтэцтэй.', icon: <CreditCard className="h-6 w-6" /> },
  { title: 'Үнэлгээ', text: 'Аяллын дараа traveler-driver review flow-оор итгэлцэл нэмэгдэнэ.', icon: <Star className="h-6 w-6" /> },
  { title: 'Report/support', text: 'Маргаан, асуудал гарвал support болон admin moderation queue руу орно.', icon: <Flag className="h-6 w-6" /> },
];

const faqs = [
  ['Public дээр шууд жолооч хайж болох уу?', 'Public page нь үйлчилгээний утгыг тайлбарлаж, хэрэглэгчийг register/login рүү оруулна. Бодит хайлт, booking, proof upload нь нэвтэрсний дараа ажиллана.'],
  ['Дайвар ачаа гол үйлчилгээ юу?', 'Үгүй. Гол урсгал нь аялагч-жолооч matching. Дайвар ачаа бол жолоочийн route дээр суурилсан secondary add-on.'],
  ['Жолооч чиглэл нэмэхэд юу шаардлагатай вэ?', 'Утас баталгаажсан, onboarding дууссан, driver verification approved болсон үед route нийтлэх боломжтой.'],
];

export function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Navbar />

      <main>
        <section className="relative border-b border-border bg-card">
          <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-18 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-20">
            <div className="reveal-up">
              <Badge variant="info">Passenger-driver route sharing</Badge>
              <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight text-foreground sm:text-5xl">
                Орон нутаг руу хамт явах жолоочоо олоорой
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
                NuudelchinTrip нь нэг чиглэлд явах аялагч, сул суудалтай жолоочийг холбох платформ. Дайвар ачаа нь жолоочийн route дээр суурилсан жижиг нэмэлт боломж хэвээр байна.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" onClick={() => { window.location.href = '/auth/register?role=traveler'; }}>
                  Бүртгүүлэх
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => { window.location.href = '/auth/login?next=/traveler/find-drivers'; }}>
                  Нэвтрэх
                </Button>
                <Button size="lg" variant="ghost" onClick={() => { window.location.href = '/how-it-works'; }}>
                  Яаж ажилладаг вэ?
                </Button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {['Role-based dashboard', 'Payment proof', 'Route-based cargo'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <HeroRoutePreview />
          </div>
        </section>

        <section className="py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle kicker="Role cards" title="Та аль урсгалаар эхлэх вэ?" />
            <div className="grid gap-5 md:grid-cols-3">
              {roles.map((role, index) => (
                <Card key={role.title} className="reveal-up p-6" style={{ animationDelay: `${index * 90}ms` }}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">{role.icon}</div>
                  <h2 className="mt-5 text-xl font-semibold text-foreground">{role.title}</h2>
                  <p className="mt-3 leading-7 text-muted-foreground">{role.text}</p>
                  <Button variant={index === 0 ? 'primary' : 'outline'} className="mt-5" fullWidth onClick={() => { window.location.href = role.href; }}>
                    {role.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-muted/35 py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle kicker="How it works" title="Public website-ээс dashboard хүртэлх энгийн урсгал" />
            <div className="grid gap-4 md:grid-cols-5">
              {steps.map((step, index) => (
                <Card key={step.title} className="p-5">
                  <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    {index + 1}
                  </div>
                  <h2 className="text-base font-semibold text-foreground">{step.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle kicker="Route previews" title="Жолоочийн санал ямар мэдээлэлтэй харагдах вэ?" />
            <div className="grid gap-5 lg:grid-cols-3">
              {routePreviews.map((item) => (
                <Card key={item.route} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">{item.route}</h2>
                      <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
                    </div>
                    <Badge variant={item.tag === 'Cargo add-on' ? 'warning' : 'success'}>{item.tag}</Badge>
                  </div>
                  <Button className="mt-5" variant="outline" fullWidth onClick={() => { window.location.href = '/auth/login?next=/traveler/find-drivers'; }}>
                    Нэвтэрч route хайх
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-card py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle kicker="Trust & safety" title="Итгэлцэл нь booking flow-ийн үндсэн хэсэг" />
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {trust.map((item) => (
                <Card key={item.title} className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">{item.icon}</div>
                  <h2 className="mt-5 text-lg font-semibold text-foreground">{item.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.text}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-warning/5 py-14 sm:py-16">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <Badge variant="warning">Daivar achaa add-on</Badge>
              <h2 className="mt-4 text-3xl font-bold leading-tight text-foreground">
                Дайвар ачаа нь тусдаа том marketplace биш
              </h2>
              <p className="mt-4 leading-8 text-muted-foreground">
                Жолооч route нэмэхдээ “дайвар ачаа авч болно” гэж сонговол тухайн чиглэл дээр жижиг ачааны request авах боломжтой. Passenger-driver booking нь үндсэн flow хэвээр үлдэнэ.
              </p>
            </div>
            <Card className="p-6">
              <div className="grid gap-4 md:grid-cols-2">
                {['Allows cargo toggle', 'Cargo capacity', 'Allowed cargo types', 'Delivery code/status'].map((item) => (
                  <div key={item} className="rounded-lg border border-border bg-card p-4">
                    <BadgeCheck className="mb-3 h-6 w-6 text-warning" />
                    <p className="font-semibold text-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section className="py-14 sm:py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <SectionTitle kicker="FAQ" title="Түгээмэл асуулт" center />
            <div className="space-y-4">
              {faqs.map(([question, answer]) => (
                <Card key={question} className="p-5">
                  <div className="flex gap-3">
                    <HelpCircle className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <h2 className="font-semibold text-foreground">{question}</h2>
                      <p className="mt-2 text-muted-foreground">{answer}</p>
                    </div>
                  </div>
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

function HeroRoutePreview() {
  return (
    <div className="reveal-up relative" style={{ animationDelay: '120ms' }}>
      <Card className="overflow-hidden p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Authenticated search preview</p>
            <h2 className="text-2xl font-semibold text-foreground">УБ → Дархан route</h2>
          </div>
          <Route className="h-8 w-8 text-primary" />
        </div>

        <div className="relative min-h-72 rounded-lg border border-border bg-muted/30 p-5">
          <div className="absolute left-8 right-8 top-1/2 h-1 -translate-y-1/2 rounded-full bg-border">
            <div className="route-line h-1 rounded-full bg-primary" />
          </div>
          <div className="route-car absolute top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg">
            <Car className="h-6 w-6" />
          </div>
          <RouteStop className="left-5 top-1/2 -translate-y-1/2" label="Улаанбаатар" />
          <RouteStop className="right-5 top-1/2 -translate-y-1/2" label="Дархан" align="right" />

          <div className="absolute inset-x-5 bottom-5 grid gap-3 sm:grid-cols-3">
            <MiniMetric label="Сул суудал" value="3" />
            <MiniMetric label="Үнэ" value="₮35k" />
            <MiniMetric label="Cargo" value="Add-on" />
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-success/25 bg-success/5 p-4">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <p className="text-sm leading-6 text-muted-foreground">
              Route detail дээр verified badge, rating, seats, price, pickup/dropoff note болон allows_cargo status хамт харагдана.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function RouteStop({ label, className, align = 'left' }: { label: string; className: string; align?: 'left' | 'right' }) {
  return (
    <div className={`absolute ${className}`}>
      <div className={`flex flex-col ${align === 'right' ? 'items-end' : 'items-start'}`}>
        <div className="route-pulse flex h-11 w-11 items-center justify-center rounded-full border-4 border-card bg-primary text-primary-foreground shadow-md">
          <MapPin className="h-5 w-5" />
        </div>
        <span className="mt-3 rounded-lg bg-card px-3 py-1 text-sm font-semibold text-foreground shadow-sm">{label}</span>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-card p-3 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold text-foreground">{value}</p>
    </div>
  );
}

function SectionTitle({ kicker, title, center = false }: { kicker: string; title: string; center?: boolean }) {
  return (
    <div className={`mb-8 ${center ? 'text-center' : ''}`}>
      <p className="text-sm font-semibold text-primary">{kicker}</p>
      <h2 className="mt-2 text-3xl font-bold leading-tight text-foreground">{title}</h2>
    </div>
  );
}
