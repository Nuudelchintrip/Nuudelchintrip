import { ArrowLeft, ArrowRight, Car, CheckCircle2, Package, UserRound } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Logo } from '../components/Logo';
import { getDashboardPath, saveStoredUser, type MarketplaceRole } from '../utils/auth';

const roles = [
  {
    title: 'Би аялагч',
    description: 'Орон нутаг руу явах унаа, сул суудал, үнэ, найдвартай жолооч хайна.',
    icon: <UserRound className="w-10 h-10" />,
    color: 'info',
    role: 'traveler',
    benefits: ['Унаа хайх', 'Жолоочийн санал харах', 'Захиалгын хүсэлт илгээх', 'Төлбөрийн баримт оруулах'],
  },
  {
    title: 'Би жолооч',
    description: 'Явах чиглэл, цаг, сул суудал, үнийг нийтэлж аялагчийн хүсэлт авна.',
    icon: <Car className="w-10 h-10" />,
    color: 'accent',
    role: 'driver',
    benefits: ['Аяллын чиглэл нийтлэх', 'Аялагчийн хүсэлт шийдэх', 'Аяллын төлөв шинэчлэх', 'Орлого хянах'],
  },
  {
    title: 'Би дайвар ачаа илгээнэ',
    description: 'Жолоочийн нийтэлсэн чиглэл дээр жижиг дайвар ачаа илгээх хүсэлт үүсгэнэ.',
    icon: <Package className="w-10 h-10" />,
    color: 'cargo',
    role: 'cargo_sender',
    benefits: ['Дайвар ачаа авах чиглэл хайх', 'Жижиг ачааны хүсэлт илгээх', 'Баримт ба ачаа авсан зураг оруулах', 'Хүлээн авах кодоор баталгаажуулах'],
  },
] as const;

export function RoleSelectPage() {
  const chooseRole = (role: MarketplaceRole) => {
    saveStoredUser({
      role,
      full_name: role === 'driver' ? 'Бат Болд' : role === 'cargo_sender' ? 'Дорж Цэцэг' : 'Сарангэрэл Цэцэг',
      phone: '+976 99999999',
      email: `${role}@nuudelchintrip.mn`,
      phone_verified: true,
      onboarding_completed: true,
      verification_status: role === 'driver' ? 'pending' : undefined,
      cargo_policy_accepted: role === 'cargo_sender' ? true : undefined,
    });
    window.location.href = getDashboardPath(role);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-6xl">
        <a href="/auth/register" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" />
          Буцах
        </a>

        <a href="/" className="mb-8 flex justify-center" aria-label="NuudelchinTrip нүүр">
          <Logo size="lg" />
        </a>

        <div className="text-center mb-10">
          <Badge variant="info" className="mb-4">Ашиглах төрөл</Badge>
          <h1 className="text-3xl font-bold text-foreground mb-3">Та NuudelchinTrip-ийг ямар зорилгоор ашиглах вэ?</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Үндсэн үйлчилгээ нь аялагч, жолоочийг холбох. Дайвар ачаа нь жолоочийн чиглэл дээр суурилсан нэмэлт боломж.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role) => {
            const isDriver = role.color === 'accent';
            const isTraveler = role.color === 'info';
            const isCargo = role.color === 'cargo';
            const tone = isDriver ? 'accent' : 'primary';

            return (
              <Card
                key={role.title}
                className={`border-2 transition-all hover:-translate-y-1 hover:shadow-lg ${
                  isDriver ? 'hover:border-accent' : 'hover:border-primary'
                }`}
              >
                <CardBody className="p-7">
                  <div className={`${isDriver ? 'bg-accent/10 text-accent' : isCargo ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'} w-20 h-20 rounded-lg flex items-center justify-center mb-6`}>
                    {role.icon}
                  </div>
                  <h2 className="text-2xl font-semibold text-foreground mb-3">{role.title}</h2>
                  <p className="text-muted-foreground mb-6">{role.description}</p>

                  <div className="space-y-3 mb-7">
                    {role.benefits.map((benefit) => (
                      <div key={benefit} className="flex items-start gap-3">
                        <CheckCircle2 className={`w-5 h-5 ${isDriver ? 'text-accent' : isCargo ? 'text-warning' : 'text-primary'} mt-0.5`} />
                        <span className="text-sm text-foreground">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant={tone}
                    fullWidth
                    onClick={() => chooseRole(role.role)}
                  >
                    {isTraveler ? 'Аялагчийн самбар руу' : isDriver ? 'Жолоочийн самбар руу' : 'Дайвар ачааны самбар руу'}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardBody>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Ашиглах төрлөө дараа нь солих бол админы зөвшөөрөл шаардлагатай.
        </p>
      </div>
    </div>
  );
}
