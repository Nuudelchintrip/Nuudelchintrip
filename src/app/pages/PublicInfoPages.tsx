import { useState, type ReactNode } from 'react';
import { ArrowRight, CheckCircle2, FileText, HelpCircle, LockKeyhole, Mail, MapPin, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Footer } from '../components/Footer';
import { Input } from '../components/Input';
import { Navbar } from '../components/Navbar';
import { sendPasswordResetEmail, updatePasswordWithRecovery } from '../services/supabaseAuth';
import { submitSupportRequest } from '../services/supportService';

const values = [
  'NuudelchinTrip нь тээврийн компани биш, аялагч болон жолоочийг ил тод мэдээллээр холбох платформ.',
  'Гол урсгал нь унаа хайж буй аялагч, сул суудалтай жолооч хоёрыг тохирох хүсэлтээр тааруулах.',
  'Төлбөрийн баримт, баталгаажсан тэмдэг, үнэлгээ, гомдол илгээх боломж нь итгэлцлийн давхарга болж ажиллана.',
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
            Дайвар ачаа нь жолоочийн чиглэл дээр суурилсан нэмэлт боломж байна.
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
          <h2 className="text-xl font-semibold text-foreground">Одоогийн бүтээгдэхүүний хүрээ</h2>
          <div className="mt-5 grid gap-4">
            {[
              ['Аялагч', 'Нэвтэрсний дараа жолоочийн чиглэл хайж, суудлын хүсэлт илгээнэ.'],
              ['Жолооч', 'Баталгаажсаны дараа чиглэл нийтэлж, ирсэн хүсэлтүүдээ шийднэ.'],
              ['Дайвар ачаа', 'Зөвхөн ачаа авах боломжтой чиглэл дээр хүсэлт үүснэ.'],
              ['Админ', 'Баталгаажуулалт, төлбөрийн баримт, гомдлуудыг шалгана.'],
            ].map(([title, text]) => (
              <div key={title} className="rounded-lg bg-muted/40 p-4">
                <p className="font-semibold text-primary">{title}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
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
    ['Энэ платформ яг юу хийдэг вэ?', 'Нэг чиглэлд явах аялагч, жолоочийг чиглэл, хүсэлт, баталгаажуулалт, үнэлгээгээр холбодог.'],
    ['Ачаа гол үйлчилгээ мөн үү?', 'Үгүй. Гол урсгал нь аялагч болон жолоочийн холбоос. Ачаа нь жолоочийн чиглэл дээр суурилсан нэмэлт боломж.'],
    ['Төлбөр яаж баталгаажих вэ?', 'Эхний хувилбарт банк эсвэл QPay төлбөрийн баримт оруулж, админ баталгаажуулсны дараа дараагийн алхам нээгдэнэ.'],
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
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async () => {
    setError('');
    setSuccess('');
    if (!message.trim()) {
      setError('Асуудлаа дэлгэрэнгүй бичнэ үү.');
      return;
    }
    setBusy(true);
    try {
      await submitSupportRequest({ name, phone, bookingRef, category, message });
      setSuccess('Таны хүсэлт амжилттай илгээгдлээ. Бид удахгүй холбогдоно.');
      setName('');
      setPhone('');
      setBookingRef('');
      setCategory('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Хүсэлт илгээхэд алдаа гарлаа.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <InfoFrame>
      <PageHero icon={<MessageCircle />} eyebrow="Дэмжлэг" title="Асуудал гарвал нэг газраас шийдүүлнэ" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Нэр" placeholder="Таны нэр" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Утас" placeholder="+976 9999 9999" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input label="Захиалгын дугаар" placeholder="Захиалгын дугаар" value={bookingRef} onChange={(e) => setBookingRef(e.target.value)} />
            <Input label="Асуудлын төрөл" placeholder="Төлбөр, баримт, чиглэл..." value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <label className="mt-4 block text-sm font-medium text-foreground">Дэлгэрэнгүй</label>
          <textarea
            className="mt-2 min-h-36 w-full rounded-lg border border-input bg-input-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-ring"
            placeholder="Юу болсон талаар бичнэ үү"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          {error && <p className="mt-3 text-sm font-medium text-destructive">{error}</p>}
          {success && <p className="mt-3 text-sm font-medium text-success">{success}</p>}
          <Button className="mt-5" disabled={busy} onClick={submit}>
            {busy ? 'Илгээж байна...' : 'Дэмжлэг рүү илгээх'}
          </Button>
        </Card>
        <div className="space-y-4">
          {[
            [<Phone className="h-5 w-5" />, 'Утас', 'Бүртгэлтэй захиалгын дараа харагдана'],
            [<Mail className="h-5 w-5" />, 'И-мэйл', 'contact@nuudelchintrip.com'],
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
          Бүртгэлтэй и-мэйлээ оруулна. Нууц үг сэргээх холбоос ирсний дараа шинэ нууц үг тохируулна.
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
  { title: 'Платформын үүрэг', text: 'NuudelchinTrip нь аялагч болон жолоочийг холбох технологийн платформ бөгөөд шууд тээврийн үйлчилгээ үзүүлэгч биш. Жолооч өөрийн тээврийн хэрэгсэл, аяллын аюулгүй байдлыг бие даан хариуцна.' },
  { title: 'Хэрэглэгчийн үүрэг', text: 'Чиглэл, авах болон буулгах цэг, суудал, үнэ, төлбөрийн нотолгоо, профайл мэдээллээ үнэн зөв оруулах шаардлагатай. Худал мэдээлэл, хуурамч баримт оруулсан бүртгэлийг түдгэлзүүлнэ.' },
  { title: 'Төлбөр ба шимтгэл', text: 'Аялагч төлбөрөө платформын зарласан данс руу шилжүүлж, баримтаа оруулна. Админ баталгаажуулсны дараа захиалга баталгаажна. Үйлчилгээний шимтгэлийг үнэ дээр нэмж тооцно.' },
  { title: 'Цуцлалт ба буцаалт', text: 'Аялагч аялал баталгаажихаас өмнө захиалгаа цуцалж болох ба суудал автоматаар чөлөөлөгдөнө. Төлбөр баталгаажсаны дараа цуцлах тохиолдолд маргааныг админ шалгаж, үндэслэлтэй бол төлбөрийг буцаана (refund). Жолоочийн буруугаас аялал болоогүй бол төлбөрийг бүтэн буцаана.' },
  { title: 'Маргаан шийдвэрлэх', text: 'Төлбөрийн баримт, аяллын төлөв, тэмдэглэл, үйлдлийн түүх (audit log), админы шалгалтын мэдээлэл дээр үндэслэн маргааныг ангилж шийдвэрлэнэ.' },
  { title: 'Хариуцлагын хязгаар', text: 'Платформ нь хэрэглэгчдийн хооронд үүссэн зөрчил, аялалын явцад гарсан хохирлыг шууд хариуцахгүй ч маргаан шийдвэрлэх, нотолгоо хадгалах үүргийг гүйцэтгэнэ.' },
];

const privacy = [
  { title: 'Цуглуулах мэдээлэл', text: 'Бүртгэл, утас, хэрэглэгчийн төрөл, чиглэл, захиалга, төлбөрийн баримт, бичиг баримт, үнэлгээ зэрэг үйлчилгээ үзүүлэхэд хэрэгтэй мэдээллийг хадгална.' },
  { title: 'Ашиглах зорилго', text: 'Хэрэглэгч тааруулах, аюулгүй байдлыг шалгах, төлбөрийн баримт баталгаажуулах, маргаан шийдвэрлэх, дэмжлэг үзүүлэхэд ашиглана.' },
  { title: 'Хандалтын зарчим', text: 'Хэрэглэгч бүр зөвхөн өөрт хамаарах самбар, захиалга, баримтын мэдээлэлд хандана. Бичиг баримт, төлбөрийн баримтыг хамгаалагдсан (signed URL) холбоосоор зөвхөн эзэмшигч болон админ үзнэ.' },
  { title: 'Хадгалалт ба устгал', text: 'Бичиг баримтыг хувийн (private) хадгалах сан дахь зөвхөн эзэмшигчийн хавтсанд байршуулна. Хэрэглэгч бүртгэлээ устгах хүсэлт гаргаж болох ба идэвхтэй захиалга байхгүй бол админ устгана.' },
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
