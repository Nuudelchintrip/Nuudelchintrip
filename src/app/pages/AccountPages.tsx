import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bell,
  Camera,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  Mail,
  MapPin,
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
import {
  DEFAULT_ACCOUNT_PREFERENCES,
  fetchAccountPreferences,
  saveAccountPreferences,
  type AccountPreferences,
} from '../services/accountPreferencesService';
import {
  changePassword,
  fetchMyAvatarUrl,
  fetchMyDriverVerification,
  refreshLocalProfileFromSupabase,
  updateProfileInfo,
  uploadAvatar,
  type MyDriverVerification,
} from '../services/supabaseAuth';
import { getStoredUser } from '../utils/auth';

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
              <Metric label="Үнэлгээ" value="Одоогоор алга" />
              <Metric label="Дууссан" value="Одоогоор алга" />
              <Metric label="Гомдол" value="Идэвхтэй гомдол алга" />
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
  const storedUser = getStoredUser();
  const displayPhone = storedUser?.phone || '';
  const displayEmail = storedUser?.email || '';
  const phoneVerified = Boolean(storedUser?.phone_verified);

  const [editName, setEditName] = useState(storedUser?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'trust' | 'verification' | 'activity'>('profile');
  const [driverVerification, setDriverVerification] = useState<MyDriverVerification | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void fetchMyAvatarUrl().then(setAvatarUrl);
  }, []);

  useEffect(() => {
    if (role === 'driver') void fetchMyDriverVerification().then(setDriverVerification);
  }, [role]);

  const onboardingCompleted = Boolean(storedUser?.onboarding_completed);
  const driverStatus = driverVerification?.status || storedUser?.verification_status || 'not_submitted';
  const isDriver = role === 'driver';

  const displayName = editName.trim() || 'Нэр оруулаагүй';
  const completion = Math.round(([editName.trim(), displayPhone, displayEmail].filter(Boolean).length / 3) * 100);

  const saveName = async () => {
    setProfileMsg('');
    if (!editName.trim()) {
      setProfileMsg('Нэрээ оруулна уу.');
      return;
    }
    setSaving(true);
    try {
      await updateProfileInfo({ fullName: editName });
      setProfileMsg('Профайл хадгалагдлаа.');
    } catch (err) {
      setProfileMsg(err instanceof Error ? err.message : 'Хадгалахад алдаа гарлаа.');
    } finally {
      setSaving(false);
    }
  };

  const onAvatarSelected = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setProfileMsg('');
    try {
      const url = await uploadAvatar(file);
      await updateProfileInfo({ avatarUrl: url });
      setAvatarUrl(url);
      setProfileMsg('Профайл зураг шинэчлэгдлээ.');
    } catch (err) {
      setProfileMsg(err instanceof Error ? err.message : 'Зураг оруулахад алдаа гарлаа.');
    } finally {
      setUploading(false);
    }
  };

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
          <Badge variant={phoneVerified ? 'success' : 'warning'}>{phoneVerified ? 'Утас баталгаажсан' : 'Утас баталгаажаагүй'}</Badge>
          <Badge variant={role === 'driver' ? 'warning' : 'info'}>{details.status}</Badge>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
          <Card className="overflow-hidden p-5">
            <div className="relative mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary/20 via-white to-warning/20 text-primary shadow-inner dark:via-card">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <UserCircle className="h-14 w-14" />
              )}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow disabled:opacity-60"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => onAvatarSelected(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="mt-5 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{displayName}</h1>
              <p className="mt-1 text-sm font-medium text-muted-foreground">{details.roleLabel}</p>
            </div>

            <Button
              className="mt-5"
              variant="outline"
              fullWidth
              disabled={uploading}
              onClick={() => avatarInputRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
              {uploading ? 'Зураг оруулж байна...' : avatarUrl ? 'Профайл зураг солих' : 'Профайл зураг оруулах'}
            </Button>
            {profileMsg && <p className="mt-3 text-center text-sm font-medium text-primary">{profileMsg}</p>}

            <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4 text-center">
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
                <span className="z-10 text-sm font-bold text-foreground">{completion}%</span>
              </div>
              <div>
                <p className="font-semibold text-foreground">Профайлын бүрдэлт</p>
                <p className="mt-1 text-sm text-muted-foreground">{completion === 100 ? 'Үндсэн мэдээлэл бүрдсэн' : details.nextStep}</p>
              </div>
            </div>
          </Card>
        </aside>

        <section className="space-y-4 sm:space-y-6">
          <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">Миний профайл</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{details.about}</p>
            <div className="mt-4 flex gap-5 overflow-x-auto border-b border-border text-sm font-semibold text-muted-foreground [scrollbar-width:none] sm:mt-6 sm:flex-wrap sm:gap-6 [&::-webkit-scrollbar]:hidden">
              {[
                { id: 'profile' as const, label: 'Хувийн мэдээлэл' },
                { id: 'trust' as const, label: 'Итгэлцэл' },
                { id: 'verification' as const, label: 'Баталгаажуулалт' },
                { id: 'activity' as const, label: 'Үйлдлийн түүх' },
              ].map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 pb-3 transition-colors ${
                    activeTab === tab.id ? 'border-b-2 border-primary text-foreground' : 'hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <Card className={`p-4 sm:p-6 ${activeTab !== 'profile' ? 'hidden' : ''}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Хувийн мэдээлэл</h2>
                <p className="mt-1 text-sm text-muted-foreground">Хувийн мэдээлэл зөвхөн тухайн хэрэглэгч болон админд харагдана.</p>
              </div>
              <Button variant="outline" size="sm" disabled={saving} onClick={saveName}>
                {saving ? 'Хадгалж байна...' : 'Засвар хадгалах'}
              </Button>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Input label="Нэр" value={editName} onChange={(e) => setEditName(e.target.value)} />
              <Input label="Утас" defaultValue={displayPhone} readOnly />
              <Input label="И-мэйл" defaultValue={displayEmail} readOnly />
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

          <div className={`grid gap-4 sm:gap-6 ${isDriver ? 'lg:grid-cols-[1fr_320px]' : ''} ${activeTab !== 'trust' ? 'hidden' : ''}`}>
            <Card className="p-4 sm:p-6">
              <h2 className="text-xl font-semibold text-foreground sm:text-2xl">{details.primaryCardTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{details.primaryCardText}</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {details.infoCards.map((item) => (
                  <InfoCard key={item.title} title={item.title} text={item.text} />
                ))}
              </div>
            </Card>

            {isDriver && (
              <Card className="border-success/20 bg-success/5 p-4 sm:p-6">
                <h2 className="text-xl font-semibold text-foreground">Итгэлцлийн тойм</h2>
                <div className="mt-5 grid gap-3">
                  <Metric label="Үнэлгээ" value={details.rating} />
                  <Metric label="Дууссан аялал" value={details.completed} />
                </div>
              </Card>
            )}
          </div>

          <Card className={`p-4 sm:p-6 ${activeTab !== 'verification' ? 'hidden' : ''}`}>
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Баталгаажуулалт</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Таны бүртгэлийн баталгаажуулалтын төлөв.</p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <VerifyRow label="Утасны дугаар" ok={phoneVerified} okText="Баталгаажсан" pendingText="Баталгаажаагүй" />
              <VerifyRow label="Профайлын мэдээлэл" ok={onboardingCompleted} okText="Бүрдсэн" pendingText="Дутуу" />
              {isDriver && (
                <VerifyRow
                  label="Жолоочийн эрх"
                  ok={driverStatus === 'approved'}
                  okText="Баталгаажсан"
                  pendingText={driverStatus === 'rejected' ? 'Буцаагдсан' : 'Админ шалгаж байна'}
                />
              )}
            </div>
            {isDriver && driverStatus === 'rejected' && driverVerification?.rejectionReason && (
              <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm leading-6 text-destructive">
                <p className="font-semibold">Админы тайлбар</p>
                <p className="mt-1">{driverVerification.rejectionReason}</p>
              </div>
            )}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              {!phoneVerified && (
                <Button variant="outline" onClick={() => window.location.href = '/auth/verify-phone'}>
                  Утсаа баталгаажуулах
                </Button>
              )}
              {isDriver && driverStatus !== 'approved' && (
                <Button variant="outline" onClick={() => window.location.href = '/onboarding/driver'}>
                  Жолоочийн мэдээлэл шинэчлэх
                </Button>
              )}
            </div>
          </Card>

          <Card className={`p-4 sm:p-6 ${activeTab !== 'activity' ? 'hidden' : ''}`}>
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Сүүлийн үйлдлүүд</h2>
            <div className="mt-5 grid gap-3">
              {details.activity.length > 0 ? (
                details.activity.map((item) => (
                  <TimelineRow key={`${item.title}-${item.meta}`} title={item.title} meta={item.meta} right={item.right} />
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                  Бодит захиалга, чиглэл эсвэл ачааны хүсэлт үүссэний дараа үйлдлийн түүх энд харагдана.
                </div>
              )}
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
      about: 'Жолоочийн баталгаажуулалт, машины мэдээлэл, нийтэлсэн чиглэл, ирсэн хүсэлтүүд бодит өгөгдлөөр бүрдэнэ.',
      location: 'Монгол',
      completion: 0,
      nextStep: 'Машины мэдээлэл болон бичиг баримтаа оруулах',
      badges: ['Утасны төлөв', 'Жолоочийн шалгалт', 'Машины мэдээлэл', 'Дайвар ачааны эрх'],
      privateFields: [
        { label: 'Машины загвар', value: '' },
        { label: 'Улсын дугаар', value: '' },
        { label: 'Суудлын тоо', value: '' },
        { label: 'Жолооны үнэмлэх', value: 'Оруулаагүй' },
      ],
      primaryCardTitle: 'Жолоочийн мэдээлэл',
      primaryCardText: 'Нийтийн карт дээр зөвхөн баталгаажсан тэмдэг, үнэлгээ, дууссан аялал, машины үндсэн мэдээлэл харагдана.',
      infoCards: [
        { title: 'Чиглэлийн түүх', text: 'Нийтэлсэн чиглэл үүсвэл энд харагдана' },
        { title: 'Хүсэлтүүд', text: 'Аялагчийн хүсэлт ирвэл энд харагдана' },
        { title: 'Ачаа авах эрх', text: 'Route нийтлэх үед сонгоно' },
        { title: 'Төлбөр', text: 'Баталгаажсан booking дээр бүртгэгдэнэ' },
      ],
      rating: 'Одоогоор алга',
      completed: 'Одоогоор алга',
      activity: [],
    };
  }

  if (role === 'sender') {
    return {
      roleLabel: 'Дайвар ачаа илгээгч',
      status: 'Ачааны дүрэм зөвшөөрсөн',
      availability: 'Ачаа илгээхэд бэлэн',
      headline: 'Хүлээн авагч, ачааны дүрэм, хүргэлтийн кодоо нэг дор хянах профайл',
      about: 'Жолоочийн чиглэл дээр суурилсан жижиг дайвар ачааны хүсэлт илгээдэг хэрэглэгч.',
      location: 'Монгол',
      completion: 0,
      nextStep: 'Хүлээн авагчийн мэдээлэл болон ачааны дүрмээ шалгах',
      badges: ['Утасны төлөв', 'Ачааны дүрэм', 'Төлбөрийн баримт', 'Хүргэлтийн код'],
      privateFields: [
        { label: 'Байнгын хүлээн авагч', value: '' },
        { label: 'Ачааны дүрэм', value: 'Профайл setup дээр зөвшөөрнө' },
        { label: 'Төлбөрийн баримтын түүх', value: 'Одоогоор алга' },
        { label: 'Маргааны түүх', value: 'Одоогоор алга' },
      ],
      primaryCardTitle: 'Ачаа илгээгчийн мэдээлэл',
      primaryCardText: 'Ачааны нэр, хүлээн авагч, хүргэлтийн код, төлбөрийн баримт нь хувийн хэсэгт хадгалагдана.',
      infoCards: [
        { title: 'Идэвхтэй ачаа', text: 'Хүсэлт үүсвэл энд харагдана' },
        { title: 'Хүргэлтийн код', text: 'Accepted cargo дээр үүснэ' },
        { title: 'Хүргэгдсэн ачаа', text: 'Одоогоор алга' },
        { title: 'Дүрмийн төлөв', text: 'Профайл setup-аас удирдана' },
      ],
      rating: '-',
      completed: 'Одоогоор алга',
      activity: [],
    };
  }

  if (role === 'admin') {
    return {
      roleLabel: 'Платформын админ',
      status: 'Админ эрхтэй',
      availability: 'Хяналтын жагсаалт идэвхтэй',
      headline: 'Баталгаажуулалт, төлбөрийн баримт, гомдлын хяналт нэг дор',
      about: 'Платформын итгэлцлийн давхарга буюу төлбөр, баталгаажуулалт, гомдлын жагсаалтыг хянах эрхтэй админ.',
      location: 'Монгол',
      completion: 0,
      nextStep: 'Админ queue-г бодит өгөгдлөөр холбох',
      badges: ['Админ', 'Төлбөр', 'Гомдол', 'Баталгаажуулалт'],
      privateFields: [
        { label: 'Админы эрх', value: 'Төлбөр, баталгаажуулалт, гомдол' },
        { label: 'Хандалтын түвшин', value: 'Админ эрх' },
        { label: 'Сүүлд шалгасан', value: 'Одоогоор алга' },
        { label: 'Нээлттэй гомдол', value: 'Бодит report үүсвэл харагдана' },
      ],
      primaryCardTitle: 'Админы эрх',
      primaryCardText: 'Нийтийн профайл биш, зөвхөн платформын хяналтад зориулсан дотоод бүртгэл.',
      infoCards: [
        { title: 'Хүлээгдэж буй төлбөр', text: 'Бодит төлбөрийн баримт үүсвэл харагдана' },
        { title: 'Жолоочийн шалгалт', text: 'Driver verification request үүсвэл харагдана' },
        { title: 'Нээлттэй гомдол', text: 'Report үүсвэл харагдана' },
        { title: 'Идэвхтэй чиглэл', text: 'Өгөгдлийн сангаас уншина' },
      ],
      rating: '-',
      completed: 'Админ',
      activity: [],
    };
  }

  return {
    roleLabel: 'Аялагч',
    status: 'Аялагчийн профайл идэвхтэй',
    availability: 'Жолооч хайхад бэлэн',
    headline: 'Аяллын түүх, яаралтай холбоо барих хүн, суудлын сонголтоо нэг дор хадгална',
    about: 'Орон нутаг руу явах жолооч хайж, суудал захиалдаг аялагчийн профайл.',
    location: 'Монгол',
    completion: 0,
    nextStep: 'Яаралтай холбоо барих хүн баталгаажуулах',
    badges: ['Утасны төлөв', 'Яаралтай холбоо барих хүн', 'Төлбөрийн баримт', 'Аяллын түүх'],
    privateFields: [
      { label: 'Яаралтай холбоо барих хүн', value: '' },
      { label: 'Яаралтай холбоо барих утас', value: '' },
      { label: 'Суудлын сонголт', value: '' },
      { label: 'Ачаатай явах эсэх', value: '' },
    ],
    primaryCardTitle: 'Аялагчийн мэдээлэл',
    primaryCardText: 'Жолооч таны захиалгын хүсэлтийг харах үед нэр, үнэлгээ, утас баталгаажсан тэмдэг зэрэг үндсэн итгэлцлийн мэдээлэл л харна.',
    infoCards: [
      { title: 'Дараагийн аялал', text: 'Booking үүсвэл энд харагдана' },
      { title: 'Төлбөрийн баримт', text: 'Accepted booking дээр нээгдэнэ' },
      { title: 'Дууссан аялал', text: 'Одоогоор алга' },
      { title: 'Үнэлгээ', text: 'Одоогоор алга' },
    ],
    rating: 'Одоогоор алга',
    completed: 'Одоогоор алга',
    activity: [],
  };
}

export function AccountSettingsPage({ role }: { role: AccountRole }) {
  const profile = profiles[role];
  const storedUser = getStoredUser();
  const isDriver = role === 'driver';
  const isSender = role === 'sender';
  const roleLabel = role === 'traveler' ? 'Аялагч' : role === 'driver' ? 'Жолооч' : role === 'sender' ? 'Дайвар ачаа илгээгч' : 'Админ';
  const [displayName, setDisplayName] = useState(storedUser?.full_name || '');
  const displayPhone = storedUser?.phone || '';
  const displayEmail = storedUser?.email || '';
  const [preferences, setPreferences] = useState<AccountPreferences>(DEFAULT_ACCOUNT_PREFERENCES);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [preferencesError, setPreferencesError] = useState('');
  const [preferencesSuccess, setPreferencesSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const settingsTabs = [
    { id: 'details', label: 'Миний мэдээлэл' },
    { id: 'security', label: 'Нууц үг ба нууцлал' },
    { id: 'verification', label: 'Баталгаажуулалт' },
    { id: 'notifications', label: 'Мэдэгдэл' },
  ];

  useEffect(() => {
    let active = true;
    fetchAccountPreferences()
      .then((result) => {
        if (active) setPreferences(result);
      })
      .catch((error) => {
        if (active) {
          setPreferencesError(error instanceof Error ? error.message : 'Тохиргоо уншихад алдаа гарлаа.');
        }
      })
      .finally(() => {
        if (active) setPreferencesLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const updateNotificationPreference = (
    key: keyof AccountPreferences['notifications'],
    value: boolean,
  ) => {
    setPreferences((current) => ({
      ...current,
      notifications: { ...current.notifications, [key]: value },
    }));
    setPreferencesSuccess('');
  };

  const updatePrivacyPreference = <Key extends keyof AccountPreferences['privacy']>(
    key: Key,
    value: AccountPreferences['privacy'][Key],
  ) => {
    setPreferences((current) => ({
      ...current,
      privacy: { ...current.privacy, [key]: value },
    }));
    setPreferencesSuccess('');
  };

  const handleSaveSettings = async () => {
    setPreferencesSaving(true);
    setPreferencesError('');
    setPreferencesSuccess('');
    try {
      if (displayName.trim() && displayName.trim() !== storedUser?.full_name) {
        await updateProfileInfo({ fullName: displayName.trim() });
      }
      const saved = await saveAccountPreferences(preferences);
      setPreferences(saved);
      setPreferencesSuccess('Тохиргоо амжилттай хадгалагдлаа.');
    } catch (error) {
      setPreferencesError(error instanceof Error ? error.message : 'Тохиргоо хадгалахад алдаа гарлаа.');
    } finally {
      setPreferencesSaving(false);
    }
  };

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

        <nav className="mb-5 overflow-x-auto border-b border-border [scrollbar-width:none] sm:mb-8 [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-1">
            {settingsTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-11 whitespace-nowrap px-3 py-3 text-sm font-medium transition sm:px-4 sm:py-4 ${
                  activeTab === tab.id
                    ? 'border-b-2 border-primary text-foreground'
                    : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="space-y-6 sm:space-y-10">
          {activeTab === 'details' && <section id="details" className="scroll-mt-6">
            <SettingsSection
              title="Миний мэдээлэл"
              description="NuudelchinTrip дээр ашиглагдах үндсэн мэдээлэл."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Input label="Нэр" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
                <Input label="Утасны дугаар" value={displayPhone} readOnly />
                <Input label="И-мэйл" value={displayEmail} readOnly />
                <Select label="Хэрэглэгчийн төрөл" value={role} disabled options={[{ value: role, label: roleLabel }]} />
              </div>
            </SettingsSection>
          </section>}

          {activeTab === 'security' && <section id="password" className="scroll-mt-6">
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
          </section>}

          {activeTab === 'verification' && <section id="verification" className="scroll-mt-6">
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
          </section>}

          {activeTab === 'security' && <section id="privacy" className="scroll-mt-6">
            <SettingsSection
              title="Нууцлал"
              description="Утас, хүсэлт, үнэлгээ ямар үед харагдахыг тохируулна."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Select
                  label="Утас хэзээ харагдах вэ?"
                  value={preferences.privacy.phoneVisibility}
                  disabled={preferencesLoading}
                  onChange={(event) => updatePrivacyPreference('phoneVisibility', event.target.value as AccountPreferences['privacy']['phoneVisibility'])}
                  options={[
                  { value: 'accepted', label: 'Хүсэлт зөвшөөрсний дараа' },
                  { value: 'confirmed', label: 'Төлбөр баталгаажсаны дараа' },
                  { value: 'admin', label: 'Зөвхөн админд' },
                ]}
                />
                <Select
                  label="Чиглэлийн хүсэлтийн нууцлал"
                  value={preferences.privacy.requestVisibility}
                  disabled={preferencesLoading}
                  onChange={(event) => updatePrivacyPreference('requestVisibility', event.target.value as AccountPreferences['privacy']['requestVisibility'])}
                  options={[
                  { value: 'matched', label: 'Зөвхөн тохирсон хэрэглэгчид' },
                  { value: 'admin', label: 'Админд нэмэлтээр харагдана' },
                ]}
                />
                <ToggleRow
                  label="Үнэлгээ нийтэд харагдана"
                  checked={preferences.privacy.reviewsPublic}
                  disabled={preferencesLoading}
                  onChange={(value) => updatePrivacyPreference('reviewsPublic', value)}
                />
                <ToggleRow
                  label="Гомдлын түүх хувийн байна"
                  checked={preferences.privacy.reportsPrivate}
                  disabled={preferencesLoading}
                  onChange={(value) => updatePrivacyPreference('reportsPrivate', value)}
                />
              </div>
            </SettingsSection>
          </section>}

          {activeTab === 'notifications' && <section id="notifications" className="scroll-mt-6">
            <SettingsSection
              title="Мэдэгдэл"
              description="Захиалга, төлбөр, аялал болон ачааны төлөвийн мэдэгдэл."
            >
              <div className="grid gap-3 md:grid-cols-2">
                <ToggleRow label="Захиалгын хүсэлтийн мэдэгдэл" checked={preferences.notifications.bookingRequests} disabled={preferencesLoading} onChange={(value) => updateNotificationPreference('bookingRequests', value)} />
                <ToggleRow label="Жолоочийн хариу мэдэгдэл" checked={preferences.notifications.driverResponses} disabled={preferencesLoading} onChange={(value) => updateNotificationPreference('driverResponses', value)} />
                <ToggleRow label="Төлбөр баталгаажсан мэдэгдэл" checked={preferences.notifications.paymentUpdates} disabled={preferencesLoading} onChange={(value) => updateNotificationPreference('paymentUpdates', value)} />
                <ToggleRow label="Аяллын сануулга" checked={preferences.notifications.tripReminders} disabled={preferencesLoading} onChange={(value) => updateNotificationPreference('tripReminders', value)} />
                <ToggleRow label="Үнэлгээ өгөх сануулга" checked={preferences.notifications.reviewReminders} disabled={preferencesLoading} onChange={(value) => updateNotificationPreference('reviewReminders', value)} />
                {(isDriver || isSender) && (
                  <ToggleRow label="Ачааны төлөвийн мэдэгдэл" checked={preferences.notifications.cargoUpdates} disabled={preferencesLoading} onChange={(value) => updateNotificationPreference('cargoUpdates', value)} />
                )}
              </div>
            </SettingsSection>
          </section>}

          {preferencesError && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
              {preferencesError}
            </div>
          )}
          {preferencesSuccess && (
            <div className="rounded-lg border border-success/20 bg-success/5 px-4 py-3 text-sm font-medium text-success">
              {preferencesSuccess}
            </div>
          )}

          {activeTab === 'details' && <section className="border-t border-border pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Бүртгэл идэвхгүй болгох</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Идэвхтэй захиалга эсвэл ачааны хүсэлт байвал бүртгэл шууд устахгүй, админ шалгаж шийдвэрлэнэ.
                </p>
              </div>
              <Button variant="outline">Идэвхгүй болгох хүсэлт</Button>
            </div>
          </section>}

          <div className="sticky bottom-0 -mx-4 border-t border-border bg-background/95 p-4 backdrop-blur sm:static sm:mx-0 sm:flex sm:justify-end sm:border-0 sm:bg-transparent sm:p-0">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" onClick={() => window.location.href = getSettingsHref(role)}>Болих</Button>
              <Button disabled={preferencesLoading || preferencesSaving} onClick={handleSaveSettings}>
                {preferencesSaving ? 'Хадгалж байна...' : 'Өөрчлөлт хадгалах'}
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

          <SettingCard icon={<LockKeyhole />} title="Хамгаалалтын тохиргоо" description="Нууц үг, нэвтрэлт, давхар хамгаалалт, утас баталгаажуулалт.">
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
              Бүртгэл устгах хүсэлтийг админ шалгаж шийдвэрлэнэ. Идэвхтэй захиалга байвал шууд устгахгүй.
            </p>
            <Button className="mt-5" variant="outline" fullWidth>Идэвхгүй болгох хүсэлт</Button>
          </Card>
        </aside>
      </div>
    </AccountFrame>
  );
}

export function AccountVerificationPage({ role }: { role: AccountRole }) {
  const profile = profiles[role];
  const [storedUser, setStoredUser] = useState(getStoredUser());
  const [driverVerification, setDriverVerification] = useState<MyDriverVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const user = await refreshLocalProfileFromSupabase();
        const verification = role === 'driver' ? await fetchMyDriverVerification() : null;
        if (!active) return;
        setStoredUser(user);
        setDriverVerification(verification);
      } catch (error) {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : 'Баталгаажуулалтын төлөв уншихад алдаа гарлаа.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [role]);

  const phoneVerified = Boolean(storedUser?.phone_verified);
  const onboardingCompleted = Boolean(storedUser?.onboarding_completed);
  const cargoPolicyAccepted = Boolean(storedUser?.cargo_policy_accepted);
  const driverStatus = driverVerification?.status || storedUser?.verification_status || 'not_submitted';
  const driverStatusCopy = {
    not_submitted: { label: 'Илгээгээгүй', variant: 'default' as const, item: 'placeholder' as const },
    pending: { label: 'Админ шалгаж байна', variant: 'warning' as const, item: 'review' as const },
    approved: { label: 'Баталгаажсан', variant: 'success' as const, item: 'approved' as const },
    rejected: { label: 'Буцаагдсан', variant: 'danger' as const, item: 'placeholder' as const },
  }[driverStatus];

  const roleStatus = role === 'driver'
    ? driverStatus === 'approved'
    : role === 'sender'
      ? cargoPolicyAccepted
      : onboardingCompleted;
  const completionItems = role === 'driver'
    ? [phoneVerified, onboardingCompleted, driverStatus === 'approved']
    : role === 'sender'
      ? [phoneVerified, onboardingCompleted, cargoPolicyAccepted]
      : [phoneVerified, onboardingCompleted];
  const completion = Math.round((completionItems.filter(Boolean).length / completionItems.length) * 100);

  const action = role === 'driver'
    ? {
        label: driverStatus === 'approved' ? 'Жолоочийн самбар руу орох' : 'Жолоочийн мэдээлэл шинэчлэх',
        href: driverStatus === 'approved' ? profile.dashboardHref : '/onboarding/driver',
      }
    : role === 'sender'
      ? {
          label: cargoPolicyAccepted ? 'Ачаа илгээгчийн самбар руу орох' : 'Ачааны дүрэмтэй танилцах',
          href: cargoPolicyAccepted ? profile.dashboardHref : '/onboarding/cargo',
        }
      : {
          label: onboardingCompleted ? 'Аялагчийн самбар руу орох' : 'Профайлаа гүйцээх',
          href: onboardingCompleted ? profile.dashboardHref : '/onboarding/traveler',
        };

  return (
    <AccountFrame role={role}>
      <div className="mb-8">
        <Badge variant={roleStatus ? 'success' : 'warning'}>Бүртгэлийн төлөв</Badge>
        <h1 className="mt-4 text-3xl font-bold text-foreground">Баталгаажуулалт</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Таны утас, профайл болон хэрэглэгчийн төрөлд шаардлагатай баталгаажуулалтын төлөв.
        </p>
      </div>

      {loadError && (
        <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
          {loadError}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">{profile.label}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {loading ? 'Төлөвийг шинэчилж байна...' : 'Доорх мэдээлэл Supabase бүртгэлээс шинэчлэгдэн харагдана.'}
              </p>
            </div>
            {role === 'driver' && <Badge variant={driverStatusCopy.variant}>{driverStatusCopy.label}</Badge>}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <VerificationItem
              title="Утасны дугаар"
              status={phoneVerified ? 'approved' : 'review'}
              icon={<Phone />}
            />
            <VerificationItem
              title="Профайлын мэдээлэл"
              status={onboardingCompleted ? 'approved' : 'review'}
              icon={<UserCircle />}
            />
            {role === 'driver' ? (
              <VerificationItem title="Жолоочийн эрх" status={driverStatusCopy.item} icon={<BadgeCheck />} />
            ) : role === 'sender' ? (
              <VerificationItem
                title="Ачааны дүрэм"
                status={cargoPolicyAccepted ? 'approved' : 'review'}
                icon={<ShieldCheck />}
              />
            ) : (
              <VerificationItem title="Аялагчийн бүртгэл" status={onboardingCompleted ? 'approved' : 'review'} icon={<CheckCircle2 />} />
            )}
          </div>

          {role === 'driver' && driverStatus === 'rejected' && driverVerification?.rejectionReason && (
            <div className="mt-6 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              <p className="font-semibold">Админы тайлбар</p>
              <p className="mt-1 leading-6">{driverVerification.rejectionReason}</p>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button disabled={loading} onClick={() => window.location.href = action.href}>
              {action.label}
              <ArrowRight className="h-4 w-4" />
            </Button>
            {!phoneVerified && (
              <Button variant="outline" onClick={() => window.location.href = '/auth/verify-phone'}>
                Утсаа баталгаажуулах
              </Button>
            )}
          </div>
        </Card>

        <aside className="space-y-6">
          <Card className="border-primary/20 bg-primary/5 p-5">
            <h2 className="text-xl font-semibold text-foreground">Бүрдүүлэлт</h2>
            <div className="mt-5">
              <ProgressRow label="Нийт явц" value={completion} />
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {roleStatus
                ? 'Таны энэ төрлийн үндсэн тохиргоо бэлэн байна.'
                : 'Дутуу алхмаа гүйцээсний дараа тухайн самбарын үндсэн үйлдлүүд нээгдэнэ.'}
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="text-xl font-semibold text-foreground">Дараагийн алхам</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {role === 'driver'
                ? 'Жолоочийн мэдээллээ илгээсний дараа админ шалгаж чиглэл нийтлэх эрхийг нээнэ.'
                : role === 'sender'
                  ? 'Дайвар ачаа нь жолоочийн нийтэлсэн чиглэл дээр суурилна. Эхлээд ачааны дүрмийг зөвшөөрнө.'
                  : 'Профайлаа гүйцээгээд жолоочийн нийтэлсэн чиглэлүүдээс хайлт хийнэ.'}
            </p>
          </Card>
        </aside>
      </div>
    </AccountFrame>
  );
}

export function AccountPasswordPage({ role }: { role: AccountRole }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async () => {
    setError('');
    setSuccess('');
    if (!current || !next) return setError('Бүх талбарыг бөглөнө үү.');
    if (next.length < 8) return setError('Шинэ нууц үг 8-аас дээш тэмдэгт байх ёстой.');
    if (next !== confirm) return setError('Шинэ нууц үг таарахгүй байна.');
    setBusy(true);
    try {
      await changePassword(current, next);
      setSuccess('Нууц үг амжилттай шинэчлэгдлээ.');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Нууц үг шинэчлэхэд алдаа гарлаа.');
    } finally {
      setBusy(false);
    }
  };

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
            <Input label="Одоогийн нууц үг" type="password" placeholder="Одоогийн нууц үгээ оруулна" value={current} onChange={(e) => setCurrent(e.target.value)} />
            <div className="grid gap-5 md:grid-cols-2">
              <Input label="Шинэ нууц үг" type="password" placeholder="Шинэ нууц үг" value={next} onChange={(e) => setNext(e.target.value)} />
              <Input label="Шинэ нууц үг давтах" type="password" placeholder="Давтаж оруулна" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
          </div>

          {error && <p className="mt-4 text-sm font-medium text-destructive">{error}</p>}
          {success && <p className="mt-4 text-sm font-medium text-success">{success}</p>}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button disabled={busy} onClick={submit}>{busy ? 'Шинэчилж байна...' : 'Нууц үг шинэчлэх'}</Button>
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
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <button className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary" onClick={() => window.location.href = '/routes'}>
          <ArrowLeft className="h-4 w-4" />
          Чиглэл рүү буцах
        </button>

        <Card className="p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserCircle className="h-9 w-9" />
          </div>
          <Badge variant="info" className="mt-5">Жолоочийн нийтийн профайл</Badge>
          <h1 className="mt-4 text-3xl font-bold text-foreground">Бодит жолоочийн мэдээлэл чиглэлийн дэлгэрэнгүй дээр харагдана</h1>
          <p className="mx-auto mt-3 max-w-xl leading-7 text-muted-foreground">
            Нийтийн профайл дээр зөвхөн тухайн жолоочийн өгөгдлийн санд хадгалагдсан баталгаажуулалт, машины үндсэн мэдээлэл, бодит үнэлгээ харагдана. Одоогоор зохиомол жолоочийн профайл харуулахгүй.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => window.location.href = '/traveler/find-drivers'}>Жолооч хайх</Button>
            <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>Самбар руу очих</Button>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

function TravelerProfileFields() {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <Input label="Яаралтай үед холбоо барих хүн" defaultValue="+976 9911 2233" />
      <Select label="Суудлын сонголт" options={[{ value: 'front', label: 'Урд суудал' }, { value: 'back', label: 'Арын суудал' }]} />
      <Select label="Тамхи татдаг эсэх" options={[{ value: 'no', label: 'Татдаггүй' }, { value: 'yes', label: 'Татдаг' }]} />
      <Select label="Ачаатай явах эсэх" options={[{ value: 'small', label: 'Жижиг гар тээштэй' }, { value: 'none', label: 'Ачаагүй' }]} />
    </div>
  );
}

function DriverProfileFields() {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <Input label="Машины загвар" defaultValue="Toyota Prius 30" />
      <Input label="Улсын дугаар" defaultValue="УБА 1234" />
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

function ToggleRow({
  label,
  checked = false,
  disabled = false,
  onChange,
}: {
  label: string;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-border p-4">
      <span className="font-medium text-foreground">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
        className="h-5 w-5 rounded border-border text-primary focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
      />
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

function VerifyRow({ label, ok, okText, pendingText }: { label: string; ok: boolean; okText: string; pendingText: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 p-4">
      <div className="flex items-center gap-2.5">
        {ok ? <CheckCircle2 className="h-5 w-5 text-success" /> : <ShieldCheck className="h-5 w-5 text-warning" />}
        <span className="font-medium text-foreground">{label}</span>
      </div>
      <Badge variant={ok ? 'success' : 'warning'}>{ok ? okText : pendingText}</Badge>
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
      <main className="min-w-0 flex-1 overflow-x-hidden p-3.5 sm:p-5 md:p-8">
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
