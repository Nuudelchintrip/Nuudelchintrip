import { useRef, useState, type ReactNode } from 'react';
import { ArrowRight, CheckCircle2, FileText, HelpCircle, LockKeyhole, Mail, MapPin, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Footer } from '../components/Footer';
import { Input } from '../components/Input';
import { Navbar } from '../components/Navbar';
import { PublicBackLink } from '../components/PublicBackLink';
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
    ['NuudelchinTrip ямар үйлчилгээ вэ?', 'NuudelchinTrip нь орон нутаг руу нэг чиглэлд явах аялагчийг сул суудалтай жолоочтой холбох платформ. Платформ өөрөө тээврийн компани биш бөгөөд чиглэл, үнэ, суудал, хүсэлт, төлбөрийн баримт, аяллын төлөвийг нэг дор удирдах боломж олгоно.'],
    ['Аялагч хэрхэн суудал захиалах вэ?', 'Аялагч нэвтэрч суух болон буух байршил, огноо, хүний тоогоор чиглэл хайна. Тохирох жолоочийн мэдээлэл, үнэ, сул суудлыг шалгаад хүсэлт илгээж, жолооч зөвшөөрсний дараа төлбөрийн алхамд шилжинэ.'],
    ['Жолооч чиглэлээ хэрхэн нийтлэх вэ?', 'Жолооч утас, жолооны үнэмлэх болон машины мэдээллээ баталгаажуулсны дараа явах чиглэл, огноо, цаг, сул суудал, нэг хүний үнэ болон дайвар ачаа авах эсэхээ оруулж нийтэлнэ.'],
    ['Үйлчилгээний шимтгэл хэрхэн тооцогдох вэ?', 'Аялал болон дайвар ачааны тохиролцсон нийт үнийн 10%-ийг үйлчилгээний шимтгэлд суутгана. Энэ шимтгэлийг хэрэглэгчийн төлөх дүн дээр нэмж тооцохгүй. Төлбөр хийхээс өмнө нийт үнэ, шимтгэл, жолоочид шилжих дүн тус тусдаа харагдана.'],
    ['Төлбөр яаж баталгаажих вэ?', 'Аялагч платформын заасан төлбөрийн сувгаар төлөөд баримтын зураг эсвэл гүйлгээний код оруулна. Админ баримтыг шалгаж зөвшөөрсний дараа захиалга баталгаажсан төлөвт шилжинэ.'],
    ['Захиалга цуцлагдвал яах вэ?', 'Цуцлах боломж болон буцаан олголтыг захиалгын одоогийн төлөв, төлбөр баталгаажсан эсэх, аялал эхэлсэн эсэхэд үндэслэн шийднэ. Маргаантай тохиолдолд хэрэглэгч тусламжийн хүсэлт илгээж админаар шалгуулна.'],
    ['Дайвар ачаа хэрхэн ажиллах вэ?', 'Дайвар ачаа нь тусдаа тээвэр биш, жолоочийн нийтэлсэн чиглэл дээрх нэмэлт боломж. Ачаа илгээгч зөвхөн “дайвар ачаа авч болно” гэж тэмдэглэсэн чиглэлд хүсэлт илгээж, хэмжээ, жин, хүлээн авагчийн мэдээллээ бүртгэнэ.'],
    ['Асуудал гарвал хаана хандах вэ?', 'Тусламжийн хуудсаар захиалгын дугаар, асуудлын төрөл, дэлгэрэнгүй тайлбараа илгээнэ. Төлбөрийн баримт, аяллын төлөв болон системийн үйлдлийн түүхийг шалгасны дараа админ хариу өгнө.'],
  ];

  return (
    <InfoFrame showBack>
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
  const startedAt = useRef(Date.now());
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async () => {
    setError('');
    setSuccess('');
    if (message.trim().length < 10) {
      setError('Асуудлаа дор хаяж 10 тэмдэгтээр дэлгэрэнгүй бичнэ үү.');
      return;
    }
    setBusy(true);
    try {
      await submitSupportRequest({
        name,
        phone,
        bookingRef,
        category,
        message,
        website,
        startedAt: startedAt.current,
      });
      setSuccess('Таны хүсэлт амжилттай илгээгдлээ. Бид удахгүй холбогдоно.');
      setName('');
      setPhone('');
      setBookingRef('');
      setCategory('');
      setMessage('');
      setWebsite('');
      startedAt.current = Date.now();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Хүсэлт илгээхэд алдаа гарлаа.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <InfoFrame showBack>
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
            maxLength={4000}
          />
          <div className="sr-only" aria-hidden="true">
            <label htmlFor="support-website">Website</label>
            <input
              id="support-website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
          </div>
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
      setError('Одоогоор нууц үг сэргээх зөвхөн и-мэйлээр илгээгдэнэ.');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(email.trim());
      setStatus('Нууц үг сэргээх холбоос таны и-мэйл рүү илгээгдлээ. Ирсэн имэйл болон спам хавтсаа шалгаарай.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Нууц үг сэргээх имэйл илгээхэд алдаа гарлаа.');
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
    <InfoFrame showBack>
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
  { title: 'Платформын зориулалт', text: 'NuudelchinTrip нь аялагч, жолооч болон чиглэл дээр суурилсан дайвар ачааны хүсэлтийг холбох технологийн платформ. Платформ нь өөрөө тээврийн үйлчилгээ үзүүлэгч биш бөгөөд хэрэглэгчдийн оруулсан чиглэл, хүсэлт, төлөв, төлбөрийн нотолгоог удирдах орчин бүрдүүлнэ.' },
  { title: 'Бүртгэл ба баталгаажуулалт', text: 'Хэрэглэгч нэр, утас, и-мэйл болон өөрийн сонгосон төрлийн мэдээллээ үнэн зөв бүртгүүлнэ. Жолооч чиглэл нийтлэхийн өмнө жолооны үнэмлэх, машины мэдээллээ админаар шалгуулсан байна. Бусдын мэдээлэл ашиглах, хуурамч баримт оруулахыг хориглоно.' },
  { title: 'Чиглэл ба захиалгын мэдээлэл', text: 'Жолооч явах чиглэл, огноо, цаг, суудал, үнэ, суух болон буух мэдээллээ тодорхой оруулна. Аялагч захиалгын хүний тоо, сонгосон суудал болон холбоо барих мэдээллээ шалгаж хүсэлт илгээнэ. Хоёр тал аяллын өмнө тохиролцсон мэдээллээ дахин нягтална.' },
  { title: 'Төлбөр ба үйлчилгээний шимтгэл', text: 'Аялал болон дайвар ачааны тохиролцсон нийт үнийн 10%-ийг үйлчилгээний шимтгэлд суутгана. Шимтгэлийг хэрэглэгчийн төлөх дүн дээр нэмэхгүй. Аялагч эсвэл ачаа илгээгч төлбөрөө заасан сувгаар шилжүүлж, баримтаа оруулна. Админ төлбөрийн баримтыг баталгаажуулсны дараа захиалга баталгаажсан төлөвт шилжинэ.' },
  { title: 'Цуцлалт ба буцаан олголт', text: 'Цуцлалт болон буцаан олголтыг захиалгын төлөв, төлбөр баталгаажсан эсэх, аялал эхэлсэн эсэх болон цуцалсан талын шалтгаанд үндэслэн шалгана. Төлбөртэй холбоотой хүсэлтийг баримт, захиалгын түүх болон хоёр талын тайлбарт тулгуурлан админ шийдвэрлэнэ.' },
  { title: 'Дайвар ачааны нөхцөл', text: 'Дайвар ачаа нь зөвхөн жолоочийн зөвшөөрсөн чиглэл дээр үүснэ. Илгээгч ачааны төрөл, хэмжээ, жин, хүлээн авагчийн мэдээллийг үнэн зөв мэдүүлж, хориглосон ачааны дүрмийг зөвшөөрсөн байна. Хууль бус, аюултай эсвэл буруу мэдүүлсэн ачааг хүлээн авахгүй.' },
  { title: 'Маргаан, гомдол шийдвэрлэх', text: 'Хэрэглэгч тусламжийн хэсгээр захиалгын дугаар болон нотлох мэдээллээ хавсарган хүсэлт гаргана. Админ төлбөрийн баримт, аяллын төлөв, харилцан тохиролцсон мэдээлэл, системийн үйлдлийн түүхийг шалгаж шийдвэрлэнэ.' },
  { title: 'Бүртгэл түдгэлзүүлэх', text: 'Хуурамч мэдээлэл, залилангийн шинжтэй үйлдэл, бусдын эрхэд халдсан хэрэглээ, хориглосон ачаа, давтан зөрчил илэрвэл бүртгэлийг түр түдгэлзүүлэх эсвэл ашиглах эрхийг хязгаарлаж болно.' },
  { title: 'Хариуцлагын хязгаар', text: 'Платформ нь хэрэглэгчдийг холбож, мэдээлэл болон нотолгоог хадгалах дэд бүтэц өгнө. Аяллын бодит гүйцэтгэл, тээврийн хэрэгслийн бүрэн бүтэн байдал, замын хөдөлгөөний дүрэм болон хэрэглэгчдийн хувийн тохиролцооны хариуцлагыг холбогдох талууд өөрсдөө хүлээнэ.' },
];

const privacy = [
  { title: 'Бид ямар мэдээлэл цуглуулах вэ?', text: 'Бүртгэлийн нэр, утас, и-мэйл, хэрэглэгчийн төрөл, профайл зураг, баталгаажуулалтын мэдээлэл, чиглэл, захиалга, төлбөрийн баримт, үнэлгээ, гомдол болон үйлчилгээ ашигласан үйлдлийн түүхийг шаардлагатай хэмжээнд хадгална.' },
  { title: 'Мэдээллийг ямар зорилгоор ашиглах вэ?', text: 'Хэрэглэгчийн бүртгэл үүсгэх, тохирох чиглэл харуулах, захиалга боловсруулах, жолооч баталгаажуулах, төлбөр шалгах, мэдэгдэл хүргэх, тусламж үзүүлэх, маргаан шийдвэрлэх болон платформын аюулгүй байдлыг хамгаалахад ашиглана.' },
  { title: 'Хэн ямар мэдээлэл харах вэ?', text: 'Нийтийн профайл дээр зөвхөн нэр, үнэлгээ, дууссан аяллын мэдээлэл болон баталгаажсан тэмдэг зэрэг итгэлцэлд шаардлагатай мэдээлэл харагдана. Утас, и-мэйл, бичиг баримт, төлбөрийн баримт зэрэг хувийн мэдээллийг зөвхөн эрх бүхий хэрэглэгч болон админ үзнэ.' },
  { title: 'Хандалтын хамгаалалт', text: 'Хэрэглэгч өөрт хамаарах профайл, захиалга, ачаа болон баримтын мэдээлэлд л хандана. Хувийн файл хамгаалагдсан хадгалах санд байрлаж, хугацаатай холбоос болон эрхийн шалгалтаар дамжин нээгдэнэ.' },
  { title: 'Мэдээлэл хуваалцах нөхцөл', text: 'Үйлчилгээ үзүүлэхэд зайлшгүй шаардлагатайгаас бусад тохиолдолд хувийн мэдээллийг бусдад худалдахгүй. Хуульд заасан шаардлага, хэрэглэгчийн зөвшөөрөл эсвэл аюулгүй байдлын ноцтой асуудал гарсан үед эрх бүхий байгууллагад мэдээлэл өгөх боломжтой.' },
  { title: 'Мэдээлэл хадгалах хугацаа', text: 'Бүртгэл идэвхтэй байх хугацаанд үйлчилгээ үзүүлэхэд шаардлагатай мэдээллийг хадгална. Төлбөр, маргаан, аюулгүй байдлын нотолгоог холбогдох асуудал бүрэн шийдэгдэх хүртэл хадгалж болно.' },
  { title: 'Хэрэглэгчийн сонголт ба эрх', text: 'Хэрэглэгч хувийн мэдээллээ харах, засах, мэдэгдлийн тохиргоогоо өөрчлөх болон бүртгэл устгуулах хүсэлт гаргах боломжтой. Идэвхтэй захиалга, төлбөр эсвэл шийдэгдээгүй маргаан байгаа бол устгах хүсэлтийг асуудал дууссаны дараа гүйцэтгэнэ.' },
  { title: 'Холбоо барих', text: 'Нууцлал, мэдээллийн засвар, хандалт эсвэл устгалтай холбоотой хүсэлтийг тусламжийн хуудсаар эсвэл contact@nuudelchintrip.com хаягаар илгээнэ.' },
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

function InfoFrame({ children, narrow = false, showBack = false }: { children: ReactNode; narrow?: boolean; showBack?: boolean }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className={`${narrow ? 'max-w-xl' : 'max-w-7xl'} mx-auto px-4 py-10 sm:px-6 lg:px-8`}>
        {showBack && (
          <div className="mb-5">
            <PublicBackLink />
          </div>
        )}
        {children}
      </main>
      <Footer />
    </div>
  );
}
