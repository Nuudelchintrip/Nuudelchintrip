import { Calculator, CreditCard, ReceiptText } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';

const driverPrice = 20000;
const platformFee = driverPrice * 0.1;
const total = driverPrice + platformFee;

export function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        <section className="bg-primary/5 py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="info" className="mb-5">10% үйлчилгээний шимтгэл</Badge>
            <h1 className="text-4xl font-bold text-foreground mb-4">Ил тод, ойлгомжтой үнэ</h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Эхний хувилбарт NuudelchinTrip нь жолоочийн суудлын үнээс 10% үйлчилгээний шимтгэл авна. Автомат QPay холболт дараагийн шатанд орно.
            </p>
          </div>
        </section>

        <section className="py-14">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                        <p className="text-sm text-muted-foreground">NuudelchinTrip үйлчилгээний шимтгэл 10%</p>
                      </div>
                      <p className="text-xl font-bold text-primary">₮{platformFee.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">Аялагчийн нийт төлөх</p>
                        <p className="text-sm text-muted-foreground">Жолоочийн үнэ + үйлчилгээний шимтгэл</p>
                      </div>
                      <p className="text-3xl font-bold text-primary">₮{total.toLocaleString()}</p>
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
