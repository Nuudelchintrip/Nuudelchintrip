import { useMemo, useState, type ReactNode } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bell,
  Camera,
  Car,
  CheckCircle2,
  FileCheck2,
  KeyRound,
  LockKeyhole,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  ShieldCheck,
  Star,
  Trash2,
  Upload,
  UserCircle,
  XCircle,
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { AppFooter, Footer } from '../components/Footer';
import { Input } from '../components/Input';
import { Navbar } from '../components/Navbar';
import { Select } from '../components/Select';
import { Sidebar } from '../components/Sidebar';
import { getDashboardMenu } from '../navigation/dashboardMenus';
import {
  getActionLogs,
  getIdentityRequests,
  getStoredUser,
  upsertIdentityRequest,
  type IdentityVerificationRequest,
  type MarketplaceRole,
  type VerificationStatus,
} from '../utils/auth';

type AccountRole = 'sender' | 'traveler' | 'driver' | 'admin';

const profiles = {
  traveler: {
    name: 'Сарангэрэл Цэцэг',
    label: 'Аялагч',
    title: 'Аялагчийн хувийн мэдээлэл',
    description: 'Унаа хайх, захиалга, төлбөрийн баримт, аяллын түүх, сонголтоо нэг дор хянана.',
    phone: '+976 9999 9999',
    email: 'traveler@nuudelchintrip.mn',
    dashboardHref: '/dashboard/traveler',
    accent: 'primary',
  },
  driver: {
    name: 'Бат-Эрдэнэ',
    label: 'Жолооч',
    title: 'Жолоочийн хувийн мэдээлэл',
    description: 'Жолоочийн баталгаажуулалт, машин, чиглэлийн түүх, үнэлгээ, орлого, дайвар ачааны эрх эндээс харагдана.',
    phone: '+976 8888 8888',
    email: 'driver@nuudelchintrip.mn',
    dashboardHref: '/dashboard/driver',
    accent: 'success',
  },
  sender: {
    name: 'Дорж Цэцэг',
    label: 'Дайвар ачаа илгээгч',
    title: 'Ачаа илгээгчийн хувийн мэдээлэл',
    description: 'Илгээсэн ачаа, хүлээн авагч, төлбөрийн баримт, хүргэлтийн код, ачааны дүрмийн зөвшөөрлийг хянана.',
    phone: '+976 9090 9090',
    email: 'sender@nuudelchintrip.mn',
    dashboardHref: '/dashboard/cargo',
    accent: 'warning',
  },
  admin: {
    name: 'Админ',
    label: 'Платформын хяналт',
    title: 'Админы мэдээлэл',
    description: 'Төлбөр, баталгаажуулалт, гомдол болон аюулгүй байдлын хяналт хийх эрхтэй бүртгэл.',
    phone: '+976 7000 0000',
    email: 'admin@nuudelchintrip.mn',
    dashboardHref: '/admin',
    accent: 'primary',
  },
};

const travelerTrips = [
  { route: 'УБ → Дархан', status: 'Дууссан', date: '2026.05.18', rating: '5.0' },
  { route: 'УБ → Эрдэнэт', status: 'Баталгаажсан', date: '2026.05.28', rating: '-' },
  { route: 'Дархан → УБ', status: 'Цуцлагдсан', date: '2026.05.10', rating: '-' },
];

const driverRoutes = [
  { route: 'УБ → Дархан', trips: 18, income: '₮630,000' },
  { route: 'УБ → Эрдэнэт', trips: 12, income: '₮480,000' },
  { route: 'Дархан → УБ', trips: 9, income: '₮288,000' },
];

const cargoHistory = [
  { item: 'Баримт бичиг', route: 'УБ → Дархан', status: 'Хүргэгдсэн', code: '482913' },
  { item: 'Жижиг хайрцаг', route: 'УБ → Эрдэнэт', status: 'Замдаа', code: '739120' },
  { item: 'Хувцас', route: 'Дархан → УБ', status: 'Хүсэлт илгээгдсэн', code: '-' },
];

export function AccountProfilePage({ role }: { role: AccountRole }) {
  return <ProfileExperiencePage role={role} />;
}

function LegacyAccountProfilePage({ role }: { role: AccountRole }) {
  const profile = profiles[role];

  return (
    <AccountFrame role={role}>
      <div className="mb-8">
        <Badge variant="info">{profile.label}</Badge>
        <h1 className="mt-4 text-3xl font-bold text-foreground">{profile.title}</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">{profile.description}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative flex h-24 w-24 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserCircle className="h-12 w-12" />
                <button className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl font-semibold text-foreground">{profile.name}</h2>
                <p className="mt-1 text-muted-foreground">{profile.phone} · {profile.email}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="success">Утас баталгаажсан</Badge>
                  <Badge variant="success">Профайл баталгаажсан</Badge>
                <Badge variant="default">{profile.label}</Badge>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <Input label="Нэр" defaultValue={profile.name} />
              <Input label="Утас" defaultValue={profile.phone} />
              <Input label="И-мэйл" defaultValue={profile.email} />
              <Select
                label="Хэрэглэгчийн төрөл"
                value={role}
                disabled
                options={[
                  { value: 'traveler', label: 'Аялагч' },
                  { value: 'driver', label: 'Жолооч' },
                  { value: 'sender', label: 'Дайвар ачаа илгээгч' },
                  { value: 'admin', label: 'Админ' },
                ]}
              />
            </div>

            {role === 'traveler' && <TravelerProfileFields />}
            {role === 'driver' && <DriverProfileFields />}
            {role === 'sender' && <SenderProfileFields />}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button>Профайл хадгалах</Button>
              <Button variant="outline" onClick={() => window.location.href = getVerificationHref(role)}>
                Баталгаажуулалтын төв
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          {role === 'traveler' && <TravelerHistory />}
          {role === 'driver' && <DriverTrustPanel />}
          {role === 'sender' && <SenderCargoPanel />}
          {role === 'admin' && <AdminScopePanel />}
        </div>

        <aside className="space-y-5">
          <Card className="p-5">
            <h2 className="text-xl font-semibold text-foreground">Нийтэд харагдах ба хувийн мэдээлэл</h2>
            <div className="mt-5 space-y-4">
              <VisibilityRow title="Нийтэд харагдах профайл" text="Нэр, үнэлгээ, дууссан аялал, баталгаажуулалтын тэмдэг, машины үндсэн мэдээлэл харагдана." />
              <VisibilityRow title="Хувийн мэдээлэл" text="Утас, имэйл, бичиг баримт, төлбөрийн баримт, маргааны түүх нууц байна." />
            </div>
          </Card>

          <Card className="border-primary/20 bg-primary/5 p-5">
            <h2 className="text-xl font-semibold text-foreground">Итгэлцлийн хураангуй</h2>
            <div className="mt-5 grid gap-3">
              <Metric label="Үнэлгээ" value={role === 'driver' ? '4.8' : role === 'traveler' ? '5.0' : '-'} />
              <Metric label="Дууссан" value={role === 'driver' ? '42 аялал' : role === 'sender' ? '8 ачаа' : '12 аялал'} />
              <Metric label="Гомдол" value="Идэвхтэй гомдолгүй" />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-xl font-semibold text-foreground">Дараагийн алхам</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Профайлын баталгаажуулалт өндөр байх тусам суудлын хүсэлт, жолоочийн зөвшөөрөл, дайвар ачааны хүсэлт илүү найдвартай харагдана.
            </p>
            <Button className="mt-5" fullWidth onClick={() => window.location.href = profile.dashboardHref}>
              Самбар руу буцах
            </Button>
          </Card>
        </aside>
      </div>
    </AccountFrame>
  );
}

