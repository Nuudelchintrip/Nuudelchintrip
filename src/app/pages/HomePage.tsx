import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Car,
  CheckCircle2,
  CreditCard,
  Flag,
  HelpCircle,
  MapPin,
  Package,
  PhoneCall,
  Search,
  ShieldCheck,
  Star,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';

const stats = [
  { value: '21', label: 'Аймаг даяар' },
  { value: '330+', label: 'Сум, дүүрэг' },
  { value: '3', label: 'Төрлийн үйлчилгээ' },
  { value: '100%', label: 'Баталгаажсан жолооч' },
];

const roles = [
  {
    title: 'Би аялагч',
    text: 'Очих газар руугаа явах жолооч олж, сул суудлыг нь захиалаарай.',
    icon: <UserRound className="h-5 w-5" />,
    href: '/auth/register?role=traveler',
    cta: 'Жолооч хайх',
  },
  {
    title: 'Би жолооч',
    text: 'Явах замаа нийтэлж, хажуугаар чинь явах зорчигчоо аваарай.',
    icon: <Car className="h-5 w-5" />,
    href: '/auth/register?role=driver',
    cta: 'Аялал нэмэх',
  },
  {
    title: 'Би ачаа илгээгч',
    text: 'Тэр чиглэлд явж буй жолоочоор ачаагаа найдвартай илгээгээрэй.',
    icon: <Package className="h-5 w-5" />,
    href: '/auth/register?role=cargo_sender',
    cta: 'Ачаа илгээх',
  },
];

const sampleTrips = [
  { driver: 'Бат-Эрдэнэ', car: 'Toyota Prius 30', rating: '4.9', from: 'Улаанбаатар', to: 'Дархан', when: 'Маргааш 09:00', seats: 3, price: 35000, cargo: true },
  { driver: 'Энхтуяа', car: 'Lexus RX 350', rating: '4.8', from: 'Эрдэнэт', to: 'Мөрөн', when: 'Бямба 07:30', seats: 2, price: 60000, cargo: false },
  { driver: 'Ганболд', car: 'Toyota Land Cruiser', rating: '5.0', from: 'Улаанбаатар', to: 'Цэцэрлэг', when: 'Өнөөдөр 14:00', seats: 4, price: 40000, cargo: true },
];

const steps = [
  { title: 'Бүртгүүлэх', text: 'Нэр, утсаа оруулаад хэн болохоо сонгоход л болоо.' },
  { title: 'Утсаа баталгаажуулах', text: 'Ирсэн кодоо оруулмагц өөрийн самбар нээгдэнэ.' },
  { title: 'Үндсэн үйлдэл', text: 'Жолооч хайх, аялал нэмэх, эсвэл ачаагаа илгээх.' },
  { title: 'Хүсэлт батлах', text: 'Жолооч зөвшөөрч, төлбөр баталгаажсны дараа бэлэн.' },
  { title: 'Замдаа гарах', text: 'Аяллын явц, баримт, кодоо нэг дороос хянана.' },
];

const trust = [
  { title: 'Баталгаажсан жолооч', text: 'Утас, бичиг баримтыг шалгаж байж л замд гаргадаг.', icon: <ShieldCheck className="h-5 w-5" /> },
  { title: 'Төлбөрийн баримт', text: 'Төлбөрөө шилжүүлж, баримтаа оруулна — админ нягталж баталгаажуулна.', icon: <CreditCard className="h-5 w-5" /> },
  { title: 'Үнэлгээ, сэтгэгдэл', text: 'Аялал дууссаны дараа бодит хүмүүс бие биенээ үнэлнэ.', icon: <Star className="h-5 w-5" /> },
  { title: 'Гомдол, маргаан', text: 'Ямар нэг зүйл болвол гомдлоо үлдээ — админ хянаж шийдвэрлэнэ.', icon: <Flag className="h-5 w-5" /> },
];

const faqs = [
  ['Нэвтрэхгүйгээр жолооч хайж болох уу?', 'Болохгүй. Жинхэнэ чиглэл, жолоочийн утас, захиалга нь бүртгүүлж нэвтэрсний дараа л харагдана. Ингэснээр хүмүүсийн мэдээлэл хамгаалагдана.'],
  ['Ачаа илгээх нь гол үйлчилгээ үү?', 'Үгүй. Гол нь нэг замаар явах хүн, жолоочийг холбох. Ачаа илгээх нь жолоочийн аялал дээрх нэмэлт боломж.'],
  ['Жолооч болоход юу хэрэгтэй вэ?', 'Утсаа баталгаажуулж, жолоочийн мэдээллээ админаар зөвшөөрүүлэхэд л аялал нэмэх эрх нээгдэнэ.'],
];

