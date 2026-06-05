import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Car,
  CheckCircle2,
  Clock3,
  CreditCard,
  Flag,
  HelpCircle,
  MapPin,
  Package,
  PhoneCall,
  ShieldCheck,
  Star,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';

const roles = [
  {
    title: 'Аялагч',
    text: 'Орон нутаг руу явах жолооч, сул суудал, үнэ, цагийн мэдээллийг харж суудлын хүсэлт илгээнэ.',
    icon: <UserRound className="h-6 w-6" />,
    href: '/auth/register?role=traveler',
    cta: 'Жолооч хайж эхлэх',
  },
  {
    title: 'Жолооч',
    text: 'Явах чиглэл, цаг, сул суудал, үнийг нийтэлж аялагчийн хүсэлтүүдийг хүлээн авна.',
    icon: <Car className="h-6 w-6" />,
    href: '/auth/register?role=driver',
    cta: 'Чиглэл нийтлэх',
  },
  {
    title: 'Дайвар ачаа',
    text: 'Жолоочийн нийтэлсэн чиглэл дээр жижиг дайвар ачаа илгээх хүсэлт үүсгэнэ.',
    icon: <Package className="h-6 w-6" />,
    href: '/auth/register?role=cargo_sender',
    cta: 'Ачаа авах чиглэл хайх',
  },
];

const steps = [
  { title: 'Бүртгэл үүсгэнэ', text: 'Нэр, утас, имэйлээ оруулаад ашиглах зорилгоо сонгоно.' },
  { title: 'Утсаа баталгаажуулна', text: 'Утасны дугаар баталгаажсаны дараа таны самбар нээгдэнэ.' },
  { title: 'Чиглэл сонгоно', text: 'Аялагч жолооч хайна, жолооч өөрийн явах чиглэлээ нийтэлнэ.' },
  { title: 'Хүсэлт баталгаажна', text: 'Жолооч зөвшөөрсний дараа төлбөрийн баримт, төлөв ил тод харагдана.' },
  { title: 'Аялал эхэлнэ', text: 'Аяллын явц, үнэлгээ, тусламжийн сувгууд нэг дор хадгалагдана.' },
];

const routePreviews = [
  { route: 'Улаанбаатар → Дархан', detail: '3 сул суудал · нэг хүний үнэ · авах цэгийн тайлбар', tag: 'Жишээ санал' },
  { route: 'Улаанбаатар → Эрдэнэт', detail: 'Жолоочийн мэдээлэл · үнэлгээ · дайвар ачаа авах боломж', tag: 'Дайвар ачаа' },
  { route: 'Дархан → Улаанбаатар', detail: 'Төлбөрийн баримт · аяллын төлөв · тусламжийн холбоос', tag: 'Итгэлцэл' },
];

const trust = [
  { title: 'Баталгаажсан жолооч', text: 'Утас, машин, жолоочийн баталгаажуулалтын төлөв аяллын өмнө харагдана.', icon: <ShieldCheck className="h-6 w-6" /> },
  { title: 'Төлбөрийн баримт', text: 'Шилжүүлгийн баримтыг оруулж, админ шалгасны дараа аяллын төлөв шинэчлэгдэнэ.', icon: <CreditCard className="h-6 w-6" /> },
  { title: 'Үнэлгээ ба сэтгэгдэл', text: 'Аяллын дараа аялагч, жолооч хоёр харилцан үнэлгээ өгч итгэлцэл нэмнэ.', icon: <Star className="h-6 w-6" /> },
  { title: 'Маргаан шийдвэрлэх', text: 'Асуудал гарвал тусламжийн хүсэлт үүсгэж админ шалгах дараалалтай.', icon: <Flag className="h-6 w-6" /> },
];

const faqs = [
  ['Нүүр хуудас дээр шууд жолооч хайж болох уу?', 'Нүүр хуудас үйлчилгээний санаа, итгэлцэл, бүртгэлийн замыг тайлбарлана. Жинхэнэ хайлт, захиалга, төлбөрийн баримт нэвтэрсний дараа ажиллана.'],
  ['Дайвар ачаа нь гол үйлчилгээ юу?', 'Үгүй. Гол урсгал нь аялагч, жолоочийг нэг чиглэл дээр холбох. Дайвар ачаа нь жолоочийн чиглэл дээрх жижиг нэмэлт боломж.'],
  ['Жолооч чиглэл нийтлэхэд юу шаардлагатай вэ?', 'Утас баталгаажсан, жолоочийн мэдээлэл админаар зөвшөөрөгдсөн үед чиглэл нийтлэх боломжтой.'],
];

