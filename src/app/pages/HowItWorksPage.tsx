import { CheckCircle2, CreditCard, Route, ShieldCheck, Star, UserRoundCheck } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';

const flowSteps = [
  {
    icon: <UserRoundCheck className="w-6 h-6" />,
    title: 'Бүртгүүлэх ба role сонгох',
    text: 'Аялагч эсвэл жолоочоор бүртгүүлж profile setup, утас болон шаардлагатай verification-оо бөглөнө.',
  },
  {
    icon: <Route className="w-6 h-6" />,
    title: 'Унаа ба суудал тааруулах',
    text: 'Аялагч route хайна. Жолооч чиглэл, огноо, сул суудал, үнийг нийтэлнэ.',
  },
  {
    icon: <CreditCard className="w-6 h-6" />,
    title: 'Төлбөр баталгаажуулах',
    text: 'Аялагч банк эсвэл QPay-р төлөөд screenshot/transaction code байршуулна. Admin баталсны дараа booking confirmed болно.',
  },
  {
    icon: <Star className="w-6 h-6" />,
    title: 'Аялал дуусгаж үнэлэх',
    text: 'Аяллын төлөв completed болоход хоёр тал rating/comment үлдээж marketplace-ийн итгэлийг нэмнэ.',
  },
];

const bookingStatuses = [
  ['pending_request', 'Хүсэлт илгээгдсэн'],
  ['accepted', 'Зөвшөөрсөн'],
  ['waiting_payment', 'Төлбөр хүлээгдэж байна'],
  ['payment_review', 'Баримт шалгаж байна'],
  ['confirmed', 'Баталгаажсан'],
  ['on_trip', 'Аялал эхэлсэн'],
  ['completed', 'Дууссан'],
];

export function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        <section className="bg-primary/5 py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="info" className="mb-5">Marketplace flow</Badge>
            <h1 className="text-4xl font-bold text-foreground mb-4">NuudelchinTrip хэрхэн ажилладаг вэ?</h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Платформ нь шууд тээврийн үйлчилгээ үзүүлэгч биш. Харин орон нутаг руу явах аялагчийг найдвартай жолоочтой route, booking, төлбөрийн баримт, үнэлгээгээр холбодог.
            </p>
          </div>
        </section>

        <section className="py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {flowSteps.map((step, index) => (
                <Card key={step.title}>
                  <CardBody className="p-6">
                    <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-5">
                      {step.icon}
                    </div>
                    <p className="text-sm font-semibold text-primary mb-2">Алхам {index + 1}</p>
                    <h2 className="text-lg font-semibold text-foreground mb-2">{step.title}</h2>
                    <p className="text-sm text-muted-foreground">{step.text}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 bg-muted/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold text-foreground">Аялагчийн урсгал</h2>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    {['Route хайна', 'Жолоочийн санал, үнэ, сул суудал харна', 'Booking request илгээнэ', 'Төлбөрийн баримт upload хийнэ', 'Аялал дууссаны дараа review үлдээнэ'].map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
                        <p className="text-foreground">{item}</p>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold text-foreground">Жолоочийн урсгал</h2>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    {['Verification батлуулна', 'Явах чиглэл, сул суудал, үнэ оруулна', 'Аялагчийн хүсэлтийг accept/reject хийнэ', 'Аяллын төлөв шинэчилнэ', 'Орлого, rating, completed trips хянана'].map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />
                        <p className="text-foreground">{item}</p>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-foreground">Booking status timeline</h2>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {bookingStatuses.map(([code, label]) => (
                    <div key={code} className="p-4 border border-border rounded-lg bg-background">
                      <p className="text-xs font-mono text-primary mb-1">{code}</p>
                      <p className="font-medium text-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
