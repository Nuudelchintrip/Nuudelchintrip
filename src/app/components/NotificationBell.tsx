import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from '../services/notificationService';

const PANEL_LIMIT = 6;

/** Мэдэгдлийн хонх: уншаагүй тоог үзүүлж, сүүлийн мэдэгдлүүдийг цонхоор харуулна. */
export function NotificationBell({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    try {
      setItems(await fetchNotifications(PANEL_LIMIT));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  // Гадна талд дарахад цонх хаагдана.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const unread = items.filter((item) => !item.readAt).length;

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) void load();
  };

  const handleOpenItem = async (item: AppNotification) => {
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

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={unread > 0 ? `Мэдэгдэл: ${unread} уншаагүй` : 'Мэдэгдэл'}
        aria-expanded={open}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-secondary"
        onClick={handleToggle}
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-bold leading-none text-destructive-foreground">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between gap-2 border-b border-border px-3.5 py-2.5">
            <p className="text-sm font-semibold text-foreground">Мэдэгдэл</p>
            {unread > 0 && (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                onClick={handleMarkAll}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Бүгдийг уншсан болгох
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="px-3.5 py-5 text-sm text-muted-foreground">Уншиж байна...</p>
            ) : items.length === 0 ? (
              <div className="px-3.5 py-6 text-center">
                <Bell className="mx-auto mb-2 h-7 w-7 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Мэдэгдэл алга</p>
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`flex w-full items-start gap-2.5 border-b border-border px-3.5 py-3 text-left transition-colors last:border-b-0 hover:bg-secondary ${
                    item.readAt ? '' : 'bg-primary/5'
                  }`}
                  onClick={() => void handleOpenItem(item)}
                >
                  {!item.readAt ? (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  ) : (
                    <span className="mt-1.5 h-2 w-2 shrink-0" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">{item.title}</span>
                    {item.body && <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{item.body}</span>}
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString('mn-MN')}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>

          <a
            href="/dashboard/notifications"
            className="block border-t border-border px-3.5 py-2.5 text-center text-sm font-medium text-primary hover:bg-secondary"
          >
            Бүх мэдэгдлийг харах
          </a>
        </div>
      )}
    </div>
  );
}
