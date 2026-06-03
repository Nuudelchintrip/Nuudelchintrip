import type { ReactNode } from 'react';
import {
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
  UserCircle,
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

type AccountRole = 'sender' | 'traveler' | 'driver' | 'admin';

const profiles = {
  traveler: {
    name: 'Сарангэрэл Цэцэг',
    label: 'Аялагч account',
    title: 'Аялагчийн profile',
    description: 'Унаа хайх, booking, төлбөрийн баримт, аяллын түүх, preference-ээ нэг дор хянана.',
    phone: '+976 9999 9999',
    email: 'traveler@nuudelchintrip.mn',
    dashboardHref: '/dashboard/traveler',
    accent: 'primary',
  },
  driver: {
    name: 'Бат-Эрдэнэ',
    label: 'Жолооч account',
    title: 'Жолоочийн profile',
    description: 'Жолоочийн verification, машин, route history, rating, орлого, cargo permission эндээс харагдана.',
    phone: '+976 8888 8888',
    email: 'driver@nuudelchintrip.mn',
    dashboardHref: '/dashboard/driver',
    accent: 'success',
  },
  sender: {
    name: 'Дорж Цэцэг',
    label: 'Дайвар ачаа илгээгч',
    title: 'Ачаа илгээгчийн profile',
    description: 'Илгээсэн ачаа, receiver contacts, payment proofs, delivery code/status, ачааны дүрмийн зөвшөөрлийг хянана.',
    phone: '+976 9090 9090',
    email: 'sender@nuudelchintrip.mn',
    dashboardHref: '/dashboard/cargo',
    accent: 'warning',
  },
  admin: {
    name: 'Admin user',
    label: 'Platform moderation',
    title: 'Admin profile',
    description: 'Payment, verification, reports, safety moderation хийх эрхтэй platform account.',
    phone: '+976 7000 0000',
    email: 'admin@nuudelchintrip.mn',
    dashboardHref: '/admin',
    accent: 'primary',
  },
};

const travelerTrips = [
  { route: 'УБ -> Дархан', status: 'completed', date: '2026.05.18', rating: '5.0' },
  { route: 'УБ -> Эрдэнэт', status: 'confirmed', date: '2026.05.28', rating: '-' },
  { route: 'Дархан -> УБ', status: 'cancelled', date: '2026.05.10', rating: '-' },
];

const driverRoutes = [
  { route: 'УБ -> Дархан', trips: 18, income: '₮630,000' },
  { route: 'УБ -> Эрдэнэт', trips: 12, income: '₮480,000' },
  { route: 'Дархан -> УБ', trips: 9, income: '₮288,000' },
];

const cargoHistory = [
  { item: 'Баримт бичиг', route: 'УБ -> Дархан', status: 'delivered', code: '482913' },
  { item: 'Жижиг хайрцаг', route: 'УБ -> Эрдэнэт', status: 'in_transit', code: '739120' },
  { item: 'Хувцас', route: 'Дархан -> УБ', status: 'requested', code: '-' },
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
                  <Badge variant="success">Profile verified</Badge>
                  <Badge variant="default">{role}</Badge>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <Input label="Нэр" defaultValue={profile.name} />
              <Input label="Утас" defaultValue={profile.phone} />
              <Input label="И-мэйл" defaultValue={profile.email} />
              <Select
                label="Role"
                value={role}
                disabled
                options={[
                  { value: 'traveler', label: 'Аялагч' },
                  { value: 'driver', label: 'Жолооч' },
                  { value: 'sender', label: 'Дайвар ачаа илгээгч' },
                  { value: 'admin', label: 'Admin' },
                ]}
              />
            </div>

            {role === 'traveler' && <TravelerProfileFields />}
            {role === 'driver' && <DriverProfileFields />}
            {role === 'sender' && <SenderProfileFields />}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button>Profile хадгалах</Button>
              <Button variant="outline" onClick={() => window.location.href = getVerificationHref(role)}>
                Verification center
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
            <h2 className="text-xl font-semibold text-foreground">Private vs public</h2>
            <div className="mt-5 space-y-4">
              <VisibilityRow title="Public profile" text="Нэр, rating, completed trips, verification badge, basic car info харагдана." />
              <VisibilityRow title="Private profile" text="Утас, имэйл, бичиг баримт, төлбөрийн баримт, dispute history нууц байна." />
            </div>
          </Card>

          <Card className="border-primary/20 bg-primary/5 p-5">
            <h2 className="text-xl font-semibold text-foreground">Trust summary</h2>
            <div className="mt-5 grid gap-3">
              <Metric label="Rating" value={role === 'driver' ? '4.8' : role === 'traveler' ? '5.0' : '-'} />
              <Metric label="Completed" value={role === 'driver' ? '42 аялал' : role === 'sender' ? '8 ачаа' : '12 аялал'} />
              <Metric label="Report" value="0 active" />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-xl font-semibold text-foreground">Next action</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Profile trust өндөр байх тусам booking request, driver acceptance, cargo request илүү найдвартай харагдана.
            </p>
            <Button className="mt-5" fullWidth onClick={() => window.location.href = profile.dashboardHref}>
              Dashboard руу буцах
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
          Dashboard руу буцах
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
              <p className="text-sm text-muted-foreground">Profile төлөв</p>
              <p className="mt-1 font-semibold text-foreground">{details.availability}</p>
            </div>

            <div className="mt-6 border-t border-border pt-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Badges</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {details.badges.map((badge) => (
                  <span key={badge} className="rounded-full border border-border bg-card px-3 py-1 text-sm font-medium text-foreground">
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">About</p>
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
                <p className="font-semibold text-foreground">Profile бүрдэлт</p>
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
                Verification center
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost">Дараа</Button>
            </div>
            <h2 className="mt-5 max-w-4xl text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl">
              {details.headline}
            </h2>
            <div className="mt-6 flex flex-wrap gap-6 border-b border-border text-sm font-semibold text-muted-foreground">
              {['Хувийн мэдээлэл', 'Trust', 'Activity'].map((tab, index) => (
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
                <p className="mt-1 text-sm text-muted-foreground">Private мэдээлэл зөвхөн owner болон admin-д харагдана.</p>
              </div>
              <Button variant="outline" size="sm">Засвар хадгалах</Button>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Input label="Нэр" defaultValue={profile.name} />
              <Input label="Утас" defaultValue={profile.phone} />
              <Input label="И-мэйл" defaultValue={profile.email} />
              <Select
                label="Role"
                value={role}
                disabled
                options={[
                  { value: 'traveler', label: 'Аялагч' },
                  { value: 'driver', label: 'Жолооч' },
                  { value: 'sender', label: 'Дайвар ачаа илгээгч' },
                  { value: 'admin', label: 'Admin' },
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
              <h2 className="text-xl font-semibold text-foreground">Trust summary</h2>
              <div className="mt-5 grid gap-3">
                <Metric label="Rating" value={details.rating} />
                <Metric label="Completed" value={details.completed} />
                <Metric label="Active reports" value="0" />
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold text-foreground">Сүүлийн activity</h2>
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
      status: 'Driver verification pending',
      availability: 'Admin approve хүлээж байна',
      headline: 'Найдвартай жолоочийн profile, машины мэдээлэл, route history нэг дор',
      about: 'Орон нутаг руу тогтмол явдаг, суудал болон pickup нөхцлөө тодорхой бичдэг жолоочийн profile.',
      location: 'Улаанбаатар, Монгол',
      completion: 78,
      nextStep: 'Машины гэрчилгээний зураг нэмэх',
      badges: ['Phone verified', 'License review', 'Toyota Prius 30', 'Cargo allowed'],
      privateFields: [
        { label: 'Машины model', value: 'Toyota Prius 30' },
        { label: 'Улсын дугаар', value: 'УБА 1234' },
        { label: 'Суудлын тоо', value: '4' },
        { label: 'Жолооны үнэмлэх', value: 'Admin review' },
      ],
      primaryCardTitle: 'Жолоочийн мэдээлэл',
      primaryCardText: 'Public card дээр зөвхөн verified badge, rating, completed trips, машины basic info харагдана.',
      infoCards: [
        { title: 'Route history', text: '42 аялал completed' },
        { title: 'Дундаж хариу', text: '18 минут' },
        { title: 'Cargo permission', text: 'Дайвар ачаа авч болно' },
        { title: 'Орлого', text: 'Орлогын summary' },
      ],
      rating: '4.8/5',
      completed: '42 аялал',
      activity: driverRoutes.map((route) => ({ title: route.route, meta: `${route.trips} аялал`, right: route.income })),
    };
  }

  if (role === 'sender') {
    return {
      roleLabel: 'Дайвар ачаа илгээгч',
      status: 'Cargo policy accepted',
      availability: 'Ачаа илгээхэд бэлэн',
      headline: 'Хүлээн авагч, ачааны дүрэм, delivery code-оо нэг дор хянах profile',
      about: 'Жолоочийн route дээр суурилсан жижиг дайвар ачааны хүсэлт илгээдэг хэрэглэгч.',
      location: 'Дархан-Уул, Монгол',
      completion: 82,
      nextStep: 'Байнгын хүлээн авагч нэмэх',
      badges: ['Phone verified', 'Policy accepted', '8 cargo completed'],
      privateFields: [
        { label: 'Байнгын хүлээн авагч', value: 'Дорж Мөнх · +976 7777 8888' },
        { label: 'Cargo rules', value: 'Зөвшөөрсөн' },
        { label: 'Payment proof history', value: '5 uploaded' },
        { label: 'Dispute history', value: '0 active' },
      ],
      primaryCardTitle: 'Ачаа илгээгчийн мэдээлэл',
      primaryCardText: 'Ачааны нэр, хүлээн авагч, delivery code, payment proof нь private section-д хадгалагдана.',
      infoCards: [
        { title: 'Active cargo', text: '1 in transit' },
        { title: 'Delivery code', text: '482913' },
        { title: 'Completed cargo', text: '8 ачаа' },
        { title: 'Policy status', text: 'Accepted' },
      ],
      rating: '-',
      completed: '8 ачаа',
      activity: cargoHistory.map((item) => ({ title: `${item.item} · ${item.route}`, meta: item.status, right: item.code })),
    };
  }

  if (role === 'admin') {
    return {
      roleLabel: 'Platform admin',
      status: 'Admin access',
      availability: 'Moderation queue active',
      headline: 'Verification, payment proof, report moderation хянах admin profile',
      about: 'Platform trust layer буюу payment, verification, report queue-г хянах эрхтэй admin account.',
      location: 'Улаанбаатар, Монгол',
      completion: 95,
      nextStep: 'Open reports шалгах',
      badges: ['Admin', 'Payments', 'Reports', 'Verifications'],
      privateFields: [
        { label: 'Admin scope', value: 'Payments, verification, reports' },
        { label: 'Access level', value: 'Admin access' },
        { label: 'Last review', value: '2026.05.26' },
        { label: 'Open reports', value: '3' },
      ],
      primaryCardTitle: 'Admin эрх',
      primaryCardText: 'Public profile биш, зөвхөн platform moderation-д зориулсан internal account.',
      infoCards: [
        { title: 'Pending payments', text: '4' },
        { title: 'Driver verifications', text: '2' },
        { title: 'Open reports', text: '3' },
        { title: 'Active routes', text: '18' },
      ],
      rating: '-',
      completed: 'Admin',
      activity: [
        { title: 'Payment proof approved', meta: 'BK-001', right: 'Өнөөдөр' },
        { title: 'Driver verification reviewed', meta: 'DRV-204', right: '09:48' },
        { title: 'Report resolved', meta: 'RP-001', right: 'Өчигдөр' },
      ],
    };
  }

  return {
    roleLabel: 'Аялагч',
    status: 'Traveler profile active',
    availability: 'Жолооч хайхад бэлэн',
    headline: 'Аяллын түүх, emergency contact, preference-ээ нэг дор хадгална',
    about: 'Орон нутаг руу явах жолооч хайж, суудал захиалдаг аялагчийн profile.',
    location: 'Улаанбаатар, Монгол',
    completion: 86,
    nextStep: 'Emergency contact баталгаажуулах',
    badges: ['Phone verified', '5.0 rating', '12 trips', 'Payment proof ready'],
    privateFields: [
      { label: 'Emergency contact name', value: 'Дорж Цэцэг' },
      { label: 'Emergency contact phone', value: '+976 9911 2233' },
      { label: 'Суудлын preference', value: 'Урд суудал' },
      { label: 'Ачаатай явах эсэх', value: 'Жижиг гар тээштэй' },
    ],
    primaryCardTitle: 'Аялагчийн мэдээлэл',
    primaryCardText: 'Жолооч таны booking request харах үед нэр, rating, phone verified badge зэрэг basic trust мэдээлэл л харна.',
    infoCards: [
      { title: 'Upcoming trip', text: 'УБ → Эрдэнэт · 2026.05.28' },
      { title: 'Payment proof', text: '1 review хүлээж байна' },
      { title: 'Completed trips', text: '12 аялал' },
      { title: 'Reviews', text: '5.0 average' },
    ],
    rating: '5.0/5',
    completed: '12 аялал',
    activity: travelerTrips.map((trip) => ({ title: trip.route, meta: `${trip.date} · ${trip.status}`, right: trip.rating === '-' ? 'No review' : `★ ${trip.rating}` })),
  };
}

export function AccountSettingsPage({ role }: { role: AccountRole }) {
  const profile = profiles[role];
  const isDriver = role === 'driver';
  const isSender = role === 'sender';
  const roleLabel = role === 'traveler' ? 'Аялагч' : role === 'driver' ? 'Жолооч' : role === 'sender' ? 'Дайвар ачаа илгээгч' : 'Admin';
  const settingsTabs = [
    { href: '#details', label: 'Миний мэдээлэл' },
    { href: '#password', label: 'Нууц үг' },
    { href: '#verification', label: 'Verification' },
    { href: '#privacy', label: 'Privacy' },
    { href: '#notifications', label: 'Notifications' },
  ];

  return (
    <AccountFrame role={role}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 border-b border-border pb-5">
          <Badge variant="info">{profile.label}</Badge>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            NuudelchinTrip account, route booking, verification болон privacy тохиргоогоо удирдана.
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
              title="My details"
              description="NuudelchinTrip дээр ашиглагдах үндсэн мэдээлэл."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Input label="Нэр" defaultValue={profile.name} />
                <Input label="Утасны дугаар" defaultValue={profile.phone} />
                <Input label="И-мэйл" defaultValue={profile.email} />
                <Select label="Role" defaultValue={role} options={[{ value: role, label: roleLabel }]} />
              </div>
            </SettingsSection>
          </section>

          <section id="password" className="scroll-mt-6">
            <SettingsSection
              title="Password & security"
              description="Нууц үг, утас баталгаажуулалт, session тохиргоо."
            >
              <div className="divide-y divide-border rounded-lg border border-border">
                <SettingsLine icon={<KeyRound className="h-5 w-5" />} title="Password" text="Сүүлд 32 хоногийн өмнө шинэчилсэн." action="Update" onClick={() => window.location.href = getPasswordHref(role)} />
                <SettingsLine icon={<Phone className="h-5 w-5" />} title="Утас баталгаажуулалт" text="SMS webhook demo-оор баталгаажсан." badge="Verified" />
                <SettingsLine icon={<ShieldCheck className="h-5 w-5" />} title="2FA" text="Production шатанд нэмэх боломжтой." action="Setup later" />
              </div>
            </SettingsSection>
          </section>

          <section id="verification" className="scroll-mt-6">
            <SettingsSection
              title="Verification"
              description="Marketplace trust-д хэрэгтэй баталгаажуулалтын төлөв."
            >
              <div className="grid gap-4 md:grid-cols-3">
                <VerificationStatusCard title="Утас" text="Phone verified" status="Verified" />
                <VerificationStatusCard title={isDriver ? 'Driver docs' : 'Account'} text={isDriver ? 'Admin шалгаж байна' : 'Basic account active'} status={isDriver ? 'Pending' : 'Active'} tone={isDriver ? 'warning' : 'success'} />
                <VerificationStatusCard title="Cargo permission" text={isDriver || isSender ? 'Дүрэм зөвшөөрсөн' : 'Шаардлагагүй'} status={isDriver || isSender ? 'Ready' : 'Off'} />
              </div>
            </SettingsSection>
          </section>

          <section id="privacy" className="scroll-mt-6">
            <SettingsSection
              title="Privacy"
              description="Утас, route request, review ямар үед харагдахыг тохируулна."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Select label="Утас хэзээ харагдах вэ?" defaultValue="accepted" options={[
                  { value: 'accepted', label: 'Хүсэлт зөвшөөрсний дараа' },
                  { value: 'confirmed', label: 'Төлбөр баталгаажсаны дараа' },
                  { value: 'admin', label: 'Зөвхөн admin-д' },
                ]} />
                <Select label="Route request privacy" defaultValue="matched" options={[
                  { value: 'matched', label: 'Зөвхөн matched user-д' },
                  { value: 'admin', label: 'Admin-д нэмэлтээр харагдана' },
                ]} />
                <ToggleRow label="Review public харагдана" checked />
                <ToggleRow label="Report history private байна" checked />
              </div>
            </SettingsSection>
          </section>

          <section id="notifications" className="scroll-mt-6">
            <SettingsSection
              title="Notifications"
              description="Booking, payment, trip болон cargo status update."
            >
              <div className="grid gap-3 md:grid-cols-2">
                <ToggleRow label="Booking request notification" checked />
                <ToggleRow label="Driver accepted notification" checked />
                <ToggleRow label="Payment approved notification" checked />
                <ToggleRow label="Trip reminder" checked />
                <ToggleRow label="Review reminder" checked />
                <ToggleRow label="Cargo status update" checked={isDriver || isSender} />
              </div>
            </SettingsSection>
          </section>

          <section className="border-t border-border pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Account deactivate</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Active booking эсвэл cargo request байвал account шууд устахгүй, admin review-р шийдэгдэнэ.
                </p>
              </div>
              <Button variant="outline">Deactivate request</Button>
            </div>
          </section>

          <div className="sticky bottom-0 -mx-4 border-t border-border bg-background/95 p-4 backdrop-blur sm:static sm:mx-0 sm:flex sm:justify-end sm:border-0 sm:bg-transparent sm:p-0">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" onClick={() => window.location.href = getSettingsHref(role)}>Cancel</Button>
              <Button>
                Save changes
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
        <h1 className="mt-4 text-3xl font-bold text-foreground">Settings</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Account, security, notification, privacy тохиргоо role-оос үл хамаараад нэг стандартаар ажиллана.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <SettingCard icon={<UserCircle />} title="Account settings" description="Нэр, зураг, утас, имэйл, account status.">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Нэр" defaultValue={profiles[role].name} />
              <Input label="Утас" defaultValue={profiles[role].phone} />
              <Input label="И-мэйл" defaultValue={profiles[role].email} />
              <Select label="Account status" options={[{ value: 'active', label: 'Active' }, { value: 'deactivate', label: 'Deactivate requested' }]} />
            </div>
          </SettingCard>

          <SettingCard icon={<LockKeyhole />} title="Security settings" description="Password, session, 2FA placeholder, phone verification.">
            <div className="grid gap-3 md:grid-cols-4">
              <StatusTile title="Password" text="32 хоногийн өмнө" />
              <StatusTile title="Login history" text="2 төхөөрөмж" />
              <StatusTile title="2FA" text="Placeholder" />
              <StatusTile title="Phone" text="Verified" success />
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => window.location.href = getPasswordHref(role)}>
                Нууц үг солих
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/forgot-password'}>Нууц үг мартсан</Button>
            </div>
          </SettingCard>

          <SettingCard icon={<Bell />} title="Notification settings" description="Booking, payment, trip, cargo, review reminder.">
            <ToggleRow label="Booking request notification" checked />
            <ToggleRow label="Driver accepted notification" checked />
            <ToggleRow label="Payment approved notification" checked />
            <ToggleRow label="Trip reminder" checked />
            <ToggleRow label="Cargo status update" checked={role !== 'traveler'} />
            <ToggleRow label="Review reminder" checked />
          </SettingCard>
        </div>

        <aside className="space-y-6">
          <SettingCard icon={<ShieldCheck />} title="Privacy settings" description="Утас, profile, review visibility.">
            <Select label="Утас хэзээ харагдах вэ?" options={[
              { value: 'accepted', label: 'Accepted booking дараа' },
              { value: 'confirmed', label: 'Payment confirmed дараа' },
              { value: 'never', label: 'Зөвхөн admin-д' },
            ]} />
            <ToggleRow label="Profile public" checked />
            <ToggleRow label="Review public" checked />
          </SettingCard>

          <Card className="border-destructive/20 bg-destructive/5 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <Trash2 className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-foreground">Deactivate account</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              MVP дээр account delete request admin review-р шийдэгдэнэ. Active booking байвал шууд устгахгүй.
            </p>
            <Button className="mt-5" variant="outline" fullWidth>Deactivate request</Button>
          </Card>
        </aside>
      </div>
    </AccountFrame>
  );
}

export function AccountVerificationPage({ role }: { role: AccountRole }) {
  const isDriver = role === 'driver';
  const isSender = role === 'sender';

  return (
    <AccountFrame role={role}>
      <div className="mb-8">
        <Badge variant="success">Verification center</Badge>
        <h1 className="mt-4 text-3xl font-bold text-foreground">Verification center</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Phone, email, identity, driver document, car document, cargo policy status-уудыг нэг дор хянана.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground">Бүх хэрэглэгчид</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <VerificationItem title="Утас баталгаажуулах" status="approved" icon={<Phone />} />
              <VerificationItem title="И-мэйл баталгаажуулах" status="approved" icon={<Mail />} />
              <VerificationItem title="Иргэний үнэмлэх" status="placeholder" icon={<FileCheck2 />} />
            </div>
          </Card>

          {isDriver && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground">Жолоочийн verification</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <VerificationItem title="Жолооны үнэмлэх upload" status="review" icon={<FileCheck2 />} />
                <VerificationItem title="Машины гэрчилгээ upload" status="review" icon={<Car />} />
                <VerificationItem title="Машины зураг upload" status="approved" icon={<Camera />} />
              </div>
            </Card>
          )}

          {(isDriver || isSender) && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground">Дайвар ачааны permission</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <VerificationItem title="Cargo policy зөвшөөрөх" status="approved" icon={<PackageCheck />} />
                <VerificationItem title="Хориглосон барааны дүрэм" status="approved" icon={<ShieldCheck />} />
                <VerificationItem title="Cargo permission status" status={isDriver ? 'approved' : 'review'} icon={<BadgeCheck />} />
              </div>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          <Card className="border-primary/20 bg-primary/5 p-5">
            <h2 className="text-xl font-semibold text-foreground">Admin approval status</h2>
            <div className="mt-5 space-y-4">
              <ProgressRow label="Phone" value={100} />
              <ProgressRow label="Profile" value={90} />
              <ProgressRow label={isDriver ? 'Driver docs' : 'Identity'} value={isDriver ? 68 : 40} />
              <ProgressRow label="Cargo policy" value={isDriver || isSender ? 100 : 0} />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-xl font-semibold text-foreground">Next action</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Driver document approve болсны дараа route нийтлэх эрх бүрэн нээгдэнэ.
            </p>
            <Button className="mt-5" fullWidth onClick={() => window.location.href = '/admin/verifications'}>
              Admin queue харах
            </Button>
          </Card>
        </aside>
      </div>
    </AccountFrame>
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
        <Badge variant="info">Security</Badge>
        <h1 className="mt-4 text-3xl font-bold text-foreground">Нууц үг шинэчлэх</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Password update-ийг тусдаа page дээр гаргаснаар settings илүү цэвэр, professional харагдана.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card className="p-6">
          <div className="mb-6 flex items-start gap-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Password update</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Нууц үг солисны дараа бусад төхөөрөмжийн session-уудыг гаргах боломжтой.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <Input label="Одоогийн нууц үг" type="password" placeholder="Одоогийн нууц үгээ оруулна" />
            <div className="grid gap-5 md:grid-cols-2">
              <Input label="Шинэ нууц үг" type="password" placeholder="Шинэ нууц үг" />
              <Input label="Шинэ нууц үг давтах" type="password" placeholder="Давтаж оруулна" />
            </div>
            <ToggleRow label="Бусад төхөөрөмж дээрх session-уудыг гаргах" checked />
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
          Route руу буцах
        </button>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-4xl font-bold text-primary">Б</div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-bold text-foreground">Бат-Эрдэнэ</h1>
                  <Badge variant="success">Verified driver</Badge>
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
              <PublicStat label="Completed trips" value="42" />
              <PublicStat label="Response time" value="18 мин" />
              <PublicStat label="Cargo permission" value="Active" />
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold text-foreground">Машины мэдээлэл</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <InfoCard title="Model" text="Toyota Prius 30" />
                <InfoCard title="Plate" text="УБА 1234" />
                <InfoCard title="Сул суудал" text="3 хүртэл" />
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold text-foreground">Reviews</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <ReviewCard text="Цагтаа ирсэн, машин цэвэрхэн, route ойлгомжтой байсан." author="Сарангэрэл" />
                <ReviewCard text="Ачаа авах дүрэм тодорхой, pickup цонхоо сайн барьсан." author="Мөнх-Эрдэнэ" />
              </div>
            </div>
          </Card>

          <aside className="space-y-6">
            <Card className="p-5">
              <h2 className="text-xl font-semibold text-foreground">Public profile дээр харагдах</h2>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <p>Нэр, зураг, rating, completed trips, verification badges, машины basic info, reviews.</p>
                <p className="font-medium text-foreground">Утас, имэйл, бичиг баримт, орлого public биш.</p>
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
      <Select label="Cargo permission" options={[{ value: 'yes', label: 'Дайвар ачаа авч болно' }, { value: 'no', label: 'Авахгүй' }]} />
    </div>
  );
}

function SenderProfileFields() {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <Input label="Байнга илгээдэг хүлээн авагч" defaultValue="Дорж Мөнх · +976 7777 8888" />
      <Select label="Cargo rules accepted" options={[{ value: 'yes', label: 'Зөвшөөрсөн' }, { value: 'no', label: 'Дахин унших' }]} />
    </div>
  );
}

function TravelerHistory() {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-foreground">Миний аяллын түүх</h2>
      <div className="mt-5 space-y-3">
        {travelerTrips.map((trip) => (
          <TimelineRow key={`${trip.route}-${trip.date}`} title={trip.route} meta={`${trip.date} · ${trip.status}`} right={trip.rating === '-' ? 'No review' : `⭐ ${trip.rating}`} />
        ))}
      </div>
    </Card>
  );
}

function DriverTrustPanel() {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-foreground">Route history & earnings</h2>
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
          <TimelineRow key={`${item.item}-${item.code}`} title={`${item.item} · ${item.route}`} meta={item.status} right={item.code === '-' ? 'No code' : item.code} />
        ))}
      </div>
    </Card>
  );
}

function AdminScopePanel() {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-foreground">Admin scope</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <InfoCard title="Payment" text="Approve/reject proof" />
        <InfoCard title="Verification" text="Driver docs review" />
        <InfoCard title="Reports" text="Dispute moderation" />
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
  const label = status === 'approved' ? 'Approved' : status === 'review' ? 'Admin review' : 'Placeholder';
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
