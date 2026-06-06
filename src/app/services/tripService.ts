import { supabase } from '../lib/supabase';
import { getDefaultSeatIds, normalizeSeatIds } from '../data/seats';

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
  availableSeatLabels: string[];
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
  availableSeatLabels?: string[];
  pricePerSeat: number;
  pickupNote?: string;
  dropoffNote?: string;
  allowsCargo: boolean;
  cargoCapacityKg?: number;
  allowedCargoTypes?: string[];
  cargoPriceNote?: string;
}

export interface DriverPassengerRequest {
  id: string;
  tripId: string;
  travelerId: string;
  travelerName: string;
  travelerPhone?: string;
  route: string;
  departureAt: string;
  seatsRequested: number;
  totalAmount: number;
  note?: string;
  status: string;
  createdAt: string;
}

export interface TravelerBookingSummary {
  id: string;
  tripId: string;
  route: string;
  departureAt: string;
  driverName: string;
  carModel?: string;
  seatsRequested: number;
  selectedSeats: string[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface DriverCargoRequest {
  id: string;
  tripId: string;
  senderId: string;
  senderName: string;
  senderPhone?: string;
  route: string;
  cargoName: string;
  cargoType?: string;
  sizeNote?: string;
  weightKg?: number;
  receiverName: string;
  receiverPhone: string;
  pickupNote?: string;
  status: string;
  deliveryCode: string;
  createdAt: string;
}

export interface CreateCargoRequestInput {
  tripId: string;
  cargoName: string;
  cargoType?: string;
  sizeNote?: string;
  weightKg?: number;
  receiverName: string;
  receiverPhone: string;
  pickupNote?: string;
}

export interface PassengerBookingDetail {
  id: string;
  tripId: string;
  travelerId: string;
  status: string;
  seatsRequested: number;
  selectedSeats: string[];
  totalAmount: number;
  note?: string;
  createdAt: string;
  trip: {
    driverId: string;
    fromLocation: string;
    toLocation: string;
    departureAt: string;
    pickupNote?: string;
    dropoffNote?: string;
    pricePerSeat: number;
    allowsCargo: boolean;
  };
  traveler: {
    fullName: string;
    phone?: string;
    email?: string;
    phoneVerified: boolean;
  };
  driver: {
    fullName: string;
    phone?: string;
    email?: string;
    carModel?: string;
    rating: number;
    completedTrips: number;
    verificationStatus?: TripDriverSummary['verificationStatus'];
  };
}

interface TripRow {
  id: string;
  driver_id: string;
  from_location: string;
  to_location: string;
  departure_at: string;
  seats_total: number;
  seats_available: number;
  available_seat_labels?: string[] | null;
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

interface BookingRow {
  id: string;
  trip_id: string;
  traveler_id: string;
  seats_requested: number;
  selected_seats?: string[] | null;
  status: string;
  total_amount: number | null;
  note: string | null;
  created_at: string;
}

interface BookingDetailRow extends BookingRow {
  trip_id: string;
}

interface CargoRequestRow {
  id: string;
  trip_id: string;
  sender_id: string;
  cargo_name: string;
  cargo_type: string | null;
  size_note: string | null;
  weight_kg: number | null;
  receiver_name: string;
  receiver_phone: string;
  pickup_note: string | null;
  status: string;
  delivery_code: string;
  created_at: string;
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
      availableSeatLabels: normalizeSeatIds(trip.available_seat_labels, trip.seats_available),
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

  const tripPayload = {
      driver_id: userId,
      from_location: input.fromLocation,
      to_location: input.toLocation,
      departure_at: input.departureAt,
      seats_total: input.seatsTotal,
      seats_available: input.seatsTotal,
      available_seat_labels: normalizeSeatIds(input.availableSeatLabels, input.seatsTotal),
      price_per_seat: input.pricePerSeat,
      pickup_note: input.pickupNote || null,
      dropoff_note: input.dropoffNote || null,
      allows_cargo: input.allowsCargo,
      cargo_capacity_kg: input.allowsCargo ? input.cargoCapacityKg ?? null : null,
      allowed_cargo_types: input.allowsCargo ? input.allowedCargoTypes ?? [] : null,
      cargo_price_note: input.allowsCargo ? input.cargoPriceNote || null : null,
      status: 'active',
  };

  let { data, error } = await supabase
    .from('trips')
    .insert(tripPayload)
    .select('id')
    .single();

  if (error && toError(error, '').message.includes('available_seat_labels')) {
    const { available_seat_labels: _seatLabels, ...legacyTripPayload } = tripPayload;
    const retry = await supabase
      .from('trips')
      .insert(legacyTripPayload)
      .select('id')
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
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
      toError(error, 'Supabase request failed.').message,
      `email=${profile?.email || userData.user.email || 'unknown'}`,
      `auth_user_id=${userId}`,
      `role=${profile?.role || 'missing'}`,
      `phone_verified=${Boolean(profile?.phone_verified)}`,
      `onboarding_completed=${Boolean(profile?.onboarding_completed)}`,
      `is_suspended=${Boolean(profile?.is_suspended)}`,
      `driver_verification=${driverProfile?.verification_status || 'missing'}`,
    ].join(' | '));
  }
  return data;
}

export async function fetchCurrentDriverTrips() {
  if (!supabase) return [];

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw toError(userError, 'User session check failed.');
  const userId = userData.user?.id;
  if (!userId) throw new Error('Жолоочийн route харахын тулд дахин нэвтэрнэ үү.');

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
    .eq('driver_id', userId)
    .order('departure_at', { ascending: false });

  if (tripError) throw toError(tripError, 'Driver trips request failed.');
  if (!tripRows?.length) return [];

  const [{ data: profileRows }, { data: driverRows }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, phone').eq('id', userId),
    supabase.from('driver_profiles').select('user_id, verification_status, car_model, rating, completed_trips').eq('user_id', userId),
  ]);

