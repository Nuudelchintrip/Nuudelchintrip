import {
  ArrowRight,
  BadgeCheck,
  Car,
  CheckCircle2,
  CreditCard,
  Flag,
  HelpCircle,
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
    title: 'Аялагч',
    text: 'Орон нутаг руу явах жолооч, сул суудал, үнэ, цагийн мэдээллийг нэвтэрсний дараа хайна.',
    icon: <UserRound className="h-6 w-6" />,
    href: '/auth/register?role=traveler',
    cta: 'Аялагчаар бүртгүүлэх',
  },
  {
    title: 'Жолооч',
    text: 'Баталгаажсаны дараа өөрийн явах чиглэл, сул суудал, үнийг нийтэлж хүсэлт авна.',
    icon: <Car className="h-6 w-6" />,
    href: '/auth/register?role=driver',
    cta: 'Жолоочоор бүртгүүлэх',
  },
  {
    title: 'Дайвар ачаа',
    text: 'Зөвхөн дайвар ачаа авах боломжтой гэж нийтэлсэн жолоочийн чиглэл дээр хүсэлт илгээнэ.',
    icon: <Package className="h-6 w-6" />,
    href: '/auth/register?role=cargo_sender',
    cta: 'Ачаа илгээгчээр бүртгүүлэх',
  },
];

const steps = [
  { title: 'Бүртгэл үүсгэнэ', text: 'Нэр, утас, имэйлээ оруулаад ашиглах төрлөө сонгоно.' },
  { title: 'Утсаа баталгаажуулна', text: 'Утас баталгаажсаны дараа өөрийн role-д тохирсон самбар нээгдэнэ.' },
  { title: 'Үндсэн үйлдлээ хийнэ', text: 'Аялагч жолооч хайна. Жолооч чиглэл нэмнэ. Ачаа илгээгч ачаа авах боломжтой чиглэл хайна.' },
  { title: 'Хүсэлт баталгаажна', text: 'Жолооч зөвшөөрөх, төлбөрийн баримт оруулах, admin шалгах дараалалтай.' },
  { title: 'Аяллын төлөв харагдана', text: 'Захиалга бодитоор үүссэний дараа төлөв, баримт, дараагийн алхам харагдана.' },
];

const trust = [
  { title: 'Баталгаажсан хэрэглэгч', text: 'Утас болон шаардлагатай бичиг баримтын шалгалт role-оос хамаарч хийгдэнэ.', icon: <ShieldCheck className="h-6 w-6" /> },
  { title: 'Төлбөрийн баримт', text: 'Эхний хувилбарт төлбөрийн баримт оруулж, админ шалгах урсгал ашиглана.', icon: <CreditCard className="h-6 w-6" /> },
  { title: 'Үнэлгээ ба сэтгэгдэл', text: 'Аялал дууссаны дараа бодит захиалга дээр үндэслэн үнэлгээ нээгдэнэ.', icon: <Star className="h-6 w-6" /> },
  { title: 'Гомдол, маргаан', text: 'Асуудал гарвал report үүсгэж admin шалгах процесс руу орно.', icon: <Flag className="h-6 w-6" /> },
];

const faqs = [
  ['Нүүр хуудас дээр шууд жолооч хайж болох уу?', 'Үгүй. Нүүр хуудас нь үйлчилгээний санаа, аюулгүй байдлын зарчим, бүртгэлийн замыг тайлбарлана. Жинхэнэ хайлт, захиалга, төлбөрийн баримт нэвтэрсний дараа ажиллана.'],
  ['Дайвар ачаа нь гол үйлчилгээ юу?', 'Үгүй. Гол урсгал нь аялагч, жолоочийг нэг чиглэл дээр холбох. Дайвар ачаа нь жолоочийн чиглэл дээрх нэмэлт боломж.'],
  ['Жолооч чиглэл нийтлэхэд юу шаардлагатай вэ?', 'Утас баталгаажсан, жолоочийн мэдээлэл admin-аар зөвшөөрөгдсөн үед чиглэл нийтлэх боломжтой.'],
];

export function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Navbar />

      <main>
        <section className="relative border-b border-border bg-card">
          <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-20">
            <div className="flex min-w-0 flex-col justify-center">
              <Badge variant="info">Орон нутгийн унаа хуваалцах платформ</Badge>
              <h1 className="mt-5 max-w-4xl text-3xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                Орон нутаг руу хамт явах жолоочоо олоорой
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
                NuudelchinTrip нь нэг чиглэлд явах аялагчийг сул суудалтай жолоочтой холбодог marketplace. Дайвар ачаа нь зөвхөн тухайн жолоочийн чиглэл дээр суурилсан нэмэлт боломж байна.
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
                {['Хэрэглэгчийн төрөлтэй самбар', 'Төлбөрийн баримт', 'Админы хяналт'].map((item) => (
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
            <SectionTitle kicker="Ажиллах дараалал" title="Бодит үйлдлүүд нэвтэрсний дараа эхэлнэ" />
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

        <section className="bg-card py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle kicker="Итгэлцэл" title="Итгэлцэл нь баталгаажуулалт, төлөв, баримтаар бий болно" />
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
  const items = [
    { icon: <Search className="h-5 w-5" />, title: 'Нэвтэрсний дараа хайлт хийнэ', text: 'Чиглэлийн жагсаалт бодит өгөгдлөөс бүрдэнэ.' },
    { icon: <Car className="h-5 w-5" />, title: 'Жолооч чиглэл нийтэлнэ', text: 'Баталгаажсан жолооч чиглэл нэмнэ.' },
    { icon: <CreditCard className="h-5 w-5" />, title: 'Баримт admin-аар шалгагдана', text: 'Төлөв бодит захиалга дээр өөрчлөгдөнө.' },
  ];

  return (
    <div className="relative min-w-0">
      <Card className="p-5 shadow-sm sm:p-6">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
          <p className="text-sm font-semibold text-primary">Платформын үндсэн зарчим</p>
          <h2 className="mt-3 text-2xl font-bold leading-tight text-foreground">
            Хэрэглэгчийн бодит data үүссэний дараа жагсаалт, төлөв, төлбөр харагдана
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Нүүр хуудсан дээр үйлчилгээний зарчим, role-ийн ялгаа, итгэлцлийн урсгалыг тайлбарлана.
          </p>
        </div>

        <div className="mt-4 grid gap-3">
          {items.map((item) => (
            <div key={item.title} className="flex gap-3 rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {item.icon}
              </div>
              <div>
                <p className="font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <PhoneCall className="h-4 w-4" />
        Жинхэнэ захиалга, утасны мэдээлэл зөвхөн нэвтэрсний дараа харагдана.
      </p>
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
