import { ArrowRight, Box, MapPin, Package, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Footer } from '../components/Footer';
import { Input } from '../components/Input';
import { LocationSelectGroup } from '../components/LocationSelectGroup';
import { Navbar } from '../components/Navbar';
import { Select } from '../components/Select';

export function PostCargoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [fromAimag, setFromAimag] = useState('Улаанбаатар');
  const [fromSoum, setFromSoum] = useState('');
  const [toAimag, setToAimag] = useState('');
  const [toSoum, setToSoum] = useState('');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Badge variant="info" className="mb-4">Дайвар ачаа add-on</Badge>
          <h1 className="text-3xl font-bold text-foreground mb-2">Дайвар ачаа илгээх хүсэлт</h1>
          <p className="text-muted-foreground">
            Passenger-driver route дээр “дайвар ачаа авч болно” гэж тэмдэглэсэн жолоочид жижиг ачааны хүсэлт илгээнэ.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {submitted && (
              <Card className="border-success/30 bg-success/5">
                <CardBody className="p-5">
                  <h2 className="text-xl font-semibold text-foreground">Cargo request үүслээ</h2>
                  <p className="mt-2 text-muted-foreground">Mock request хадгалагдсан мэт харагдана. Дэлгэрэнгүй status руу шилжиж болно.</p>
                  <Button className="mt-4" onClick={() => { window.location.href = '/cargo/mock-id'; }}>
                    Cargo detail харах
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardBody>
              </Card>
            )}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Ачааны мэдээлэл</h2>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Ачааны нэр" placeholder="Жишээ: Баримт бичиг" />
                  <Select
                    label="Ачааны төрөл"
                    options={[
                      { value: 'document', label: 'Баримт бичиг' },
                      { value: 'small_box', label: 'Жижиг хайрцаг' },
                      { value: 'bag', label: 'Цүнх' },
                      { value: 'electronics', label: 'Электроник' },
                      { value: 'other', label: 'Бусад' },
                    ]}
                  />
                  <Input label="Ойролцоо жин" placeholder="1 кг" />
                  <Input label="Хэмжээ" placeholder="30 x 20 x 10 см" />
                  <Select
                    label="Эмзэг эсэх"
                    options={[
                      { value: 'no', label: 'Эмзэг биш' },
                      { value: 'yes', label: 'Эмзэг, болгоомжтой' },
                    ]}
                  />
                  <Input label="Санал болгох үнэ" placeholder="15000" />
                </div>
                <textarea
                  className="mt-4 w-full min-h-28 px-4 py-3 bg-input-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Нэмэлт тэмдэглэл: авах цаг, савлагаа, анхаарах зүйл..."
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Route match ба байршил</h2>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <LocationSelectGroup
                    label="Хаанаас"
                    aimag={fromAimag}
                    soum={fromSoum}
                    onAimagChange={setFromAimag}
                    onSoumChange={setFromSoum}
                    className="md:col-span-2"
                  />
                  <LocationSelectGroup
                    label="Хаашаа"
                    aimag={toAimag}
                    soum={toSoum}
                    onAimagChange={setToAimag}
                    onSoumChange={setToSoum}
                    className="md:col-span-2"
                  />
                  <Input label="Pickup байршил" placeholder="Баянзүрх, 13-р хороолол" />
                  <Input label="Dropoff байршил" placeholder="Дархан, төв зам дагуу" />
                  <Input label="Явуулах огноо" type="date" />
                  <Input label="Хүссэн цаг" type="time" />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UserRound className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Хүлээн авагч</h2>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Хүлээн авагчийн нэр" placeholder="Дорж Цэцэг" />
                  <Input label="Утас" placeholder="+976 9999 9999" />
                  <Input label="Хот/аймаг" placeholder="Дархан-Уул" />
                  <Input label="Нэмэлт холбоо барих" placeholder="Optional" />
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20">
              <CardBody className="p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Box className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Дараагийн алхам</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  Ачаагаа үүсгэсний дараа allows_cargo route сонгож жолооч руу request илгээнэ.
                </p>
                <Button variant="primary" fullWidth onClick={() => window.location.href = '/dashboard/cargo'}>
                  Dashboard руу буцах
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button className="mt-3" variant="accent" fullWidth onClick={() => setSubmitted(true)}>
                  Хүсэлт илгээх
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardBody>
            </Card>

            <Card className="border-warning/30 bg-warning/5">
              <CardBody className="p-6">
                <h3 className="font-semibold text-foreground mb-3">Policy confirmation</h3>
                <label className="flex items-start gap-3 text-sm text-foreground">
                  <input type="checkbox" className="mt-1 w-4 h-4" />
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
