import { supabase } from '../lib/supabase';

function toError(error: unknown, fallback: string) {
  if (error instanceof Error) return error;
  if (error && typeof error === 'object') {
    const record = error as { message?: string; details?: string; hint?: string; code?: string };
    const parts = [record.message, record.details, record.hint, record.code ? `code: ${record.code}` : undefined].filter(Boolean);
    if (parts.length) return new Error(parts.join(' | '));
  }
  return new Error(fallback);
}

export interface TripDriverSummary {
  fullName: string;
  phone?: string;
  carModel?: string;
  rating: number;
  completedTrips: number;
  verificationStatus?: 'not_submitted' | 'pending' | 'approved' | 'rejected';
}

export interface MarketplaceTrip {
  id: string;
  driverId: string;
  fromLocation: string;
  toLocation: string;
  departureAt: string;
  seatsTotal: number;
  seatsAvailable: number;
  pricePerSeat: number;
  pickupNote?: string;
  dropoffNote?: string;
  allowsCargo: boolean;
  cargoCapacityKg?: number;
  allowedCargoTypes: string[];
  cargoPriceNote?: string;
  status: string;
  driver: TripDriverSummary;
}

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

interface TripRow {
  id: string;
  driver_id: string;
  from_location: string;
  to_location: string;
  departure_at: string;
  seats_total: number;
  seats_available: number;
  price_per_seat: number;
  pickup_note: string | null;
  dropoff_note: string | null;
  allows_cargo: boolean;
  cargo_capacity_kg: number | null;
  allowed_cargo_types: string[] | null;
  cargo_price_note: string | null;
  status: string;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  phone: string | null;
}

interface DriverProfileRow {
  user_id: string;
  verification_status: TripDriverSummary['verificationStatus'];
  car_model: string | null;
  rating: number | null;
  completed_trips: number | null;
}

function mapTripRows(
  tripRows: TripRow[],
  profileRows: ProfileRow[],
  driverRows: DriverProfileRow[],
): MarketplaceTrip[] {
  const profiles = new Map(profileRows.map((profile) => [profile.id, profile]));
  const driverProfiles = new Map(driverRows.map((driver) => [driver.user_id, driver]));

  return tripRows.map((trip) => {
    const profile = profiles.get(trip.driver_id);
    const driverProfile = driverProfiles.get(trip.driver_id);

    return {
      id: trip.id,
      driverId: trip.driver_id,
      fromLocation: trip.from_location,
      toLocation: trip.to_location,
      departureAt: trip.departure_at,
      seatsTotal: trip.seats_total,
      seatsAvailable: trip.seats_available,
      pricePerSeat: trip.price_per_seat,
      pickupNote: trip.pickup_note || undefined,
      dropoffNote: trip.dropoff_note || undefined,
      allowsCargo: trip.allows_cargo,
      cargoCapacityKg: trip.cargo_capacity_kg ?? undefined,
      allowedCargoTypes: trip.allowed_cargo_types || [],
      cargoPriceNote: trip.cargo_price_note || undefined,
      status: trip.status,
      driver: {
        fullName: profile?.full_name || 'Баталгаажсан жолооч',
        phone: profile?.phone || undefined,
        carModel: driverProfile?.car_model || undefined,
        rating: Number(driverProfile?.rating || 0),
        completedTrips: Number(driverProfile?.completed_trips || 0),
        verificationStatus: driverProfile?.verification_status,
      },
    };
  });
}

export async function canCurrentDriverCreateTrip() {
  if (!supabase) return false;

  const { data, error } = await supabase.rpc('can_create_trip');
  if (error) throw toError(error, 'Supabase request failed.');
  return Boolean(data);
}