function ProfileExperiencePage({ role }: { role: AccountRole }) {
  const profile = profiles[role];
  const details = getProfileExperience(role);

  return (
    <AccountFrame role={role}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          onClick={() => window.location.href = profile.dashboardHref}
        >
          <ArrowLeft className="h-4 w-4" />
          Самбар руу буцах
        </button>
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">Утас баталгаажсан</Badge>
          <Badge variant={role === 'driver' ? 'warning' : 'info'}>{details.status}</Badge>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
          <Card className="overflow-hidden p-6">
            <div className="relative mx-auto flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 via-white to-warning/20 text-primary shadow-inner">
              <UserCircle className="h-20 w-20" />
              <button className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{profile.name}</h1>
              <p className="mt-1 text-sm font-medium text-muted-foreground">{details.roleLabel}</p>
            </div>

            <Button className="mt-6" fullWidth onClick={() => window.location.href = getSettingsHref(role)}>
              <Phone className="h-4 w-4" />
              Холбоо барих мэдээлэл засах
            </Button>

            <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4 text-center">
              <p className="text-sm text-muted-foreground">Профайлын төлөв</p>
              <p className="mt-1 font-semibold text-foreground">{details.availability}</p>
            </div>

            <div className="mt-6 border-t border-border pt-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Баталгаажуулалт</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {details.badges.map((badge) => (
                  <span key={badge} className="rounded-full border border-border bg-card px-3 py-1 text-sm font-medium text-foreground">
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Товч мэдээлэл</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{details.about}</p>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {details.location}
              </div>
            </div>
          </Card>

          <Card className="border-primary/20 bg-primary/5 p-5">
            <div className="flex items-center gap-4">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-card">
                <div className="absolute inset-1 rounded-full border-4 border-primary border-r-warning" />
                <span className="z-10 text-sm font-bold text-foreground">{details.completion}%</span>
              </div>
              <div>
                <p className="font-semibold text-foreground">Профайлын бүрдэлт</p>
                <p className="mt-1 text-sm text-muted-foreground">{details.nextStep}</p>
              </div>
            </div>
          </Card>
        </aside>

        <section className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" variant="outline" onClick={() => window.location.href = getVerificationHref(role)}>
                <BadgeCheck className="h-4 w-4" />
                Баталгаажуулалт
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost">Дараа</Button>
            </div>
            <h2 className="mt-5 max-w-4xl text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl">
              {details.headline}
            </h2>
            <div className="mt-6 flex flex-wrap gap-6 border-b border-border text-sm font-semibold text-muted-foreground">
              {['Хувийн мэдээлэл', 'Итгэлцэл', 'Үйлдлийн түүх'].map((tab, index) => (
                <span key={tab} className={`pb-3 ${index === 0 ? 'border-b-2 border-foreground text-foreground' : ''}`}>
                  {tab}
                </span>
              ))}
            </div>
          </div>

          <Card className="p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Хувийн мэдээлэл</h2>
                <p className="mt-1 text-sm text-muted-foreground">Хувийн мэдээлэл зөвхөн тухайн хэрэглэгч болон админд харагдана.</p>
              </div>
              <Button variant="outline" size="sm">Засвар хадгалах</Button>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Input label="Нэр" defaultValue={profile.name} />
              <Input label="Утас" defaultValue={profile.phone} />
              <Input label="И-мэйл" defaultValue={profile.email} />
              <Select
                label="Хэрэглэгчийн төрөл"
                value={role}
                disabled
                options={[
                  { value: 'traveler', label: 'Аялагч' },
                  { value: 'driver', label: 'Жолооч' },
                  { value: 'sender', label: 'Дайвар ачаа илгээгч' },
                  { value: 'admin', label: 'Админ' },
                ]}
              />
              {details.privateFields.map((field) => (
                <Input key={field.label} label={field.label} defaultValue={field.value} />
              ))}
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold text-foreground">{details.primaryCardTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{details.primaryCardText}</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {details.infoCards.map((item) => (
                  <InfoCard key={item.title} title={item.title} text={item.text} />
                ))}
              </div>
            </Card>

            <Card className="border-success/20 bg-success/5 p-6">
              <h2 className="text-xl font-semibold text-foreground">Итгэлцлийн тойм</h2>
              <div className="mt-5 grid gap-3">
                <Metric label="Үнэлгээ" value={details.rating} />
                <Metric label="Дууссан" value={details.completed} />
                <Metric label="Идэвхтэй гомдол" value="0" />
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold text-foreground">Сүүлийн үйлдлүүд</h2>
            <div className="mt-5 grid gap-3">
              {details.activity.map((item) => (
                <TimelineRow key={`${item.title}-${item.meta}`} title={item.title} meta={item.meta} right={item.right} />
              ))}
            </div>
          </Card>
        </section>
      </div>
    </AccountFrame>
  );
}

