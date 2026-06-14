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
} from 'lucide-react';
import { Button } from '../components/Button';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';

const roles = [
  {
    title: 'Би аялагч',
    text: 'Очих газар руугаа явах жолоочийн сул суудлаас захиална.',
    icon: <UserRound className="h-5 w-5" />,
    href: '/auth/register?role=traveler',
    cta: 'Жолооч хайх',
  },
  {
    title: 'Би жолооч',
    text: 'Явах чиглэл, сул суудал, үнээ нийтэлж зорчигч авна.',
    icon: <Car className="h-5 w-5" />,
    href: '/auth/register?role=driver',
    cta: 'Аялал нэмэх',
  },
  {
    title: 'Би ачаа илгээгч',
    text: 'Тухайн чиглэлээр явж буй жолоочоор ачаагаа явуулна.',
    icon: <Package className="h-5 w-5" />,
    href: '/auth/register?role=cargo_sender',
    cta: 'Ачаа илгээх',
  },
];

const steps = [
  { title: 'Бүртгэл үүсгэх', text: 'Нэр, утас, имэйлээ оруулаад төрлөө сонгоно.' },
  { title: 'Утсаа баталгаажуулах', text: 'Баталгаажсаны дараа өөрт тохирсон самбар нээгдэнэ.' },
  { title: 'Үндсэн үйлдэл', text: 'Аялагч жолооч хайна. Жолооч аялал нэмнэ. Ачаа илгээгч чиглэл хайна.' },
  { title: 'Хүсэлт баталгаажих', text: 'Жолооч зөвшөөрнө, төлбөр оруулна, админ шалгана.' },
  { title: 'Аяллын төлөв', text: 'Захиалга үүссэний дараа төлөв, баримт, дараагийн алхам харагдана.' },
];

const trust = [
  { title: 'Баталгаажсан хэрэглэгч', text: 'Утас, бичиг баримтыг төрлөөс нь хамааруулан шалгана.', icon: <ShieldCheck className="h-5 w-5" /> },
  { title: 'Төлбөрийн баримт', text: 'Төлбөрөө шилжүүлж баримтаа оруулна, админ баталгаажуулна.', icon: <CreditCard className="h-5 w-5" /> },
  { title: 'Үнэлгээ, сэтгэгдэл', text: 'Аялал дууссаны дараа бодит захиалган дээр үндэслэн үнэлнэ.', icon: <Star className="h-5 w-5" /> },
  { title: 'Гомдол, маргаан', text: 'Асуудал гарвал гомдол үүсгэж админ шийдвэрлэнэ.', icon: <Flag className="h-5 w-5" /> },
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
        {/* Hero */}
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8 lg:py-24">
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-wide text-primary">Орон нутгийн хамтын унаа</p>
              <h1 className="mt-3 text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Хаашаа явах<br className="hidden sm:block" /> гэж байна вэ?
              </h1>
              <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                Нэг чиглэлд явах хүнийг сул суудалтай жолоочтой холбоно. Доороос өөрт тохирохоо сонгоод эхэлнэ үү.
              </p>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
                {['Баталгаажсан жолооч', 'Төлбөрийн баримт', 'Админы хяналт'].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <SearchPreview />
          </div>
        </section>

        {/* Role chooser */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <SectionHead kicker="Эхлэх" title="Та юу хийх вэ?" />
          <div className="grid gap-4 md:grid-cols-3">
            {roles.map((role) => (
              <a
                key={role.title}
                href={role.href}
                className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-foreground">{role.icon}</span>
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

        {/* Steps */}
        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <SectionHead kicker="Хэрхэн ажилладаг вэ?" title="Таван энгийн алхам" />
            <ol className="grid gap-x-6 gap-y-7 sm:grid-cols-2 lg:grid-cols-5">
              {steps.map((step, index) => (
                <li key={step.title}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/40 text-sm font-semibold text-primary">
                    {index + 1}
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Trust */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <SectionHead kicker="Аюулгүй байдал" title="Юунд итгэж болох вэ?" />
          <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
            {trust.map((item) => (
              <div key={item.title} className="border-t border-border pt-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-foreground">{item.icon}</span>
                <h3 className="mt-3 text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cargo */}
        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1fr_1fr] lg:px-8">
            <div>
              <p className="text-sm font-semibold tracking-wide text-primary">Ачаа илгээх</p>
              <h2 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
                Ачаа илгээх нь жолоочийн аялал дээрх нэмэлт боломж
              </h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground sm:text-base">
                Жолооч аялал нийтлэхдээ “ачаа авч болно” гэж сонговол тэр чиглэл дээр жижиг ачааны хүсэлт авна. Үндсэн үйлчилгээ нь аялагч, жолоочийг холбох хэвээр.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['Ачаа авах эсэх', 'Ачааны багтаамж', 'Зөвшөөрөх төрөл', 'Хүргэлтийн код'].map((item) => (
                <div key={item} className="rounded-xl border border-border bg-card p-4">
                  <BadgeCheck className="h-5 w-5 text-primary" />
                  <p className="mt-2 text-sm font-medium text-foreground">{item}</p>
                </div>
              ))}
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

function SearchPreview() {
  const goSearch = () => { window.location.href = '/auth/register?role=traveler'; };

  return (
    <div className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Жолооч хайх</p>
      </div>

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
        Бодит чиглэл, жолоочийн утас зөвхөн бүртгүүлж нэвтэрсний дараа харагдана.
      </p>
    </div>
  );
}

function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-7 sm:mb-9">
      <p className="text-sm font-semibold tracking-wide text-primary">{kicker}</p>
      <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h2>
    </div>
  );
}
