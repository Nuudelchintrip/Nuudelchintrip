import { useState } from 'react';
import { AlertTriangle, Camera, Car, CheckCircle2, FileCheck2, Package, ShieldCheck, UserRound } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Footer } from '../components/Footer';
import { Input } from '../components/Input';
import { Navbar } from '../components/Navbar';
import { completeCargoOnboarding, completeTravelerOnboarding, submitDriverOnboarding } from '../services/supabaseAuth';
import { getDashboardPath, type MarketplaceRole } from '../utils/auth';

interface ProfileSetupPageProps {
  role: 'sender' | 'cargo' | 'traveler' | 'driver';
}

const prohibitedItems = [
  'Хууль бус бараа',
  'Зэвсэг',
  'Мөнгө, үнэт эдлэл',
  'Амьд амьтан',
  'Муудаж болзошгүй хүнс',
  'Буруу мэдүүлсэн ачаа',
];

export function ProfileSetupPage({ role }: ProfileSetupPageProps) {
  const normalizedRole: MarketplaceRole = role === 'sender' || role === 'cargo' ? 'cargo_sender' : role;
  const [cargoAccepted, setCargoAccepted] = useState(false);
  const [error, setError] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [carModel, setCarModel] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [seats, setSeats] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const finishOnboarding = async () => {
    if (normalizedRole === 'cargo_sender' && !cargoAccepted) {
      setError('Дайвар ачааны дүрмийг зөвшөөрнө үү.');
      return;
    }

    if (normalizedRole === 'driver') {
      if (!carModel.trim()) {
        setError('Машины загварыг оруулна уу.');
        return;
      }
      if (!plateNumber.trim()) {
        setError('Улсын дугаарыг оруулна уу.');
        return;
      }
      const seatCount = Number(seats);
      if (!Number.isInteger(seatCount) || seatCount < 1 || seatCount > 12) {
        setError('Суудлын тоо 1-12 хооронд байх ёстой.');
        return;
      }
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (normalizedRole === 'traveler') {
        await completeTravelerOnboarding({ emergencyContactName, emergencyContactPhone });
      } else if (normalizedRole === 'driver') {
        await submitDriverOnboarding({ carModel, plateNumber, seats: Number(seats) });
      } else {
        await completeCargoOnboarding();
      }
      window.location.href = getDashboardPath(normalizedRole);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Мэдээлэл хадгалахад алдаа гарлаа.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTraveler = normalizedRole === 'traveler';
  const isDriver = normalizedRole === 'driver';
  const isCargo = normalizedRole === 'cargo_sender';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Badge variant={isDriver ? 'success' : isCargo ? 'warning' : 'info'} className="mb-4">
            Анхны тохиргоо
          </Badge>
          <h1 className="text-3xl font-bold text-foreground">
            {isTraveler ? 'Аялагчийн мэдээлэл' : isDriver ? 'Жолоочийн баталгаажуулалт' : 'Дайвар ачааны дүрэм'}
          </h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            {isTraveler && 'Үндсэн бүртгэл дууссан. Яаралтай холбоо барих мэдээллээ нэмээд самбар руу орно.'}
            {isDriver && 'Машин болон жолоочийн баталгаажуулалтын мэдээллээ илгээсний дараа админ шалгана.'}
            {isCargo && 'Дайвар ачаа нь жолоочийн чиглэл дээр суурилсан нэмэлт боломж тул ачааны дүрмийг зөвшөөрөх шаардлагатай.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
            {error}
          </div>
        )}

        {isTraveler && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Аялагчийн мэдээлэл</h2>
              </div>
            </CardHeader>
            <CardBody>
              <div className="mb-5 rounded-lg border-2 border-dashed border-border bg-muted/20 p-6 text-center">
                <Camera className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="font-medium text-foreground">Профайл зураг</p>
                <p className="text-sm text-muted-foreground">Дараа нь тохиргоо хэсгээс сольж болно.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Яаралтай холбоо барих хүний нэр" placeholder="Холбоо барих хүний нэр" value={emergencyContactName} onChange={(event) => setEmergencyContactName(event.target.value)} />
                <Input label="Яаралтай холбоо барих утас" placeholder="+976 99999999" value={emergencyContactPhone} onChange={(event) => setEmergencyContactPhone(event.target.value)} />
              </div>
            </CardBody>
          </Card>
        )}

        {isDriver && (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Машины мэдээлэл</h2>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="Машины загвар" placeholder="Toyota Prius 30" value={carModel} onChange={(event) => setCarModel(event.target.value)} />
                  <Input label="Улсын дугаар" placeholder="УБА 1234" value={plateNumber} onChange={(event) => setPlateNumber(event.target.value)} />
                  <Input label="Суудлын тоо" placeholder="4" value={seats} onChange={(event) => setSeats(event.target.value)} />
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <UploadPlaceholder title="Жолооны үнэмлэх" />
                  <UploadPlaceholder title="Машины гэрчилгээ" />
                  <UploadPlaceholder title="Машины зураг" />
                </div>
              </CardBody>
            </Card>

            <Card className="border-warning/20 bg-warning/5">
              <CardBody className="p-6">
                <AlertTriangle className="h-8 w-8 text-warning" />
                <h2 className="mt-4 text-xl font-semibold text-foreground">Админ шалгалт</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Таны мэдээллийг админ шалгасны дараа чиглэл нэмэх боломж нээгдэнэ.
                </p>
                <Badge variant="warning" className="mt-4">Шалгалт хүлээгдэж байна</Badge>
              </CardBody>
            </Card>
          </div>
        )}

        {isCargo && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-warning" />
                <h2 className="text-xl font-semibold text-foreground">Хориглосон ачааны дүрэм</h2>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid gap-3 md:grid-cols-2">
                {prohibitedItems.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-4">
                    <ShieldCheck className="h-5 w-5 text-warning" />
                    <span className="font-medium text-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <label className="mt-6 flex items-start gap-3 rounded-lg border border-warning/20 bg-warning/5 p-4 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={cargoAccepted}
                  onChange={(event) => {
                    setCargoAccepted(event.target.checked);
                    setError('');
                  }}
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span>Би дайвар ачааны дүрэмтэй танилцаж, зөвшөөрч байна.</span>
              </label>
            </CardBody>
          </Card>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" onClick={finishOnboarding} disabled={isSubmitting}>
            {isSubmitting ? 'Хадгалж байна...' : isDriver ? 'Баталгаажуулалт илгээх' : isCargo ? 'Үргэлжлүүлэх' : 'Дуусгах'}
            <CheckCircle2 className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="lg" onClick={() => window.location.href = '/auth/register'}>Буцах</Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function UploadPlaceholder({ title }: { title: string }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-border bg-muted/20 p-5 text-center">
      <FileCheck2 className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">Файл оруулах хэсэг дараагийн шатанд холбогдоно</p>
    </div>
  );
}