  return mapTripRows(
    tripRows as TripRow[],
    (profileRows || []) as ProfileRow[],
    (driverRows || []) as DriverProfileRow[],
  );
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

export async function fetchCargoEnabledTrips() {
  const trips = await fetchActiveTrips();
  return trips.filter((trip) => trip.allowsCargo);
}

export async function fetchTripById(tripId: string) {
  if (!supabase) return null;

  const tripColumns = `
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
    `;

  let { data: trip, error: tripError } = await supabase
    .from('trips')
    .select(`
      ${tripColumns},
      available_seat_labels
    `)
    .eq('id', tripId)
    .maybeSingle();

  if (tripError && toError(tripError, '').message.includes('available_seat_labels')) {
    const retry = await supabase
      .from('trips')
      .select(tripColumns)
      .eq('id', tripId)
      .maybeSingle();
    trip = retry.data;
    tripError = retry.error;
  }

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
  selectedSeats?: string[];
  note?: string;
}) {
  if (!supabase) throw new Error('Supabase env тохируулагдаагүй байна.');

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw toError(userError, 'User session check failed.');
  const userId = userData.user?.id;
  if (!userId) throw new Error('Booking request илгээхийн тулд дахин нэвтэрнэ үү.');

  const selectedSeats = normalizeSeatIds(input.selectedSeats, input.seatsRequested);

  const rpcResult = await supabase.rpc('create_passenger_booking_with_seats', {
    p_trip_id: input.tripId,
    p_selected_seats: selectedSeats,
    p_note: input.note || null,
  });

  if (!rpcResult.error && rpcResult.data?.[0]) {
    return rpcResult.data[0] as { id: string; status: string };
  }

  const rpcMessage = rpcResult.error ? toError(rpcResult.error, '').message : '';
  if (rpcResult.error && !rpcMessage.includes('create_passenger_booking_with_seats')) {
    throw toError(rpcResult.error, 'Seat booking request failed.');
  }

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, price_per_seat, seats_available')
    .eq('id', input.tripId)
    .single();

  if (tripError) throw toError(tripError, 'Trip request failed.');
  if (trip.seats_available < input.seatsRequested) {
    throw new Error('Сул суудлын тоо хүрэлцэхгүй байна.');
  }

  const bookingPayload = {
    trip_id: input.tripId,
    traveler_id: userId,
    seats_requested: selectedSeats.length,
    selected_seats: selectedSeats,
    total_amount: trip.price_per_seat * selectedSeats.length,
    note: input.note || null,
    status: 'pending_request',
  };

  let { data, error } = await supabase
    .from('passenger_bookings')
    .insert(bookingPayload)
    .select('id, status')
    .single();

  if (error && toError(error, '').message.includes('selected_seats')) {
    const { selected_seats: _selectedSeats, ...legacyBookingPayload } = bookingPayload;
    const retry = await supabase
      .from('passenger_bookings')
      .insert(legacyBookingPayload)
      .select('id, status')
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) throw toError(error, 'Supabase request failed.');
  return data;
}

