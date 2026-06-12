import { useState } from 'react';
import { ArrowLeft, ArrowRight, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Input } from '../components/Input';
import { Logo } from '../components/Logo';
import { PasswordInput } from '../components/PasswordInput';
import { ThemeToggle } from '../components/ThemeToggle';
import { loginWithSupabase, logoutFromSupabase } from '../services/supabaseAuth';

function getAdminLoginError(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    return 'И-мэйл эсвэл нууц үг буруу байна.';
  }
  if (normalized.includes('email not confirmed')) {
    return 'И-мэйл хаягаа баталгаажуулсны дараа нэвтэрнэ үү.';
  }

  return message || 'Админ нэвтрэлт амжилтгүй боллоо.';
}

export function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-3.5 py-6 sm:px-4 sm:py-10">
      <ThemeToggle className="fixed right-3 top-3 z-20 sm:right-5 sm:top-5" />
      <div className="w-full max-w-md">
        <a
          href="/"
          className="mb-4 inline-flex min-h-10 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary sm:mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Нүүр хуудас
        </a>

        <div className="mb-5 flex justify-center sm:mb-7">
          <Logo size="lg" />
        </div>

        <Card>
          <CardBody className="p-5 sm:p-8">
            <div className="mb-5 sm:mb-7">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary sm:mb-4 sm:h-11 sm:w-11">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Админ нэвтрэх</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
                NuudelchinTrip-ийн хяналтын самбарт зөвхөн админ эрхтэй хэрэглэгч нэвтэрнэ.
              </p>
            </div>

            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setError('');

                if (!email.trim()) {
                  setError('И-мэйл хаягаа оруулна уу.');
                  return;
                }
                if (!password) {
                  setError('Нууц үгээ оруулна уу.');
                  return;
                }

                setIsSubmitting(true);
                try {
                  const profile = await loginWithSupabase(email.trim(), password);
                  if (profile.role !== 'admin') {
                    await logoutFromSupabase();
                    setError('Энэ бүртгэл админ эрхгүй байна.');
                    return;
                  }

                  window.location.href = '/admin';
                } catch (loginError) {
                  setError(getAdminLoginError(loginError));
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <div className="relative">
                <Input
                  type="email"
                  autoComplete="email"
                  label="Админ и-мэйл"
                  placeholder="admin@nuudelchintrip.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <Mail className="absolute bottom-3 right-4 h-5 w-5 text-muted-foreground" />
              </div>

              <PasswordInput
                autoComplete="current-password"
                label="Нууц үг"
                placeholder="Нууц үгээ оруулна уу"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />

              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive"
                >
                  {error}
                </div>
              )}

              <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
                {isSubmitting ? 'Шалгаж байна...' : 'Админ самбарт нэвтрэх'}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Энгийн хэрэглэгч үү?{' '}
              <a href="/auth/login" className="font-medium text-primary hover:underline">
                Хэрэглэгчийн нэвтрэх хэсэг
              </a>
            </p>
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
