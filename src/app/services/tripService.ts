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
  tripCode?: string;
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

export interface ParticipantPublicProfile {
  id: string;
  role: 'traveler' | 'driver' | 'cargo_sender' | 'admin';
  fullName: string;
  phone?: string;
  email?: string;
  phoneVerified: boolean;
  avatarUrl?: string;
  driverVerificationStatus?: TripDriverSummary['verificationStatus'];
  carModel?: string;
  plateNumber?: string;
  seats?: number;
  rating: number;
  completedTrips: number;
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

interface ActiveTripRpcRow extends TripRow {
  driver_full_name: string | null;
  driver_car_model: string | null;
  driver_rating: number | null;
  driver_completed_trips: number | null;
  driver_verification_status: TripDriverSummary['verificationStatus'];
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

interface BookingDetailRpcRow extends BookingRow {
  trip_code?: string | null;
  trip_driver_id: string;
  trip_from_location: string;
  trip_to_location: string;
  trip_departure_at: string;
  trip_pickup_note: string | null;
  trip_dropoff_note: string | null;
  trip_price_per_seat: number | null;
  trip_allows_cargo: boolean | null;
  traveler_full_name: string | null;
  traveler_phone: string | null;
  traveler_email: string | null;
  traveler_phone_verified: boolean | null;
  driver_full_name: string | null;
  driver_phone: string | null;
  driver_email: string | null;
  driver_car_model: string | null;
  driver_rating: number | null;
  driver_completed_trips: number | null;
  driver_verification_status: TripDriverSummary['verificationStatus'] | null;
}

interface ParticipantPublicProfileRow {
  id: string;
  role: ParticipantPublicProfile['role'];
  full_name: string | null;
  phone: string | null;
  email: string | null;
  phone_verified: boolean | null;
  avatar_url: string | null;
  driver_verification_status: TripDriverSummary['verificationStatus'] | null;
  car_model: string | null;
  plate_number: string | null;
  seats: number | null;
  rating: number | null;
  completed_trips: number | null;
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

function mapBookingDetailRpcRow(row: BookingDetailRpcRow): PassengerBookingDetail {
  return {
    id: row.id,
    tripId: row.trip_id,
    travelerId: row.traveler_id,
    status: row.status,
    seatsRequested: row.seats_requested,
    selectedSeats: normalizeSeatIds(row.selected_seats, row.seats_requested),
    totalAmount: Number(row.total_amount || 0),
    note: row.note || undefined,
    createdAt: row.created_at,
    tripCode: row.trip_code || undefined,
    trip: {
      driverId: row.trip_driver_id,
      fromLocation: row.trip_from_location,
      toLocation: row.trip_to_location,
      departureAt: row.trip_departure_at,
      pickupNote: row.trip_pickup_note || undefined,
      dropoffNote: row.trip_dropoff_note || undefined,
      pricePerSeat: Number(row.trip_price_per_seat || 0),
      allowsCargo: Boolean(row.trip_allows_cargo),
    },
    traveler: {
      fullName: row.traveler_full_name || 'Аялагч',
      phone: row.traveler_phone || undefined,
      email: row.traveler_email || undefined,
      phoneVerified: Boolean(row.traveler_phone_verified),
    },
    driver: {
      fullName: row.driver_full_name || 'Жолооч',
      phone: row.driver_phone || undefined,
      email: row.driver_email || undefined,
      carModel: row.driver_car_model || undefined,
      rating: Number(row.driver_rating || 0),
      completedTrips: Number(row.driver_completed_trips || 0),
      verificationStatus: row.driver_verification_status || undefined,
    },
  };
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

  const { data: tripId, error } = await supabase.rpc('create_driver_trip', {
    p_from_location: input.fromLocation,
    p_to_location: input.toLocation,
    p_departure_at: input.departureAt,
    p_seats_total: input.seatsTotal,
    p_available_seat_labels: normalizeSeatIds(input.availableSeatLabels, input.seatsTotal),
    p_price_per_seat: input.pricePerSeat,
    p_pickup_note: input.pickupNote || null,
    p_dropoff_note: input.dropoffNote || null,
    p_allows_cargo: input.allowsCargo,
    p_cargo_capacity_kg: input.allowsCargo ? input.cargoCapacityKg ?? null : null,
    p_allowed_cargo_types: input.allowsCargo ? input.allowedCargoTypes ?? [] : null,
    p_cargo_price_note: input.allowsCargo ? input.cargoPriceNote || null : null,
  });

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
  return { id: tripId };
}

export async function updateDriverTrip(tripId: string, input: CreateDriverTripInput) {
  if (!supabase) throw new Error('Supabase env тохируулагдаагүй байна.');

  const { data, error } = await supabase.rpc('update_driver_trip', {
    p_trip_id: tripId,
    p_from_location: input.fromLocation,
    p_to_location: input.toLocation,
    p_departure_at: input.departureAt,
    p_seats_total: input.seatsTotal,
    p_available_seat_labels: normalizeSeatIds(input.availableSeatLabels, input.seatsTotal),
    p_price_per_seat: input.pricePerSeat,
    p_pickup_note: input.pickupNote || null,
    p_dropoff_note: input.dropoffNote || null,
    p_allows_cargo: input.allowsCargo,
    p_cargo_capacity_kg: input.allowsCargo ? input.cargoCapacityKg ?? null : null,
    p_allowed_cargo_types: input.allowsCargo ? input.allowedCargoTypes ?? [] : null,
    p_cargo_price_note: input.allowsCargo ? input.cargoPriceNote || null : null,
  });

  if (error) throw toError(error, 'Чиглэл засахад алдаа гарлаа.');
  return { id: (data as string) || tripId };
}

export async function cancelDriverTrip(tripId: string) {
  if (!supabase) throw new Error('Supabase env тохируулагдаагүй байна.');

  const { data, error } = await supabase.rpc('cancel_driver_trip', { p_trip_id: tripId });
  if (error) throw toError(error, 'Чиглэл цуцлахад алдаа гарлаа.');
  return { action: (data as string) || 'cancelled' };
}

export async function fetchCurrentDriverTrips() {
  if (!supabase) return [];

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw toError(userError, 'User session check failed.');
  const userId = userData.user?.id;
  if (!userId) throw new Error('Жолоочийн route харахын тулд дахин нэвтэрнэ үү.');

  const { data: tripRows, error: tripError } = await supabase.rpc('list_my_driver_trips');

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

  const { data: tripRows, error: tripError } = await supabase.rpc('list_active_marketplace_trips');

  if (tripError) throw toError(tripError, 'Trip request failed.');
  if (!tripRows?.length) return [];

  const rows = tripRows as ActiveTripRpcRow[];
  const profileRows: ProfileRow[] = rows.map((trip) => ({
    id: trip.driver_id,
    full_name: trip.driver_full_name,
    phone: null,
  }));
  const driverRows: DriverProfileRow[] = rows.map((trip) => ({
    user_id: trip.driver_id,
    verification_status: trip.driver_verification_status,
    car_model: trip.driver_car_model,
    rating: trip.driver_rating,
    completed_trips: trip.driver_completed_trips,
  }));

  return mapTripRows(
    rows,
    profileRows,
    driverRows,
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
    if (rpcMessage.includes('request_rate_limited')) {
      throw new Error('Хэт олон захиалгын хүсэлт илгээлээ. Түр хүлээгээд дахин оролдоно уу.');
    }
    throw toError(rpcResult.error, 'Seat booking request failed.');
  }

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, price_per_seat, seats_available')
    .eq('id', input.tripId)
    .maybeSingle();

  if (tripError) throw toError(tripError, 'Trip request failed.');
  if (!trip) throw new Error('Идэвхтэй чиглэл олдсонгүй. Хуудсаа шинэчлээд дахин оролдоно уу.');
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
    .maybeSingle();

  if (error && toError(error, '').message.includes('selected_seats')) {
    const { selected_seats: _selectedSeats, ...legacyBookingPayload } = bookingPayload;
    const retry = await supabase
      .from('passenger_bookings')
      .insert(legacyBookingPayload)
      .select('id, status')
      .maybeSingle();
    data = retry.data;
    error = retry.error;
  }

  if (error) throw toError(error, 'Supabase request failed.');
  if (!data) throw new Error('Захиалгын хүсэлтийг баталгаажуулж чадсангүй. Хуудсаа шинэчлээд дахин шалгана уу.');
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

  // Role-validated transition that also releases held seats on reject/cancel.
  const { data, error } = await supabase
    .rpc('set_passenger_booking_status', { p_booking_id: bookingId, p_status: status })
    .maybeSingle();

  if (error) {
    const messageByCode: Record<string, string> = {
      not_authenticated: 'Нэвтрэлтийн хугацаа дууссан байна. Дахин нэвтэрнэ үү.',
      booking_not_found: 'Захиалга олдсонгүй.',
      driver_or_admin_required: 'Зөвхөн чиглэлийн жолооч энэ үйлдлийг хийнэ.',
      not_authorized: 'Энэ үйлдлийг хийх эрхгүй байна.',
      unsupported_status: 'Буруу төлөв.',
    };
    const known = Object.entries(messageByCode).find(([code]) => toError(error, '').message.includes(code))?.[1];
    throw known ? new Error(known) : toError(error, 'Booking status шинэчлэхэд алдаа гарлаа.');
  }
  return (data || { id: bookingId, status }) as { id: string; status: string };
}

export async function startPassengerTrip(bookingId: string) {
  if (!supabase) throw new Error('Supabase env тохируулагдаагүй байна.');
  const { error } = await supabase.rpc('start_passenger_trip', { p_booking_id: bookingId }).maybeSingle();
  if (error) {
    const messageByCode: Record<string, string> = {
      driver_or_admin_required: 'Зөвхөн чиглэлийн жолооч аялал эхлүүлнэ.',
      booking_not_confirmed: 'Зөвхөн баталгаажсан захиалгын аяллыг эхлүүлнэ.',
      booking_not_found: 'Захиалга олдсонгүй.',
    };
    const known = Object.entries(messageByCode).find(([code]) => toError(error, '').message.includes(code))?.[1];
    throw known ? new Error(known) : toError(error, 'Аялал эхлүүлэхэд алдаа гарлаа.');
  }
}

export async function completePassengerTrip(bookingId: string, code: string) {
  if (!supabase) throw new Error('Supabase env тохируулагдаагүй байна.');
  const { error } = await supabase.rpc('complete_passenger_trip', { p_booking_id: bookingId, p_code: code }).maybeSingle();
  if (error) {
    const messageByCode: Record<string, string> = {
      driver_or_admin_required: 'Зөвхөн чиглэлийн жолооч аялал дуусгана.',
      booking_not_on_trip: 'Энэ захиалга аялал эхэлсэн төлөвт байхгүй байна.',
      invalid_trip_code: 'Баталгаажуулах код буруу байна. Аялагчаас 6 оронтой кодыг асууна уу.',
      booking_not_found: 'Захиалга олдсонгүй.',
    };
    const known = Object.entries(messageByCode).find(([code]) => toError(error, '').message.includes(code))?.[1];
    throw known ? new Error(known) : toError(error, 'Аялал дуусгахад алдаа гарлаа.');
  }
}

/** File a dispute/report tied to a booking. reporter_id is the signed-in user (RLS-enforced). */
export async function createBookingReport(input: { bookingId: string; tripId?: string; reason: string; details?: string }) {
  if (!supabase) throw new Error('Supabase env тохируулагдаагүй байна.');
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('Дахин нэвтэрнэ үү.');
  if (!input.reason.trim()) throw new Error('Асуудлын талаар бичнэ үү.');

  const { error } = await supabase.rpc('create_booking_report', {
    p_booking_id: input.bookingId,
    p_reason: input.reason.trim(),
    p_details: input.details?.trim() || null,
  });
  if (error) {
    const messageByCode: Record<string, string> = {
      request_rate_limited: 'Хэт олон хүсэлт илгээлээ. Түр хүлээгээд дахин оролдоно уу.',
      report_already_open: 'Энэ захиалгын нээлттэй гомдол аль хэдийн байна.',
      not_a_booking_participant: 'Та зөвхөн өөрийн оролцсон захиалгын талаар мэдэгдэл илгээнэ.',
      report_reason_too_short: 'Асуудлаа арай дэлгэрэнгүй бичнэ үү.',
      report_reason_too_long: 'Тайлбар хэт урт байна.',
    };
    const known = Object.entries(messageByCode).find(([code]) => toError(error, '').message.includes(code))?.[1];
    throw known ? new Error(known) : toError(error, 'Гомдол илгээхэд алдаа гарлаа.');
  }
}

export interface BookingStatusLog {
  id: string;
  status: string;
  note?: string;
  createdAt: string;
}

/** Fetch the audit trail (status transitions) for a booking, oldest first. */
export async function fetchBookingStatusHistory(bookingId: string): Promise<BookingStatusLog[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('trip_status_logs')
    .select('id, status, note, created_at')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true });

