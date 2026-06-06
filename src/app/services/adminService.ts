import { supabase } from '../lib/supabase';

type PaymentStatus = 'pending' | 'proof_uploaded' | 'approved' | 'rejected' | 'refunded';
type DriverVerificationStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

export interface AdminPaymentItem {
  id: string;
  userId: string;
  bookingId?: string;
  cargoRequestId?: string;
  amount: number;
  status: PaymentStatus;
  proofUrl?: string;
  signedProofUrl?: string;
  createdAt: string;
  payerName: string;
  payerPhone?: string;
  routeLabel?: string;
  targetLabel: string;
}

export interface AdminDriverVerificationItem {
  userId: string;
  fullName: string;
  phone?: string;
  email?: string;
  status: DriverVerificationStatus;
  carModel?: string;
  plateNumber?: string;
  seats?: number;
  createdAt?: string;
}

function toError(error: unknown, fallback: string) {
  if (error instanceof Error) return error;
  if (error && typeof error === 'object') {
    const record = error as { message?: string; details?: string; hint?: string; code?: string };
    const parts = [record.message, record.details, record.hint, record.code ? `code: ${record.code}` : undefined].filter(Boolean);
    if (parts.length) return new Error(parts.join(' | '));
  }
  return new Error(fallback);
}

function stripBucketPrefix(path?: string | null) {
  if (!path) return undefined;
  return path.replace(/^payment-proofs\//, '');
}

async function getPaymentSignedUrl(proofUrl?: string | null) {
  if (!supabase || !proofUrl) return undefined;
  const path = stripBucketPrefix(proofUrl);
  if (!path) return undefined;

  const { data, error } = await supabase.storage.from('payment-proofs').createSignedUrl(path, 60 * 10);
  if (error) return undefined;
  return data.signedUrl;
}

export async function fetchAdminPayments(): Promise<AdminPaymentItem[]> {
  if (!supabase) return [];

  const { data: payments, error } = await supabase
    .from('payments')
    .select('id, user_id, booking_id, cargo_request_id, amount, status, proof_url, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw toError(error, 'Төлбөрийн жагсаалт уншихад алдаа гарлаа.');
  if (!payments?.length) return [];

  const userIds = Array.from(new Set(payments.map((payment) => payment.user_id).filter(Boolean)));
  const bookingIds = Array.from(new Set(payments.map((payment) => payment.booking_id).filter(Boolean)));
  const cargoIds = Array.from(new Set(payments.map((payment) => payment.cargo_request_id).filter(Boolean)));

  const [{ data: profiles }, { data: bookings }, { data: cargoRequests }] = await Promise.all([
    userIds.length
      ? supabase.from('profiles').select('id, full_name, phone').in('id', userIds)
      : Promise.resolve({ data: [] }),
    bookingIds.length
      ? supabase.from('passenger_bookings').select('id, trip_id').in('id', bookingIds)
      : Promise.resolve({ data: [] }),
    cargoIds.length
      ? supabase.from('cargo_requests').select('id, trip_id, cargo_name').in('id', cargoIds)
      : Promise.resolve({ data: [] }),
  ]);

  const tripIds = Array.from(
    new Set([
      ...((bookings || []).map((booking) => booking.trip_id).filter(Boolean)),
      ...((cargoRequests || []).map((request) => request.trip_id).filter(Boolean)),
    ]),
  );

  const { data: trips } = tripIds.length
    ? await supabase.from('trips').select('id, from_location, to_location').in('id', tripIds)
    : { data: [] };

  const profilesById = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const bookingsById = new Map((bookings || []).map((booking) => [booking.id, booking]));
  const cargoById = new Map((cargoRequests || []).map((request) => [request.id, request]));
  const tripsById = new Map((trips || []).map((trip) => [trip.id, trip]));

  const signedUrls = await Promise.all(payments.map((payment) => getPaymentSignedUrl(payment.proof_url)));

  return payments.map((payment, index) => {
    const profile = profilesById.get(payment.user_id);
    const booking = payment.booking_id ? bookingsById.get(payment.booking_id) : undefined;
    const cargo = payment.cargo_request_id ? cargoById.get(payment.cargo_request_id) : undefined;
    const trip = booking ? tripsById.get(booking.trip_id) : cargo ? tripsById.get(cargo.trip_id) : undefined;

    return {
      id: payment.id,
      userId: payment.user_id,
      bookingId: payment.booking_id || undefined,
      cargoRequestId: payment.cargo_request_id || undefined,
      amount: Number(payment.amount || 0),
      status: payment.status as PaymentStatus,
      proofUrl: payment.proof_url || undefined,
      signedProofUrl: signedUrls[index],
      createdAt: payment.created_at,
      payerName: profile?.full_name || 'Хэрэглэгч',
      payerPhone: profile?.phone || undefined,
      routeLabel: trip ? `${trip.from_location} → ${trip.to_location}` : undefined,
      targetLabel: payment.booking_id ? 'Аяллын захиалга' : cargo?.cargo_name ? `Дайвар ачаа: ${cargo.cargo_name}` : 'Дайвар ачаа',
    };
  });
}

export async function approvePayment(paymentId: string) {
  if (!supabase) throw new Error('Supabase тохиргоо дутуу байна.');

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw toError(userError, 'Admin session шалгахад алдаа гарлаа.');
  const adminId = userData.user?.id;
  if (!adminId) throw new Error('Admin эрхээр дахин нэвтэрнэ үү.');

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('id, booking_id, cargo_request_id')
    .eq('id', paymentId)
    .single();

  if (paymentError) throw toError(paymentError, 'Төлбөрийн мөр олдсонгүй.');

  const { error: updateError } = await supabase
    .from('payments')
    .update({ status: 'approved', reviewed_by: adminId, reviewed_at: new Date().toISOString() })
    .eq('id', paymentId);

  if (updateError) throw toError(updateError, 'Төлбөр баталгаажуулахад алдаа гарлаа.');

  if (payment.booking_id) {
    const { error } = await supabase
      .from('passenger_bookings')
      .update({ status: 'confirmed' })
      .eq('id', payment.booking_id);
    if (error) throw toError(error, 'Захиалгын төлөв шинэчлэхэд алдаа гарлаа.');
  }

  if (payment.cargo_request_id) {
    const { error } = await supabase
      .from('cargo_requests')
      .update({ status: 'picked_up' })
      .eq('id', payment.cargo_request_id);
    if (error) throw toError(error, 'Ачааны төлөв шинэчлэхэд алдаа гарлаа.');
  }
}

export async function rejectPayment(paymentId: string) {
  if (!supabase) throw new Error('Supabase тохиргоо дутуу байна.');

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw toError(userError, 'Admin session шалгахад алдаа гарлаа.');
  const adminId = userData.user?.id;
  if (!adminId) throw new Error('Admin эрхээр дахин нэвтэрнэ үү.');

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('id, booking_id, cargo_request_id')
    .eq('id', paymentId)
    .single();

  if (paymentError) throw toError(paymentError, 'Төлбөрийн мөр олдсонгүй.');

  const { error: updateError } = await supabase
    .from('payments')
    .update({ status: 'rejected', reviewed_by: adminId, reviewed_at: new Date().toISOString() })
    .eq('id', paymentId);

  if (updateError) throw toError(updateError, 'Төлбөр буцаахад алдаа гарлаа.');

  if (payment.booking_id) {
    await supabase.from('passenger_bookings').update({ status: 'waiting_payment' }).eq('id', payment.booking_id);
  }
  if (payment.cargo_request_id) {
    await supabase.from('cargo_requests').update({ status: 'waiting_payment' }).eq('id', payment.cargo_request_id);
  }
}

export async function fetchAdminDriverVerifications(): Promise<AdminDriverVerificationItem[]> {
  if (!supabase) return [];

  const { data: driverRows, error } = await supabase
    .from('driver_profiles')
    .select('user_id, verification_status, car_model, plate_number, seats, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw toError(error, 'Жолоочийн баталгаажуулалт уншихад алдаа гарлаа.');
  if (!driverRows?.length) return [];

  const userIds = driverRows.map((row) => row.user_id);
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, phone, email')
    .in('id', userIds);

  if (profileError) throw toError(profileError, 'Хэрэглэгчийн мэдээлэл уншихад алдаа гарлаа.');

  const profilesById = new Map((profiles || []).map((profile) => [profile.id, profile]));

  return driverRows.map((row) => {
    const profile = profilesById.get(row.user_id);
    return {
      userId: row.user_id,
      fullName: profile?.full_name || 'Жолооч',
      phone: profile?.phone || undefined,
      email: profile?.email || undefined,
      status: row.verification_status as DriverVerificationStatus,
      carModel: row.car_model || undefined,
      plateNumber: row.plate_number || undefined,
      seats: row.seats ?? undefined,
      createdAt: row.created_at || undefined,
    };
  });
}

export async function updateDriverVerification(userId: string, status: DriverVerificationStatus) {
  if (!supabase) throw new Error('Supabase тохиргоо дутуу байна.');

  const { error } = await supabase
    .from('driver_profiles')
    .update({
      verification_status: status,
      cargo_permission_status: status === 'approved' ? 'approved' : status,
    })
    .eq('user_id', userId);

  if (error) throw toError(error, 'Жолоочийн баталгаажуулалт шинэчлэхэд алдаа гарлаа.');
}

export interface AdminUserItem {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  role: string;
  phoneVerified: boolean;
  onboardingCompleted: boolean;
  isSuspended: boolean;
  createdAt?: string;
}

export async function fetchAdminUsers(): Promise<AdminUserItem[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, email, role, phone_verified, onboarding_completed, is_suspended, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw toError(error, 'Хэрэглэгчдийн жагсаалт уншихад алдаа гарлаа.');

  return (data || []).map((row) => ({
    id: row.id,
    fullName: row.full_name || 'Нэргүй хэрэглэгч',
    phone: row.phone || undefined,
    email: row.email || undefined,
    role: row.role,
    phoneVerified: Boolean(row.phone_verified),
    onboardingCompleted: Boolean(row.onboarding_completed),
    isSuspended: Boolean(row.is_suspended),
    createdAt: row.created_at || undefined,
  }));
}

export async function setUserSuspended(userId: string, isSuspended: boolean) {
  if (!supabase) throw new Error('Supabase тохиргоо дутуу байна.');

  const { error } = await supabase
    .from('profiles')
    .update({ is_suspended: isSuspended })
    .eq('id', userId);

  if (error) throw toError(error, 'Хэрэглэгчийн төлөв шинэчлэхэд алдаа гарлаа.');
}

export interface AdminTripItem {
  id: string;
  route: string;
  departureAt: string;
  seatsTotal: number;
  seatsAvailable: number;
  pricePerSeat: number;
  allowsCargo: boolean;
  status: string;
  driverName: string;
  driverPhone?: string;
  createdAt?: string;
}

export async function fetchAdminTrips(): Promise<AdminTripItem[]> {
  if (!supabase) return [];

  const { data: trips, error } = await supabase
    .from('trips')
    .select('id, driver_id, from_location, to_location, departure_at, seats_total, seats_available, price_per_seat, allows_cargo, status, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw toError(error, 'Чиглэлийн жагсаалт уншихад алдаа гарлаа.');
  if (!trips?.length) return [];

  const driverIds = Array.from(new Set(trips.map((trip) => trip.driver_id).filter(Boolean)));
  const { data: drivers } = driverIds.length
    ? await supabase.from('profiles').select('id, full_name, phone').in('id', driverIds)
    : { data: [] };

  const driversById = new Map((drivers || []).map((driver) => [driver.id, driver]));

  return trips.map((trip) => {
    const driver = driversById.get(trip.driver_id);
    return {
      id: trip.id,
      route: `${trip.from_location} → ${trip.to_location}`,
      departureAt: trip.departure_at,
      seatsTotal: Number(trip.seats_total || 0),
      seatsAvailable: Number(trip.seats_available || 0),
      pricePerSeat: Number(trip.price_per_seat || 0),
      allowsCargo: Boolean(trip.allows_cargo),
      status: trip.status,
      driverName: driver?.full_name || 'Жолооч',
      driverPhone: driver?.phone || undefined,
      createdAt: trip.created_at || undefined,
    };
  });
}

export async function updateTripStatus(tripId: string, status: 'active' | 'cancelled') {
  if (!supabase) throw new Error('Supabase тохиргоо дутуу байна.');

  const { error } = await supabase
    .from('trips')
    .update({ status })
    .eq('id', tripId);

  if (error) throw toError(error, 'Чиглэлийн төлөв шинэчлэхэд алдаа гарлаа.');
}

export interface AdminBookingItem {
  id: string;
  route: string;
  departureAt?: string;
  travelerName: string;
  travelerPhone?: string;
  driverName: string;
  seatsRequested: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export async function fetchAdminBookings(): Promise<AdminBookingItem[]> {
  if (!supabase) return [];

  const { data: bookings, error } = await supabase
    .from('passenger_bookings')
    .select('id, trip_id, traveler_id, seats_requested, total_amount, status, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw toError(error, 'Захиалгын жагсаалт уншихад алдаа гарлаа.');
  if (!bookings?.length) return [];

  const tripIds = Array.from(new Set(bookings.map((booking) => booking.trip_id).filter(Boolean)));
  const travelerIds = Array.from(new Set(bookings.map((booking) => booking.traveler_id).filter(Boolean)));

  const { data: trips } = tripIds.length
    ? await supabase.from('trips').select('id, driver_id, from_location, to_location, departure_at').in('id', tripIds)
    : { data: [] };

  const driverIds = Array.from(new Set((trips || []).map((trip) => trip.driver_id).filter(Boolean)));
  const profileIds = Array.from(new Set([...travelerIds, ...driverIds]));

  const { data: profiles } = profileIds.length
    ? await supabase.from('profiles').select('id, full_name, phone').in('id', profileIds)
    : { data: [] };

  const tripsById = new Map((trips || []).map((trip) => [trip.id, trip]));
  const profilesById = new Map((profiles || []).map((profile) => [profile.id, profile]));

  return bookings.map((booking) => {
    const trip = tripsById.get(booking.trip_id);
    const traveler = profilesById.get(booking.traveler_id);
    const driver = trip ? profilesById.get(trip.driver_id) : undefined;
    return {
      id: booking.id,
      route: trip ? `${trip.from_location} → ${trip.to_location}` : 'Чиглэл олдсонгүй',
      departureAt: trip?.departure_at || undefined,
      travelerName: traveler?.full_name || 'Аялагч',
      travelerPhone: traveler?.phone || undefined,
      driverName: driver?.full_name || 'Жолооч',
      seatsRequested: Number(booking.seats_requested || 0),
      totalAmount: Number(booking.total_amount || 0),
      status: booking.status,
      createdAt: booking.created_at,
    };
  });
}

export interface AdminCargoItem {
  id: string;
  route: string;
  cargoName: string;
  senderName: string;
  senderPhone?: string;
  receiverName: string;
  receiverPhone: string;
  weightKg?: number;
  status: string;
  createdAt: string;
}

export async function fetchAdminCargoRequests(): Promise<AdminCargoItem[]> {
  if (!supabase) return [];

  const { data: cargo, error } = await supabase
    .from('cargo_requests')
    .select('id, trip_id, sender_id, cargo_name, receiver_name, receiver_phone, weight_kg, status, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw toError(error, 'Ачааны хүсэлтүүд уншихад алдаа гарлаа.');
  if (!cargo?.length) return [];

  const tripIds = Array.from(new Set(cargo.map((request) => request.trip_id).filter(Boolean)));
  const senderIds = Array.from(new Set(cargo.map((request) => request.sender_id).filter(Boolean)));

  const [{ data: trips }, { data: senders }] = await Promise.all([
    tripIds.length
      ? supabase.from('trips').select('id, from_location, to_location').in('id', tripIds)
      : Promise.resolve({ data: [] }),
    senderIds.length
      ? supabase.from('profiles').select('id, full_name, phone').in('id', senderIds)
      : Promise.resolve({ data: [] }),
  ]);

  const tripsById = new Map((trips || []).map((trip) => [trip.id, trip]));
  const sendersById = new Map((senders || []).map((sender) => [sender.id, sender]));

  return cargo.map((request) => {
    const trip = tripsById.get(request.trip_id);
    const sender = sendersById.get(request.sender_id);
    return {
      id: request.id,
      route: trip ? `${trip.from_location} → ${trip.to_location}` : 'Чиглэл олдсонгүй',
      cargoName: request.cargo_name,
      senderName: sender?.full_name || 'Илгээгч',
      senderPhone: sender?.phone || undefined,
      receiverName: request.receiver_name,
      receiverPhone: request.receiver_phone,
      weightKg: request.weight_kg ?? undefined,
      status: request.status,
      createdAt: request.created_at,
    };
  });
}
