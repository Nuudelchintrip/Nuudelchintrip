import { useState } from 'react';
import { ArrowLeft, ArrowRight, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Input } from '../components/Input';
import { Logo } from '../components/Logo';
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
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <a
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Нүүр хуудас
        </a>

        <div className="mb-7 flex justify-center">
          <Logo size="lg" />
        </div>

        <Card>
          <CardBody className="p-6 sm:p-8">
            <div className="mb-7">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Админ нэвтрэх</h1>
              <p className="mt-2 text-muted-foreground">
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

              <div className="relative">
                <Input
                  type="password"
                  autoComplete="current-password"
                  label="Нууц үг"
                  placeholder="Нууц үгээ оруулна уу"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <LockKeyhole className="absolute bottom-3 right-4 h-5 w-5 text-muted-foreground" />
              </div>

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