  if (error) return [];
  return (data || []).map((row) => ({
    id: row.id as string,
    status: row.status as string,
    note: (row.note as string) || undefined,
    createdAt: row.created_at as string,
  }));
}

export async function fetchPassengerBookingById(bookingId: string): Promise<PassengerBookingDetail | null> {
  if (!supabase) return null;

  const { data: rpcBooking, error: rpcError } = await supabase
    .rpc('get_passenger_booking_detail', { p_booking_id: bookingId })
    .maybeSingle();

  if (!rpcError && rpcBooking) {
    return mapBookingDetailRpcRow(rpcBooking as BookingDetailRpcRow);
  }

  const rpcMessage = rpcError ? toError(rpcError, '').message : '';
  const canFallbackToDirectRead = !rpcError
    || rpcMessage.includes('get_passenger_booking_detail')
    || rpcMessage.includes('Could not find the function')
    || rpcMessage.includes('PGRST202');

  if (rpcError && !canFallbackToDirectRead) {
    throw toError(rpcError, 'Booking detail уншихад алдаа гарлаа.');
  }

  let { data: booking, error: bookingError } = await supabase
    .from('passenger_bookings')
    .select('id, trip_id, traveler_id, seats_requested, selected_seats, status, total_amount, note, created_at, trip_code')
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
    .maybeSingle();

  if (tripError) throw toError(tripError, 'Booking trip уншихад алдаа гарлаа.');
  if (!trip) throw new Error('Захиалгатай холбоотой чиглэл олдсонгүй. Хуудсаа шинэчлээд дахин шалгана уу.');

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
    tripCode: (bookingRow as { trip_code?: string }).trip_code || undefined,
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

export async function fetchParticipantPublicProfile(userId: string): Promise<ParticipantPublicProfile | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .rpc('get_participant_public_profile', { p_user_id: userId })
    .maybeSingle();

  if (error) throw toError(error, 'Хэрэглэгчийн мэдээлэл уншихад алдаа гарлаа.');
  if (!data) return null;

  const row = data as ParticipantPublicProfileRow;
  return {
    id: row.id,
    role: row.role,
    fullName: row.full_name || (row.role === 'driver' ? 'Жолооч' : 'Аялагч'),
    phone: row.phone || undefined,
    email: row.email || undefined,
    phoneVerified: Boolean(row.phone_verified),
    avatarUrl: row.avatar_url || undefined,
    driverVerificationStatus: row.driver_verification_status || undefined,
    carModel: row.car_model || undefined,
    plateNumber: row.plate_number || undefined,
    seats: row.seats || undefined,
    rating: Number(row.rating || 0),
    completedTrips: Number(row.completed_trips || 0),
  };
}

export async function createCargoRequest(input: CreateCargoRequestInput) {
  if (!supabase) throw new Error('Supabase env тохируулагдаагүй байна.');

  const { data, error } = await supabase
    .rpc('create_cargo_request', {
      p_trip_id: input.tripId,
      p_cargo_name: input.cargoName,
      p_cargo_type: input.cargoType || null,
      p_size_note: input.sizeNote || null,
      p_weight_kg: input.weightKg ?? null,
      p_receiver_name: input.receiverName,
      p_receiver_phone: input.receiverPhone,
      p_pickup_note: input.pickupNote || null,
    })
    .maybeSingle();

  if (error) {
    const messageByCode: Record<string, string> = {
      not_authenticated: 'Дахин нэвтэрнэ үү.',
      cargo_name_required: 'Ачааны нэрийг оруулна уу.',
      receiver_required: 'Хүлээн авагчийн нэрийг оруулна уу.',
      receiver_phone_required: 'Хүлээн авагчийн утсыг оруулна уу.',
      cargo_sender_required: 'Зөвхөн дүрэм зөвшөөрсөн, утсаа баталгаажуулсан ачаа илгээгч хүсэлт үүсгэнэ.',
      trip_not_cargo_enabled: 'Энэ чиглэл дайвар ачаа авах боломжгүй байна.',
      request_rate_limited: 'Хэт олон ачааны хүсэлт илгээлээ. Түр хүлээгээд дахин оролдоно уу.',
    };
    const known = Object.entries(messageByCode).find(([code]) => toError(error, '').message.includes(code))?.[1];
    throw known ? new Error(known) : toError(error, 'Cargo request хадгалахад алдаа гарлаа.');
  }
  if (!data) throw new Error('Ачааны хүсэлтийг баталгаажуулж чадсангүй. Хуудсаа шинэчлээд дахин шалгана уу.');
  return data as { id: string; status: string; delivery_code: string };
}

export interface SenderCargoRequest {
  id: string;
  route: string;
  cargoName: string;
  weightKg?: number;
  receiverName: string;
  receiverPhone: string;
  status: string;
  deliveryCode: string;
  createdAt: string;
}

/** The signed-in sender's own cargo requests, including the delivery code to share. */
export async function fetchCurrentSenderCargoRequests(): Promise<SenderCargoRequest[]> {
  if (!supabase) return [];

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return [];

  const { data: cargoRows, error } = await supabase
    .from('cargo_requests')
    .select('id, trip_id, cargo_name, weight_kg, receiver_name, receiver_phone, status, delivery_code, created_at')
    .eq('sender_id', userId)
    .order('created_at', { ascending: false });

  if (error || !cargoRows?.length) return [];

  const tripIds = Array.from(new Set(cargoRows.map((r) => r.trip_id)));
  const { data: trips } = await supabase
    .from('trips')
    .select('id, from_location, to_location')
    .in('id', tripIds);
  const tripsById = new Map((trips || []).map((t) => [t.id, t]));

  return cargoRows.map((r) => {
    const trip = tripsById.get(r.trip_id);
    return {
      id: r.id as string,
      route: trip ? `${trip.from_location} → ${trip.to_location}` : 'Чиглэл',
      cargoName: r.cargo_name as string,
      weightKg: (r.weight_kg as number) ?? undefined,
      receiverName: r.receiver_name as string,
      receiverPhone: r.receiver_phone as string,
      status: r.status as string,
      deliveryCode: r.delivery_code as string,
      createdAt: r.created_at as string,
    };
  });
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------
export interface ReceivedReview {
  id: string;
  rating: number;
  comment?: string;
  reviewerName: string;
  createdAt: string;
}

export interface PendingReview {
  bookingId: string;
  route: string;
  otherName: string;
  completedAt: string;
}

export async function submitReview(bookingId: string, rating: number, comment?: string) {
  if (!supabase) throw new Error('Supabase env тохируулагдаагүй байна.');
  const { error } = await supabase.rpc('submit_review', {
    p_booking_id: bookingId,
    p_rating: rating,
    p_comment: comment?.trim() || null,
  });
  if (error) {
    const messageByCode: Record<string, string> = {
      invalid_rating: 'Үнэлгээ 1-5 одны хооронд байх ёстой.',
      booking_not_found: 'Захиалга олдсонгүй.',
      booking_not_completed: 'Зөвхөн дууссан аяллыг үнэлнэ.',
      not_a_participant: 'Зөвхөн аяллын оролцогч үнэлгээ өгнө.',
      already_reviewed: 'Та энэ аяллыг аль хэдийн үнэлсэн байна.',
    };
    const known = Object.entries(messageByCode).find(([c]) => toError(error, '').message.includes(c))?.[1];
    throw known ? new Error(known) : toError(error, 'Үнэлгээ өгөхөд алдаа гарлаа.');
  }
}

export async function submitCargoReview(cargoId: string, rating: number, comment?: string) {
  if (!supabase) throw new Error('Supabase env тохируулагдаагүй байна.');
  const { error } = await supabase.rpc('submit_cargo_review', {
    p_cargo_id: cargoId,
    p_rating: rating,
    p_comment: comment?.trim() || null,
  });
  if (error) {
    const messageByCode: Record<string, string> = {
      invalid_rating: 'Үнэлгээ 1-5 одны хооронд байх ёстой.',
      cargo_not_found: 'Ачааны захиалга олдсонгүй.',
      cargo_not_completed: 'Зөвхөн дууссан ачааны захиалгыг үнэлнэ.',
      not_authorized: 'Зөвхөн ачаа илгээгч үнэлгээ өгнө.',
    };
    const known = Object.entries(messageByCode).find(([c]) => toError(error, '').message.includes(c))?.[1];
    throw known ? new Error(known) : toError(error, 'Үнэлгээ өгөхөд алдаа гарлаа.');
  }
}

export async function fetchReceivedReviews(): Promise<ReceivedReview[]> {
  if (!supabase) return [];
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return [];

  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, comment, reviewer_id, created_at')
    .eq('reviewee_id', userId)
    .order('created_at', { ascending: false });
  if (error || !data?.length) return [];

  const reviewerIds = Array.from(new Set(data.map((r) => r.reviewer_id)));
  const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', reviewerIds);
  const names = new Map((profiles || []).map((p) => [p.id, p.full_name]));

  return data.map((r) => ({
    id: r.id as string,
    rating: Number(r.rating),
    comment: (r.comment as string) || undefined,
    reviewerName: names.get(r.reviewer_id as string) || 'Хэрэглэгч',
    createdAt: r.created_at as string,
  }));
}

/** Completed bookings the signed-in user can still review (hasn't yet). */
export async function fetchPendingReviews(): Promise<PendingReview[]> {
  if (!supabase) return [];
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return [];

  // RLS limits these to bookings where the user is the traveler or the trip driver.
  const { data: bookings } = await supabase
    .from('passenger_bookings')
    .select('id, trip_id, traveler_id, completed_at, updated_at')
    .eq('status', 'completed')
    .order('updated_at', { ascending: false });
  if (!bookings?.length) return [];

  const { data: myReviews } = await supabase
    .from('reviews')
    .select('booking_id')
    .eq('reviewer_id', userId);
  const reviewed = new Set((myReviews || []).map((r) => r.booking_id));

  const pending = bookings.filter((b) => !reviewed.has(b.id));
  if (!pending.length) return [];

  const tripIds = Array.from(new Set(pending.map((b) => b.trip_id)));
  const { data: trips } = await supabase
    .from('trips')
    .select('id, from_location, to_location, driver_id')
    .in('id', tripIds);
  const tripsById = new Map((trips || []).map((t) => [t.id, t]));

  // The "other party" is the driver (when I'm traveler) or the traveler (when I'm driver).
  const otherIds = Array.from(
    new Set(
      pending.map((b) => {
        const trip = tripsById.get(b.trip_id);
        return b.traveler_id === userId ? trip?.driver_id : b.traveler_id;
      }).filter(Boolean) as string[],
    ),
  );
  const { data: profiles } = otherIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', otherIds)
    : { data: [] };
  const names = new Map((profiles || []).map((p) => [p.id, p.full_name]));

  return pending.map((b) => {
    const trip = tripsById.get(b.trip_id);
    const otherId = b.traveler_id === userId ? trip?.driver_id : b.traveler_id;
    return {
      bookingId: b.id as string,
      route: trip ? `${trip.from_location} → ${trip.to_location}` : 'Аялал',
      otherName: (otherId && names.get(otherId)) || 'Хэрэглэгч',
      completedAt: (b.completed_at as string) || (b.updated_at as string),
    };
  });
}

export interface CargoRequestDetail {
  id: string;
  status: string;
  cargoName: string;
  cargoType?: string;
  sizeNote?: string;
  weightKg?: number;
  receiverName: string;
  receiverPhone: string;
  pickupNote?: string;
  deliveryCode: string;
  createdAt: string;
  isSender: boolean;
  trip: { fromLocation: string; toLocation: string; departureAt: string; driverId: string };
  driver: { fullName: string; phone?: string; carModel?: string; rating: number };
  history: BookingStatusLog[];
}

export async function fetchCargoRequestById(cargoId: string): Promise<CargoRequestDetail | null> {
  if (!supabase) return null;

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  const { data: cargo, error } = await supabase
    .from('cargo_requests')
    .select('id, trip_id, sender_id, cargo_name, cargo_type, size_note, weight_kg, receiver_name, receiver_phone, pickup_note, status, delivery_code, created_at')
    .eq('id', cargoId)
    .maybeSingle();

  if (error || !cargo) return null;

  const { data: trip } = await supabase
    .from('trips')
    .select('id, driver_id, from_location, to_location, departure_at')
    .eq('id', cargo.trip_id)
    .maybeSingle();

  const driverId = trip?.driver_id;
  const [{ data: driver }, { data: driverProfile }, { data: logs }] = await Promise.all([
    driverId
      ? supabase.from('profiles').select('full_name, phone').eq('id', driverId).maybeSingle()
      : Promise.resolve({ data: null }),
    driverId
      ? supabase.from('driver_profiles').select('car_model, rating').eq('user_id', driverId).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('trip_status_logs')
      .select('id, status, note, created_at')
      .eq('cargo_request_id', cargoId)
      .order('created_at', { ascending: true }),
  ]);

  return {
    id: cargo.id,
    status: cargo.status,
    cargoName: cargo.cargo_name,
    cargoType: cargo.cargo_type || undefined,
    sizeNote: cargo.size_note || undefined,
    weightKg: cargo.weight_kg ?? undefined,
    receiverName: cargo.receiver_name,
    receiverPhone: cargo.receiver_phone,
    pickupNote: cargo.pickup_note || undefined,
    deliveryCode: cargo.delivery_code,
    createdAt: cargo.created_at,
    isSender: cargo.sender_id === userId,
    trip: {
      fromLocation: trip?.from_location || '',
      toLocation: trip?.to_location || '',
      departureAt: trip?.departure_at || cargo.created_at,
      driverId: driverId || '',
    },
    driver: {
      fullName: driver?.full_name || 'Жолооч',
      phone: driver?.phone || undefined,
      carModel: driverProfile?.car_model || undefined,
      rating: Number(driverProfile?.rating || 0),
    },
    history: (logs || []).map((l) => ({
      id: l.id as string,
      status: l.status as string,
      note: (l.note as string) || undefined,
      createdAt: l.created_at as string,
    })),
  };
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

const CARGO_STATUS_ERRORS: Record<string, string> = {
  not_authenticated: 'Нэвтрэлтийн хугацаа дууссан байна. Дахин нэвтэрнэ үү.',
  cargo_not_found: 'Ачааны хүсэлт олдсонгүй.',
  driver_or_admin_required: 'Зөвхөн чиглэлийн жолооч энэ үйлдлийг хийнэ.',
  sender_or_admin_required: 'Зөвхөн ачаа илгээгч энэ үйлдлийг хийнэ.',
  not_authorized: 'Энэ үйлдлийг хийх эрхгүй байна.',
  invalid_transition: 'Энэ төлөвт шилжих боломжгүй.',
  cargo_not_in_transit: 'Ачаа тээвэрлэгдэж буй төлөвт байхгүй байна.',
  invalid_delivery_code: 'Хүргэлтийн код буруу байна. Хүлээн авагчаас 6 оронтой кодыг асууна уу.',
};

export async function updateCargoRequestStatus(
  cargoRequestId: string,
  status: 'cargo_accepted' | 'rejected' | 'waiting_payment' | 'picked_up' | 'in_transit' | 'completed' | 'cancelled',
) {
  if (!supabase) throw new Error('Supabase env тохируулагдаагүй байна.');

  const { data, error } = await supabase
    .rpc('set_cargo_request_status', { p_cargo_id: cargoRequestId, p_status: status })
    .maybeSingle();

  if (error) {
    const known = Object.entries(CARGO_STATUS_ERRORS).find(([code]) => toError(error, '').message.includes(code))?.[1];
    throw known ? new Error(known) : toError(error, 'Cargo status шинэчлэхэд алдаа гарлаа.');
  }
  return (data || { id: cargoRequestId, status }) as { id: string; status: string };
}

export async function completeCargoDelivery(cargoRequestId: string, code: string) {
  if (!supabase) throw new Error('Supabase env тохируулагдаагүй байна.');

  const { error } = await supabase
    .rpc('complete_cargo_delivery', { p_cargo_id: cargoRequestId, p_code: code })
    .maybeSingle();

  if (error) {
    const known = Object.entries(CARGO_STATUS_ERRORS).find(([code2]) => toError(error, '').message.includes(code2))?.[1];
    throw known ? new Error(known) : toError(error, 'Хүргэлт баталгаажуулахад алдаа гарлаа.');
  }
}
