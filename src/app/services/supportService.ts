import { supabase } from '../lib/supabase';

export interface SupportRequestInput {
  name?: string;
  phone?: string;
  bookingRef?: string;
  category?: string;
  message: string;
}

export async function submitSupportRequest(input: SupportRequestInput) {
  if (!supabase) throw new Error('Supabase env тохируулагдаагүй байна.');
  if (!input.message.trim()) throw new Error('Асуудлаа дэлгэрэнгүй бичнэ үү.');

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;

  const { error } = await supabase.from('support_requests').insert({
    user_id: userId,
    name: input.name?.trim() || null,
    phone: input.phone?.trim() || null,
    booking_ref: input.bookingRef?.trim() || null,
    category: input.category?.trim() || null,
    message: input.message.trim(),
  });
  if (error) throw error;
}

export interface AdminSupportItem {
  id: string;
  name?: string;
  phone?: string;
  bookingRef?: string;
  category?: string;
  message: string;
  status: string;
  createdAt: string;
}

export async function fetchAdminSupportRequests(): Promise<AdminSupportItem[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('support_requests')
    .select('id, name, phone, booking_ref, category, message, status, created_at')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id as string,
    name: (r.name as string) || undefined,
    phone: (r.phone as string) || undefined,
    bookingRef: (r.booking_ref as string) || undefined,
    category: (r.category as string) || undefined,
    message: r.message as string,
    status: r.status as string,
    createdAt: r.created_at as string,
  }));
}

export async function updateSupportStatus(id: string, status: 'open' | 'reviewing' | 'resolved') {
  if (!supabase) throw new Error('Supabase тохиргоо дутуу байна.');
  const { error } = await supabase.from('support_requests').update({ status }).eq('id', id);
  if (error) throw error;
}
