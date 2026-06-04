import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock3, Copy, MessageSquareText, ShieldCheck } from 'lucide-react';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { markPhoneVerified } from '../services/supabaseAuth';
import { getOnboardingPath, getStoredUser } from '../utils/auth';

const VERIFY_SHORT_CODE = '144773';
const DEMO_SMS_TEXT = 'NT 1234';

export function VerifyPhonePage() {
  const user = getStoredUser();
  const [status, setStatus] = useState<'idle' | 'waiting' | 'verified'>('idle');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(DEMO_SMS_TEXT);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const handleCheckStatus = async () => {
    if (status === 'idle') {
      setStatus('waiting');
      return;
    }

    const nextUser = await markPhoneVerified();
    setStatus('verified');
    window.setTimeout(() => {
      window.location.href = getOnboardingPath(nextUser.role);
    }, 700);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        <a href="/auth/register" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          Бүртгэл рүү буцах
        </a>

        <a href="/" className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary">
            <span className="text-xl font-bold text-primary-foreground">N</span>
          </div>
          <span className="text-2xl font-bold text-foreground">NuudelchinTrip</span>
        </a>

        <Card>
          <CardBody className="p-8">
            <div className="mb-7 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MessageSquareText className="h-7 w-7" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Утас баталгаажуулах</h1>
              <p className="mt-3 leading-7 text-muted-foreground">
                {user?.phone || '+976 XXXXXXXX'} дугаараасаа доорх текстийг {VERIFY_SHORT_CODE} богино дугаар руу SMS-ээр илгээнэ үү.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
                <p className="text-sm font-medium text-muted-foreground">Илгээх дугаар</p>
                <p className="mt-1 text-3xl font-bold tracking-wide text-foreground">{VERIFY_SHORT_CODE}</p>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-5">
                <p className="text-sm font-medium text-muted-foreground">SMS текст</p>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="rounded-lg bg-card px-4 py-3 font-mono text-2xl font-bold tracking-widest text-foreground">
                    {DEMO_SMS_TEXT}
                  </p>
                  <Button type="button" variant="outline" onClick={handleCopy}>
                    <Copy className="h-4 w-4" />
                    {copied ? 'Хуулагдлаа' : 'Хуулах'}
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-border p-4 text-sm leading-6 text-muted-foreground">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  <p>
                    Бодит хувилбар дээр SMS ирмэгц систем таны утсыг автоматаар баталгаажуулна. Одоогийн prototype дээр SMS илгээсний дараа доорх товчоор баталгаажуулалтын төлөвийг шалгана.
                  </p>
                </div>
              </div>

              {status === 'waiting' && (
                <div className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm font-medium text-accent-foreground">
                  SMS илгээгдсэн төлөвтэй байна. Дахин дарж баталгаажуулалтыг дуусгана уу.
                </div>
              )}

              {status === 'verified' && (
                <div className="rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm font-medium text-success">
                  Утас баталгаажлаа. Дараагийн алхам руу шилжиж байна.
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="h-4 w-4" />
                  Session хугацаа
                </span>
                <span className="font-medium text-foreground">5 минут</span>
              </div>

              <Button type="button" size="lg" fullWidth onClick={handleCheckStatus}>
                <CheckCircle2 className="h-5 w-5" />
                {status === 'idle' ? 'Би SMS илгээсэн, төлөв шалгах' : 'Баталгаажуулалтыг дуусгах'}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
