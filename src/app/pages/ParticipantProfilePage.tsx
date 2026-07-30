import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, Car, CheckCircle2, Lock, Mail, Phone, ShieldCheck, Star, Users, XCircle } from 'lucide-react';
import { useParams } from 'react-router';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';
import { fetchParticipantPublicProfile, type ParticipantPublicProfile } from '../services/tripService';

const roleLabels: Record<ParticipantPublicProfile['role'], string> = {
  traveler: 'Аялагч',
  driver: 'Жолооч',
  cargo_sender: 'Ачаа илгээгч',
  admin: 'Админ',
};

export function ParticipantProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState<ParticipantPublicProfile | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!id) {
      setLoading(false);
      setError('Хэрэглэгчийн дугаар олдсонгүй.');
      return;
    }

    setLoading(true);
    fetchParticipantPublicProfile(id)
      .then((item) => {
        if (!active) return;
        setProfile(item);
        setError(item ? '' : 'Энэ хэрэглэгчийн мэдээллийг харах эрхгүй эсвэл мэдээлэл олдсонгүй.');
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Хэрэглэгчийн мэдээлэл уншихад алдаа гарлаа.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const isDriver = profile?.role === 'driver';
  const driverApproved = profile?.driverVerificationStatus === 'approved';
  const hasContact = Boolean(profile?.phone || profile?.email);
  const initial = (profile?.fullName || 'Х').trim().charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="mx-auto w-full flex-1 max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <button
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
          onClick={() => window.history.back()}
          type="button"
        >
          <ArrowLeft className="h-4 w-4" />
          Буцах
        </button>

        {loading ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">Хэрэглэгчийн мэдээлэл уншиж байна...</Card>
        ) : error || !profile ? (
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold text-foreground">Хэрэглэгч олдсонгүй</h1>
            <div className="mx-auto mt-5 max-w-xl rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm font-medium text-destructive">
              {error || 'Хэрэглэгчийн мэдээлэл олдсонгүй.'}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button variant="outline" onClick={() => window.history.back()}>Буцах</Button>
              <Button onClick={() => window.location.href = '/dashboard'}>Самбар руу очих</Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            <Card className="p-6 sm:p-8">
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.fullName}
                    className="h-20 w-20 shrink-0 rounded-full border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary">
                    {initial}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{profile.fullName}</h1>
                    <Badge variant={isDriver ? 'success' : 'info'}>{roleLabels[profile.role]}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    {profile.phoneVerified && (
                      <TrustChip icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Утас баталгаажсан" />
                    )}
                    {isDriver && driverApproved && (
                      <TrustChip icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Баталгаажсан жолооч" />
                    )}
                    {!profile.phoneVerified && !(isDriver && driverApproved) && (
                      <span className="text-sm text-muted-foreground">Баталгаажуулалт хийгдээгүй байна</span>
                    )}
                  </div>
                </div>
              </div>

              {isDriver && (
                <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-6">
                  <HeroStat
                    icon={<Star className="h-4 w-4 text-warning" />}
                    value={profile.rating > 0 ? profile.rating.toFixed(1) : '—'}
                    label={profile.rating > 0 ? 'Үнэлгээ (5-аас)' : 'Үнэлгээ алга'}
                  />
                  <HeroStat
                    icon={<Car className="h-4 w-4 text-primary" />}
                    value={`${profile.completedTrips}`}
                    label="Дууссан аялал"
                  />
                  <HeroStat
                    icon={<Users className="h-4 w-4 text-success" />}
                    value={profile.seats ? `${profile.seats}` : '—'}
                    label="Суудлын тоо"
                  />
                </div>
              )}
            </Card>

            {isDriver && (profile.carModel || profile.plateNumber) && (
              <Card className="p-5 sm:p-6">
                <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
                  <Car className="h-4 w-4 text-primary" />
                  Тээврийн хэрэгсэл
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {profile.carModel && <InfoTile label="Машины загвар" value={profile.carModel} />}
                  {profile.plateNumber && <InfoTile label="Улсын дугаар" value={profile.plateNumber} />}
                </div>
              </Card>
            )}

            <Card className="p-5 sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Баталгаажуулалт
              </h2>
              <div className="space-y-3">
                <VerificationRow
                  label="Утасны дугаар"
                  ok={profile.phoneVerified}
                  okText="Баталгаажсан"
                  pendingText="Баталгаажаагүй"
                />
                {isDriver && (
                  <VerificationRow
                    label="Жолоочийн бичиг баримт"
                    ok={driverApproved}
                    okText="Админ баталгаажуулсан"
                    pendingText="Хүлээгдэж байна"
                  />
                )}
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
                <Phone className="h-4 w-4 text-primary" />
                Холбоо барих
              </h2>
              {hasContact ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {profile.phone && <InfoTile icon={<Phone className="h-4 w-4 text-muted-foreground" />} label="Утас" value={profile.phone} />}
                  {profile.email && <InfoTile icon={<Mail className="h-4 w-4 text-muted-foreground" />} label="И-мэйл" value={profile.email} />}
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="text-sm leading-6 text-muted-foreground">
                    Аюулгүй байдлын үүднээс утас, и-мэйл зэрэг холбоо барих мэдээлэл зөвхөн
                    захиалга эсвэл ачааны хүсэлт баталгаажсны дараа нээгдэнэ.
                  </p>
                </div>
              )}
            </Card>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button variant="outline" onClick={() => window.history.back()}>Буцах</Button>
              <Button onClick={() => window.location.href = '/dashboard'}>Самбар руу очих</Button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function TrustChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
      {icon}
      {label}
    </span>
  );
}

function HeroStat({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1.5">
        {icon}
        <span className="text-xl font-bold text-foreground sm:text-2xl">{value}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</p>
    </div>
  );
}

function InfoTile({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        {icon}
        <p className="break-words font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function VerificationRow({
  label,
  ok,
  okText,
  pendingText,
}: {
  label: string;
  ok: boolean;
  okText: string;
  pendingText: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 p-3.5">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${ok ? 'text-success' : 'text-muted-foreground'}`}>
        {ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        {ok ? okText : pendingText}
      </span>
    </div>
  );
}
