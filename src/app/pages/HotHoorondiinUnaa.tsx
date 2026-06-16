import { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';

export default function HotHoorondiinUnaa() {
  useEffect(() => {
    document.title = 'Хот хоорондын унаа | NuudelchinTrip';
    const meta = document.querySelector("meta[name='description']");
    meta?.setAttribute(
      'content',
      'Хот хоорондын унаа, сул суудал, жолоочийн чиглэл хайж зорчигч болон жолоочийг NuudelchinTrip дээр холбоорой.',
    );
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="bg-primary/5 py-12 sm:py-16">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <Badge variant="info">Хот хоорондын чиглэл</Badge>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-foreground sm:text-5xl">
              Хот хоорондын унаа нэг дор
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
              Улаанбаатараас аймаг, аймгаас хот, сум хооронд явахдаа сул суудалтай
              жолоочийн чиглэлийг хайж, тохирох аяллын хүсэлт илгээх боломжтой.
              NuudelchinTrip нь чиглэл, суудал, төлбөрийн баримтыг нэг урсгалд нэгтгэнэ.
            </p>
            <div className="mt-7 flex justify-center">
              <Button onClick={() => window.location.href = '/routes'}>
                Чиглэл хайх
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground">Хот хоорондын аялалд хэрэгтэй зүйлс</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {[
                ['Огноо ба цаг', 'Явах өдөр, цагийн мэдээлэл тодорхой байх тусам тохирох унаа олоход амар.'],
                ['Суух, буух цэг', 'Зорчигч болон жолооч эхлэх, хүрэх байршлаа урьдчилан тохиролцоно.'],
                ['Үнэ ба суудал', 'Нэг хүний үнэ, сул суудлын тоо, захиалгын төлөвийг шалгаж болно.'],
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
                ['Хот хоорондын унаа урьдчилж захиалж болох уу?', 'Тийм. Жолооч маршрутаа нийтэлсэн бол зорчигч хүсэлт илгээж, зөвшөөрөгдсөний дараа төлбөрийн алхам руу орно.'],
                ['Жолооч баталгаажсан эсэхийг яаж мэдэх вэ?', 'Жолоочийн бүртгэл, машины мэдээлэл, баталгаажуулалтын төлөвийг платформын урсгалд харуулна.'],
                ['Нэгээс олон хүн суудал авч болох уу?', 'Боломжтой. Сул суудлын тоонд багтаж байвал зорчигч хүний тоогоо сонгон хүсэлт илгээнэ.'],
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
