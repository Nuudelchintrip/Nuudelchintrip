import { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { AppFooter } from '../components/Footer';
import { Sidebar } from '../components/Sidebar';
import { getDashboardMenu, type DashboardRole } from '../navigation/dashboardMenus';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from '../services/notificationService';
import { getStoredUser } from '../utils/auth';

function toMenuRole(role?: string): DashboardRole {
  if (role === 'driver') return 'driver';
  if (role === 'cargo_sender') return 'sender';
  if (role === 'admin') return 'admin';
  return 'traveler';
}

export function NotificationsPage() {
  const user = getStoredUser();
  const menuRole = toMenuRole(user?.role);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await fetchNotifications());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleOpen = async (item: AppNotification) => {
    if (!item.readAt) {
      await markNotificationRead(item.id);
      setItems((current) => current.map((n) => (n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n)));
    }
    if (item.deeplink) window.location.href = item.deeplink;
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    const now = new Date().toISOString();
    setItems((current) => current.map((n) => ({ ...n, readAt: n.readAt || now })));
  };

  const unread = items.filter((n) => !n.readAt).length;

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar menuItems={getDashboardMenu(menuRole)} />

      <main className="mx-auto w-full max-w-6xl min-w-0 flex-1 overflow-x-hidden p-3.5 sm:p-5 md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge variant="info" className="mb-3">Мэдэгдэл</Badge>
            <h1 className="text-3xl font-bold text-foreground">Мэдэгдэл</h1>
            <p className="mt-2 text-muted-foreground">
              Захиалга, төлбөр, аяллын төлөв болон баталгаажуулалтын мэдэгдэл энд бодитоор харагдана.
            </p>
          </div>
          {unread > 0 && (
            <Button variant="outline" onClick={handleMarkAll}>
              <CheckCheck className="h-4 w-4" />
              Бүгдийг уншсан болгох ({unread})
            </Button>
          )}
        </div>

        {loading ? (
          <Card className="p-6 text-sm text-muted-foreground">Мэдэгдлүүдийг уншиж байна...</Card>
        ) : items.length === 0 ? (
          <Card className="p-8 text-center">
            <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Мэдэгдэл алга</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Захиалга, төлбөр, аялалд өөрчлөлт орох үед мэдэгдэл энд гарч ирнэ.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Card
                key={item.id}
                className={`cursor-pointer p-4 transition-colors hover:border-primary/50 ${item.readAt ? '' : 'border-primary/40 bg-primary/5'}`}
                onClick={() => handleOpen(item)}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.readAt ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{item.title}</p>
                      {!item.readAt && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    </div>
                    {item.body && <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.body}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString('mn-MN')}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <AppFooter />
      </main>
    </div>
  );
}