export function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Navbar />

      <main>
        <section className="relative border-b border-border bg-card">
          <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-20">
            <div className="flex w-full max-w-[358px] min-w-0 flex-col justify-center sm:max-w-none">
              <Badge variant="info">Орон нутгийн унаа хуваалцах платформ</Badge>
              <h1 className="mt-5 max-w-4xl text-3xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                Орон нутаг руу хамт явах жолоочоо олоорой
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
                NuudelchinTrip нь нэг чиглэлд явах аялагчийг сул суудалтай жолоочтой холбодог. Дайвар ачаа нь зөвхөн тухайн жолоочийн чиглэл дээр суурилсан жижиг нэмэлт боломж байна.
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
                {['Тус бүрийн самбар', 'Төлбөрийн баримт', 'Чиглэл дээрх дайвар ачаа'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <HeroVisual />
          </div>
        </section>

        <section className="py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle kicker="Хэрэглэгчийн урсгал" title="Та ямар зорилгоор ашиглах вэ?" />
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
            <SectionTitle kicker="Ажиллах дараалал" title="Нэвтэрсний дараа бүх үйлдэл өөрийн самбар дээр үргэлжилнэ" />
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
            <SectionTitle kicker="Чиглэлийн жишээ" title="Жолоочийн санал дээр харагдах үндсэн мэдээлэл" />
            <div className="grid gap-5 lg:grid-cols-3">
              {routePreviews.map((item) => (
                <Card key={item.route} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">{item.route}</h2>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
                    </div>
                    <Badge variant={item.tag === 'Дайвар ачаа' ? 'warning' : 'success'}>{item.tag}</Badge>
                  </div>
                  <Button className="mt-5" variant="outline" fullWidth onClick={() => { window.location.href = '/auth/login?next=/traveler/find-drivers'; }}>
                    Нэвтэрч чиглэл хайх
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-card py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle kicker="Итгэлцэл" title="Аяллын өмнө мэдэх ёстой зүйлс ил тод байна" />
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
              <Badge variant="warning">Дайвар ачаа</Badge>
              <h2 className="mt-4 text-3xl font-bold leading-tight text-foreground">
                Дайвар ачаа нь тусдаа ачаа тээврийн зах биш
              </h2>
              <p className="mt-4 leading-8 text-muted-foreground">
                Жолооч чиглэл нийтлэхдээ “дайвар ачаа авч болно” гэж сонговол тухайн чиглэл дээр жижиг ачааны хүсэлт авах боломжтой. Үндсэн үйлчилгээ нь аялагч, жолоочийг холбох хэвээр байна.
              </p>
            </div>
            <Card className="p-6">
              <div className="grid gap-4 md:grid-cols-2">
                {['Ачаа авах эсэх', 'Ачааны багтаамж', 'Зөвшөөрөх төрөл', 'Хүргэлтийн код'].map((item) => (
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
            <SectionTitle kicker="Түгээмэл асуулт" title="Хэрэглэгчийн хамгийн түрүүнд асуух зүйлс" center />
            <div className="space-y-4">
              {faqs.map(([question, answer]) => (
                <Card key={question} className="p-5">
                  <div className="flex gap-3">
                    <HelpCircle className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <h2 className="font-semibold text-foreground">{question}</h2>
                      <p className="mt-2 leading-7 text-muted-foreground">{answer}</p>
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

function HeroVisual() {
  return (
    <div className="relative w-full max-w-[358px] min-w-0 sm:max-w-none">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 sm:p-5">
          <p className="text-sm font-semibold text-primary">Хайлтын жишээ</p>
          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <LocationMini label="Хаанаас" value="Улаанбаатар" />
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <LocationMini label="Хаашаа" value="Дархан" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniInfo icon={<CalendarDays className="h-4 w-4" />} label="Огноо" value="Маргааш" />
            <MiniInfo icon={<UsersRound className="h-4 w-4" />} label="Хүн" value="2" />
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Жишээ санал</p>
              <h2 className="mt-1 text-xl font-bold text-foreground">Улаанбаатар → Дархан</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                3 сул суудал · ₮35,000 · дайвар ачаа авч болно
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Car className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <MiniInfo icon={<Clock3 className="h-4 w-4" />} label="Цаг" value="09:00" />
            <MiniInfo icon={<ShieldCheck className="h-4 w-4" />} label="Төлөв" value="Баталгаатай" />
            <MiniInfo icon={<Package className="h-4 w-4" />} label="Ачаа" value="Болно" />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-muted/35 p-4">
            <p className="text-sm font-semibold text-foreground">Нэвтэрсний дараа</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Жинхэнэ хайлт, booking request, payment proof нь хэрэглэгчийн самбар дээр ажиллана.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/35 p-4">
            <p className="text-sm font-semibold text-foreground">Итгэлцэл</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Утас баталгаажуулалт, жолоочийн шалгалт, төлбөрийн баримт, үнэлгээтэй.
            </p>
          </div>
        </div>
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <PhoneCall className="h-4 w-4" />
        Жинхэнэ захиалга, утасны мэдээлэл зөвхөн нэвтэрсний дараа харагдана.
      </p>
    </div>
  );
}

function LocationMini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-semibold text-foreground">{value}</p>
    </div>
  );
}

function MiniInfo({ icon, label, value }: { icon: JSX.Element; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card/85 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 truncate text-sm font-semibold text-foreground">{value}</p>
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
