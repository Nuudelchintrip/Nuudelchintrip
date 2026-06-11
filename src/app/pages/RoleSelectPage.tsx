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
    <div className="flex min-h-screen items-center justify-center bg-background px-3.5 py-6 sm:px-4 sm:py-12">
      <div className="w-full max-w-6xl">
        <a href="/auth/register" className="mb-4 inline-flex min-h-10 items-center gap-2 text-sm text-muted-foreground hover:text-primary sm:mb-6">
          <ArrowLeft className="w-4 h-4" />
          Буцах
        </a>

        <a href="/" className="mb-5 flex justify-center sm:mb-8" aria-label="NuudelchinTrip нүүр">
          <Logo size="lg" />
        </a>

        <div className="mb-6 text-center sm:mb-10">
          <Badge variant="info" className="mb-3 sm:mb-4">Ашиглах төрөл</Badge>
          <h1 className="mb-2 text-2xl font-bold leading-tight text-foreground sm:mb-3 sm:text-3xl">Та NuudelchinTrip-ийг ямар зорилгоор ашиглах вэ?</h1>
          <p className="mx-auto max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Үндсэн үйлчилгээ нь аялагч, жолоочийг холбох. Дайвар ачаа нь жолоочийн чиглэл дээр суурилсан нэмэлт боломж.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
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
                <CardBody className="p-4 sm:p-7">
                  <div className={`${isDriver ? 'bg-accent/10 text-accent' : isCargo ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'} mb-4 flex h-14 w-14 items-center justify-center rounded-lg sm:mb-6 sm:h-20 sm:w-20`}>
                    {role.icon}
                  </div>
                  <h2 className="mb-2 text-xl font-semibold text-foreground sm:mb-3 sm:text-2xl">{role.title}</h2>
                  <p className="mb-4 text-sm leading-6 text-muted-foreground sm:mb-6 sm:text-base">{role.description}</p>

                  <div className="mb-5 space-y-2.5 sm:mb-7 sm:space-y-3">
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

        <p className="mt-5 text-center text-sm text-muted-foreground sm:mt-8">
          Ашиглах төрлөө дараа нь солих бол админы зөвшөөрөл шаардлагатай.
        </p>
      </div>
    </div>
  );
}
