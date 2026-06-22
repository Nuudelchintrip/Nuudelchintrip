import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, CheckCircle, ShieldCheck, UserCircle } from 'lucide-react';
import { useParams } from 'react-router';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';
import { fetchParticipantPublicProfile, type ParticipantPublicProfile } from '../services/tripService';

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
  const title = loading ? 'Мэдээлэл уншиж байна...' : profile?.fullName || 'Хэрэглэгч олдсонгүй';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <button
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
          onClick={() => window.history.back()}
          type="button"
        >
          <ArrowLeft className="h-4 w-4" />
          Буцах
        </button>

        <Card className="p-8">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserCircle className="h-9 w-9" />
            </div>
            <Badge variant={isDriver ? 'success' : 'info'} className="mt-5">
              {profile ? (isDriver ? 'Жолооч' : profile.role === 'traveler' ? 'Аялагч' : 'Хэрэглэгч') : 'Профайл'}
            </Badge>
            <h1 className="mt-4 text-3xl font-bold text-foreground">{title}</h1>
            <p className="mx-auto mt-3 max-w-xl leading-7 text-muted-foreground">
              Захиалгатай холбоотой хэрэглэгчийн үндсэн мэдээлэл энд харагдана.
            </p>
          </div>

          {error && (
            <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm font-medium text-destructive">
              {error}
            </div>
          )}

          {profile && (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <ProfileInfo label="Утас" value={profile.phone || 'Нууцалсан'} />
              <ProfileInfo label="И-мэйл" value={profile.email || 'Нууцалсан'} />
              <ProfileInfo label="Утас баталгаажсан" value={profile.phoneVerified ? 'Тийм' : 'Үгүй'} icon={profile.phoneVerified ? <CheckCircle className="h-4 w-4 text-success" /> : undefined} />
              {isDriver && <ProfileInfo label="Жолоочийн баталгаажуулалт" value={profile.driverVerificationStatus === 'approved' ? 'Баталгаажсан' : 'Хүлээгдэж байна'} icon={<ShieldCheck className="h-4 w-4 text-success" />} />}
              {isDriver && <ProfileInfo label="Машин" value={profile.carModel || 'Оруулаагүй'} />}
              {isDriver && <ProfileInfo label="Улсын дугаар" value={profile.plateNumber || 'Оруулаагүй'} />}
              {isDriver && <ProfileInfo label="Суудал" value={profile.seats ? `${profile.seats}` : 'Оруулаагүй'} />}
              {isDriver && <ProfileInfo label="Үнэлгээ" value={`${profile.rating}/5 · ${profile.completedTrips} аялал`} />}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button variant="outline" onClick={() => window.history.back()}>Буцах</Button>
            <Button onClick={() => window.location.href = '/dashboard'}>Самбар руу очих</Button>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

function ProfileInfo({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <p className="font-semibold text-foreground">{value}</p>
        {icon}
      </div>
    </div>
  );
}
