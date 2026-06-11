import { supabase } from '../lib/supabase';

/** Platform commission taken from the fare. Driver keeps the rest. */
export const COMMISSION_RATE = 0.1;

export interface DriverEarnings {
  fareTotal: number;
  commission: number;
  netEarned: number;
  paidOut: number;
  pending: number;
  completedCount: number;
  trips: { id: string; route: string; amount: number; net: number; date: string }[];
}

export async function fetchMyDriverEarnings(): Promise<DriverEarnings> {
  const empty: DriverEarnings = { fareTotal: 0, commission: 0, netEarned: 0, paidOut: 0, pending: 0, completedCount: 0, trips: [] };
  if (!supabase) return empty;

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return empty;

  const { data: trips } = await supabase
    .from('trips')
    .select('id, from_location, to_location')
    .eq('driver_id', userId);
  if (!trips?.length) return empty;

  const tripIds = trips.map((t) => t.id);
  const routeById = new Map(trips.map((t) => [t.id, `${t.from_location} → ${t.to_location}`]));

  const { data: bookings } = await supabase
    .from('passenger_bookings')
    .select('id, trip_id, total_amount, completed_at, updated_at')
    .eq('status', 'completed')
    .in('trip_id', tripIds);

  const { data: payouts } = await supabase
    .from('driver_payouts')
    .select('amount')
    .eq('driver_id', userId);

  const fareTotal = (bookings || []).reduce((s, b) => s + Number(b.total_amount || 0), 0);
  const netEarned = Math.round(fareTotal * (1 - COMMISSION_RATE));
  const commission = fareTotal - netEarned;
  const paidOut = (payouts || []).reduce((s, p) => s + Number(p.amount || 0), 0);

  return {
    fareTotal,
    commission,
    netEarned,
    paidOut,
    pending: Math.max(0, netEarned - paidOut),
    completedCount: bookings?.length || 0,
    trips: (bookings || []).map((b) => {
      const amount = Number(b.total_amount || 0);
      return {
        id: b.id as string,
        route: routeById.get(b.trip_id) || 'Аялал',
        amount,
        net: Math.round(amount * (1 - COMMISSION_RATE)),
        date: (b.completed_at as string) || (b.updated_at as string),
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
export interface AdminDriverPayout {
  driverId: string;
  driverName: string;
  phone?: string;
  netEarned: number;
  paidOut: number;
  pending: number;
}

export async function fetchAdminDriverPayouts(): Promise<AdminDriverPayout[]> {
  if (!supabase) return [];

  const { data: bookings } = await supabase
    .from('passenger_bookings')
    .select('trip_id, total_amount')
    .eq('status', 'completed');
  if (!bookings?.length) return [];

  const tripIds = Array.from(new Set(bookings.map((b) => b.trip_id)));
  const { data: trips } = await supabase.from('trips').select('id, driver_id').in('id', tripIds);
  const driverByTrip = new Map((trips || []).map((t) => [t.id, t.driver_id]));

  const earnedByDriver = new Map<string, number>();
  for (const b of bookings) {
    const driverId = driverByTrip.get(b.trip_id);
    if (!driverId) continue;
    earnedByDriver.set(driverId, (earnedByDriver.get(driverId) || 0) + Number(b.total_amount || 0));
  }

  const driverIds = Array.from(earnedByDriver.keys());
  if (!driverIds.length) return [];

  const [{ data: profiles }, { data: payouts }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, phone').in('id', driverIds),
    supabase.from('driver_payouts').select('driver_id, amount').in('driver_id', driverIds),
  ]);
  const names = new Map((profiles || []).map((p) => [p.id, p]));
  const paidByDriver = new Map<string, number>();
  for (const p of payouts || []) {
    paidByDriver.set(p.driver_id, (paidByDriver.get(p.driver_id) || 0) + Number(p.amount || 0));
  }

  return driverIds.map((driverId) => {
    const fare = earnedByDriver.get(driverId) || 0;
    const netEarned = Math.round(fare * (1 - COMMISSION_RATE));
    const paidOut = paidByDriver.get(driverId) || 0;
    const profile = names.get(driverId);
    return {
      driverId,
      driverName: profile?.full_name || 'Жолооч',
      phone: profile?.phone || undefined,
      netEarned,
      paidOut,
      pending: Math.max(0, netEarned - paidOut),
    };
  }).sort((a, b) => b.pending - a.pending);
}

export async function recordDriverPayout(driverId: string, amount: number, note?: string) {
  if (!supabase) throw new Error('Supabase тохиргоо дутуу байна.');
  const { error } = await supabase.rpc('record_driver_payout', {
    p_driver_id: driverId,
    p_amount: Math.round(amount),
    p_note: note?.trim() || null,
  });
  if (error) {
    if (error.message?.includes('admin_required')) throw new Error('Зөвхөн админ payout бүртгэнэ.');
    if (error.message?.includes('invalid_amount')) throw new Error('Дүн буруу байна.');
    throw error;
  }
}
