import { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';

export default function AchaaDaih() {
  useEffect(() => {
    document.title = 'Ачаа дайх | NuudelchinTrip';
    const meta = document.querySelector("meta[name='description']");
    meta?.setAttribute(
      'content',
      'Орон нутаг, хот хоорондын чиглэлд дайвар ачаа илгээх боломжтой жолоочийн маршрутыг NuudelchinTrip дээрээс хайгаарай.',
    );
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="bg-primary/5 py-12 sm:py-16">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <Badge variant="info">Дайвар ачаа</Badge>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-foreground sm:text-5xl">
              Ачаа дайх боломжтой чиглэл хайх
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
              NuudelchinTrip дээр жолоочийн нийтэлсэн маршрутаас ачаа авах боломжтой
              чиглэлийг сонгож, ачааны хэмжээ, жин, хүлээн авагчийн мэдээллээ бүртгэнэ.
              Дайвар ачаа нь зорчигчийн үндсэн урсгалыг дагасан нэмэлт боломж юм.
            </p>
            <div className="mt-7 flex justify-center">
              <Button onClick={() => window.location.href = '/cargo/find-routes'}>
                Ачааны чиглэл хайх
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground">Ачаа дайхдаа юу анхаарах вэ?</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {[
                ['Чиглэл таарах', 'Ачаа зөвхөн жолоочийн явж буй чиглэлтэй таарсан үед хүсэлт илгээнэ.'],
                ['Мэдээлэл бүрэн байх', 'Ачааны төрөл, хэмжээ, жин, авах болон хүргэх мэдээлэл тодорхой байх хэрэгтэй.'],
                ['Баталгаатай хүлээлцэх', 'Төлбөр, proof, delivery code зэрэг алхам нь хүлээлцэх явцыг илүү тодорхой болгоно.'],
              ].map(([title, text]) => (
                <Card key={title} className="p-6">
                  <h2 className="text-xl font-semibold text-foreground">{title}</h2>
                  <p className="mt-3 leading-7 text-muted-foreground">{text}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-muted/40 py-12">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground">Түгээмэл асуулт</h2>
            <div className="mt-6 space-y-4">
              {[
                ['Ямар ачаа дайж болох вэ?', 'Жолоочийн зөвшөөрсөн хэмжээ, жин, нөхцөлд багтах ачааг илгээж болно. Хориглосон болон эрсдэлтэй бараа илгээхгүй.'],
                ['Ачаа шууд хүргэлтийн үйлчилгээ мөн үү?', 'Үгүй. Энэ нь жолоочийн явж буй чиглэл дээр суурилсан дайвар ачааны тохиролцоо юм.'],
                ['Хүлээн авсныг яаж баталгаажуулах вэ?', 'Ачааны proof болон delivery code ашиглан хүлээлцсэн төлөвийг платформ дээр тэмдэглэнэ.'],
              ].map(([question, answer]) => (
                <Card key={question} className="p-5">
                  <h2 className="font-semibold text-foreground">{question}</h2>
                  <p className="mt-2 leading-7 text-muted-foreground">{answer}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
