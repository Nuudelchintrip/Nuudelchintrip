import { ArrowRight, LockKeyhole, Search, ShieldCheck } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Footer } from '../components/Footer';
import { LocationSelectGroup } from '../components/LocationSelectGroup';
import { Navbar } from '../components/Navbar';

export function TripsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
          <div>
            <Badge variant="info">Чиглэл хайх</Badge>
            <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight text-foreground sm:text-5xl">
              Жинхэнэ чиглэлүүд нэвтэрсний дараа харагдана
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
              NuudelchinTrip дээр жолоочийн нийтэлсэн чиглэл, сул суудал, үнэ, утасны мэдээлэл нь хэрэглэгч нэвтэрсний дараа өөрийн төрөлд тохирсон самбарт харагдана.
            </p>
          </div>

          <Card className="border-primary/20 bg-primary/5 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <LockKeyhole className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-foreground">Яагаад public жагсаалт байхгүй вэ?</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Жолооч, аялагчийн утас, захиалга, төлбөрийн баримт, маргааны мэдээлэл privacy-тэй холбоотой тул login-ийн дараа л ажиллана.
            </p>
          </Card>
        </section>

        <Card className="mt-8 p-5 md:p-6">
          <div className="mb-5 flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Хайлтын талбар</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <LocationSelectGroup
              label="Хаанаас"
              aimag=""
              soum=""
              onAimagChange={() => undefined}
              onSoumChange={() => undefined}
            />
            <LocationSelectGroup
              label="Хаашаа"
              aimag=""
              soum=""
              onAimagChange={() => undefined}
              onSoumChange={() => undefined}
            />
          </div>

          <div className="mt-5 rounded-lg border border-border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
            Бодит хайлт хийхийн тулд бүртгүүлж эсвэл нэвтэрнэ үү. Аялагчийн самбар дээр “Жолооч хайх”, жолоочийн самбар дээр “Чиглэл нэмэх” урсгал ажиллана.
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => window.location.href = '/auth/register?role=traveler'}>
              Аялагчаар бүртгүүлэх
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/auth/login?next=/traveler/find-drivers'}>
              Нэвтрэх
            </Button>
          </div>
        </Card>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            ['Аялагч', 'Нэвтэрсний дараа боломжтой жолоочийн чиглэл хайна.'],
            ['Жолооч', 'Баталгаажсаны дараа өөрийн чиглэлээ нийтэлнэ.'],
            ['Дайвар ачаа', 'Зөвхөн ачаа авах боломжтой чиглэл дээр хүсэлт илгээнэ.'],
          ].map(([title, text]) => (
            <Card key={title} className="p-5">
              <ShieldCheck className="h-6 w-6 text-success" />
              <h2 className="mt-4 text-lg font-semibold text-foreground">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
            </Card>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
}
