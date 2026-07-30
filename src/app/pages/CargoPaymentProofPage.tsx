import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, Copy, FileImage, Upload } from 'lucide-react';
import { useParams } from 'react-router';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Footer } from '../components/Footer';
import { Input } from '../components/Input';
import { Navbar } from '../components/Navbar';
import { isSupabaseConfigured } from '../lib/supabase';
import { fetchPlatformPaymentInfo, uploadPaymentProof, type PlatformPaymentInfo } from '../services/paymentService';
import { fetchCargoRequestById, type CargoRequestDetail } from '../services/tripService';
import { getCargoStatusLabel } from '../utils/bookingStatus';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const fallbackPayment: PlatformPaymentInfo = {
  holder: import.meta.env.VITE_PLATFORM_BANK_HOLDER || 'NuudelchinTrip админ',
  bankName: import.meta.env.VITE_PLATFORM_BANK_NAME || 'Админы данс',
  account: import.meta.env.VITE_PLATFORM_BANK_ACCOUNT || 'Дансны мэдээллийг админ тохируулна',
};

export function CargoPaymentProofPage() {
  const { id } = useParams();
  const isReal = Boolean(id && UUID_PATTERN.test(id));
  const [cargo, setCargo] = useState<CargoRequestDetail | null>(null);
  const [loading, setLoading] = useState(isReal);
  const [platform, setPlatform] = useState<PlatformPaymentInfo>(fallbackPayment);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    fetchPlatformPaymentInfo().then((info) => {
      if (active && info) {
        setPlatform({
          holder: info.holder || fallbackPayment.holder,
          bankName: info.bankName || fallbackPayment.bankName,
          account: info.account || fallbackPayment.account,
        });
      }
    });
    if (!id || !isReal) {
      setLoading(false);
      return;
    }
    fetchCargoRequestById(id)
      .then((item) => {
        if (active) setCargo(item);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, isReal]);

  const submit = async () => {
    setError('');
    setSuccess('');
    const amt = Number(amount.replace(/[^0-9]/g, ''));
    if (!amt || amt <= 0) {
      setError('Төлсөн дүнгээ оруулна уу.');
      return;
    }
    if (!file) {
      setError('Төлбөрийн зураг эсвэл PDF баримтаа сонгоно уу.');
      return;
    }
    if (!isReal || !id || !isSupabaseConfigured) {
      setError('Төлбөрийн баримт илгээхийн тулд бодит ачаа шаардлагатай.');
      return;
    }
    setSubmitting(true);
    try {
      await uploadPaymentProof({ target: 'cargo', targetId: id, amount: amt, file, note });
      setSuccess('Төлбөрийн баримт амжилттай илгээгдлээ. Админ шалгасны дараа ачаа баталгаажна.');
      setCargo((c) => (c ? { ...c, status: 'payment_review' } : c));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Төлбөрийн баримт хадгалахад алдаа гарлаа.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="mx-auto w-full flex-1 max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => window.location.href = id ? `/cargo/${id}` : '/dashboard/cargo/requests'}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Ачаа руу буцах
        </button>

        {loading ? (
          <Card className="p-6 text-sm text-muted-foreground">Уншиж байна...</Card>
        ) : !cargo ? (
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold text-foreground">Ачаа олдсонгүй</h1>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Төлбөрийн баримт зөвхөн бодит ачааны хүсэлт дээр оруулна.</p>
            <Button className="mt-6" onClick={() => window.location.href = '/cargo/find-routes'}>Ачаа авах чиглэл хайх</Button>
          </Card>
        ) : (
          <div className="space-y-6">
            <div>
              <Badge variant="warning">{getCargoStatusLabel(cargo.status)}</Badge>
              <h1 className="mt-3 text-3xl font-bold text-foreground">Дайвар ачааны төлбөр</h1>
              <p className="mt-2 text-muted-foreground">{cargo.cargoName} · {cargo.trip.fromLocation} → {cargo.trip.toLocation}</p>
            </div>

            <Card>
              <CardHeader><h2 className="text-lg font-semibold text-foreground">Платформын данс</h2></CardHeader>
              <CardBody className="space-y-2 text-sm">
                <BankRow label="Хүлээн авагч" value={platform.holder} />
                <BankRow label="Банк" value={platform.bankName} />
                <BankRow label="Дансны дугаар" value={platform.account} copyable />
                <p className="pt-2 text-xs leading-5 text-muted-foreground">
                  Жолоочтой тохирсон дүнг энэ данс руу шилжүүлээд, гүйлгээний баримтаа доор оруулна уу.
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardHeader><h2 className="text-lg font-semibold text-foreground">Төлбөрийн баримт</h2></CardHeader>
              <CardBody className="space-y-4">
                <Input
                  label="Төлсөн дүн (₮)"
                  inputMode="numeric"
                  placeholder="Жишээ: 20000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                />
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">Зураг / PDF баримт</span>
                  <div className="flex items-center gap-3 rounded-lg border-2 border-dashed border-border bg-muted/20 p-4">
                    <FileImage className="h-6 w-6 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{file ? file.name : 'Файл сонгоогүй'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="hidden"
                      id="cargo-proof-file"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                    <label htmlFor="cargo-proof-file" className="cursor-pointer rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:border-primary">
                      Сонгох
                    </label>
                  </div>
                </label>
                <Input label="Тэмдэглэл (сонголтоор)" placeholder="Гүйлгээний утга, цаг" value={note} onChange={(e) => setNote(e.target.value)} />

                {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                {success && (
                  <p className="flex items-center gap-2 text-sm font-medium text-success"><CheckCircle className="h-4 w-4" />{success}</p>
                )}

                <Button fullWidth disabled={submitting || cargo.status === 'payment_review'} onClick={submit}>
                  <Upload className="h-4 w-4" />
                  {submitting ? 'Илгээж байна...' : cargo.status === 'payment_review' ? 'Баримт илгээгдсэн' : 'Баримт илгээх'}
                </Button>
              </CardBody>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function BankRow({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 font-medium text-foreground">
        {value}
        {copyable && (
          <button type="button" onClick={() => navigator.clipboard?.writeText(value)} className="text-muted-foreground hover:text-primary">
            <Copy className="h-4 w-4" />
          </button>
        )}
      </span>
    </div>
  );
}
