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
  PhoneCall,
  Search,
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
    title: 'Би аялагч',
    text: 'Очих газар руугаа явах жолоочийн сул суудлаас захиалъя.',
    icon: <UserRound className="h-5 w-5" />,
    href: '/auth/register?role=traveler',
    cta: 'Жолооч хайх',
    primary: true,
  },
  {
    title: 'Би жолооч',
    text: 'Явах чиглэл, сул суудал, үнээ нийтэлж зорчигч авъя.',
    icon: <Car className="h-5 w-5" />,
    href: '/auth/register?role=driver',
    cta: 'Аялал нэмэх',
    primary: false,
  },
  {
    title: 'Би ачаа илгээгч',
    text: 'Тухайн чиглэлээр явж буй жолоочоор ачаагаа явуулъя.',
    icon: <Package className="h-5 w-5" />,
    href: '/auth/register?role=cargo_sender',
    cta: 'Ачаа илгээх',
    primary: false,
  },
];

const steps = [
  { title: 'Бүртгэл үүсгэх', text: 'Нэр, утас, имэйлээ оруулаад өөрийн төрлөө сонгоно.' },
  { title: 'Утсаа баталгаажуулах', text: 'Утсаа баталгаажуулсны дараа өөрт тохирсон самбар нээгдэнэ.' },
  { title: 'Үндсэн үйлдлээ хийх', text: 'Аялагч жолооч хайна. Жолооч аялал нэмнэ. Ачаа илгээгч чиглэл хайна.' },
  { title: 'Хүсэлт баталгаажих', text: 'Жолооч зөвшөөрнө, төлбөрийн баримт оруулна, админ шалгана.' },
  { title: 'Аяллын төлөв харах', text: 'Захиалга үүссэний дараа төлөв, баримт, дараагийн алхам харагдана.' },
];

const trust = [
  { title: 'Баталгаажсан хэрэглэгч', text: 'Утас болон шаардлагатай бичиг баримтыг төрлөөс нь хамааруулан шалгана.', icon: <ShieldCheck className="h-6 w-6" /> },
  { title: 'Төлбөрийн баримт', text: 'Төлбөрөө шилжүүлээд баримтаа оруулна, админ шалгаж баталгаажуулна.', icon: <CreditCard className="h-6 w-6" /> },
  { title: 'Үнэлгээ, сэтгэгдэл', text: 'Аялал дууссаны дараа бодит захиалган дээр үндэслэн үнэлгээ өгнө.', icon: <Star className="h-6 w-6" /> },
  { title: 'Гомдол, маргаан', text: 'Асуудал гарвал гомдол үүсгэж, админы шийдвэрлэх урсгал руу орно.', icon: <Flag className="h-6 w-6" /> },
];

const faqs = [
  ['Нэвтрэхгүйгээр жолооч хайж болох уу?', 'Үгүй. Жинхэнэ хайлт, захиалга, төлбөрийн баримт нь бүртгүүлж нэвтэрсний дараа ажиллана. Энэ нь хэрэглэгчдийн мэдээллийг хамгаалах зорилготой.'],
  ['Ачаа илгээх нь гол үйлчилгээ юу?', 'Үгүй. Гол нь аялагч, жолоочийг нэг чиглэл дээр холбох. Ачаа илгээх нь жолоочийн аялал дээрх нэмэлт боломж.'],
  ['Жолооч аялал нийтлэхэд юу хэрэгтэй вэ?', 'Утсаа баталгаажуулж, жолоочийн мэдээллээ админаар зөвшөөрүүлсэн бол аялал нэмэх боломжтой болно.'],
];

