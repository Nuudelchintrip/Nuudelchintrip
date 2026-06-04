import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Car, Mail, Package, Phone, UserRound } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Input } from '../components/Input';
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
      await registerWithSupabase({
        role,
        fullName: fullName.trim(),
        phone,
        email: email.trim(),
        password,
      });
      window.location.href = '/auth/verify-phone';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Бүртгэл үүсгэхэд алдаа гарлаа.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center overflow-x-hidden bg-background px-4 py-12">
      <div className="min-w-0 max-w-3xl" style={{ width: 'min(100%, calc(100vw - 3rem))' }}>
        <a href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          Буцах
        </a>

        <a href="/" className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary">
            <span className="text-xl font-bold text-primary-foreground">N</span>
          </div>
          <span className="text-2xl font-bold text-foreground">NuudelchinTrip</span>
        </a>

        <Card className="min-w-0 max-w-full overflow-hidden">
          <CardBody className="min-w-0 p-5 md:p-8">
            <div className="mb-7">
              <h1 className="mb-2 text-3xl font-bold text-foreground">Бүртгүүлэх</h1>
              <p className="text-muted-foreground">Ашиглах төрлөө сонгоод үндсэн мэдээллээ оруулна уу.</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
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
                        className={`w-full min-w-0 rounded-lg border p-4 text-left transition-all hover:-translate-y-0.5 ${
                          selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card hover:border-primary/50'
                        }`}
                      >
                        <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${
                          selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          {type.icon}
                        </div>
                        <p className="font-semibold text-foreground">{type.title}</p>
                        <p className="mt-1 break-words text-sm leading-6 text-muted-foreground">{type.description}</p>
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
                <Input type="password" label="Нууц үг" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} />
                <Input type="password" label="Нууц үг баталгаажуулах" placeholder="••••••••" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
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
