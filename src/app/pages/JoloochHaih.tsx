import { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';

export default function JoloochHaih() {
  useEffect(() => {
    document.title = 'Жолооч хайх | NuudelchinTrip';
    const meta = document.querySelector("meta[name='description']");
    meta?.setAttribute(
      'content',
      'Орон нутаг, хот хооронд явах жолооч хайж, сул суудалтай чиглэл болон маршрутыг NuudelchinTrip дээрээс олоорой.',
    );
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="bg-primary/5 py-12 sm:py-16">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <Badge variant="info">Жолооч хайх</Badge>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-foreground sm:text-5xl">
              Чиглэл таарах жолооч хайх
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
              Орон нутаг руу явахдаа сул суудалтай жолоочийн маршрутыг хайж,
              суудал, үнэ, явах өдөр болон буух цэгийн мэдээллийг харьцуулна.
              NuudelchinTrip нь зорчигчийн хүсэлт, жолоочийн зөвшөөрөл, төлбөрийн
              баримтыг нэг дор удирдахад тусална.
            </p>
            <div className="mt-7 flex justify-center">
              <Button onClick={() => window.location.href = '/routes'}>
                Жолооч хайх
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground">Жолооч хайхдаа шалгах мэдээлэл</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {[
                ['Маршрут', 'Жолоочийн явах чиглэл таны суух, буух газартай ойр эсэхийг шалгана.'],
                ['Суудал', 'Сул суудлын тоо болон нэг хүний үнэ тодорхой харагдана.'],
                ['Төлөв', 'Хүсэлт илгээх, зөвшөөрөх, төлбөр шалгах, аялал эхлэх төлөвүүд дарааллаар явна.'],
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
                ['Жолооч шууд баталгаажих уу?', 'Зорчигч хүсэлт илгээсний дараа жолооч зөвшөөрөх эсвэл татгалзах боломжтой.'],
                ['Жолоочийн мэдээлэл харагдах уу?', 'Маршрут, үнэ, суудал болон жолоочийн бүртгэлийн мэдээлэл платформын боломжит хэсэгт харагдана.'],
                ['Би өөрийн чиглэлд жолооч олдохгүй бол яах вэ?', 'Тухайн өдөр маршрут нийтлээгүй байж болно. Өөр огноо, ойролцоо чиглэлээр дахин хайж болно.'],
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