export function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Navbar />

      <main>
        <section className="relative border-b border-border bg-card">
          <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
          <div className="mx-auto grid max-w-7xl gap-7 px-3.5 py-8 sm:gap-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_1fr] lg:px-8 lg:py-16">
            <div className="flex min-w-0 flex-col justify-center">
              <Badge variant="info">Орон нутгийн хамтын унаа</Badge>
              <h1 className="mt-4 max-w-xl text-[1.85rem] font-extrabold leading-[1.12] tracking-tight text-foreground sm:mt-5 sm:text-5xl sm:leading-tight">
                Хаашаа явах гэж байна вэ?
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:mt-4 sm:text-lg sm:leading-8">
                NuudelchinTrip нь нэг чиглэлд явах хүнийг сул суудалтай жолоочтой холбоно. Доороос өөрт тохирохоо сонгоод эхэлнэ үү.
              </p>

              <div className="mt-5 flex flex-wrap gap-2 sm:mt-6">
                {['Баталгаажсан жолооч', 'Төлбөрийн баримт', 'Админы хяналт'].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <SearchPreview />
          </div>
        </section>

        <section className="py-9 sm:py-14">
          <div className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8">
            <SectionTitle kicker="Эхлэх" title="Та юу хийх вэ?" />
            <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
              {roles.map((role, index) => (
                <Card key={role.title} className="reveal-up flex flex-col p-4 sm:p-5" style={{ animationDelay: `${index * 80}ms` }}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">{role.icon}</div>
                    <h2 className="text-base font-semibold text-foreground sm:text-lg">{role.title}</h2>
                  </div>
                  <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{role.text}</p>
                  <Button variant={role.primary ? 'primary' : 'outline'} className="mt-4" fullWidth onClick={() => { window.location.href = role.href; }}>
                    {role.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-muted/35 py-9 sm:py-14">
          <div className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8">
            <SectionTitle kicker="Хэрхэн ажилладаг вэ?" title="Таван энгийн алхам" />
            <div className="grid gap-3 sm:gap-4 md:grid-cols-5">
              {steps.map((step, index) => (
                <Card key={step.title} className="p-4 sm:p-5">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <h2 className="text-sm font-semibold text-foreground sm:text-base">{step.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-card py-9 sm:py-14">
          <div className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8">
            <SectionTitle kicker="Аюулгүй байдал" title="Юунд итгэж болох вэ?" />
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
              {trust.map((item) => (
                <Card key={item.title} className="p-4 sm:p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{item.icon}</div>
                  <h2 className="mt-3 text-base font-semibold text-foreground sm:mt-4">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-warning/5 py-9 sm:py-14">
          <div className="mx-auto grid max-w-7xl gap-5 px-3.5 sm:gap-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <Badge variant="warning">Ачаа илгээх</Badge>
              <h2 className="mt-3 text-2xl font-bold leading-tight text-foreground sm:mt-4 sm:text-3xl">
                Ачаа илгээх нь жолоочийн аялал дээрх нэмэлт боломж
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:mt-4 sm:text-base sm:leading-8">
                Жолооч аялал нийтлэхдээ “ачаа авч болно” гэж сонговол тэр чиглэл дээр жижиг ачааны хүсэлт авна. Үндсэн үйлчилгээ нь аялагч, жолоочийг холбох хэвээр.
              </p>
            </div>
            <Card className="p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {['Ачаа авах эсэх', 'Ачааны багтаамж', 'Зөвшөөрөх төрөл', 'Хүргэлтийн код'].map((item) => (
                  <div key={item} className="rounded-lg border border-border bg-card p-3 sm:p-4">
                    <BadgeCheck className="mb-2 h-5 w-5 text-warning" />
                    <p className="text-sm font-semibold text-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section className="py-9 sm:py-14">
          <div className="mx-auto max-w-4xl px-3.5 sm:px-6 lg:px-8">
            <SectionTitle kicker="Түгээмэл асуулт" title="Хамгийн их асуудаг зүйлс" center />
            <div className="space-y-3">
              {faqs.map(([question, answer]) => (
                <Card key={question} className="p-4 sm:p-5">
                  <div className="flex gap-3">
                    <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <h2 className="font-semibold text-foreground">{question}</h2>
                      <p className="mt-1.5 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">{answer}</p>
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

function SearchPreview() {
  const goSearch = () => { window.location.href = '/auth/register?role=traveler'; };

  return (
    <div className="min-w-0">
      <Card className="p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Жолооч хайх</p>
        </div>

        <div className="mt-3 space-y-2.5">
          <button
            type="button"
            onClick={goSearch}
            className="flex w-full items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-3 text-left transition-colors hover:border-primary"
          >
            <MapPin className="h-5 w-5 shrink-0 text-success" />
            <span>
              <span className="block text-xs text-muted-foreground">Суух хаяг</span>
              <span className="block text-sm font-medium text-foreground">Хаанаас явах вэ?</span>
            </span>
          </button>
          <button
            type="button"
            onClick={goSearch}
            className="flex w-full items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-3 text-left transition-colors hover:border-primary"
          >
            <MapPin className="h-5 w-5 shrink-0 text-destructive" />
            <span>
              <span className="block text-xs text-muted-foreground">Буух хаяг</span>
              <span className="block text-sm font-medium text-foreground">Хаашаа явах вэ?</span>
            </span>
          </button>
        </div>

        <Button className="mt-3" fullWidth onClick={goSearch}>
          <Search className="h-4 w-4" />
          Жолооч хайх
        </Button>

        <p className="mt-3 flex items-center gap-1.5 text-xs leading-5 text-muted-foreground">
          <PhoneCall className="h-3.5 w-3.5 shrink-0" />
          Бодит чиглэл, жолоочийн утас зөвхөн бүртгүүлж нэвтэрсний дараа харагдана.
        </p>
      </Card>
    </div>
  );
}

function SectionTitle({ kicker, title, center = false }: { kicker: string; title: string; center?: boolean }) {
  return (
    <div className={`mb-5 sm:mb-7 ${center ? 'text-center' : ''}`}>
      <p className="text-sm font-semibold text-primary">{kicker}</p>
      <h2 className="mt-1.5 text-2xl font-bold leading-tight text-foreground sm:mt-2 sm:text-3xl">{title}</h2>
    </div>
  );
}
