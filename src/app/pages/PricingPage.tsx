import { Calculator, CheckCircle2, CreditCard, ReceiptText, RotateCcw } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';
import { PublicBackLink } from '../components/PublicBackLink';

const agreedPrice = 20000;
const platformFee = agreedPrice * 0.1;
const driverPayout = agreedPrice - platformFee;

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
              NuudelchinTrip аялал болон дайвар ачааны тохиролцсон нийт үнийн 10%-ийг үйлчилгээний шимтгэлд суутгана. Хэрэглэгчийн төлөх дүн дээр нэмэлт төлбөр нэмэгдэхгүй.
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
                        <p className="font-medium text-foreground">Тохиролцсон нийт үнэ</p>
                        <p className="text-sm text-muted-foreground">Аялагч эсвэл ачаа илгээгчийн төлөх дүн</p>
                      </div>
                      <p className="text-xl font-bold text-foreground">₮{agreedPrice.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center justify-between border-b border-border pb-4">
                      <div>
                        <p className="font-medium text-foreground">Үйлчилгээний шимтгэл</p>
                        <p className="text-sm text-muted-foreground">Тохиролцсон нийт үнээс суутгах 10%</p>
                      </div>
                      <p className="text-xl font-bold text-primary">₮{platformFee.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">Жолоочид шилжих дүн</p>
                        <p className="text-sm text-muted-foreground">Тохиролцсон үнэ - үйлчилгээний шимтгэл</p>
                      </div>
                      <p className="text-2xl font-bold text-primary sm:text-3xl">₮{driverPayout.toLocaleString()}</p>
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

        <section className="bg-muted/40 py-9 sm:py-14">
          <div className="mx-auto max-w-6xl px-3.5 sm:px-6 lg:px-8">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-5 sm:p-6">
                <h2 className="text-xl font-semibold text-foreground">Шимтгэлд юу багтах вэ?</h2>
                <div className="mt-5 space-y-4">
                  {[
                    'Захиалгын хүсэлт, төлөв болон суудлын мэдээллийг нэг дор удирдах',
                    'Төлбөрийн баримтыг админаар шалгуулж баталгаажуулах',
                    'Аяллын явц, мэдэгдэл, үнэлгээ болон гомдлын түүхийг хадгалах',
                    'Асуудал гарсан үед захиалгын нотолгоонд тулгуурлан шалгуулах',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                      <p className="text-sm leading-6 text-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Цуцлалт ба буцаан олголт</h2>
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  Буцаан олголтыг захиалгын төлөв, төлбөр баталгаажсан эсэх, аялал эхэлсэн эсэх болон цуцалсан шалтгаанд үндэслэн шалгана.
                  Маргаантай тохиолдолд төлбөрийн баримт, захиалгын түүх, хоёр талын тайлбарыг админ нягталж шийдвэрлэнэ.
                </p>
                <div className="mt-5 rounded-lg border border-border bg-background p-4">
                  <p className="font-medium text-foreground">Төлбөр хийхээс өмнө</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Жолоочийн тохиролцсон үнэ, 10%-ийн үйлчилгээний шимтгэл, нийт төлөх дүн тус тусдаа харагдана.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
