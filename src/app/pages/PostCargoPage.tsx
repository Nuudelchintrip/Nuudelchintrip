import { ArrowRight, Box, MapPin, Package, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Footer } from '../components/Footer';
import { Input } from '../components/Input';
import { LocationSelectGroup } from '../components/LocationSelectGroup';
import { Navbar } from '../components/Navbar';
import { Select } from '../components/Select';
import { createCargoRequest } from '../services/tripService';

export function PostCargoPage() {
  const [searchParams] = useSearchParams();
  const tripId = searchParams.get('tripId') || '';
  const [submittedCargoId, setSubmittedCargoId] = useState('');
  const [fromAimag, setFromAimag] = useState('Улаанбаатар');
  const [fromSoum, setFromSoum] = useState('');
  const [toAimag, setToAimag] = useState('');
  const [toSoum, setToSoum] = useState('');
  const [cargoName, setCargoName] = useState('');
  const [cargoType, setCargoType] = useState('document');
  const [weightKg, setWeightKg] = useState('');
  const [sizeNote, setSizeNote] = useState('');
  const [cargoNote, setCargoNote] = useState('');
  const [pickupNote, setPickupNote] = useState('');
  const [dropoffNote, setDropoffNote] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const pickupSummary = useMemo(() => {
    const route = [
      fromAimag && (fromSoum ? `${fromAimag} - ${fromSoum}` : fromAimag),
      toAimag && (toSoum ? `${toAimag} - ${toSoum}` : toAimag),
    ].filter(Boolean).join(' → ');
    const notes = [pickupNote, dropoffNote, date && `Огноо: ${date}`, time && `Цаг: ${time}`, cargoNote].filter(Boolean);
    return [route, ...notes].join(' | ');
  }, [cargoNote, date, dropoffNote, fromAimag, fromSoum, pickupNote, time, toAimag, toSoum]);

  const handleSubmit = async () => {
    setError('');
    setSubmittedCargoId('');

    if (!tripId) {
      setError('Эхлээд “Ачаа авах жолооч хайх” хэсгээс чиглэл сонгоно уу.');
      return;
    }
    if (!cargoName.trim()) {
      setError('Ачааны нэрийг оруулна уу.');
      return;
    }
    if (!receiverName.trim() || !receiverPhone.trim()) {
      setError('Хүлээн авагчийн нэр болон утсыг оруулна уу.');
      return;
    }
    if (!policyAccepted) {
      setError('Ачааны дүрэм, хориглосон барааны нөхцөлийг зөвшөөрнө үү.');
      return;
    }

    const parsedWeight = weightKg ? Number(weightKg) : undefined;
    if (weightKg && (!Number.isFinite(parsedWeight) || Number(parsedWeight) <= 0)) {
      setError('Ачааны жинг кг-аар зөв оруулна уу.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createCargoRequest({
        tripId,
        cargoName: cargoName.trim(),
        cargoType,
        sizeNote: sizeNote.trim() || undefined,
        weightKg: parsedWeight,
        receiverName: receiverName.trim(),
        receiverPhone: receiverPhone.trim(),
        pickupNote: pickupSummary || undefined,
      });
      setSubmittedCargoId(result.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ачааны хүсэлт хадгалахад алдаа гарлаа.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-6xl px-3.5 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-5 sm:mb-8">
          <Badge variant="info" className="mb-3 sm:mb-4">Дайвар ачааны нэмэлт боломж</Badge>
          <h1 className="mb-2 text-2xl font-bold leading-tight text-foreground sm:text-3xl">Дайвар ачаа илгээх хүсэлт</h1>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            Дайвар ачаа нь зөвхөн жолоочийн нийтэлсэн чиглэл дээр суурилна. Эхлээд ачаа авч болох чиглэл сонгоод, дараа нь жижиг ачааны хүсэлт илгээнэ.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
          <div className="space-y-4 sm:space-y-6 lg:col-span-2">
            {!tripId && (
              <Card className="border-warning/30 bg-warning/5">
                <CardBody className="p-5">
                  <h2 className="text-xl font-semibold text-foreground">Чиглэл сонгоогүй байна</h2>
                  <p className="mt-2 text-muted-foreground">Ачааны хүсэлт илгээхийн тулд дайвар ачаа авах боломжтой чиглэл сонгох хэрэгтэй.</p>
                  <Button className="mt-4" onClick={() => { window.location.href = '/cargo/find-routes'; }}>
                    Ачаа авах чиглэл хайх
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardBody>
              </Card>
            )}

            {error && (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardBody className="p-5">
                  <p className="text-sm font-medium text-destructive">{error}</p>
                </CardBody>
              </Card>
            )}

            {submittedCargoId && (
              <Card className="border-success/30 bg-success/5">
                <CardBody className="p-5">
                  <h2 className="text-xl font-semibold text-foreground">Ачааны хүсэлт амжилттай илгээгдлээ</h2>
                  <p className="mt-2 text-muted-foreground">Жолоочийн “Дайвар ачааны хүсэлтүүд” дээр энэ хүсэлт харагдана.</p>
                  <Button className="mt-4" onClick={() => { window.location.href = `/cargo/${submittedCargoId}`; }}>
                    Ачааны явцыг харах
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardBody>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Ачааны мэдээлэл</h2>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input label="Ачааны нэр" placeholder="Жишээ: Баримт бичиг" value={cargoName} onChange={(event) => setCargoName(event.target.value)} />
                  <Select
                    label="Ачааны төрөл"
                    value={cargoType}
                    onChange={(event) => setCargoType(event.target.value)}
                    options={[
                      { value: 'document', label: 'Баримт бичиг' },
                      { value: 'small_box', label: 'Жижиг хайрцаг' },
                      { value: 'bag', label: 'Цүнх' },
                      { value: 'electronics', label: 'Электроник' },
                      { value: 'other', label: 'Бусад' },
                    ]}
                  />
                  <Input label="Ойролцоо жин (кг)" placeholder="1" inputMode="decimal" value={weightKg} onChange={(event) => setWeightKg(event.target.value)} />
                  <Input label="Хэмжээ" placeholder="30 x 20 x 10 см" value={sizeNote} onChange={(event) => setSizeNote(event.target.value)} />
                </div>
                <textarea
                  className="mt-4 min-h-28 w-full rounded-lg border border-input bg-input-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Нэмэлт тэмдэглэл: савлагаа, анхаарах зүйл..."
                  value={cargoNote}
                  onChange={(event) => setCargoNote(event.target.value)}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Чиглэлийн тохирол ба байршил</h2>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <LocationSelectGroup label="Суух байршил" aimag={fromAimag} soum={fromSoum} onAimagChange={setFromAimag} onSoumChange={setFromSoum} className="col-span-2 md:col-span-1" />
                  <LocationSelectGroup label="Буух байршил" aimag={toAimag} soum={toSoum} onAimagChange={setToAimag} onSoumChange={setToSoum} className="col-span-2 md:col-span-1" />
                  <Input label="Ачаа авах байршил" placeholder="Баянзүрх, 13-р хороолол" value={pickupNote} onChange={(event) => setPickupNote(event.target.value)} />
                  <Input label="Хүргэх байршил" placeholder="Дархан, төв зам дагуу" value={dropoffNote} onChange={(event) => setDropoffNote(event.target.value)} />
                  <Input label="Явуулах огноо" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
                  <Input label="Хүссэн цаг" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UserRound className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Хүлээн авагч</h2>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input label="Хүлээн авагчийн нэр" placeholder="Дорж Цэцэг" value={receiverName} onChange={(event) => setReceiverName(event.target.value)} />
                  <Input label="Утас" placeholder="+976 9999 9999" value={receiverPhone} onChange={(event) => setReceiverPhone(event.target.value)} />
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <Card className="border-primary/20 bg-primary/5">
              <CardBody className="p-4 sm:p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary sm:mb-4 sm:h-12 sm:w-12">
                  <Box className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h2 className="mb-2 text-xl font-semibold text-foreground">Дараагийн алхам</h2>
                <p className="mb-5 text-sm text-muted-foreground">
                  Илгээсний дараа жолооч зөвшөөрөх эсвэл татгалзах шийдвэр гаргана. Зөвшөөрөгдвөл төлбөрийн баримт, ачаа авсан баталгаа, хүргэлтийн кодын явц нээгдэнэ.
                </p>
                <Button variant="primary" fullWidth onClick={() => { window.location.href = '/dashboard/cargo'; }}>
                  Самбар руу буцах
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button className="mt-3" variant="accent" fullWidth onClick={handleSubmit} disabled={submitting || !tripId}>
                  {submitting ? 'Хадгалж байна...' : 'Хүсэлт илгээх'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardBody>
            </Card>

            <Card className="border-warning/30 bg-warning/5">
              <CardBody className="p-4 sm:p-6">
                <h3 className="mb-3 font-semibold text-foreground">Дүрэм зөвшөөрөх</h3>
                <label className="flex items-start gap-3 text-sm text-foreground">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4"
                    checked={policyAccepted}
                    onChange={(event) => setPolicyAccepted(event.target.checked)}
                  />
                  <span>Энэ ачаа хориглосон бараанд хамаарахгүй бөгөөд мэдээлэл үнэн зөв.</span>
                </label>
              </CardBody>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
