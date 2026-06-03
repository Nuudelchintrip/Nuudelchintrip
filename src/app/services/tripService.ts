import { supabase } from '../lib/supabase';

export interface CreateDriverTripInput {
  fromLocation: string;
  toLocation: string;
  departureAt: string;
  seatsTotal: number;
  pricePerSeat: number;
  pickupNote?: string;
  dropoffNote?: string;
  allowsCargo: boolean;
  cargoCapacityKg?: number;
  allowedCargoTypes?: string[];
  cargoPriceNote?: string;
}

export async function canCurrentDriverCreateTrip() {
  if (!supabase) return false;

  const { data, error } = await supabase.rpc('can_create_trip');
  if (error) throw error;
  return Boolean(data);
}

export async function createDriverTrip(input: CreateDriverTripInput) {
  if (!supabase) throw new Error('Supabase env тохируулагдаагүй байна.');

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const userId = userData.user?.id;
  if (!userId) throw new Error('Нэвтэрсэн жолооч олдсонгүй. Дахин нэвтэрнэ үү.');

  const { data, error } = await supabase
    .from('trips')
    .insert({
      driver_id: userId,
      from_location: input.fromLocation,
      to_location: input.toLocation,
      departure_at: input.departureAt,
      seats_total: input.seatsTotal,
      seats_available: input.seatsTotal,
      price_per_seat: input.pricePerSeat,
      pickup_note: input.pickupNote || null,
      dropoff_note: input.dropoffNote || null,
      allows_cargo: input.allowsCargo,
      cargo_capacity_kg: input.allowsCargo ? input.cargoCapacityKg ?? null : null,
      allowed_cargo_types: input.allowsCargo ? input.allowedCargoTypes ?? [] : null,
      cargo_price_note: input.allowsCargo ? input.cargoPriceNote || null : null,
      status: 'active',
    })
    .select('id')
    .single();

  if (error) throw error;
  return data;
}