export async function fetchCurrentDriverPassengerRequests() {
  if (!supabase) return [];

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw toError(userError, 'User session check failed.');
  const userId = userData.user?.id;
  if (!userId) throw new Error('Ирсэн хүсэлт харахын тулд дахин нэвтэрнэ үү.');

  const { data: driverTrips, error: tripsError } = await supabase
    .from('trips')
    .select('id, from_location, to_location, departure_at, driver_id')
    .eq('driver_id', userId);

  if (tripsError) throw toError(tripsError, 'Driver trips request failed.');
  if (!driverTrips?.length) return [];

  const tripIds = driverTrips.map((trip) => trip.id);
  let { data: bookingRows, error: bookingError } = await supabase
    .from('passenger_bookings')
    .select('id, trip_id, traveler_id, seats_requested, selected_seats, status, total_amount, note, created_at')
    .in('trip_id', tripIds)
    .order('created_at', { ascending: false });

  if (bookingError && toError(bookingError, '').message.includes('selected_seats')) {
    const retry = await supabase
      .from('passenger_bookings')
      .select('id, trip_id, traveler_id, seats_requested, status, total_amount, note, created_at')
      .in('trip_id', tripIds)
      .order('created_at', { ascending: false });
    bookingRows = retry.data;
    bookingError = retry.error;
  }

  if (bookingError) throw toError(bookingError, 'Passenger request уншихад алдаа гарлаа.');
  if (!bookingRows?.length) return [];

  const travelerIds = Array.from(new Set(bookingRows.map((booking) => booking.traveler_id)));
  const { data: travelers, error: travelerError } = await supabase
    .from('profiles')
    .select('id, full_name, phone')
    .in('id', travelerIds);

  if (travelerError) throw toError(travelerError, 'Traveler profile уншихад алдаа гарлаа.');

  const tripsById = new Map(driverTrips.map((trip) => [trip.id, trip]));
  const travelersById = new Map((travelers || []).map((profile) => [profile.id, profile]));

  return (bookingRows as BookingRow[]).map((booking) => {
    const trip = tripsById.get(booking.trip_id);
    const traveler = travelersById.get(booking.traveler_id);

    return {
      id: booking.id,
      tripId: booking.trip_id,
      travelerId: booking.traveler_id,
      travelerName: traveler?.full_name || 'Аялагч',
      travelerPhone: traveler?.phone || undefined,
      route: trip ? `${trip.from_location} → ${trip.to_location}` : 'Route',
      departureAt: trip?.departure_at || booking.created_at,
      seatsRequested: booking.seats_requested,
      totalAmount: Number(booking.total_amount || 0),
      note: booking.note || undefined,
      status: booking.status,
      createdAt: booking.created_at,
    } satisfies DriverPassengerRequest;
  });
}