function getProfileExperience(role: AccountRole) {
  if (role === 'driver') {
    return {
      roleLabel: 'Баталгаажуулалт хүлээгдэж буй жолооч',
      status: 'Жолоочийн баталгаажуулалт хүлээгдэж байна',
      availability: 'Админы зөвшөөрөл хүлээж байна',
      headline: 'Найдвартай жолоочийн мэдээлэл, машин, чиглэлийн түүх нэг дор',
      about: 'Орон нутаг руу тогтмол явдаг, суудал болон авах цэгийн нөхцлөө тодорхой бичдэг жолоочийн профайл.',
      location: 'Улаанбаатар, Монгол',
      completion: 78,
      nextStep: 'Машины гэрчилгээний зураг нэмэх',
      badges: ['Утас баталгаажсан', 'Үнэмлэх шалгаж байна', 'Toyota Prius 30', 'Дайвар ачаа авч болно'],
      privateFields: [
        { label: 'Машины загвар', value: 'Toyota Prius 30' },
        { label: 'Улсын дугаар', value: 'УБА 1234' },
        { label: 'Суудлын тоо', value: '4' },
        { label: 'Жолооны үнэмлэх', value: 'Админ шалгаж байна' },
      ],
      primaryCardTitle: 'Жолоочийн мэдээлэл',
      primaryCardText: 'Нийтийн карт дээр зөвхөн баталгаажсан тэмдэг, үнэлгээ, дууссан аялал, машины үндсэн мэдээлэл харагдана.',
      infoCards: [
        { title: 'Чиглэлийн түүх', text: '42 аялал дууссан' },
        { title: 'Дундаж хариу', text: '18 минут' },
        { title: 'Ачаа авах эрх', text: 'Дайвар ачаа авч болно' },
        { title: 'Орлого', text: 'Орлогын тойм' },
      ],
      rating: '4.8/5',
      completed: '42 аялал',
      activity: driverRoutes.map((route) => ({ title: route.route, meta: `${route.trips} аялал`, right: route.income })),
    };
  }

  if (role === 'sender') {
    return {
      roleLabel: 'Дайвар ачаа илгээгч',
      status: 'Ачааны дүрэм зөвшөөрсөн',
      availability: 'Ачаа илгээхэд бэлэн',
      headline: 'Хүлээн авагч, ачааны дүрэм, хүргэлтийн кодоо нэг дор хянах профайл',
      about: 'Жолоочийн чиглэл дээр суурилсан жижиг дайвар ачааны хүсэлт илгээдэг хэрэглэгч.',
      location: 'Дархан-Уул, Монгол',
      completion: 82,
      nextStep: 'Байнгын хүлээн авагч нэмэх',
      badges: ['Утас баталгаажсан', 'Дүрэм зөвшөөрсөн', '8 ачаа хүргэгдсэн'],
      privateFields: [
        { label: 'Байнгын хүлээн авагч', value: 'Дорж Мөнх · +976 7777 8888' },
        { label: 'Ачааны дүрэм', value: 'Зөвшөөрсөн' },
        { label: 'Төлбөрийн баримтын түүх', value: '5 баримт' },
        { label: 'Маргааны түүх', value: 'Идэвхтэй маргаангүй' },
      ],
      primaryCardTitle: 'Ачаа илгээгчийн мэдээлэл',
      primaryCardText: 'Ачааны нэр, хүлээн авагч, хүргэлтийн код, төлбөрийн баримт нь хувийн хэсэгт хадгалагдана.',
      infoCards: [
        { title: 'Идэвхтэй ачаа', text: '1 замдаа' },
        { title: 'Хүргэлтийн код', text: '482913' },
        { title: 'Хүргэгдсэн ачаа', text: '8 ачаа' },
        { title: 'Дүрмийн төлөв', text: 'Зөвшөөрсөн' },
      ],
      rating: '-',
      completed: '8 ачаа',
      activity: cargoHistory.map((item) => ({ title: `${item.item} · ${item.route}`, meta: item.status, right: item.code })),
    };
  }

  if (role === 'admin') {
    return {
      roleLabel: 'Платформын админ',
      status: 'Админ эрхтэй',
      availability: 'Хяналтын жагсаалт идэвхтэй',
      headline: 'Баталгаажуулалт, төлбөрийн баримт, гомдлын хяналт нэг дор',
      about: 'Платформын итгэлцлийн давхарга буюу төлбөр, баталгаажуулалт, гомдлын жагсаалтыг хянах эрхтэй админ.',
      location: 'Улаанбаатар, Монгол',
      completion: 95,
      nextStep: 'Нээлттэй гомдлууд шалгах',
      badges: ['Админ', 'Төлбөр', 'Гомдол', 'Баталгаажуулалт'],
      privateFields: [
        { label: 'Админы эрх', value: 'Төлбөр, баталгаажуулалт, гомдол' },
        { label: 'Хандалтын түвшин', value: 'Админ эрх' },
        { label: 'Сүүлд шалгасан', value: '2026.05.26' },
        { label: 'Нээлттэй гомдол', value: '3' },
      ],
      primaryCardTitle: 'Админы эрх',
      primaryCardText: 'Нийтийн профайл биш, зөвхөн платформын хяналтад зориулсан дотоод бүртгэл.',
      infoCards: [
        { title: 'Хүлээгдэж буй төлбөр', text: '4' },
        { title: 'Жолоочийн шалгалт', text: '2' },
        { title: 'Нээлттэй гомдол', text: '3' },
        { title: 'Идэвхтэй чиглэл', text: '18' },
      ],
      rating: '-',
      completed: 'Админ',
      activity: [
        { title: 'Төлбөрийн баримт зөвшөөрсөн', meta: 'BK-001', right: 'Өнөөдөр' },
        { title: 'Жолоочийн баталгаажуулалт шалгасан', meta: 'DRV-204', right: '09:48' },
        { title: 'Гомдол шийдвэрлэсэн', meta: 'RP-001', right: 'Өчигдөр' },
      ],
    };
  }

  return {
    roleLabel: 'Аялагч',
    status: 'Аялагчийн профайл идэвхтэй',
    availability: 'Жолооч хайхад бэлэн',
    headline: 'Аяллын түүх, яаралтай холбоо барих хүн, суудлын сонголтоо нэг дор хадгална',
    about: 'Орон нутаг руу явах жолооч хайж, суудал захиалдаг аялагчийн профайл.',
    location: 'Улаанбаатар, Монгол',
    completion: 86,
    nextStep: 'Яаралтай холбоо барих хүн баталгаажуулах',
    badges: ['Утас баталгаажсан', '5.0 үнэлгээ', '12 аялал', 'Төлбөрийн баримт бэлэн'],
    privateFields: [
      { label: 'Яаралтай холбоо барих хүн', value: 'Дорж Цэцэг' },
      { label: 'Яаралтай холбоо барих утас', value: '+976 9911 2233' },
      { label: 'Суудлын сонголт', value: 'Урд суудал' },
      { label: 'Ачаатай явах эсэх', value: 'Жижиг гар тээштэй' },
    ],
    primaryCardTitle: 'Аялагчийн мэдээлэл',
    primaryCardText: 'Жолооч таны захиалгын хүсэлтийг харах үед нэр, үнэлгээ, утас баталгаажсан тэмдэг зэрэг үндсэн итгэлцлийн мэдээлэл л харна.',
    infoCards: [
      { title: 'Дараагийн аялал', text: 'УБ → Эрдэнэт · 2026.05.28' },
      { title: 'Төлбөрийн баримт', text: '1 баримт шалгагдаж байна' },
      { title: 'Дууссан аялал', text: '12 аялал' },
      { title: 'Үнэлгээ', text: 'Дундаж 5.0' },
    ],
    rating: '5.0/5',
    completed: '12 аялал',
    activity: travelerTrips.map((trip) => ({ title: trip.route, meta: `${trip.date} · ${trip.status}`, right: trip.rating === '-' ? 'Үнэлгээ өгөөгүй' : `★ ${trip.rating}` })),
  };
}

