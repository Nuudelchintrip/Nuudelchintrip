import { useState } from 'react';
import { ArrowLeft, ArrowRight, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Input } from '../components/Input';
import { Logo } from '../components/Logo';
import { loginWithSupabase } from '../services/supabaseAuth';
import { addActionLog, getDashboardPath } from '../utils/auth';

function getLoginErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  const lower = message.toLowerCase();

  if (lower.includes('invalid login credentials')) {
    return 'И-мэйл эсвэл нууц үг буруу байна. Нууц үгээ мартсан бол сэргээх холбоос авна уу.';
  }
  if (lower.includes('email not confirmed')) {
    return 'И-мэйл баталгаажаагүй байна. И-мэйл дээр ирсэн баталгаажуулах холбоосоо шалгаарай.';
  }
  if (lower.includes('auth session missing')) {
    return 'Нэвтрэлтийн session олдсонгүй. Дахин нэвтэрнэ үү.';
  }

  return message || 'Нэвтрэхэд алдаа гарлаа.';
}

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason');
  const next = searchParams.get('next');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <a href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" />
          Буцах
        </a>

        <a href="/" className="mb-8 flex justify-center" aria-label="NuudelchinTrip нүүр">
          <Logo size="lg" />
        </a>

        <Card>
          <CardBody className="p-8">
            <div className="mb-7">
              <h1 className="text-3xl font-bold text-foreground mb-2">Нэвтрэх</h1>
              <p className="text-muted-foreground">
                Захиалга, чиглэл, төлбөрийн явцаа нэг dashboard-аас хянаарай.
              </p>
            </div>

            {reason && (
              <div className="mb-5 rounded-lg border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm font-medium text-foreground">{reason}</p>
                <p className="mt-1 text-sm text-muted-foreground">Нэвтэрсний дараа таны төрлөөс хамаарсан самбар руу шилжинэ.</p>
              </div>
            )}

            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setError('');

                if (!email.trim()) return setError('И-мэйл оруулна уу.');
                if (!password) return setError('Нууц үг оруулна уу.');

                setIsSubmitting(true);
                try {
                  const profile = await loginWithSupabase(email.trim(), password);
                  addActionLog({
                    actor: profile.full_name || email.trim(),
                    user: profile.full_name || email.trim(),
                    actionType: 'Нэвтрэх',
                    status: 'Амжилттай',
                    details: 'Хэрэглэгч системд амжилттай нэвтэрсэн.',
                  });
                  window.location.href = next || getDashboardPath(profile.role);
                } catch (err) {
                  const message = getLoginErrorMessage(err);
                  addActionLog({
                    actor: email.trim() || 'Тодорхойгүй хэрэглэгч',
                    user: email.trim() || 'Тодорхойгүй хэрэглэгч',
                    actionType: 'Нэвтрэх',
                    status: 'Амжилтгүй',
                    details: message,
                  });
                  setError(message);
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <div className="relative">
                <Input type="email" label="И-мэйл хаяг" placeholder="name@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
                <Mail className="absolute right-4 bottom-3 w-5 h-5 text-muted-foreground" />
              </div>

              <div className="relative">
                <Input type="password" label="Нууц үг" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} />
                <LockKeyhole className="absolute right-4 bottom-3 w-5 h-5 text-muted-foreground" />
              </div>

              <div className="flex items-center justify-between gap-3 text-sm">
                <label className="flex items-center gap-2 cursor-pointer text-foreground">
                  <input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                  Намайг санах
                </label>
                <a href="/forgot-password" className="text-primary hover:underline">
                  Нууц үг мартсан?
                </a>
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
                  {error}
                </div>
              )}

              <Button variant="primary" size="lg" fullWidth type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Нэвтэрч байна...' : 'Нэвтрэх'}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </form>

            <div className="mt-6 rounded-lg bg-primary/5 border border-primary/20 p-4 flex gap-3">
              <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Нэвтэрсний дараа таны хэрэглэгчийн төрөлд тохирсон самбар болон хайлтын хэсэг нээгдэнэ.
              </p>
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Бүртгэлгүй юу?{' '}
              <a href="/auth/register" className="text-primary hover:underline font-medium">
                Бүртгүүлэх
              </a>
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