export async function fetchCurrentTravelerBookings(): Promise<TravelerBookingSummary[]> {
  if (!supabase) return [];

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw toError(userError, 'Нэвтрэлтийн мэдээллийг шалгахад алдаа гарлаа.');
  const userId = userData.user?.id;
  if (!userId) throw new Error('Аяллын жагсаалтаа харахын тулд дахин нэвтэрнэ үү.');

  let { data: bookingRows, error: bookingError } = await supabase
    .from('passenger_bookings')
    .select('id, trip_id, traveler_id, seats_requested, selected_seats, status, total_amount, note, created_at')
    .eq('traveler_id', userId)
    .order('created_at', { ascending: false });

  if (bookingError && toError(bookingError, '').message.includes('selected_seats')) {
    const retry = await supabase
      .from('passenger_bookings')
      .select('id, trip_id, traveler_id, seats_requested, status, total_amount, note, created_at')
      .eq('traveler_id', userId)
      .order('created_at', { ascending: false });
    bookingRows = retry.data;
    bookingError = retry.error;
  }

  if (bookingError) throw toError(bookingError, 'Аяллын захиалгуудыг уншихад алдаа гарлаа.');
  if (!bookingRows?.length) return [];

  const tripIds = Array.from(new Set(bookingRows.map((booking) => booking.trip_id)));
  const { data: tripRows, error: tripError } = await supabase
    .from('trips')
    .select('id, driver_id, from_location, to_location, departure_at')
    .in('id', tripIds);

  if (tripError) throw toError(tripError, 'Захиалгын чиглэлүүдийг уншихад алдаа гарлаа.');

  const driverIds = Array.from(new Set((tripRows || []).map((trip) => trip.driver_id)));
  const [{ data: driverRows, error: driverError }, { data: driverProfileRows, error: driverProfileError }] = await Promise.all([
    driverIds.length
      ? supabase.from('profiles').select('id, full_name').in('id', driverIds)
      : Promise.resolve({ data: [], error: null }),
    driverIds.length
      ? supabase.from('driver_profiles').select('user_id, car_model').in('user_id', driverIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (driverError) throw toError(driverError, 'Жолоочийн мэдээллийг уншихад алдаа гарлаа.');
  if (driverProfileError) throw toError(driverProfileError, 'Машины мэдээллийг уншихад алдаа гарлаа.');

  const tripsById = new Map((tripRows || []).map((trip) => [trip.id, trip]));
  const driversById = new Map((driverRows || []).map((driver) => [driver.id, driver]));
  const driverProfilesById = new Map((driverProfileRows || []).map((driver) => [driver.user_id, driver]));

  return (bookingRows as BookingRow[]).map((booking) => {
    const trip = tripsById.get(booking.trip_id);
    const driver = trip ? driversById.get(trip.driver_id) : undefined;
    const driverProfile = trip ? driverProfilesById.get(trip.driver_id) : undefined;

    return {
      id: booking.id,
      tripId: booking.trip_id,
      route: trip ? `${trip.from_location} → ${trip.to_location}` : 'Чиглэлийн мэдээлэл олдсонгүй',
      departureAt: trip?.departure_at || booking.created_at,
      driverName: driver?.full_name || 'Жолооч',
      carModel: driverProfile?.car_model || undefined,
      seatsRequested: booking.seats_requested,
      selectedSeats: normalizeSeatIds(booking.selected_seats, booking.seats_requested),
      totalAmount: Number(booking.total_amount || 0),
      status: booking.status,
      createdAt: booking.created_at,
    };
  });
}

export async function updatePassengerBookingStatus(
  bookingId: string,
  status: 'accepted' | 'rejected' | 'waiting_payment' | 'confirmed' | 'cancelled',
) {
  if (!supabase) throw new Error('Supabase env тохируулагдаагүй байна.');

  const { data, error } = await supabase
    .from('passenger_bookings')
    .update({ status })
    .eq('id', bookingId)
    .select('id, status')
    .single();

  if (error) throw toError(error, 'Booking status шинэчлэхэд алдаа гарлаа.');
  return data;
}

export async function fetchPassengerBookingById(bookingId: string): Promise<PassengerBookingDetail | null> {
  if (!supabase) return null;

  let { data: booking, error: bookingError } = await supabase
    .from('passenger_bookings')
    .select('id, trip_id, traveler_id, seats_requested, selected_seats, status, total_amount, note, created_at')
    .eq('id', bookingId)
    .maybeSingle();

  if (bookingError && toError(bookingError, '').message.includes('selected_seats')) {
    const retry = await supabase
      .from('passenger_bookings')
      .select('id, trip_id, traveler_id, seats_requested, status, total_amount, note, created_at')
      .eq('id', bookingId)
      .maybeSingle();
    booking = retry.data;
    bookingError = retry.error;
  }

  if (bookingError) throw toError(bookingError, 'Booking detail уншихад алдаа гарлаа.');
  if (!booking) return null;

  const bookingRow = booking as BookingDetailRow;
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, driver_id, from_location, to_location, departure_at, pickup_note, dropoff_note, price_per_seat, allows_cargo')
    .eq('id', bookingRow.trip_id)
    .single();

  if (tripError) throw toError(tripError, 'Booking trip уншихад алдаа гарлаа.');

  const [{ data: traveler, error: travelerError }, { data: driver, error: driverError }, { data: driverProfile, error: driverProfileError }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, phone, email, phone_verified')
      .eq('id', bookingRow.traveler_id)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('id, full_name, phone, email, phone_verified')
      .eq('id', trip.driver_id)
      .maybeSingle(),
    supabase
      .from('driver_profiles')
      .select('user_id, verification_status, car_model, rating, completed_trips')
      .eq('user_id', trip.driver_id)
      .maybeSingle(),
  ]);

  if (travelerError) throw toError(travelerError, 'Traveler profile уншихад алдаа гарлаа.');
  if (driverError) throw toError(driverError, 'Driver profile уншихад алдаа гарлаа.');
  if (driverProfileError) throw toError(driverProfileError, 'Driver verification уншихад алдаа гарлаа.');

  return {
    id: bookingRow.id,
    tripId: bookingRow.trip_id,
    travelerId: bookingRow.traveler_id,
    status: bookingRow.status,
    seatsRequested: bookingRow.seats_requested,
    selectedSeats: normalizeSeatIds(bookingRow.selected_seats, bookingRow.seats_requested),
    totalAmount: Number(bookingRow.total_amount || 0),
    note: bookingRow.note || undefined,
    createdAt: bookingRow.created_at,
    trip: {
      driverId: trip.driver_id,
      fromLocation: trip.from_location,
      toLocation: trip.to_location,
      departureAt: trip.departure_at,
      pickupNote: trip.pickup_note || undefined,
      dropoffNote: trip.dropoff_note || undefined,
      pricePerSeat: Number(trip.price_per_seat || 0),
      allowsCargo: Boolean(trip.allows_cargo),
    },
    traveler: {
      fullName: traveler?.full_name || 'Аялагч',
      phone: traveler?.phone || undefined,
      email: traveler?.email || undefined,
      phoneVerified: Boolean(traveler?.phone_verified),
    },
    driver: {
      fullName: driver?.full_name || 'Жолооч',
      phone: driver?.phone || undefined,
      email: driver?.email || undefined,
      carModel: driverProfile?.car_model || undefined,
      rating: Number(driverProfile?.rating || 0),
      completedTrips: Number(driverProfile?.completed_trips || 0),
      verificationStatus: driverProfile?.verification_status,
    },
  };
}

export async function createCargoRequest(input: CreateCargoRequestInput) {
  if (!supabase) throw new Error('Supabase env тохируулагдаагүй байна.');

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw toError(userError, 'User session check failed.');
  const userId = userData.user?.id;
  if (!userId) throw new Error('Cargo request илгээхийн тулд дахин нэвтэрнэ үү.');

  const { data, error } = await supabase
    .from('cargo_requests')
    .insert({
      trip_id: input.tripId,
      sender_id: userId,
      cargo_name: input.cargoName,
      cargo_type: input.cargoType || null,
      size_note: input.sizeNote || null,
      weight_kg: input.weightKg ?? null,
      receiver_name: input.receiverName,
      receiver_phone: input.receiverPhone,
      pickup_note: input.pickupNote || null,
      status: 'cargo_requested',
    })
    .select('id, status, delivery_code')
    .single();

  if (error) throw toError(error, 'Cargo request хадгалахад алдаа гарлаа.');
  return data;
}

export async function fetchCurrentDriverCargoRequests() {
  if (!supabase) return [];

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw toError(userError, 'User session check failed.');
  const userId = userData.user?.id;
  if (!userId) throw new Error('Дайвар ачааны хүсэлт харахын тулд дахин нэвтэрнэ үү.');

  const { data: driverTrips, error: tripsError } = await supabase
    .from('trips')
    .select('id, from_location, to_location, departure_at, driver_id')
    .eq('driver_id', userId);

  if (tripsError) throw toError(tripsError, 'Driver trips request failed.');
  if (!driverTrips?.length) return [];

  const tripIds = driverTrips.map((trip) => trip.id);
  const { data: cargoRows, error: cargoError } = await supabase
    .from('cargo_requests')
    .select('id, trip_id, sender_id, cargo_name, cargo_type, size_note, weight_kg, receiver_name, receiver_phone, pickup_note, status, delivery_code, created_at')
    .in('trip_id', tripIds)
    .order('created_at', { ascending: false });

  if (cargoError) throw toError(cargoError, 'Cargo requests уншихад алдаа гарлаа.');
  if (!cargoRows?.length) return [];

  const senderIds = Array.from(new Set(cargoRows.map((request) => request.sender_id)));
  const { data: senders, error: senderError } = await supabase
    .from('profiles')
    .select('id, full_name, phone')
    .in('id', senderIds);

  if (senderError) throw toError(senderError, 'Sender profile уншихад алдаа гарлаа.');

  const tripsById = new Map(driverTrips.map((trip) => [trip.id, trip]));
  const sendersById = new Map((senders || []).map((profile) => [profile.id, profile]));

  return (cargoRows as CargoRequestRow[]).map((request) => {
    const trip = tripsById.get(request.trip_id);
    const sender = sendersById.get(request.sender_id);

    return {
      id: request.id,
      tripId: request.trip_id,
      senderId: request.sender_id,
      senderName: sender?.full_name || 'Илгээгч',
      senderPhone: sender?.phone || undefined,
      route: trip ? `${trip.from_location} → ${trip.to_location}` : 'Route',
      cargoName: request.cargo_name,
      cargoType: request.cargo_type || undefined,
      sizeNote: request.size_note || undefined,
      weightKg: request.weight_kg ?? undefined,
      receiverName: request.receiver_name,
      receiverPhone: request.receiver_phone,
      pickupNote: request.pickup_note || undefined,
      status: request.status,
      deliveryCode: request.delivery_code,
      createdAt: request.created_at,
    } satisfies DriverCargoRequest;
  });
}

export async function updateCargoRequestStatus(
  cargoRequestId: string,
  status: 'cargo_accepted' | 'rejected' | 'waiting_payment' | 'picked_up' | 'in_transit' | 'delivered' | 'completed',
) {
  if (!supabase) throw new Error('Supabase env тохируулагдаагүй байна.');

  const { data, error } = await supabase
    .from('cargo_requests')
    .update({ status })
    .eq('id', cargoRequestId)
    .select('id, status')
    .single();

  if (error) throw toError(error, 'Cargo status шинэчлэхэд алдаа гарлаа.');
  return data;
}
