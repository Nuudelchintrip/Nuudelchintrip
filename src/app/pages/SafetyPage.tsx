import { AlertTriangle, BadgeCheck, Ban, FileWarning, ShieldCheck, Star, Upload } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';

const safetyFeatures = [
  {
    icon: <BadgeCheck className="w-6 h-6" />,
    title: 'Баталгаажсан хэрэглэгч',
    text: 'Утасны баталгаажуулалт, жолоочийн бичиг баримт, vehicle info, admin verified badge ашиглана.',
  },
  {
    icon: <Upload className="w-6 h-6" />,
    title: 'Төлбөрийн баримт',
    text: 'Төлбөрийн screenshot эсвэл transaction code нь маргаан гарвал evidence timeline болно.',
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: 'Trip status',
    text: 'Request, accepted, confirmed, on trip, completed төлөвүүдээр аяллын явцыг хянана.',
  },
  {
    icon: <FileWarning className="w-6 h-6" />,
    title: 'Report ба moderation',
    text: 'Хэрэглэгч report үүсгэж, admin төлбөр, жолоочийн verification, booking маргааныг шалгана.',
  },
];

const safetyRules = [
  'Жолоочийн verified badge, үнэлгээ, completed trips-ийг шалгах',
  'Pickup/dropoff болон хөдөлгөх цагийг booking дээр тодорхой бичих',
  'Public card дээр утас болон нарийн байршлыг бүрэн харуулахгүй байх',
  'No-show, late trip, unsafe behavior үед report үүсгэх',
  'Аялал дууссаны дараа rating/comment үлдээх',
];

const prohibitedCargo = [
  'Хууль бус бараа, зэвсэг, тэсэрч дэлбэрэх зүйл',
  'Амьд амьтан, муудах хүнс, аюултай бодис',
  'Их хэмжээний бэлэн мөнгө, өндөр үнэ цэнтэй зүйл',
  'Буруу мэдүүлсэн эсвэл receiver info тодорхойгүй ачаа',
];

export function SafetyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        <section className="bg-primary/5 py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="info" className="mb-5">Trust & safety</Badge>
            <h1 className="text-4xl font-bold text-foreground mb-4">Аюулгүй байдал бол core feature</h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Passenger-driver marketplace дээр итгэлцэл нь гоёл биш. Verification, payment proof, status timeline, report, admin moderation бүгд booking flow-ийн үндсэн хэсэг байна.
            </p>
          </div>
        </section>

        <section className="py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {safetyFeatures.map((feature) => (
                <Card key={feature.title}>
                  <CardBody className="p-6">
                    <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-5">
                      {feature.icon}
                    </div>
                    <h2 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h2>
                    <p className="text-sm text-muted-foreground">{feature.text}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 bg-muted/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold text-foreground">Аюулгүй зорчих checklist</h2>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {safetyRules.map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <Star className="w-5 h-5 text-warning mt-0.5" />
                        <p className="text-sm text-foreground">{item}</p>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Ban className="w-5 h-5 text-destructive" />
                    <h2 className="text-xl font-semibold text-foreground">Дайвар ачааны дүрэм</h2>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {prohibitedCargo.map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                        <p className="text-sm text-foreground">{item}</p>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>

              <Card className="border-warning/30 bg-warning/5">
                <CardHeader>
                  <h2 className="text-xl font-semibold text-foreground">Хариуцлагын зарчим</h2>
                </CardHeader>
                <CardBody>
                  <p className="text-foreground leading-7">
                    NuudelchinTrip нь аялагч, жолооч болон route дээрх жижиг дайвар ачааг холбох marketplace бөгөөд шууд тээврийн үйлчилгээ үзүүлэгч биш. Verification, proof, report, admin moderation-оор эрсдэлийг багасгана.
                  </p>
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
