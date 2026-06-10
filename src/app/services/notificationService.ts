import { supabase } from '../lib/supabase';

export interface AppNotification {
  id: string;
  title: string;
  body?: string;
  eventType?: string;
  deeplink?: string;
  readAt?: string;
  createdAt: string;
}

export async function fetchNotifications(limit = 50): Promise<AppNotification[]> {
  if (!supabase) return [];
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, body, event_type, deeplink, read_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id as string,
    title: row.title as string,
    body: (row.body as string) || undefined,
    eventType: (row.event_type as string) || undefined,
    deeplink: (row.deeplink as string) || undefined,
    readAt: (row.read_at as string) || undefined,
    createdAt: row.created_at as string,
  }));
}

export async function fetchUnreadCount(): Promise<number> {
  if (!supabase) return 0;
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return 0;

  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) return 0;
  return count || 0;
}

export async function markNotificationRead(id: string) {
  if (!supabase) return;
  await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).is('read_at', null);
}

export async function markAllNotificationsRead() {
  if (!supabase) return;
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return;
  await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', userId).is('read_at', null);
}
