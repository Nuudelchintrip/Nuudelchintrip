import { useState, type ReactNode } from 'react';
import { ArrowRight, CheckCircle2, FileText, HelpCircle, LockKeyhole, Mail, MapPin, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Footer } from '../components/Footer';
import { Input } from '../components/Input';
import { Navbar } from '../components/Navbar';
import { sendPasswordResetEmail, updatePasswordWithRecovery } from '../services/supabaseAuth';

const values = [
  'NuudelchinTrip нь тээврийн компани биш, аялагч болон жолоочийг ил тод мэдээллээр холбох платформ.',
  'Гол урсгал нь унаа хайж буй аялагч, сул суудалтай жолооч хоёрыг тохирох хүсэлтээр тааруулах.',
  'Төлбөрийн баримт, verified badge, review, report нь trust layer болж ажиллана.',
];

export function AboutPage() {
  return (
    <InfoFrame>
      <section className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
        <div>
          <Badge variant="info">Бидний тухай</Badge>
          <h1 className="mt-4 text-4xl font-bold leading-tight text-foreground">Орон нутгийн аялагч, жолооч хоёрыг нэг дор холбоно</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            NuudelchinTrip-ийн үндсэн зорилго бол нэг чиглэлд явж буй аялагч, жолооч нарыг хурдан, ойлгомжтой, итгэлтэйгээр тааруулах юм.
            Дайвар ачаа нь MVP-ийн дараагийн хувилбарын нэмэлт боломж байна.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => window.location.href = '/auth/register'}>
              Бүртгүүлэх
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/auth/login'}>Нэвтрэх</Button>
          </div>
        </div>
        <Card className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {[
              ['120+', 'Идэвхтэй чиглэл'],
              ['1.8k', 'Баталгаажсан хэрэглэгч'],
              ['18 мин', 'Дундаж хариу'],
              ['4.8/5', 'Дундаж үнэлгээ'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-lg bg-muted/40 p-5">
                <p className="text-3xl font-bold text-primary">{value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mt-12 grid gap-5 md:grid-cols-3">
        {values.map((value) => (
          <Card key={value} className="p-5">
            <CheckCircle2 className="h-6 w-6 text-success" />
            <p className="mt-4 leading-7 text-foreground">{value}</p>
          </Card>
        ))}
      </section>
    </InfoFrame>
  );
}

export function FaqPage() {
  const faqs = [
    ['Энэ платформ яг юу хийдэг вэ?', 'Нэг чиглэлд явах аялагч, жолоочийг route, хүсэлт, баталгаажуулалт, үнэлгээгээр холбодог.'],
    ['Ачаа гол үйлчилгээ мөн үү?', 'Үгүй. MVP-ийн гол нь аялагч болон жолоочийн холбоос. Ачаа бол дараагийн хувилбарын нэмэлт боломж.'],
    ['Төлбөр яаж баталгаажих вэ?', 'V1 дээр банк/QPay proof upload хийж, admin баталгаажуулсны дараа дараагийн алхам нээгдэнэ.'],
    ['Аялал дууссаныг яаж мэдэх вэ?', 'Жолооч аяллын төлөв шинэчилж, аялал completed болсны дараа review нээгдэнэ.'],
  ];

  return (
    <InfoFrame>
      <PageHero icon={<HelpCircle />} eyebrow="Түгээмэл асуулт" title="Аялагч, жолоочийн хамгийн их асуудаг зүйлс" />
      <div className="mt-8 grid gap-4">
        {faqs.map(([question, answer]) => (
          <Card key={question} className="p-6">
            <h2 className="text-xl font-semibold text-foreground">{question}</h2>
            <p className="mt-3 leading-7 text-muted-foreground">{answer}</p>
          </Card>
        ))}
      </div>
    </InfoFrame>
  );
}

export function SupportPage() {
  return (
    <InfoFrame>
      <PageHero icon={<MessageCircle />} eyebrow="Дэмжлэг" title="Асуудал гарвал нэг газраас шийдүүлнэ" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Нэр" placeholder="Таны нэр" />
            <Input label="Утас" placeholder="+976 9999 9999" />
            <Input label="Booking дугаар" placeholder="BK-001" />
            <Input label="Асуудлын төрөл" placeholder="Төлбөр, proof, route..." />
          </div>
          <label className="mt-4 block text-sm font-medium text-foreground">Дэлгэрэнгүй</label>
          <textarea className="mt-2 min-h-36 w-full rounded-lg border border-input bg-input-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-ring" placeholder="Юу болсон талаар бичнэ үү" />
          <Button className="mt-5">Дэмжлэг рүү илгээх</Button>
        </Card>
        <div className="space-y-4">
          {[
            [<Phone className="h-5 w-5" />, 'Утас', '+976 9999 0000'],
            [<Mail className="h-5 w-5" />, 'И-мэйл', 'info@nuudelchintrip.mn'],
            [<MapPin className="h-5 w-5" />, 'Ажлын цаг', '09:00-18:00'],
          ].map(([icon, title, text]) => (
            <Card key={String(title)} className="p-5">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
                <div>
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="mt-1 text-muted-foreground">{text}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </InfoFrame>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setStatus('');
    setError('');

    if (!email.trim()) {
      setError('И-мэйл хаягаа оруулна уу.');
      return;
    }
    if (!email.includes('@')) {
      setError('Одоогоор password reset зөвхөн и-мэйлээр илгээгдэнэ.');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(email.trim());
      setStatus('Password reset холбоос таны и-мэйл рүү илгээгдлээ. Inbox эсвэл spam хавтсаа шалгаарай.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset email илгээхэд алдаа гарлаа.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <InfoFrame narrow>
      <Card className="p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <LockKeyhole className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-center text-3xl font-bold text-foreground">Нууц үг сэргээх</h1>
        <p className="mx-auto mt-3 max-w-md text-center leading-7 text-muted-foreground">
          Бүртгэлтэй и-мэйлээ оруулна. Supabase recovery link ирсний дараа шинэ нууц үг тохируулна.
        </p>
        <div className="mt-7 space-y-4">
          <Input label="И-мэйл" type="email" placeholder="name@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
          {error && <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">{error}</div>}
          {status && <div className="rounded-lg border border-success/20 bg-success/5 px-4 py-3 text-sm font-medium text-success">{status}</div>}
          <Button fullWidth onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Илгээж байна...' : 'Reset link авах'}
          </Button>
          <Button variant="ghost" fullWidth onClick={() => window.location.href = '/auth/login'}>Нэвтрэх рүү буцах</Button>
        </div>
      </Card>
    </InfoFrame>
  );
}

export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setStatus('');
    setError('');

    if (!password) {
      setError('Шинэ нууц үгээ оруулна уу.');
      return;
    }
    if (password.length < 8) {
      setError('Нууц үг 8-аас дээш тэмдэгттэй байх хэрэгтэй.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Нууц үг давталт таарахгүй байна.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePasswordWithRecovery(password);
      setStatus('Нууц үг шинэчлэгдлээ. Одоо шинэ нууц үгээрээ нэвтэрнэ үү.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Нууц үг шинэчлэхэд алдаа гарлаа.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <InfoFrame narrow>
      <Card className="p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <LockKeyhole className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-center text-3xl font-bold text-foreground">Шинэ нууц үг</h1>
        <p className="mx-auto mt-3 max-w-md text-center leading-7 text-muted-foreground">
          И-мэйлээр ирсэн recovery link-ээр орсны дараа шинэ нууц үгээ тохируулна.
        </p>
        <div className="mt-7 space-y-4">
          <Input label="Шинэ нууц үг" type="password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} />
          <Input label="Шинэ нууц үг давтах" type="password" placeholder="••••••••" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
          {error && <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">{error}</div>}
          {status && <div className="rounded-lg border border-success/20 bg-success/5 px-4 py-3 text-sm font-medium text-success">{status}</div>}
          <Button fullWidth onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Шинэчилж байна...' : 'Нууц үг шинэчлэх'}
          </Button>
          <Button variant="ghost" fullWidth onClick={() => window.location.href = '/auth/login'}>Нэвтрэх рүү очих</Button>
        </div>
      </Card>
    </InfoFrame>
  );
}

export function NotFoundPage() {
  return (
    <InfoFrame narrow>
      <Card className="p-8 text-center">
        <h1 className="text-3xl font-bold text-foreground">Хуудас олдсонгүй</h1>
        <p className="mt-3 leading-7 text-muted-foreground">
          Энэ хаягт тохирох хуудас байхгүй байна. Нүүр эсвэл чиглэл хайлтаас үргэлжлүүлээрэй.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => window.location.href = '/'}>Нүүр</Button>
          <Button variant="outline" onClick={() => window.location.href = '/auth/register'}>Бүртгүүлэх</Button>
        </div>
      </Card>
    </InfoFrame>
  );
}

export function LegalPage({ type }: { type: 'terms' | 'privacy' }) {
  const isTerms = type === 'terms';
  return (
    <InfoFrame>
      <PageHero
        icon={isTerms ? <FileText /> : <ShieldCheck />}
        eyebrow={isTerms ? 'Үйлчилгээний нөхцөл' : 'Нууцлалын бодлого'}
        title={isTerms ? 'Платформ ашиглах үндсэн нөхцөл' : 'Хэрэглэгчийн мэдээлэл хамгаалах зарчим'}
      />
      <div className="mt-8 grid gap-4">
        {(isTerms ? terms : privacy).map((item) => (
          <Card key={item.title} className="p-6">
            <h2 className="text-xl font-semibold text-foreground">{item.title}</h2>
            <p className="mt-3 leading-7 text-muted-foreground">{item.text}</p>
          </Card>
        ))}
      </div>
    </InfoFrame>
  );
}

const terms = [
  { title: 'Платформын үүрэг', text: 'NuudelchinTrip нь аялагч болон жолоочийг холбох технологийн платформ бөгөөд шууд тээврийн үйлчилгээ үзүүлэгч биш.' },
  { title: 'Хэрэглэгчийн үүрэг', text: 'Чиглэл, pickup/dropoff, суудал, үнэ, төлбөрийн нотолгоо, profile мэдээллээ үнэн зөв оруулах шаардлагатай.' },
  { title: 'Маргаан шийдвэрлэх', text: 'Төлбөрийн баримт, аяллын төлөв, chat тэмдэглэл, admin шалгалтын мэдээлэл дээр үндэслэн маргааныг ангилж шийдвэрлэнэ.' },
];

const privacy = [
  { title: 'Цуглуулах мэдээлэл', text: 'Бүртгэл, утас, role, route, booking, proof, review зэрэг үйлчилгээ үзүүлэхэд хэрэгтэй мэдээллийг хадгална.' },
  { title: 'Ашиглах зорилго', text: 'Хэрэглэгч тааруулах, аюулгүй байдлыг шалгах, төлбөрийн proof баталгаажуулах, дэмжлэг үзүүлэхэд ашиглана.' },
  { title: 'Хандалтын зарчим', text: 'Role бүр зөвхөн өөрт хамаарах dashboard, booking, proof мэдээлэлд хандах ёстой.' },
];

function PageHero({ icon, eyebrow, title }: { icon: ReactNode; eyebrow: string; title: string }) {
  return (
    <section className="rounded-lg border border-border bg-card p-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <Badge variant="info" className="mt-6">{eyebrow}</Badge>
      <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight text-foreground">{title}</h1>
    </section>
  );
}

function InfoFrame({ children, narrow = false }: { children: ReactNode; narrow?: boolean }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className={`${narrow ? 'max-w-xl' : 'max-w-7xl'} mx-auto px-4 py-10 sm:px-6 lg:px-8`}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
