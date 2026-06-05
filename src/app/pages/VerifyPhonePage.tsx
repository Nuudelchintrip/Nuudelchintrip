import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Clock3, MessageSquareText, RefreshCw } from 'lucide-react';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Input } from '../components/Input';
import { markPhoneVerified } from '../services/supabaseAuth';
import { addActionLog, formatMongoliaPhone, getOnboardingPath, getStoredUser, isValidMongoliaPhone } from '../utils/auth';

const DEMO_OTP_CODE = '123456';
const OTP_SECONDS = 60;

export function VerifyPhonePage() {
  const user = getStoredUser();
  const [phone, setPhone] = useState(user?.phone || '+976 ');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(OTP_SECONDS);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const isExpired = otpSent && secondsLeft <= 0 && !success;

  useEffect(() => {
    if (!otpSent || success || secondsLeft <= 0) return undefined;

    const intervalId = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [otpSent, secondsLeft, success]);

  const handleSendOtp = () => {
    setError('');
    setSuccess('');

    if (!isValidMongoliaPhone(phone)) {
      setError('Утасны дугаар +976 форматтай, 8 оронтой байх ёстой.');
      return;
    }

    setOtp('');
    setOtpSent(true);
    setSecondsLeft(OTP_SECONDS);
    addActionLog({
      actor: user?.full_name || phone,
      user: user?.full_name || phone,
      actionType: 'OTP код хүссэн',
      status: 'Амжилттай',
      details: `${formatMongoliaPhone(phone)} дугаар руу туршилтын код илгээсэн төлөв үүсэв.`,
    });
  };

  const handleVerify = async () => {
    setError('');
    setSuccess('');

    if (!otpSent) {
      setError('Эхлээд код авах товчийг дарна уу.');
      return;
    }

    if (isExpired) {
      setError('Кодын хугацаа дууссан байна. Дахин код авна уу.');
      addActionLog({
        actor: user?.full_name || phone,
        user: user?.full_name || phone,
        actionType: 'OTP баталгаажуулалт',
        status: 'Амжилтгүй',
        details: 'Кодын хугацаа дууссан.',
      });
      return;
    }

    if (otp !== DEMO_OTP_CODE) {
      setError('Код буруу байна. 6 оронтой кодоо шалгаад дахин оруулна уу.');
      addActionLog({
        actor: user?.full_name || phone,
        user: user?.full_name || phone,
        actionType: 'OTP баталгаажуулалт',
        status: 'Амжилтгүй',
        details: 'Хэрэглэгч буруу OTP код оруулсан.',
      });
      return;
    }

    const nextUser = await markPhoneVerified();
    addActionLog({
      actor: nextUser.full_name || phone,
      user: nextUser.full_name || phone,
      actionType: 'Утас баталгаажуулалт',
      status: 'Амжилттай',
      details: `${formatMongoliaPhone(phone)} дугаар баталгаажсан.`,
    });
    setSuccess('Утас амжилттай баталгаажлаа. Дараагийн алхам руу шилжиж байна.');
    window.setTimeout(() => {
      window.location.href = getOnboardingPath(nextUser.role);
    }, 700);
  };

  return (
    <div className="flex min-h-screen items-center justify-center overflow-x-hidden bg-background px-4 py-10 sm:py-12">
      <div className="min-w-0 sm:w-full sm:max-w-lg" style={{ width: '20rem', maxWidth: 'calc(100vw - 2rem)' }}>
        <a href="/auth/register" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          Бүртгэл рүү буцах
        </a>

        <a href="/" className="mb-8 flex min-w-0 items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary">
            <span className="text-xl font-bold text-primary-foreground">N</span>
          </div>
          <span className="min-w-0 text-2xl font-bold text-foreground">NuudelchinTrip</span>
        </a>

        <Card className="box-border w-full max-w-full overflow-hidden">
          <CardBody className="p-5 sm:p-8">
            <div className="mb-7 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MessageSquareText className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Утас баталгаажуулах</h1>
              <p className="mx-auto mt-3 max-w-[30ch] break-words text-sm leading-7 text-muted-foreground sm:max-w-sm sm:text-base">
                Таны дугаар руу илгээсэн 6 оронтой кодыг оруулна уу. Бодит SMS дараагийн шатанд холбогдоно.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid min-w-0 gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <Input
                  label="Утасны дугаар"
                  value={phone}
                  onChange={(event) => setPhone(formatMongoliaPhone(event.target.value))}
                  inputMode="tel"
                  placeholder="+976 80883461"
                />
                <Button type="button" variant="outline" className="w-full sm:h-12 sm:w-auto" onClick={handleSendOtp}>
                  {otpSent ? <RefreshCw className="h-4 w-4" /> : <MessageSquareText className="h-4 w-4" />}
                  {otpSent ? 'Дахин код авах' : 'Код авах'}
                </Button>
              </div>

              <Input
                label="6 оронтой код"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                placeholder="123456"
              />

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock3 className="h-4 w-4" />
                    <span>{otpSent ? `Код дахин авах: ${Math.max(secondsLeft, 0)} сек` : 'Код авахад 60 секундийн хугацаа эхэлнэ'}</span>
                  </div>
                  <span className="rounded-lg bg-card px-3 py-2 font-mono text-sm font-semibold text-foreground">
                    Туршилтын код: {DEMO_OTP_CODE}
                  </span>
                </div>
              </div>

              {isExpired && (
                <div className="flex gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm font-medium text-warning">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  Кодын хугацаа дууссан байна. Дахин код аваад баталгаажуулна уу.
                </div>
              )}

              {error && (
                <div className="flex gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {success && (
                <div className="flex gap-3 rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm font-medium text-success">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  {success}
                </div>
              )}

              <Button type="button" size="lg" fullWidth onClick={handleVerify}>
                Баталгаажуулах
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
