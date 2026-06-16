import { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';

export default function OronNutgiinUnaa() {
  useEffect(() => {
    document.title = 'Орон нутгийн унаа хайх | NuudelchinTrip';
    const meta = document.querySelector("meta[name='description']");
    meta?.setAttribute(
      'content',
      'Орон нутаг руу явах унаа, сул суудалтай жолооч болон хот хоорондын чиглэлээ NuudelchinTrip дээрээс хайж олоорой.',
    );
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="bg-primary/5 py-12 sm:py-16">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <Badge variant="info">Орон нутгийн унаа</Badge>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-foreground sm:text-5xl">
              Орон нутгийн унаа хайх хялбар арга
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
              NuudelchinTrip нь нэг чиглэлд явах зорчигч болон сул суудалтай жолоочийг
              холбодог платформ. Та аймаг, сум, хот хоорондын чиглэлээ сонгоод
              боломжтой унаа, суудал, үнийг нэг дор харна.
            </p>
            <div className="mt-7 flex justify-center">
              <Button onClick={() => window.location.href = '/routes'}>
                Унаа хайх
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto grid max-w-6xl gap-5 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
            {[
              ['Чиглэлээр хайх', 'Явах газар, очих газар, огноогоо сонгоод тохирох жолоочийн маршрутыг шалгана.'],
              ['Суудал баталгаажуулах', 'Сул суудал, үнэ, жолоочийн мэдээллийг харсны дараа хүсэлт илгээнэ.'],
              ['Ил тод тохиролцоо', 'Захиалга, төлбөрийн баримт, аяллын төлөв платформ дээр бүртгэгдэнэ.'],
            ].map(([title, text]) => (
              <Card key={title} className="p-6">
                <h2 className="text-xl font-semibold text-foreground">{title}</h2>
                <p className="mt-3 leading-7 text-muted-foreground">{text}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-muted/40 py-12">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground">Түгээмэл асуулт</h2>
            <div className="mt-6 space-y-4">
              {[
                ['NuudelchinTrip өөрөө тээвэр хийдэг үү?', 'Үгүй. NuudelchinTrip нь зорчигч болон жолоочийг холбох платформ бөгөөд аяллын тохиролцоог ил тод удирдахад тусална.'],
                ['Орон нутгийн унаа яаж захиалах вэ?', 'Та чиглэлээ хайж, тохирох жолоочийн мэдээлэлтэй танилцаад суудлын хүсэлт илгээнэ. Жолооч зөвшөөрсний дараа дараагийн алхам руу шилжинэ.'],
                ['Ямар чиглэлүүд багтах вэ?', 'Аймаг, сум, хот хоорондын чиглэлүүдийг жолооч нар өөрсдөө нийтэлдэг тул боломжит маршрут тухайн өдрийн заруудаас хамаарна.'],
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