export function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="border-b border-border bg-secondary/20">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:px-8 lg:py-20">
            <div className="reveal-up min-w-0">
              <p className="text-sm font-semibold tracking-wide text-primary">Орон нутгийн хамтын унаа</p>
              <h1 className="mt-3 text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Хаашаа явах<br className="hidden sm:block" /> гэж байна вэ?
              </h1>
              <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                Нэг замаар явах жолоочтой холбогдоод, сул суудлыг нь хуваалцаарай. Хямд, ойр дотно, найдвартай.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button onClick={() => { window.location.href = '/auth/register?role=traveler'; }}>
                  Жолооч хайх
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => { window.location.href = '/auth/register?role=driver'; }}>
                  Жолоочоор нэгдэх
                </Button>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
                {['Баталгаажсан жолооч', 'Төлбөрийн баримт', 'Админ хяналт'].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <HeroJourneyCard />
          </div>

          {/* Stats strip */}
          <div className="border-t border-border">
            <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-border px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
              {stats.map((stat) => (
                <div key={stat.label} className="px-2 py-5 text-center sm:py-6">
                  <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Role chooser */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <SectionHead kicker="Эхлэх" title="Та юу хийх вэ?" />
          <div className="grid gap-4 md:grid-cols-3">
            {roles.map((role, index) => (
              <a
                key={role.title}
                href={role.href}
                className="reveal-up group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">{role.icon}</span>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{role.title}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-6 text-muted-foreground">{role.text}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  {role.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Product showcase */}
        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <div className="mb-7 flex flex-col gap-2 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
              <SectionHead kicker="Жишээ харагдац" title="Жолооч хайхад ийм харагдана" inline />
              <span className="text-sm text-muted-foreground">Бодит чиглэл нэвтэрсний дараа</span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {sampleTrips.map((trip, index) => (
                <div
                  key={trip.driver}
                  className="reveal-up rounded-2xl border border-border bg-card p-5 shadow-sm"
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-primary">
                        <Car className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{trip.driver}</p>
                        <p className="truncate text-xs text-muted-foreground">{trip.car}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      {trip.rating}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-base font-semibold text-foreground">
                    <span>{trip.from}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span>{trip.to}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {trip.when} · {trip.seats} сул суудал
                  </p>
                  {trip.cargo && (
                    <div className="mt-3">
                      <Badge variant="warning">Дайвар ачаа авна</Badge>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                    <span className="text-lg font-bold text-primary">
                      ₮{trip.price.toLocaleString()}
                      <span className="text-sm font-normal text-muted-foreground"> /хүн</span>
                    </span>
                    <span className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium text-muted-foreground">Суудал захиалах</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <SectionHead kicker="Хэрхэн ажилладаг вэ?" title="Таван энгийн алхам" />
          <ol className="grid gap-x-6 gap-y-7 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((step, index) => (
              <li key={step.title} className="reveal-up" style={{ animationDelay: `${index * 80}ms` }}>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Trust */}
        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <SectionHead kicker="Аюулгүй байдал" title="Юунд итгэж болох вэ?" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trust.map((item, index) => (
                <div
                  key={item.title}
                  className="reveal-up rounded-2xl border border-border bg-card p-5 shadow-sm"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">{item.icon}</span>
                  <h3 className="mt-4 text-base font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cargo */}
        <section className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1fr_1fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold tracking-wide text-primary">Ачаа илгээх</p>
            <h2 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
              Аян замдаа явахдаа л ачааг зөөдөг
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground sm:text-base">
              Жолооч аялал нийтлэхдээ “ачаа авна” гэж тэмдэглэвэл тэр замдаа жижиг ачаа дайчилж болно. Тусдаа тээврийн зах биш — энгийн, дайвар үйлчилгээ.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {['Ачаа авах эсэх', 'Ачааны багтаамж', 'Зөвшөөрөх төрөл', 'Хүргэлтийн код'].map((item) => (
              <div key={item} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <BadgeCheck className="h-5 w-5 text-primary" />
                <p className="mt-2 text-sm font-medium text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA band */}
        <section className="bg-primary">
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-12 sm:px-6 sm:py-16 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div>
              <h2 className="text-2xl font-bold leading-tight tracking-tight text-primary-foreground sm:text-3xl">
                Замдаа гарахад бэлэн үү?
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-7 text-primary-foreground/80 sm:text-base">
                Хэдхэн алхамд бүртгүүлээд жолооч хайх, аялал нэмэх, ачаа илгээхээ эхэл.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a href="/auth/register" className="inline-flex items-center justify-center gap-2 rounded-lg bg-card px-5 py-3 text-sm font-semibold text-primary shadow-sm transition-colors hover:bg-card/90">
                Бүртгүүлэх
                <ArrowRight className="h-4 w-4" />
              </a>
              <a href="/how-it-works" className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary-foreground/30 px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10">
                <UsersRound className="h-4 w-4" />
                Яаж ажилладаг вэ?
              </a>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <SectionHead kicker="Түгээмэл асуулт" title="Хамгийн их асуудаг зүйлс" />
          <div className="divide-y divide-border border-y border-border">
            {faqs.map(([question, answer]) => (
              <div key={question} className="py-5">
                <h3 className="flex items-start gap-2.5 font-semibold text-foreground">
                  <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  {question}
                </h3>
                <p className="mt-2 pl-7 text-sm leading-7 text-muted-foreground">{answer}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function HeroJourneyCard() {
  const goSearch = () => { window.location.href = '/auth/register?role=traveler'; };

  return (
    <div className="reveal-up min-w-0" style={{ animationDelay: '120ms' }}>
      <div className="floating-panel rounded-2xl border border-border bg-card p-4 shadow-lg sm:p-5">
        {/* Animated journey */}
        <div className="relative h-40 overflow-hidden rounded-xl border border-border bg-secondary/40 sm:h-44">
          <svg className="absolute inset-x-0 bottom-0 h-24 w-full" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 78 Q 90 40 200 66 T 400 58 V120 H0 Z" className="fill-primary/10" />
            <path d="M0 96 Q 120 66 240 88 T 400 84 V120 H0 Z" className="fill-primary/20" />
          </svg>

          <span className="absolute left-3 top-3 text-xs font-medium text-muted-foreground">Суух</span>
          <span className="absolute right-3 top-3 text-xs font-medium text-muted-foreground">Буух</span>

          {/* Route track */}
          <div className="absolute inset-x-[14%] top-1/2 -translate-y-1/2">
            <div className="route-line h-[3px] rounded-full bg-primary/50" />
          </div>

          {/* Start / end pins */}
          <span className="route-pulse absolute left-[14%] top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-success ring-4 ring-success/20" />
          <span className="route-pulse absolute left-[86%] top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-destructive ring-4 ring-destructive/20" />

          {/* Moving car */}
          <div className="route-car absolute top-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-card shadow-md ring-1 ring-border">
              <Car className="h-4 w-4 text-primary" />
            </span>
          </div>
        </div>

        {/* Quick search */}
        <div className="mt-4 space-y-2.5">
          <button
            type="button"
            onClick={goSearch}
            className="flex w-full items-center gap-3 rounded-xl border border-border px-3.5 py-3 text-left transition-colors hover:border-primary"
          >
            <MapPin className="h-5 w-5 shrink-0 text-success" />
            <span>
              <span className="block text-xs text-muted-foreground">Суух байршил</span>
              <span className="block text-sm font-medium text-foreground">Хаанаас явах вэ?</span>
            </span>
          </button>
          <button
            type="button"
            onClick={goSearch}
            className="flex w-full items-center gap-3 rounded-xl border border-border px-3.5 py-3 text-left transition-colors hover:border-primary"
          >
            <MapPin className="h-5 w-5 shrink-0 text-destructive" />
            <span>
              <span className="block text-xs text-muted-foreground">Буух байршил</span>
              <span className="block text-sm font-medium text-foreground">Хаашаа явах вэ?</span>
            </span>
          </button>
        </div>

        <Button className="mt-4" fullWidth onClick={goSearch}>
          <Search className="h-4 w-4" />
          Жолооч хайх
        </Button>

        <p className="mt-3 flex items-center gap-1.5 text-xs leading-5 text-muted-foreground">
          <PhoneCall className="h-3.5 w-3.5 shrink-0" />
          Жинхэнэ чиглэл, жолоочийн утас бүртгүүлсний дараа нээгдэнэ.
        </p>
      </div>
    </div>
  );
}

function SectionHead({ kicker, title, inline = false }: { kicker: string; title: string; inline?: boolean }) {
  return (
    <div className={inline ? '' : 'mb-7 sm:mb-9'}>
      <p className="text-sm font-semibold tracking-wide text-primary">{kicker}</p>
      <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h2>
    </div>
  );
}
