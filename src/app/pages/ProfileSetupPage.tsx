import { useRef, useState } from 'react';
import { AlertTriangle, Camera, Car, CheckCircle2, FileCheck2, Package, ShieldCheck, UploadCloud, UserRound } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Footer } from '../components/Footer';
import { Input } from '../components/Input';
import { Navbar } from '../components/Navbar';
import {
  completeCargoOnboarding,
  completeTravelerOnboarding,
  submitDriverOnboarding,
  updateProfileInfo,
  uploadAvatar,
  uploadDriverDocument,
  type DriverDocumentKind,
} from '../services/supabaseAuth';
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
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [lastName, setLastName] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState('');

  const finishOnboarding = async () => {
    if (normalizedRole === 'cargo_sender' && !cargoAccepted) {
      setError('Дайвар ачааны дүрмийг зөвшөөрнө үү.');
      return;
    }

    if (normalizedRole === 'traveler' && !gender) {
      setError('Хүйсээ сонгоно уу.');
      return;
    }

    if (normalizedRole === 'driver') {
      if (!gender) {
        setError('Хүйсээ сонгоно уу.');
        return;
      }
      if (!lastName.trim()) {
        setError('Овгоо оруулна уу.');
        return;
      }
      if (!registerNumber.trim()) {
        setError('Регистрийн дугаараа оруулна уу.');
        return;
      }
      if (!birthDate) {
        setError('Төрсөн огноогоо оруулна уу.');
        return;
      }
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
      if (!licenseFile) {
        setError('Жолооны үнэмлэхний зургийг оруулна уу.');
        return;
      }
      if (!certificateFile) {
        setError('Машины гэрчилгээний зургийг оруулна уу.');
        return;
      }
      if (!photoFile) {
        setError('Машины зургийг оруулна уу.');
        return;
      }
    }

    setIsSubmitting(true);
    setError('');
    setProgress('');

    try {
      if (normalizedRole === 'traveler') {
        if (avatarFile) {
          // Профайл зураг нэмэлт зүйл — амжилтгүй болсон ч бүртгэлийг зогсоохгүй.
          try {
            setProgress('Профайл зураг оруулж байна...');
            const avatarUrl = await uploadAvatar(avatarFile);
            await updateProfileInfo({ avatarUrl });
          } catch {
            setProgress('');
          }
        }
        await completeTravelerOnboarding({ emergencyContactName, emergencyContactPhone, gender: gender || undefined });
      } else if (normalizedRole === 'driver') {
        setProgress('Бичиг баримтыг илгээж байна...');
        const [driverLicenseUrl, vehicleCertificateUrl, vehiclePhotoUrl] = await Promise.all([
          uploadDriverDocument(licenseFile!, 'driver_license'),
          uploadDriverDocument(certificateFile!, 'vehicle_certificate'),
          uploadDriverDocument(photoFile!, 'vehicle_photo'),
        ]);
        setProgress('Мэдээллийг хадгалж байна...');
        await submitDriverOnboarding({
          carModel,
          plateNumber,
          seats: Number(seats),
          driverLicenseUrl,
          vehicleCertificateUrl,
          vehiclePhotoUrl,
          gender: gender || undefined,
          lastName,
          registerNumber,
          birthDate,
        });
      } else {
        await completeCargoOnboarding();
      }
      window.location.href = getDashboardPath(normalizedRole);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Мэдээлэл хадгалахад алдаа гарлаа.');
    } finally {
      setIsSubmitting(false);
      setProgress('');
    }
  };

  const isTraveler = normalizedRole === 'traveler';
  const isDriver = normalizedRole === 'driver';
  const isCargo = normalizedRole === 'cargo_sender';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-5xl px-3.5 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-5 sm:mb-8">
          <Badge variant={isDriver ? 'success' : isCargo ? 'warning' : 'info'} className="mb-3 sm:mb-4">
            Анхны тохиргоо
          </Badge>
          <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
            {isTraveler ? 'Аялагчийн мэдээлэл' : isDriver ? 'Жолоочийн баталгаажуулалт' : 'Дайвар ачааны дүрэм'}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:mt-3 sm:text-base">
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
              <AvatarUploadField
                file={avatarFile}
                preview={avatarPreview}
                onSelect={(file) => {
                  setAvatarFile(file);
                  setAvatarPreview(file ? URL.createObjectURL(file) : '');
                  setError('');
                }}
              />
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-foreground">Хүйс</label>
                <div className="grid max-w-sm grid-cols-2 gap-2">
                  {([['male', 'Эрэгтэй'], ['female', 'Эмэгтэй']] as const).map(([value, text]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => { setGender(value); setError(''); }}
                      className={`min-h-11 rounded-lg border px-3 text-sm font-medium transition ${
                        gender === value
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-foreground hover:border-primary/50'
                      }`}
                    >
                      {text}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Хүйсээр тааруулсан чиглэл (зөвхөн эмэгтэй / зөвхөн эрэгтэй) суудал захиалахад ашиглана.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Яаралтай холбоо барих хүний нэр" placeholder="Холбоо барих хүний нэр" value={emergencyContactName} onChange={(event) => setEmergencyContactName(event.target.value)} />
                <Input label="Яаралтай холбоо барих утас" placeholder="+976 99999999" value={emergencyContactPhone} onChange={(event) => setEmergencyContactPhone(event.target.value)} />
              </div>
            </CardBody>
          </Card>
        )}

        {isDriver && (
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_340px]">
            <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UserRound className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Хувийн мэдээлэл</h2>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Хүйс</label>
                    <div className="grid grid-cols-2 gap-2">
                      {([['male', 'Эрэгтэй'], ['female', 'Эмэгтэй']] as const).map(([value, text]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => { setGender(value); setError(''); }}
                          className={`min-h-11 rounded-lg border px-3 text-sm font-medium transition ${
                            gender === value
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-background text-foreground hover:border-primary/50'
                          }`}
                        >
                          {text}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input label="Овог" placeholder="Бат" value={lastName} onChange={(event) => setLastName(event.target.value)} />
                  <Input label="Регистрийн дугаар" placeholder="УБ95010112" value={registerNumber} onChange={(event) => setRegisterNumber(event.target.value)} />
                  <Input label="Төрсөн огноо" type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
                </div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  Хүйс, овог, регистр, төрсөн огноог жолоочийн биеийн байцаалттай тулгаж админ шалгана.
                </p>
              </CardBody>
            </Card>

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
                <p className="mt-4 text-sm text-muted-foreground sm:mt-6">
                  Доорх 3 бичиг баримтыг тод зургаар оруулна уу (JPG, PNG, WEBP эсвэл PDF, 10MB хүртэл).
                </p>
                <div className="mt-3 grid gap-3 sm:gap-4 md:grid-cols-3">
                  <DocumentUploadField title="Жолооны үнэмлэх" file={licenseFile} onSelect={setLicenseFile} />
                  <DocumentUploadField title="Машины гэрчилгээ" file={certificateFile} onSelect={setCertificateFile} />
                  <DocumentUploadField title="Машины зураг" file={photoFile} onSelect={setPhotoFile} />
                </div>
              </CardBody>
            </Card>
            </div>

            <Card className="border-warning/20 bg-warning/5">
              <CardBody className="p-4 sm:p-6">
                <AlertTriangle className="h-7 w-7 text-warning sm:h-8 sm:w-8" />
                <h2 className="mt-3 text-lg font-semibold text-foreground sm:mt-4 sm:text-xl">Админ шалгалт</h2>
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

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button size="lg" onClick={finishOnboarding} disabled={isSubmitting}>
            {isSubmitting ? (progress || 'Хадгалж байна...') : isDriver ? 'Баталгаажуулалт илгээх' : isCargo ? 'Үргэлжлүүлэх' : 'Дуусгах'}
            <CheckCircle2 className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="lg" onClick={() => window.location.href = '/'}>Нүүр хуудас руу буцах</Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function AvatarUploadField({
  file,
  preview,
  onSelect,
}: {
  file: File | null;
  preview: string;
  onSelect: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="mb-4 flex w-full flex-col items-center rounded-lg border-2 border-dashed border-border bg-muted/20 p-4 text-center transition-colors hover:border-primary/50 sm:mb-5 sm:p-6"
    >
      {preview ? (
        <img src={preview} alt="Сонгосон профайл зураг" className="mb-3 h-20 w-20 rounded-full object-cover" />
      ) : (
        <Camera className="mb-2 h-8 w-8 text-muted-foreground sm:mb-3 sm:h-10 sm:w-10" />
      )}
      <p className="font-medium text-foreground">{file ? 'Профайл зураг сонгогдлоо' : 'Профайл зураг сонгох'}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {file ? file.name : 'JPG, PNG эсвэл WEBP, 5MB хүртэл'}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => onSelect(event.target.files?.[0] ?? null)}
      />
    </button>
  );
}

function DocumentUploadField({
  title,
  file,
  onSelect,
}: {
  title: string;
  file: File | null;
  onSelect: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = Boolean(file);

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className={`w-full rounded-lg border-2 border-dashed p-5 text-center transition-colors ${
        selected ? 'border-success/40 bg-success/5' : 'border-border bg-muted/20 hover:border-primary/50'
      }`}
    >
      {selected ? (
        <FileCheck2 className="mx-auto mb-3 h-9 w-9 text-success" />
      ) : (
        <UploadCloud className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
      )}
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 break-words text-xs text-muted-foreground">
        {selected ? file!.name : 'Дарж файл сонгох'}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={(event) => onSelect(event.target.files?.[0] ?? null)}
      />
    </button>
  );
}