export async function createDriverTrip(input: CreateDriverTripInput) {
  if (!supabase) throw new Error('Supabase env тохируулагдаагүй байна.');

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw toError(userError, 'User session check failed.');
  const userId = userData.user?.id;
  if (!userId) throw new Error('Нэвтэрсэн жолооч олдсонгүй. Дахин нэвтэрнэ үү.');

  const { data: canCreate, error: permissionError } = await supabase.rpc('can_create_trip');
  if (permissionError) throw toError(permissionError, 'Жолоочийн эрх шалгахад алдаа гарлаа.');
  if (!canCreate) {
    const [{ data: profile }, { data: driverProfile }] = await Promise.all([
      supabase
        .from('profiles')
        .select('email, role, phone_verified, onboarding_completed, is_suspended')
        .eq('id', userId)
        .maybeSingle(),
      supabase
        .from('driver_profiles')
        .select('verification_status')
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    throw new Error([
      'Supabase RLS: энэ account route үүсгэх эрхгүй байна.',
      `email=${profile?.email || userData.user.email || 'unknown'}`,
      `role=${profile?.role || 'missing'}`,
      `phone_verified=${Boolean(profile?.phone_verified)}`,
      `onboarding_completed=${Boolean(profile?.onboarding_completed)}`,
      `is_suspended=${Boolean(profile?.is_suspended)}`,
      `driver_verification=${driverProfile?.verification_status || 'missing'}`,
    ].join(' | '));
  }

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

  if (error) throw toError(error, 'Supabase request failed.');
  return data;
}

export async function fetchActiveTrips() {
  if (!supabase) return [];

  const { data: tripRows, error: tripError } = await supabase
    .from('trips')
    .select(`
      id,
      driver_id,
      from_location,
      to_location,
      departure_at,
      seats_total,
      seats_available,
      price_per_seat,
      pickup_note,
      dropoff_note,
      allows_cargo,
      cargo_capacity_kg,
      allowed_cargo_types,
      cargo_price_note,
      status
    `)
    .eq('status', 'active')
    .gt('seats_available', 0)
    .order('departure_at', { ascending: true });

  if (tripError) throw toError(tripError, 'Trip request failed.');
  if (!tripRows?.length) return [];

  const driverIds = Array.from(new Set(tripRows.map((trip) => trip.driver_id)));

  const [{ data: profileRows, error: profileError }, { data: driverRows, error: driverError }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, phone')
      .in('id', driverIds),
    supabase
      .from('driver_profiles')
      .select('user_id, verification_status, car_model, rating, completed_trips')
      .in('user_id', driverIds),
  ]);

  if (profileError) throw toError(profileError, 'Profile request failed.');
  if (driverError) throw toError(driverError, 'Driver profile request failed.');

  return mapTripRows(
    tripRows as TripRow[],
    (profileRows || []) as ProfileRow[],
    (driverRows || []) as DriverProfileRow[],
  );
}

export async function fetchTripById(tripId: string) {
  if (!supabase) return null;

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select(`
      id,
      driver_id,
      from_location,
      to_location,
      departure_at,
      seats_total,
      seats_available,
      price_per_seat,
      pickup_note,
      dropoff_note,
      allows_cargo,
      cargo_capacity_kg,
      allowed_cargo_types,
      cargo_price_note,
      status
    `)
    .eq('id', tripId)
    .maybeSingle();

  if (tripError) throw toError(tripError, 'Trip request failed.');
  if (!trip) return null;

  const [{ data: profile }, { data: driverProfile }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, phone')
      .eq('id', trip.driver_id)
      .maybeSingle(),
    supabase
      .from('driver_profiles')
      .select('user_id, verification_status, car_model, rating, completed_trips')
      .eq('user_id', trip.driver_id)
      .maybeSingle(),
  ]);

  return mapTripRows(
    [trip as TripRow],
    profile ? [profile as ProfileRow] : [],
    driverProfile ? [driverProfile as DriverProfileRow] : [],
  )[0];
}

export async function createPassengerBooking(input: {
  tripId: string;
  seatsRequested: number;
  note?: string;
}) {
  if (!supabase) throw new Error('Supabase env тохируулагдаагүй байна.');

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw toError(userError, 'User session check failed.');
  const userId = userData.user?.id;
  if (!userId) throw new Error('Booking request илгээхийн тулд дахин нэвтэрнэ үү.');

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, price_per_seat, seats_available')
    .eq('id', input.tripId)
    .single();

  if (tripError) throw toError(tripError, 'Trip request failed.');
  if (trip.seats_available < input.seatsRequested) {
    throw new Error('Сул суудлын тоо хүрэлцэхгүй байна.');
  }

  const { data, error } = await supabase
    .from('passenger_bookings')
    .insert({
      trip_id: input.tripId,
      traveler_id: userId,
      seats_requested: input.seatsRequested,
      total_amount: trip.price_per_seat * input.seatsRequested,
      note: input.note || null,
      status: 'pending_request',
    })
    .select('id, status')
    .single();

  if (error) throw toError(error, 'Supabase request failed.');
  return data;
}
