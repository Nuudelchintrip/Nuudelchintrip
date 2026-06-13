import { Calculator, CreditCard, ReceiptText } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';
import { PublicBackLink } from '../components/PublicBackLink';

const driverPrice = 20000;
const platformFee = driverPrice * 0.1;
const total = driverPrice + platformFee;

export function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        <div className="mx-auto max-w-5xl px-3.5 pt-4 sm:px-6 sm:pt-6 lg:px-8">
          <PublicBackLink />
        </div>
        <section className="bg-primary/5 py-9 sm:py-16">
          <div className="mx-auto max-w-5xl px-3.5 text-center sm:px-6 lg:px-8">
            <Badge variant="info" className="mb-3 sm:mb-5">10% үйлчилгээний шимтгэл</Badge>
            <h1 className="mb-3 text-3xl font-bold leading-tight text-foreground sm:mb-4 sm:text-4xl">Ил тод, ойлгомжтой үнэ</h1>
            <p className="mx-auto max-w-3xl text-sm leading-6 text-muted-foreground sm:text-lg sm:leading-7">
              NuudelchinTrip үйлчилгээний шимтгэлээ жолооч, аялагчийн тохиролцсон үнийн дүнгийн 10%-иар тооцно. Автомат QPay холболт дараагийн шатанд орно.
            </p>
          </div>
        </section>

        <section className="py-9 sm:py-14">
          <div className="mx-auto max-w-6xl px-3.5 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold text-foreground">Жишээ тооцоолол</h2>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-4">
                      <div>
                        <p className="font-medium text-foreground">Жолоочид очих үнэ</p>
                        <p className="text-sm text-muted-foreground">Нэг суудлын үндсэн тохиролцсон үнэ</p>
                      </div>
                      <p className="text-xl font-bold text-foreground">₮{driverPrice.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center justify-between border-b border-border pb-4">
                      <div>
                        <p className="font-medium text-foreground">Үйлчилгээний шимтгэл</p>
                        <p className="text-sm text-muted-foreground">Тохиролцсон үнийн дүнгийн 10%</p>
                      </div>
                      <p className="text-xl font-bold text-primary">₮{platformFee.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">Аялагчийн нийт төлөх</p>
                        <p className="text-sm text-muted-foreground">Жолоочийн үнэ + үйлчилгээний шимтгэл</p>
                      </div>
                      <p className="text-2xl font-bold text-primary sm:text-3xl">₮{total.toLocaleString()}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-accent" />
                    <h2 className="text-xl font-semibold text-foreground">Төлбөрийн эхний хувилбар</h2>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4 text-sm text-muted-foreground">
                    <p>Аялагч банк эсвэл QPay QR-р төлбөр төлнө.</p>
                    <p>Төлбөрийн зураг эсвэл гүйлгээний код оруулна.</p>
                    <p>Админ төлбөрийн баримтыг зөвшөөрөх эсвэл буцаасны дараа захиалга баталгаажна.</p>
                  </div>
                  <Button variant="primary" fullWidth className="mt-6" onClick={() => window.location.href = '/auth/login?next=/dashboard'}>
                    <ReceiptText className="w-4 h-4" />
                    Нэвтэрч захиалгаа шалгах
                  </Button>
                </CardBody>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
