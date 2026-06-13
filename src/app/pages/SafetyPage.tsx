import { AlertTriangle, BadgeCheck, Ban, FileWarning, ShieldCheck, Star, Upload } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';
import { PublicBackLink } from '../components/PublicBackLink';

const safetyFeatures = [
  {
    icon: <BadgeCheck className="w-6 h-6" />,
    title: 'Баталгаажсан хэрэглэгч',
    text: 'Утасны баталгаажуулалт, жолоочийн бичиг баримт, машины мэдээлэл, админы зөвшөөрсөн тэмдэг ашиглана.',
  },
  {
    icon: <Upload className="w-6 h-6" />,
    title: 'Төлбөрийн баримт',
    text: 'Төлбөрийн зураг эсвэл гүйлгээний код нь маргаан гарвал нотолгоо болно.',
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: 'Аяллын төлөв',
    text: 'Хүсэлт илгээгдсэн, зөвшөөрсөн, баталгаажсан, аялал эхэлсэн, дууссан төлөвүүдээр явцыг хянана.',
  },
  {
    icon: <FileWarning className="w-6 h-6" />,
    title: 'Гомдол ба хяналт',
    text: 'Хэрэглэгч гомдол үүсгэж, админ төлбөр, жолоочийн баталгаажуулалт, захиалгын маргааныг шалгана.',
  },
];

const safetyRules = [
  'Жолоочийн баталгаажсан тэмдэг, үнэлгээ, дууссан аяллыг шалгах',
  'Авах болон буулгах цэг, хөдлөх цагийг захиалга дээр тодорхой бичих',
  'Нийтийн карт дээр утас болон нарийн байршлыг бүрэн харуулахгүй байх',
  'Ирээгүй, хоцорсон, аюултай нөхцөл үүссэн үед гомдол илгээх',
  'Аялал дууссаны дараа үнэлгээ, сэтгэгдэл үлдээх',
];

const prohibitedCargo = [
  'Хууль бус бараа, зэвсэг, тэсэрч дэлбэрэх зүйл',
  'Амьд амьтан, муудах хүнс, аюултай бодис',
  'Их хэмжээний бэлэн мөнгө, өндөр үнэ цэнтэй зүйл',
  'Буруу мэдүүлсэн эсвэл хүлээн авагчийн мэдээлэл тодорхойгүй ачаа',
];

export function SafetyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        <div className="mx-auto max-w-7xl px-3.5 pt-4 sm:px-6 sm:pt-6 lg:px-8">
          <PublicBackLink />
        </div>
        <section className="bg-primary/5 py-9 sm:py-16">
          <div className="mx-auto max-w-5xl px-3.5 text-center sm:px-6 lg:px-8">
            <Badge variant="info" className="mb-3 sm:mb-5">Итгэлцэл ба аюулгүй байдал</Badge>
            <h1 className="mb-3 text-3xl font-bold leading-tight text-foreground sm:mb-4 sm:text-4xl">Аюулгүй байдал бол үндсэн хэсэг</h1>
            <p className="mx-auto max-w-3xl text-sm leading-6 text-muted-foreground sm:text-lg sm:leading-7">
              Аялагч, жолоочийг холбодог платформ дээр итгэлцэл хамгийн чухал. Баталгаажуулалт, төлбөрийн баримт, төлөвийн явц, гомдол, админы хяналт бүгд захиалгын урсгалын үндсэн хэсэг байна.
            </p>
          </div>
        </section>

        <section className="py-9 sm:py-14">
          <div className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
              {safetyFeatures.map((feature) => (
                <Card key={feature.title}>
                  <CardBody className="p-4 sm:p-6">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary sm:mb-5 sm:h-11 sm:w-11">
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

        <section className="bg-muted/40 py-9 sm:py-14">
          <div className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold text-foreground">Аюулгүй зорчих шалгах жагсаалт</h2>
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
                    NuudelchinTrip нь аялагч, жолооч болон чиглэл дээрх жижиг дайвар ачааг холбох платформ бөгөөд шууд тээврийн үйлчилгээ үзүүлэгч биш. Баталгаажуулалт, баримт, гомдол, админы хяналтаар эрсдэлийг багасгана.
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