export function AccountSettingsPage({ role }: { role: AccountRole }) {
  const profile = profiles[role];
  const isDriver = role === 'driver';
  const isSender = role === 'sender';
  const roleLabel = role === 'traveler' ? 'Аялагч' : role === 'driver' ? 'Жолооч' : role === 'sender' ? 'Дайвар ачаа илгээгч' : 'Админ';
  const settingsTabs = [
    { href: '#details', label: 'Миний мэдээлэл' },
    { href: '#password', label: 'Нууц үг' },
    { href: '#verification', label: 'Баталгаажуулалт' },
    { href: '#privacy', label: 'Нууцлал' },
    { href: '#notifications', label: 'Мэдэгдэл' },
  ];

  return (
    <AccountFrame role={role}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 border-b border-border pb-5">
          <Badge variant="info">{profile.label}</Badge>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">Тохиргоо</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            NuudelchinTrip бүртгэл, захиалга, баталгаажуулалт болон нууцлалын тохиргоогоо удирдана.
          </p>
        </div>

        <nav className="mb-8 overflow-x-auto border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-1">
            {settingsTabs.map((tab, index) => (
              <a
                key={tab.href}
                href={tab.href}
                className={`whitespace-nowrap px-4 py-4 text-sm font-medium transition ${
                  index === 0
                    ? 'border-b-2 border-primary text-foreground'
                    : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </a>
            ))}
          </div>
        </nav>

        <div className="space-y-10">
          <section id="details" className="scroll-mt-6">
            <SettingsSection
              title="Миний мэдээлэл"
              description="NuudelchinTrip дээр ашиглагдах үндсэн мэдээлэл."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Input label="Нэр" defaultValue={profile.name} />
                <Input label="Утасны дугаар" defaultValue={profile.phone} />
                <Input label="И-мэйл" defaultValue={profile.email} />
                <Select label="Хэрэглэгчийн төрөл" defaultValue={role} options={[{ value: role, label: roleLabel }]} />
              </div>
            </SettingsSection>
          </section>

          <section id="password" className="scroll-mt-6">
            <SettingsSection
              title="Нууц үг ба хамгаалалт"
              description="Нууц үг, утас баталгаажуулалт, нэвтрэлтийн тохиргоо."
            >
              <div className="divide-y divide-border rounded-lg border border-border">
                <SettingsLine icon={<KeyRound className="h-5 w-5" />} title="Нууц үг" text="Сүүлд 32 хоногийн өмнө шинэчилсэн." action="Шинэчлэх" onClick={() => window.location.href = getPasswordHref(role)} />
                <SettingsLine icon={<Phone className="h-5 w-5" />} title="Утас баталгаажуулалт" text="SMS баталгаажуулалт амжилттай." badge="Баталгаажсан" />
                <SettingsLine icon={<ShieldCheck className="h-5 w-5" />} title="Давхар хамгаалалт" text="Дараагийн хувилбарт нэмэх боломжтой." action="Дараа тохируулах" />
              </div>
            </SettingsSection>
          </section>

          <section id="verification" className="scroll-mt-6">
            <SettingsSection
              title="Баталгаажуулалт"
              description="Платформын итгэлцэлд хэрэгтэй баталгаажуулалтын төлөв."
            >
              <div className="grid gap-4 md:grid-cols-3">
                <VerificationStatusCard title="Утас" text="Утас баталгаажсан" status="Баталгаажсан" />
                <VerificationStatusCard title={isDriver ? 'Жолоочийн бичиг баримт' : 'Бүртгэл'} text={isDriver ? 'Админ шалгаж байна' : 'Үндсэн бүртгэл идэвхтэй'} status={isDriver ? 'Хүлээгдэж байна' : 'Идэвхтэй'} tone={isDriver ? 'warning' : 'success'} />
                <VerificationStatusCard title="Дайвар ачааны эрх" text={isDriver || isSender ? 'Дүрэм зөвшөөрсөн' : 'Шаардлагагүй'} status={isDriver || isSender ? 'Бэлэн' : 'Идэвхгүй'} />
              </div>
            </SettingsSection>
          </section>

          <section id="privacy" className="scroll-mt-6">
            <SettingsSection
              title="Нууцлал"
              description="Утас, хүсэлт, үнэлгээ ямар үед харагдахыг тохируулна."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Select label="Утас хэзээ харагдах вэ?" defaultValue="accepted" options={[
                  { value: 'accepted', label: 'Хүсэлт зөвшөөрсний дараа' },
                  { value: 'confirmed', label: 'Төлбөр баталгаажсаны дараа' },
                  { value: 'admin', label: 'Зөвхөн админд' },
                ]} />
                <Select label="Чиглэлийн хүсэлтийн нууцлал" defaultValue="matched" options={[
                  { value: 'matched', label: 'Зөвхөн тохирсон хэрэглэгчид' },
                  { value: 'admin', label: 'Админд нэмэлтээр харагдана' },
                ]} />
                <ToggleRow label="Үнэлгээ нийтэд харагдана" checked />
                <ToggleRow label="Гомдлын түүх хувийн байна" checked />
              </div>
            </SettingsSection>
          </section>

          <section id="notifications" className="scroll-mt-6">
            <SettingsSection
              title="Мэдэгдэл"
              description="Захиалга, төлбөр, аялал болон ачааны төлөвийн мэдэгдэл."
            >
              <div className="grid gap-3 md:grid-cols-2">
                <ToggleRow label="Захиалгын хүсэлтийн мэдэгдэл" checked />
                <ToggleRow label="Жолооч зөвшөөрсөн мэдэгдэл" checked />
                <ToggleRow label="Төлбөр баталгаажсан мэдэгдэл" checked />
                <ToggleRow label="Аяллын сануулга" checked />
                <ToggleRow label="Үнэлгээ өгөх сануулга" checked />
                <ToggleRow label="Ачааны төлөвийн мэдэгдэл" checked={isDriver || isSender} />
              </div>
            </SettingsSection>
          </section>

          <section className="border-t border-border pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Бүртгэл идэвхгүй болгох</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Идэвхтэй захиалга эсвэл ачааны хүсэлт байвал бүртгэл шууд устахгүй, админ шалгаж шийдвэрлэнэ.
                </p>
              </div>
              <Button variant="outline">Идэвхгүй болгох хүсэлт</Button>
            </div>
          </section>

          <div className="sticky bottom-0 -mx-4 border-t border-border bg-background/95 p-4 backdrop-blur sm:static sm:mx-0 sm:flex sm:justify-end sm:border-0 sm:bg-transparent sm:p-0">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" onClick={() => window.location.href = getSettingsHref(role)}>Болих</Button>
              <Button>
                Өөрчлөлт хадгалах
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AccountFrame>
  );
}

function LegacyAccountSettingsPage({ role }: { role: AccountRole }) {
  return (
    <AccountFrame role={role}>
      <div className="mb-8">
        <Badge variant="info">{profiles[role].label}</Badge>
        <h1 className="mt-4 text-3xl font-bold text-foreground">Тохиргоо</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Бүртгэл, хамгаалалт, мэдэгдэл, нууцлалын тохиргоо хэрэглэгчийн төрлөөс үл хамаараад нэг стандартаар ажиллана.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <SettingCard icon={<UserCircle />} title="Бүртгэлийн тохиргоо" description="Нэр, зураг, утас, имэйл, бүртгэлийн төлөв.">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Нэр" defaultValue={profiles[role].name} />
              <Input label="Утас" defaultValue={profiles[role].phone} />
              <Input label="И-мэйл" defaultValue={profiles[role].email} />
              <Select label="Бүртгэлийн төлөв" options={[{ value: 'active', label: 'Идэвхтэй' }, { value: 'deactivate', label: 'Идэвхгүй болгох хүсэлттэй' }]} />
            </div>
          </SettingCard>

          <SettingCard icon={<LockKeyhole />} title="Хамгаалалтын тохиргоо" description="Нууц үг, session, давхар хамгаалалт, утас баталгаажуулалт.">
            <div className="grid gap-3 md:grid-cols-4">
              <StatusTile title="Нууц үг" text="32 хоногийн өмнө" />
              <StatusTile title="Нэвтрэлтийн түүх" text="2 төхөөрөмж" />
              <StatusTile title="Давхар хамгаалалт" text="Дараагийн шатанд" />
              <StatusTile title="Утас" text="Баталгаажсан" success />
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => window.location.href = getPasswordHref(role)}>
                Нууц үг солих
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/forgot-password'}>Нууц үг мартсан</Button>
            </div>
          </SettingCard>

          <SettingCard icon={<Bell />} title="Мэдэгдлийн тохиргоо" description="Захиалга, төлбөр, аялал, ачаа, үнэлгээний сануулга.">
            <ToggleRow label="Захиалгын хүсэлтийн мэдэгдэл" checked />
            <ToggleRow label="Жолооч зөвшөөрсөн мэдэгдэл" checked />
            <ToggleRow label="Төлбөр баталгаажсан мэдэгдэл" checked />
            <ToggleRow label="Аяллын сануулга" checked />
            <ToggleRow label="Ачааны төлөв шинэчлэгдэх мэдэгдэл" checked={role !== 'traveler'} />
            <ToggleRow label="Үнэлгээ өгөх сануулга" checked />
          </SettingCard>
        </div>

        <aside className="space-y-6">
          <SettingCard icon={<ShieldCheck />} title="Нууцлалын тохиргоо" description="Утас, профайл, үнэлгээний харагдах байдал.">
            <Select label="Утас хэзээ харагдах вэ?" options={[
              { value: 'accepted', label: 'Хүсэлт зөвшөөрсний дараа' },
              { value: 'confirmed', label: 'Төлбөр баталгаажсаны дараа' },
              { value: 'never', label: 'Зөвхөн админд' },
            ]} />
            <ToggleRow label="Профайл нийтэд харагдана" checked />
            <ToggleRow label="Үнэлгээ нийтэд харагдана" checked />
          </SettingCard>

          <Card className="border-destructive/20 bg-destructive/5 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <Trash2 className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-foreground">Бүртгэл идэвхгүй болгох</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              MVP дээр бүртгэл устгах хүсэлтийг админ шалгаж шийдвэрлэнэ. Идэвхтэй захиалга байвал шууд устгахгүй.
            </p>
            <Button className="mt-5" variant="outline" fullWidth>Идэвхгүй болгох хүсэлт</Button>
          </Card>
        </aside>
      </div>
    </AccountFrame>
  );
}

export function AccountVerificationPage({ role }: { role: AccountRole }) {
  const isDriver = role === 'driver';
  const isSender = role === 'sender';
  const storedUser = getStoredUser();
  const profile = profiles[role];
  const marketplaceRole = mapAccountRole(role);
  const initialRequest = useMemo(() => {
    const requests = getIdentityRequests();
    return requests.find((request) => {
      const sameEmail = storedUser?.email && request.email === storedUser.email;
      const samePhone = storedUser?.phone && request.phone === storedUser.phone;
      return sameEmail || samePhone;
    });
  }, [storedUser?.email, storedUser?.phone]);
  const [request, setRequest] = useState<IdentityVerificationRequest | undefined>(initialRequest);
  const [familyName, setFamilyName] = useState(initialRequest?.familyName || '');
  const [fullName, setFullName] = useState(initialRequest?.fullName || storedUser?.full_name || profile.name);
  const [registerNumber, setRegisterNumber] = useState(initialRequest?.registerNumber || '');
  const [documentName, setDocumentName] = useState(initialRequest?.documentName || '');
  const [selfieName, setSelfieName] = useState(initialRequest?.selfieName || '');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const identityStatus = request?.status || storedUser?.identity_verification?.status || 'not_submitted';
  const relatedLogs = getActionLogs()
    .filter((log) => {
      const target = `${log.user} ${log.actor} ${log.details}`.toLowerCase();
      return [storedUser?.email, storedUser?.phone, fullName].some((item) => item && target.includes(item.toLowerCase()));
    })
    .slice(0, 4);

  const handleSubmitIdentity = () => {
    setFormError('');
    setFormSuccess('');

    if (!familyName.trim()) {
      setFormError('Овгоо оруулна уу.');
      return;
    }
    if (!fullName.trim()) {
      setFormError('Нэрээ оруулна уу.');
      return;
    }
    if (registerNumber.trim().length < 8) {
      setFormError('Регистрийн дугаараа зөв оруулна уу. Жишээ: УБ99112233');
      return;
    }
    if (!documentName) {
      setFormError('Иргэний үнэмлэхний зураг эсвэл PDF файлын нэр сонгоно уу.');
      return;
    }

    const nextRequest = upsertIdentityRequest({
      role: marketplaceRole,
      userName: fullName.trim(),
      phone: storedUser?.phone || profile.phone,
      email: storedUser?.email || profile.email,
      familyName: familyName.trim(),
      fullName: fullName.trim(),
      registerNumber: registerNumber.trim().toUpperCase(),
      documentName,
      selfieName: selfieName || undefined,
    });

    setRequest(nextRequest);
    setFormSuccess('Баталгаажуулалтын хүсэлт админ руу илгээгдлээ.');
  };

  return (
    <AccountFrame role={role}>
      <div className="mb-8">
        <Badge variant="success">Баталгаажуулалт</Badge>
        <h1 className="mt-4 text-3xl font-bold text-foreground">Баталгаажуулалтын төв</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Утас, иргэний үнэмлэх, жолоочийн бичиг баримт болон ачааны дүрмийн төлвийг нэг дор хянана.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Үндсэн баталгаажуулалт</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Marketplace дээр жолооч, аялагч, ачаа илгээгч бүгд утас болон иргэний үнэмлэхний үндсэн шалгалттай байна.
                </p>
              </div>
              <IdentityStatusBadge status={identityStatus} />
            </div>

            {identityStatus === 'rejected' && request?.rejectionReason && (
              <div className="mt-5 flex gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Хүсэлт буцаагдсан</p>
                  <p className="mt-1 leading-6">{request.rejectionReason}</p>
                </div>
              </div>
            )}

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <VerificationItem title="Утас баталгаажсан" status={storedUser?.phone_verified === false ? 'review' : 'approved'} icon={<Phone />} />
              <VerificationItem title="И-мэйл бүртгэлтэй" status="approved" icon={<Mail />} />
              <VerificationItem title="Иргэний үнэмлэх" status={toVerificationItemStatus(identityStatus)} icon={<FileCheck2 />} />
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Input label="Овог" value={familyName} onChange={(event) => setFamilyName(event.target.value)} placeholder="Жишээ: Бат" />
              <Input label="Нэр" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Жишээ: Болд" />
              <Input
                label="Регистрийн дугаар"
                value={registerNumber}
                onChange={(event) => setRegisterNumber(event.target.value.toUpperCase())}
                placeholder="Жишээ: УБ99112233"
              />
              <Input label="Утас" value={storedUser?.phone || profile.phone} readOnly />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <FileSelectBox
                label="Иргэний үнэмлэхний зураг / PDF"
                value={documentName}
                required
                onChange={setDocumentName}
              />
              <FileSelectBox
                label="Нүүрний зураг (сонголтоор)"
                value={selfieName}
                onChange={setSelfieName}
              />
            </div>

            <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm leading-6 text-muted-foreground">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p>
                  Туршилтын хувилбар дээр файл бодитоор хадгалахгүй, зөвхөн файлын нэр хадгалж админы шалгалтын урсгалыг харуулна. Бодит хувилбар дээр Supabase Storage ашиглана.
                </p>
              </div>
            </div>

            {formError && (
              <div className="mt-5 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="mt-5 rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm font-medium text-success">
                {formSuccess}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button onClick={handleSubmitIdentity}>
                <Upload className="h-4 w-4" />
                Хүсэлт илгээх
              </Button>
              <Button variant="outline" onClick={() => window.location.href = profile.dashboardHref}>
                Самбар руу буцах
              </Button>
            </div>
          </Card>

          {isDriver && (
            <Card className="p-5 sm:p-6">
              <h2 className="text-xl font-semibold text-foreground">Жолоочийн баталгаажуулалт</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Машин, жолооны үнэмлэхний мэдээлэл админ зөвшөөрсний дараа чиглэл нийтлэх эрх нээгдэнэ.
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <VerificationItem title="Жолооны үнэмлэх" status="review" icon={<FileCheck2 />} />
                <VerificationItem title="Машины гэрчилгээ" status="review" icon={<Car />} />
                <VerificationItem title="Машины зураг" status="approved" icon={<Camera />} />
              </div>
            </Card>
          )}

          {(isDriver || isSender) && (
            <Card className="p-5 sm:p-6">
              <h2 className="text-xl font-semibold text-foreground">Дайвар ачааны эрх</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Дайвар ачаа нь жолоочийн route дээр суурилсан нэмэлт боломж тул дүрэм зөвшөөрсөн хэрэглэгчид л харагдана.
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <VerificationItem title="Ачааны дүрэм зөвшөөрөх" status="approved" icon={<PackageCheck />} />
                <VerificationItem title="Хориглосон барааны дүрэм" status="approved" icon={<ShieldCheck />} />
                <VerificationItem title="Дайвар ачааны эрхийн төлөв" status={isDriver ? 'approved' : 'review'} icon={<BadgeCheck />} />
              </div>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          <Card className="border-primary/20 bg-primary/5 p-5">
            <h2 className="text-xl font-semibold text-foreground">Шалгалтын төлөв</h2>
            <div className="mt-5 space-y-4">
              <ProgressRow label="Утас" value={storedUser?.phone_verified === false ? 40 : 100} />
              <ProgressRow label="Профайл" value={storedUser?.onboarding_completed === false ? 60 : 90} />
              <ProgressRow label="Иргэний үнэмлэх" value={identityStatus === 'approved' ? 100 : identityStatus === 'pending' ? 65 : identityStatus === 'rejected' ? 30 : 10} />
              <ProgressRow label="Ачааны дүрэм" value={isDriver || isSender ? 100 : 0} />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-xl font-semibold text-foreground">Дараагийн алхам</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {identityStatus === 'approved'
                ? 'Таны үндсэн баталгаажуулалт дууссан. Role-д тохирсон үйлдлүүдээ үргэлжлүүлнэ.'
                : identityStatus === 'pending'
                  ? 'Админ таны мэдээллийг шалгаж байна. Шалгалтын хариу энд шинэчлэгдэнэ.'
                  : identityStatus === 'rejected'
                    ? 'Буцаасан шалтгааныг засаж, хүсэлтээ дахин илгээнэ үү.'
                    : 'Иргэний үнэмлэхний мэдээллээ илгээж үндсэн баталгаажуулалтаа эхлүүлнэ үү.'}
            </p>
            {role === 'admin' ? (
              <Button className="mt-5" fullWidth onClick={() => window.location.href = '/admin/verifications'}>
                Админы жагсаалт харах
              </Button>
            ) : (
              <Button className="mt-5" variant="outline" fullWidth onClick={() => window.location.href = profile.dashboardHref}>
                Самбар руу буцах
              </Button>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="text-xl font-semibold text-foreground">Сүүлийн үйлдэл</h2>
            <div className="mt-4 space-y-3">
              {relatedLogs.length ? (
                relatedLogs.map((log) => (
                  <div key={log.id} className="rounded-lg border border-border p-3">
                    <p className="text-sm font-semibold text-foreground">{log.actionType}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{log.details}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">Одоогоор үйлдлийн түүх алга.</p>
              )}
            </div>
          </Card>
        </aside>
      </div>
    </AccountFrame>
  );
}

function mapAccountRole(role: AccountRole): MarketplaceRole {
  if (role === 'sender') return 'cargo_sender';
  return role;
}

function toVerificationItemStatus(status: VerificationStatus) {
  if (status === 'approved') return 'approved';
  if (status === 'pending') return 'review';
  if (status === 'rejected') return 'placeholder';
  return 'placeholder';
}

function IdentityStatusBadge({ status }: { status: VerificationStatus }) {
  const copy = {
    not_submitted: { label: 'Баталгаажуулаагүй', variant: 'default' as const },
    pending: { label: 'Шалгаж байна', variant: 'warning' as const },
    approved: { label: 'Баталгаажсан', variant: 'success' as const },
    rejected: { label: 'Татгалзсан', variant: 'danger' as const },
  }[status];

  return <Badge variant={copy.variant}>{copy.label}</Badge>;
}

function FileSelectBox({ label, value, required, onChange }: { label: string; value: string; required?: boolean; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-foreground">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </span>
      <span className="mt-2 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-4 py-5 text-center transition hover:border-primary hover:bg-primary/5">
        <Upload className="h-6 w-6 text-primary" />
        <span className="mt-2 text-sm font-medium text-foreground">{value || 'Файл сонгох'}</span>
        <span className="mt-1 text-xs text-muted-foreground">Зураг эсвэл PDF файлын нэр</span>
      </span>
      <input
        className="sr-only"
        type="file"
        accept="image/*,.pdf"
        onChange={(event) => onChange(event.target.files?.[0]?.name || '')}
      />
    </label>
  );
}

export function AccountPasswordPage({ role }: { role: AccountRole }) {
  return (
    <AccountFrame role={role}>
      <button
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        onClick={() => window.location.href = getSettingsHref(role)}
      >
        <ArrowLeft className="h-4 w-4" />
        Тохиргоо руу буцах
      </button>

      <div className="mb-8">
        <Badge variant="info">Хамгаалалт</Badge>
        <h1 className="mt-4 text-3xl font-bold text-foreground">Нууц үг шинэчлэх</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Нууц үг шинэчлэх хэсгийг тусдаа гаргаснаар тохиргоо илүү цэвэр, ойлгомжтой харагдана.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card className="p-6">
          <div className="mb-6 flex items-start gap-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Нууц үг шинэчлэх</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Нууц үг солисны дараа бусад төхөөрөмж дээрх нэвтрэлтийг гаргах боломжтой.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <Input label="Одоогийн нууц үг" type="password" placeholder="Одоогийн нууц үгээ оруулна" />
            <div className="grid gap-5 md:grid-cols-2">
              <Input label="Шинэ нууц үг" type="password" placeholder="Шинэ нууц үг" />
              <Input label="Шинэ нууц үг давтах" type="password" placeholder="Давтаж оруулна" />
            </div>
            <ToggleRow label="Бусад төхөөрөмж дээрх нэвтрэлтийг гаргах" checked />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button>Нууц үг шинэчлэх</Button>
            <Button variant="outline" onClick={() => window.location.href = '/forgot-password'}>Нууц үг мартсан</Button>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-xl font-semibold text-foreground">Шаардлага</h2>
          <div className="mt-5 space-y-3">
            {['8-аас дээш тэмдэгт', 'Том жижиг үсэг, тоо орсон', 'Өмнөх нууц үгтэй давхцахгүй', 'Хувийн мэдээлэл агуулаагүй'].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span className="text-sm font-medium text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AccountFrame>
  );
}

export function PublicDriverProfilePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <button className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary" onClick={() => window.location.href = '/routes'}>
          <ArrowLeft className="h-4 w-4" />
          Чиглэл рүү буцах
        </button>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-4xl font-bold text-primary">Б</div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-bold text-foreground">Бат-Эрдэнэ</h1>
                  <Badge variant="success">Баталгаажсан жолооч</Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-muted-foreground">
                  <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-warning text-warning" /> 4.8</span>
                  <span>42 аялал</span>
                  <span>Toyota Prius 30</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="success">Утас баталгаажсан</Badge>
                  <Badge variant="success">Жолооч баталгаажсан</Badge>
                  <Badge variant="success">Машин баталгаажсан</Badge>
                  <Badge variant="warning">Дайвар ачаа авч болно</Badge>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <PublicStat label="Дууссан аялал" value="42" />
              <PublicStat label="Хариу өгөх хугацаа" value="18 мин" />
              <PublicStat label="Дайвар ачааны эрх" value="Идэвхтэй" />
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold text-foreground">Машины мэдээлэл</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <InfoCard title="Загвар" text="Toyota Prius 30" />
                <InfoCard title="Улсын дугаар" text="УБА 1234" />
                <InfoCard title="Сул суудал" text="3 хүртэл" />
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold text-foreground">Сэтгэгдэл</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <ReviewCard text="Цагтаа ирсэн, машин цэвэрхэн, чиглэл ойлгомжтой байсан." author="Сарангэрэл" />
                <ReviewCard text="Ачаа авах дүрэм тодорхой, авах цагийн цонхоо сайн барьсан." author="Мөнх-Эрдэнэ" />
              </div>
            </div>
          </Card>

          <aside className="space-y-6">
            <Card className="p-5">
              <h2 className="text-xl font-semibold text-foreground">Нийтийн профайл дээр харагдах</h2>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <p>Нэр, зураг, үнэлгээ, дууссан аялал, баталгаажуулалтын тэмдэг, машины үндсэн мэдээлэл, сэтгэгдэл.</p>
                <p className="font-medium text-foreground">Утас, имэйл, бичиг баримт, орлого нийтэд харагдахгүй.</p>
              </div>
            </Card>
            <Button size="lg" fullWidth onClick={() => window.location.href = '/dashboard/bookings/BK-001'}>
              Суудал захиалах
            </Button>
            <Button variant="outline" size="lg" fullWidth onClick={() => window.location.href = '/cargo/new'}>
              Ачаа илгээх
            </Button>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function TravelerProfileFields() {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <Input label="Emergency contact" defaultValue="+976 9911 2233" />
      <Select label="Суудлын preference" options={[{ value: 'front', label: 'Урд суудал' }, { value: 'back', label: 'Арын суудал' }]} />
      <Select label="Тамхи татдаг эсэх" options={[{ value: 'no', label: 'Татдаггүй' }, { value: 'yes', label: 'Татдаг' }]} />
      <Select label="Ачаатай явах эсэх" options={[{ value: 'small', label: 'Жижиг гар тээштэй' }, { value: 'none', label: 'Ачаагүй' }]} />
    </div>
  );
}

function DriverProfileFields() {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <Input label="Model" defaultValue="Toyota Prius 30" />
      <Input label="Plate number" defaultValue="УБА 1234" />
      <Input label="Суудлын тоо" defaultValue="4" />
      <Select label="Дайвар ачааны эрх" options={[{ value: 'yes', label: 'Дайвар ачаа авч болно' }, { value: 'no', label: 'Авахгүй' }]} />
    </div>
  );
}

function SenderProfileFields() {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <Input label="Байнга илгээдэг хүлээн авагч" defaultValue="Дорж Мөнх · +976 7777 8888" />
      <Select label="Ачааны дүрэм зөвшөөрсөн эсэх" options={[{ value: 'yes', label: 'Зөвшөөрсөн' }, { value: 'no', label: 'Дахин унших' }]} />
    </div>
  );
}

function TravelerHistory() {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-foreground">Миний аяллын түүх</h2>
      <div className="mt-5 space-y-3">
        {travelerTrips.map((trip) => (
          <TimelineRow key={`${trip.route}-${trip.date}`} title={trip.route} meta={`${trip.date} · ${trip.status}`} right={trip.rating === '-' ? 'Үнэлгээ өгөөгүй' : `⭐ ${trip.rating}`} />
        ))}
      </div>
    </Card>
  );
}

function DriverTrustPanel() {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-foreground">Чиглэлийн түүх ба орлого</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {driverRoutes.map((route) => (
          <InfoCard key={route.route} title={route.route} text={`${route.trips} аялал · ${route.income}`} />
        ))}
      </div>
    </Card>
  );
}

function SenderCargoPanel() {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-foreground">Миний ачаа</h2>
      <div className="mt-5 space-y-3">
        {cargoHistory.map((item) => (
          <TimelineRow key={`${item.item}-${item.code}`} title={`${item.item} · ${item.route}`} meta={item.status} right={item.code === '-' ? 'Код үүсээгүй' : item.code} />
        ))}
      </div>
    </Card>
  );
}

function AdminScopePanel() {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-foreground">Админы хамрах хүрээ</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <InfoCard title="Төлбөр" text="Баримт зөвшөөрөх эсвэл буцаах" />
        <InfoCard title="Баталгаажуулалт" text="Жолоочийн бичиг баримт шалгах" />
        <InfoCard title="Гомдол" text="Маргаан хянах" />
      </div>
    </Card>
  );
}

function SettingsSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="grid gap-5 border-b border-border pb-8 lg:grid-cols-[260px_1fr]">
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}

function VerificationStatusCard({ title, text, status, tone = 'success' }: { title: string; text: string; status: string; tone?: 'success' | 'warning' }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{text}</p>
        </div>
        <Badge variant={tone}>{status}</Badge>
      </div>
    </div>
  );
}

function SettingCard({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) {
  return (
    <Card className="p-6">
      <div className="flex gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-5 space-y-3">{children}</div>
    </Card>
  );
}

function SettingsLine({ icon, title, text, action, badge, onClick }: { icon: ReactNode; title: string; text: string; action?: string; badge?: string; onClick?: () => void }) {
  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
        <div>
          <p className="font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{text}</p>
        </div>
      </div>
      {badge ? (
        <Badge variant="success">{badge}</Badge>
      ) : action ? (
        <Button size="sm" variant="outline" onClick={onClick}>{action}</Button>
      ) : null}
    </div>
  );
}

function ToggleRow({ label, checked }: { label: string; checked?: boolean }) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-border p-4">
      <span className="font-medium text-foreground">{label}</span>
      <input type="checkbox" defaultChecked={checked} className="h-5 w-5 rounded border-border text-primary focus:ring-primary" />
    </label>
  );
}

function VerificationItem({ title, status, icon }: { title: string; status: 'approved' | 'review' | 'placeholder'; icon: ReactNode }) {
  const label = status === 'approved' ? 'Баталгаажсан' : status === 'review' ? 'Админ шалгаж байна' : 'Дараагийн шатанд';
  const variant = status === 'approved' ? 'success' : status === 'review' ? 'warning' : 'default';

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <div className="mt-3"><Badge variant={variant}>{label}</Badge></div>
    </div>
  );
}

function StatusTile({ title, text, success = false }: { title: string; text: string; success?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className={`mt-1 text-xs leading-5 ${success ? 'text-success' : 'text-muted-foreground'}`}>{text}</p>
    </div>
  );
}

function ProgressRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-border">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function VisibilityRow({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-card px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-1 font-semibold text-foreground">{text}</p>
    </div>
  );
}

function TimelineRow({ title, meta, right }: { title: string; meta: string; right: string }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
        <CheckCircle2 className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{meta}</p>
      </div>
      <span className="text-sm font-semibold text-foreground">{right}</span>
    </div>
  );
}

function PublicStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4 text-center">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function ReviewCard({ text, author }: { text: string; author: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <div className="mb-2 flex gap-1 text-warning">
        {[1, 2, 3, 4, 5].map((star) => <Star key={star} className="h-4 w-4 fill-warning" />)}
      </div>
      <p className="text-sm leading-6 text-foreground">{text}</p>
      <p className="mt-3 text-sm font-semibold text-muted-foreground">- {author}</p>
    </div>
  );
}

function AccountFrame({ role, children }: { role: AccountRole; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar menuItems={getDashboardMenu(role)} accountRole={role} />
      <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-8">
        {children}
        <AppFooter />
      </main>
    </div>
  );
}

function getSettingsHref(role: AccountRole) {
  if (role === 'admin') return '/admin/settings';
  if (role === 'sender') return '/dashboard/cargo/settings';
  return `/dashboard/${role}/settings`;
}

function getPasswordHref(role: AccountRole) {
  return `${getSettingsHref(role)}/password`;
}

function getVerificationHref(role: AccountRole) {
  if (role === 'admin') return '/admin/verifications';
  if (role === 'sender') return '/dashboard/cargo/verification';
  return `/dashboard/${role}/verification`;
}
