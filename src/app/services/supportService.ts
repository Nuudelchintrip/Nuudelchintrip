import { supabase } from '../lib/supabase';

export interface SupportRequestInput {
  name?: string;
  phone?: string;
  bookingRef?: string;
  category?: string;
  message: string;
  website?: string;
  startedAt: number;
}

export async function submitSupportRequest(input: SupportRequestInput) {
  if (!supabase) throw new Error('Supabase тохируулагдаагүй байна.');
  if (input.message.trim().length < 10) {
    throw new Error('Асуудлаа дор хаяж 10 тэмдэгтээр дэлгэрэнгүй бичнэ үү.');
  }
  if (input.message.trim().length > 4000) {
    throw new Error('Тайлбар 4000 тэмдэгтээс урт байж болохгүй.');
  }

  const { data, error } = await supabase.functions.invoke('submit-support', {
    body: {
      name: input.name?.trim() || '',
      phone: input.phone?.trim() || '',
      bookingRef: input.bookingRef?.trim() || '',
      category: input.category?.trim() || '',
      message: input.message.trim(),
      website: input.website || '',
      startedAt: input.startedAt,
    },
  });

  if (error) {
    let payload: { error?: string; retry_after_seconds?: number } | null = null;
    try {
      payload = await (error as { context?: { json?: () => Promise<{ error?: string; retry_after_seconds?: number }> } })
        .context?.json?.() ?? null;
    } catch {
      payload = null;
    }

    if (payload?.error === 'support_rate_limited') {
      const minutes = Math.max(1, Math.ceil((payload.retry_after_seconds || 60) / 60));
      throw new Error(`Хэт олон хүсэлт илгээлээ. ${minutes} минутын дараа дахин оролдоно уу.`);
    }
    if (payload?.error === 'message_too_short') {
      throw new Error('Асуудлаа дор хаяж 10 тэмдэгтээр дэлгэрэнгүй бичнэ үү.');
    }
    throw new Error('Хүсэлт илгээж чадсангүй. Түр хүлээгээд дахин оролдоно уу.');
  }

  if (!data?.ok) throw new Error('Хүсэлт илгээж чадсангүй.');
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
