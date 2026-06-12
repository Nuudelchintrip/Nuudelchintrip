import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Car, Mail, Package, Phone, UserRound } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Input } from '../components/Input';
import { Logo } from '../components/Logo';
import { PasswordInput } from '../components/PasswordInput';
import { ThemeToggle } from '../components/ThemeToggle';
import { registerWithSupabase } from '../services/supabaseAuth';
import { formatMongoliaPhone, type MarketplaceRole } from '../utils/auth';

const accountTypes: {
  id: MarketplaceRole;
  title: string;
  description: string;
  icon: JSX.Element;
}[] = [
  {
    id: 'traveler',
    title: 'Аялагч',
    description: 'Орон нутаг руу явах жолооч хайж, суудал захиална.',
    icon: <UserRound className="h-5 w-5" />,
  },
  {
    id: 'driver',
    title: 'Жолооч',
    description: 'Чиглэл нийтэлж, сул суудалдаа аялагч авна.',
    icon: <Car className="h-5 w-5" />,
  },
  {
    id: 'cargo_sender',
    title: 'Дайвар ачаа',
    description: 'Жолоочийн нийтэлсэн чиглэл дээр жижиг дайвар ачаа илгээнэ.',
    icon: <Package className="h-5 w-5" />,
  },
];

export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const requestedRole = searchParams.get('role');
  const initialRole: MarketplaceRole = requestedRole === 'driver' || requestedRole === 'cargo_sender' ? requestedRole : 'traveler';
  const [role, setRole] = useState<MarketplaceRole>(initialRole);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+976 ');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!role) return setError('Ашиглах төрлөө сонгоно уу.');
    if (!fullName.trim()) return setError('Нэр оруулна уу.');
    if (!phone.replace(/\D/g, '').replace(/^976/, '')) return setError('Утасны дугаар оруулна уу.');
    if (!email.trim()) return setError('И-мэйл оруулна уу.');
    if (!password) return setError('Нууц үг оруулна уу.');
    if (password !== confirmPassword) return setError('Нууц үг таарахгүй байна.');
    if (!termsAccepted) return setError('Үйлчилгээний нөхцөл болон нууцлалын бодлогыг зөвшөөрнө үү.');

    setIsSubmitting(true);
    setError('');

    try {
      const result = await registerWithSupabase({
        role,
        fullName: fullName.trim(),
        phone,
        email: email.trim(),
        password,
      });
      if (result.status === 'email_confirmation_pending') {
        setPendingEmail(result.email);
        return;
      }
      window.location.href = '/auth/verify-phone';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Бүртгэл үүсгэхэд алдаа гарлаа.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pendingEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center overflow-x-hidden bg-background px-3.5 py-6 sm:px-4 sm:py-12">
        <ThemeToggle className="fixed right-3 top-3 z-20 sm:right-5 sm:top-5" />
        <div className="min-w-0" style={{ width: 'min(100%, 28rem)' }}>
          <a href="/" className="mb-8 flex justify-center" aria-label="NuudelchinTrip нүүр">
            <Logo size="md" />
          </a>
          <Card className="overflow-hidden">
            <CardBody className="p-6 text-center md:p-8">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Mail className="h-7 w-7" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-foreground">И-мэйлээ баталгаажуулна уу</h1>
              <p className="mx-auto max-w-sm break-words text-sm leading-7 text-muted-foreground">
                <span className="font-medium text-foreground">{pendingEmail}</span> хаяг руу баталгаажуулах холбоос илгээлээ.
                И-мэйл доторх холбоосыг дарж бүртгэлээ баталгаажуулаад утас баталгаажуулах алхам руу үргэлжлүүлнэ үү.
              </p>
              <p className="mt-4 text-xs text-muted-foreground">
                И-мэйл ирээгүй бол спам хавтсаа шалгана уу.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <a href="/auth/login">
                  <Button variant="outline" fullWidth type="button">Нэвтрэх хэсэг рүү очих</Button>
                </a>
                <button
                  type="button"
                  onClick={() => setPendingEmail('')}
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Өөр и-мэйлээр дахин бүртгүүлэх
                </button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center overflow-x-hidden bg-background px-3.5 py-6 sm:px-4 sm:py-12">
      <ThemeToggle className="fixed right-3 top-3 z-20 sm:right-5 sm:top-5" />
      <div className="w-full min-w-0 max-w-3xl">
        <a href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary sm:mb-6">
          <ArrowLeft className="h-4 w-4" />
          Буцах
        </a>

        <a href="/" className="mb-5 flex justify-center sm:mb-8" aria-label="NuudelchinTrip нүүр">
          <Logo size="md" />
        </a>

        <Card className="min-w-0 max-w-full overflow-hidden">
          <CardBody className="min-w-0 p-4 sm:p-5 md:p-8">
            <div className="mb-5 sm:mb-7">
              <h1 className="mb-1.5 text-2xl font-bold text-foreground sm:mb-2 sm:text-3xl">Бүртгүүлэх</h1>
              <p className="text-sm leading-6 text-muted-foreground sm:text-base">Ашиглах төрлөө сонгоод үндсэн мэдээллээ оруулна уу.</p>
            </div>

            <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="mb-3 block text-sm font-medium text-foreground">Ашиглах төрөл сонгох</label>
                <div className="grid min-w-0 gap-3 md:grid-cols-3">
                  {accountTypes.map((type) => {
                    const selected = role === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => {
                          setRole(type.id);
                          setError('');
                        }}
                        className={`flex w-full min-w-0 gap-3 rounded-lg border p-3 text-left transition-all hover:-translate-y-0.5 md:block md:p-4 ${
                          selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card hover:border-primary/50'
                        }`}
                      >
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg md:mb-3 md:h-10 md:w-10 ${
                          selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          {type.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">{type.title}</p>
                          <p className="mt-0.5 break-words text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">{type.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="relative">
                  <Input label="Нэр" placeholder="Таны нэр" value={fullName} onChange={(event) => setFullName(event.target.value)} />
                  <UserRound className="absolute bottom-3 right-4 h-5 w-5 text-muted-foreground" />
                </div>

                <div className="relative">
                  <Input
                    type="tel"
                    label="Утасны дугаар"
                    placeholder="+976 99999999"
                    value={phone}
                    onChange={(event) => setPhone(formatMongoliaPhone(event.target.value))}
                  />
                  <Phone className="absolute bottom-3 right-4 h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              <div className="relative">
                <Input type="email" label="И-мэйл" placeholder="name@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
                <Mail className="absolute bottom-3 right-4 h-5 w-5 text-muted-foreground" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <PasswordInput
                  label="Нууц үг"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <PasswordInput
                  label="Нууц үг баталгаажуулах"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>

              <label className="flex items-start gap-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(event) => setTermsAccepted(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span>
                  Би{' '}
                  <a href="/terms" className="text-primary hover:underline">үйлчилгээний нөхцөл</a>
                  {' '}болон{' '}
                  <a href="/privacy" className="text-primary hover:underline">нууцлалын бодлогыг</a>
                  {' '}зөвшөөрч байна.
                </span>
              </label>

              {error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
                  {error}
                </div>
              )}

              <Button variant="primary" size="lg" fullWidth type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Бүртгэл үүсгэж байна...' : 'Бүртгэл үүсгээд үргэлжлүүлэх'}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Аль хэдийн бүртгэлтэй юу?{' '}
              <a href="/auth/login" className="font-medium text-primary hover:underline">Нэвтрэх</a>
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
