import type { ReactNode } from 'react';
import { AlertCircle, ArrowLeft, Camera, CheckCircle, FileCheck2, ShieldCheck, Upload } from 'lucide-react';
import { useParams } from 'react-router';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { AppFooter } from '../components/Footer';
import { Input } from '../components/Input';
import { Sidebar } from '../components/Sidebar';
import { getBooking } from '../data/mockData';
import { getDashboardMenu } from '../navigation/dashboardMenus';

export function DeliveryProofPage() {
  const { id } = useParams();
  const booking = getBooking(id);

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar menuItems={getDashboardMenu('driver')} accountRole="driver" />

      <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-8">
        <button
          type="button"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
          onClick={() => window.location.href = `/dashboard/bookings/${booking.id}`}
        >
          <ArrowLeft className="w-4 h-4" />
          Booking руу буцах
        </button>

        <section className="mb-8 rounded-lg border border-primary/20 bg-primary/5 p-6">
          <Badge variant="info" className="mb-4">Trip evidence</Badge>
          <h1 className="text-3xl font-bold text-foreground mb-3">Аяллын нотолгоо ба delivery code</h1>
          <p className="max-w-3xl text-muted-foreground leading-7">
            Pickup үеийн тэмдэглэл, хүргэсэн нотолгоо, аялагчийн 6 оронтой баталгаажуулах код нь dispute үед admin-д evidence болно.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Аяллын баталгааны заавар</h2>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    'Аялагчийг pickup хийх үед эхэлсэн тэмдэглэл эсвэл зураг хадгална.',
                    'Аялал дуусах үед хүргэсэн нотолгоо оруулна.',
                    'Аялагчийн 6 оронтой баталгаажуулах кодыг оруулна.',
                    'Илгээсний дараа booking completed flow руу шилжинэ.',
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProofUploadCard
                title="Ачаа авсан нотолгоо"
                description="Аялагчийг pickup хийсэн үеийн зураг эсвэл тэмдэглэл"
                icon={<Camera className="w-5 h-5 text-primary" />}
                tone="primary"
              />
              <ProofUploadCard
                title="Хүргэсэн нотолгоо"
                description="Аялал дууссан үеийн зураг эсвэл тэмдэглэл"
                icon={<Camera className="w-5 h-5 text-success" />}
                tone="success"
              />
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-warning" />
                  <h2 className="text-xl font-semibold text-foreground">Хүлээн авагчийн код</h2>
                </div>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-muted-foreground mb-4">
                  Аялагчийн өгсөн 6 оронтой кодыг оруулна. Demo code: {booking.tripCode}
                </p>
                <Input placeholder="000000" maxLength={6} className="text-center text-2xl tracking-widest font-mono" />
              </CardBody>
            </Card>

            <Card className="bg-success/5 border-success/20">
              <CardBody>
                <Button variant="primary" size="lg" fullWidth className="bg-success hover:bg-success/90" onClick={() => window.location.href = `/dashboard/bookings/${booking.id}`}>
                  <CheckCircle className="w-5 h-5" />
                  Аялал дууссан гэж баталгаажуулах
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Backend холбогдох үед энэ action completed status update хийнэ.
                </p>
              </CardBody>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-foreground">Booking summary</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <SummaryRow label="Booking" value={booking.id} />
                  <SummaryRow label="Суудал" value={booking.ride.title} />
                  <SummaryRow label="Чиглэл" value={`${booking.route.from} → ${booking.route.to}`} />
                  <SummaryRow label="Аялагч" value={booking.passenger.name} />
                  <SummaryRow label="Утас" value={booking.passenger.phone} />
                </div>
              </CardBody>
            </Card>

            <Card className="border-warning/20 bg-warning/5">
              <CardBody>
                <div className="flex gap-3">
                  <ShieldCheck className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <p className="text-sm leading-6 text-muted-foreground">
                    Pickup болон completed proof тэмдэглэлгүй бол маргаан шийдвэрлэхэд evidence дутуу болно.
                  </p>
                </div>
              </CardBody>
            </Card>
          </aside>
        </div>
        <AppFooter />
      </main>
    </div>
  );
}

function ProofUploadCard({ title, description, icon, tone }: { title: string; description: string; icon: ReactNode; tone: 'primary' | 'success' }) {
  const hoverClass = tone === 'primary' ? 'hover:border-primary' : 'hover:border-success';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        </div>
      </CardHeader>
      <CardBody>
        <div className={`border-2 border-dashed border-border rounded-xl p-8 text-center ${hoverClass} transition-colors cursor-pointer bg-muted/20`}>
          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground mb-2">{description}</p>
          <p className="text-sm text-muted-foreground">PNG, JPG (MAX. 10MB)</p>
        </div>
      </CardBody>
    </Card>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-border pb-3 last:border-b-0 last:pb-0">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}
