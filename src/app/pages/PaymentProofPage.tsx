import { AlertCircle, ArrowLeft, CheckCircle, Copy, CreditCard, ReceiptText, Upload } from 'lucide-react';
import { useParams } from 'react-router';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { AppFooter } from '../components/Footer';
import { Input } from '../components/Input';
import { Sidebar } from '../components/Sidebar';
import { getBooking } from '../data/mockData';
import { getDashboardMenu } from '../navigation/dashboardMenus';

export function PaymentProofPage() {
  const { id } = useParams();
  const booking = getBooking(id);

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar menuItems={getDashboardMenu('traveler')} accountRole="traveler" activeHref="/dashboard/bookings/BK-001/payment-proof" />

      <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-8">
        <button
          type="button"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
          onClick={() => window.location.href = `/dashboard/bookings/${booking.id}`}
        >
          <ArrowLeft className="w-4 h-4" />
          Booking руу буцах
        </button>

        <section className="mb-8 rounded-lg border border-warning/20 bg-warning/5 p-6">
          <Badge variant="warning" className="mb-4">Manual payment v1</Badge>
          <h1 className="text-3xl font-bold text-foreground mb-3">Төлбөрийн баримт илгээх</h1>
          <p className="max-w-3xl text-muted-foreground leading-7">
            Аялагч нийт төлөх дүнг шилжүүлээд screenshot эсвэл transaction code оруулна.
            Admin баталгаажуулсны дараа booking `confirmed` төлөв рүү шилжинэ.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Төлбөр төлөх заавар</h2>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    'Нийт төлөх дүнг доорх данс руу шилжүүлнэ.',
                    `Гүйлгээний утга дээр ${booking.id} гэж бичнэ.`,
                    'Screenshot эсвэл transaction code-оо оруулна.',
                    'Admin payment queue дээр approve/reject хийнэ.',
                  ].map((item, index) => (
                    <div key={item} className="rounded-xl border border-border bg-muted/30 p-4">
                      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-6 text-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Дансны мэдээлэл</h2>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <BankField label="Данс эзэмшигч" value={booking.driver.name} />
                  <BankField label="Банк" value={booking.driver.bankName} />
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground mb-1">Данс</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono font-semibold text-foreground">{booking.driver.bankAccount}</p>
                      <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(booking.driver.bankAccount)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ReceiptText className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Төлбөрийн баримт</h2>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Гүйлгээний screenshot</label>
                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer bg-muted/20">
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-foreground mb-2">Зургаа энд дарж эсвэл чирж оруулна уу</p>
                      <p className="text-sm text-muted-foreground">PNG, JPG эсвэл PDF (MAX. 10MB)</p>
                    </div>
                  </div>

                  <Input label="Гүйлгээний код / лавлагааны дугаар" placeholder="Жишээ: TXN123456789" />

                  <Button variant="primary" size="lg" fullWidth onClick={() => window.location.href = '/admin'}>
                    <CheckCircle className="w-5 h-5" />
                    Төлбөрийн баримт илгээх
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Demo дээр энэ товч admin payment queue руу шилжүүлнэ.
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-foreground">Payment summary</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Booking</p>
                    <p className="font-medium text-foreground">{booking.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Чиглэл</p>
                    <p className="font-medium text-foreground">{booking.route.from} → {booking.route.to}</p>
                  </div>
                  <div className="border-t border-border pt-4 space-y-3">
                    <PriceRow label="Жолоочийн үнэ" value={booking.price.agreed} />
                    <PriceRow label="Үйлчилгээний шимтгэл" value={booking.price.serviceFee} />
                    <div className="border-t border-border pt-3">
                      <PriceRow label="Нийт" value={booking.price.total} strong />
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardBody>
                <h3 className="font-semibold text-foreground mb-2">Admin approval</h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Proof илгээсний дараа admin төлбөрийг шалгаад approve хийвэл booking confirmed болно.
                  Татгалзсан бол тайлбар болон дахин upload хийх action нээгдэнэ.
                </p>
              </CardBody>
            </Card>
          </aside>
        </div>
        <AppFooter />
      </main>
    </div>
  );
}

function BankField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="font-semibold text-foreground">{value}</p>
    </div>
  );
}

function PriceRow({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? 'font-semibold text-foreground' : 'text-sm text-muted-foreground'}>{label}</span>
      <span className={strong ? 'text-2xl font-bold text-primary' : 'font-semibold text-foreground'}>
        ₮{value.toLocaleString()}
      </span>
    </div>
  );
}
