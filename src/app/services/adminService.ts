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
  reviewedAt?: string;
  rejectionReason?: string;
  documents: { label: string; signedUrl: string }[];
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

async function getDriverDocSignedUrl(storedPath?: string | null) {
  if (!supabase || !storedPath) return undefined;
  const path = storedPath.replace(/^driver-documents\//, '');
  if (!path) return undefined;

  const { data, error } = await supabase.storage.from('driver-documents').createSignedUrl(path, 60 * 10);
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

function mapPaymentError(error: { message?: string } | null) {
  const messageByCode: Record<string, string> = {
    admin_required: 'Зөвхөн админ төлбөр шийдвэрлэнэ.',
    payment_not_found: 'Төлбөрийн мөр олдсонгүй.',
    payment_already_reviewed: 'Энэ төлбөр аль хэдийн шийдвэрлэгдсэн байна.',
    refund_reason_required: 'Буцаалтын шалтгааныг бичнэ үү.',
    already_refunded: 'Энэ төлбөр аль хэдийн буцаагдсан байна.',
  };
  const known = Object.entries(messageByCode).find(([code]) => toError(error, '').message.includes(code))?.[1];
  return known ? new Error(known) : toError(error, 'Төлбөр шийдвэрлэхэд алдаа гарлаа.');
}

async function getPaymentTarget(paymentId: string) {
  const { data, error } = await supabase!
    .from('payments')
    .select('id, booking_id, cargo_request_id')
    .eq('id', paymentId)
    .single();
  if (error) throw toError(error, 'Төлбөрийн мөр олдсонгүй.');
  return data as { id: string; booking_id: string | null; cargo_request_id: string | null };
}

export async function approvePayment(paymentId: string) {
  if (!supabase) throw new Error('Supabase тохиргоо дутуу байна.');
  const payment = await getPaymentTarget(paymentId);

  if (payment.booking_id) {
    // Atomic: payment approved + booking → confirmed.
    const { error } = await supabase.rpc('review_payment', { p_payment_id: paymentId, p_approved: true, p_note: null });
    if (error) throw mapPaymentError(error);
    return;
  }

  // Cargo path (Phase 9 will make this transactional).
  const { error: updateError } = await supabase
    .from('payments')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', paymentId);
  if (updateError) throw toError(updateError, 'Төлбөр баталгаажуулахад алдаа гарлаа.');
  if (payment.cargo_request_id) {
    const { error } = await supabase.rpc('set_cargo_request_status', {
      p_cargo_id: payment.cargo_request_id,
      p_status: 'picked_up',
      p_note: 'Админ төлбөрийг баталгаажуулав.',
    });
    if (error) throw toError(error, 'Ачааны төлөв шинэчлэхэд алдаа гарлаа.');
  }
}

export async function rejectPayment(paymentId: string) {
  if (!supabase) throw new Error('Supabase тохиргоо дутуу байна.');
  const payment = await getPaymentTarget(paymentId);

  if (payment.booking_id) {
    // Atomic: payment rejected + booking → waiting_payment.
    const { error } = await supabase.rpc('review_payment', { p_payment_id: paymentId, p_approved: false, p_note: null });
    if (error) throw mapPaymentError(error);
    return;
  }

  const { error: updateError } = await supabase
    .from('payments')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
    .eq('id', paymentId);
  if (updateError) throw toError(updateError, 'Төлбөр буцаахад алдаа гарлаа.');
  if (payment.cargo_request_id) {
    const { error } = await supabase.rpc('set_cargo_request_status', {
      p_cargo_id: payment.cargo_request_id,
      p_status: 'waiting_payment',
      p_note: 'Админ төлбөрийн баримтыг буцаав.',
    });
    if (error) throw toError(error, 'Ачааны төлөв шинэчлэхэд алдаа гарлаа.');
  }
}

/** Refund a booking payment: marks refunded + cancels the booking (releases seats). */
export async function refundPayment(paymentId: string, reason: string) {
  if (!supabase) throw new Error('Supabase тохиргоо дутуу байна.');
  const { error } = await supabase.rpc('refund_payment', { p_payment_id: paymentId, p_note: reason });
  if (error) throw mapPaymentError(error);
}

export async function fetchAdminDriverVerifications(): Promise<AdminDriverVerificationItem[]> {
  if (!supabase) return [];

  const { data: driverRows, error } = await supabase
    .from('driver_profiles')
    .select(
      'user_id, verification_status, car_model, plate_number, seats, created_at, reviewed_at, rejection_reason, driver_license_url, vehicle_certificate_url, vehicle_photo_url',
    )
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

  return Promise.all(
    driverRows.map(async (row) => {
      const profile = profilesById.get(row.user_id);
      const docSpecs: { label: string; path?: string | null }[] = [
        { label: 'Жолооны үнэмлэх', path: row.driver_license_url },
        { label: 'Машины гэрчилгээ', path: row.vehicle_certificate_url },
        { label: 'Машины зураг', path: row.vehicle_photo_url },
      ];
      const documents = (
        await Promise.all(
          docSpecs.map(async (spec) => {
            const signedUrl = await getDriverDocSignedUrl(spec.path);
            return signedUrl ? { label: spec.label, signedUrl } : null;
          }),
        )
      ).filter((doc): doc is { label: string; signedUrl: string } => doc !== null);

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
        reviewedAt: row.reviewed_at || undefined,
        rejectionReason: row.rejection_reason || undefined,
        documents,
      };
    }),
  );
}

export async function updateDriverVerification(
  userId: string,
  status: DriverVerificationStatus,
  rejectionReason?: string,
) {
  if (!supabase) throw new Error('Supabase тохиргоо дутуу байна.');

  const { error } = await supabase.rpc('review_driver_verification', {
    p_user_id: userId,
    p_status: status,
    p_rejection_reason: rejectionReason?.trim() || null,
  });

  if (error) {
    const messageByCode: Record<string, string> = {
      admin_required: 'Зөвхөн админ баталгаажуулалт хийнэ.',
      rejection_reason_required: 'Татгалзах шалтгааныг бичнэ үү.',
      driver_not_found: 'Жолоочийн бүртгэл олдсонгүй.',
      invalid_status: 'Төлөв буруу байна.',
    };
    const known = Object.entries(messageByCode).find(([code]) => error.message?.includes(code))?.[1];
    throw known ? new Error(known) : toError(error, 'Жолоочийн баталгаажуулалт шинэчлэхэд алдаа гарлаа.');
  }
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

// ---------------------------------------------------------------------------
// Reports / disputes
// ---------------------------------------------------------------------------
export interface AdminReportItem {
  id: string;
  reason: string;
  details?: string;
  status: string;
  reporterName: string;
  targetName?: string;
  bookingId?: string;
  cargoRequestId?: string;
  resolvedAt?: string;
  createdAt: string;
}

export async function fetchAdminReports(): Promise<AdminReportItem[]> {
  if (!supabase) return [];

  const { data: reports, error } = await supabase
    .from('reports')
    .select('id, reporter_id, target_user_id, booking_id, cargo_request_id, reason, details, status, resolved_at, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw toError(error, 'Гомдол уншихад алдаа гарлаа.');
  if (!reports?.length) return [];

  const userIds = Array.from(
    new Set(reports.flatMap((r) => [r.reporter_id, r.target_user_id]).filter(Boolean) as string[]),
  );
  const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
  const namesById = new Map((profiles || []).map((p) => [p.id, p.full_name]));

  return reports.map((r) => ({
    id: r.id as string,
    reason: r.reason as string,
    details: (r.details as string) || undefined,
    status: r.status as string,
    reporterName: namesById.get(r.reporter_id as string) || 'Хэрэглэгч',
    targetName: r.target_user_id ? namesById.get(r.target_user_id as string) || undefined : undefined,
    bookingId: (r.booking_id as string) || undefined,
    cargoRequestId: (r.cargo_request_id as string) || undefined,
    resolvedAt: (r.resolved_at as string) || undefined,
    createdAt: r.created_at as string,
  }));
}

export async function resolveReport(reportId: string, status: 'reviewing' | 'resolved' | 'rejected') {
  if (!supabase) throw new Error('Supabase тохиргоо дутуу байна.');
  const { data: userData } = await supabase.auth.getUser();
  const adminId = userData.user?.id;

  const patch: Record<string, unknown> = { status };
  if (status === 'resolved' || status === 'rejected') {
    patch.resolved_by = adminId;
    patch.resolved_at = new Date().toISOString();
  }

  const { error } = await supabase.from('reports').update(patch).eq('id', reportId);
  if (error) throw toError(error, 'Гомдол шинэчлэхэд алдаа гарлаа.');
}

// ---------------------------------------------------------------------------
// Audit logs (trip_status_logs)
// ---------------------------------------------------------------------------
export interface AdminAuditLogItem {
  id: string;
  status: string;
  note?: string;
  bookingId?: string;
  cargoRequestId?: string;
  actorName?: string;
  source?: 'marketplace' | 'security';
  createdAt: string;
}

export async function fetchAdminAuditLogs(): Promise<AdminAuditLogItem[]> {
  if (!supabase) return [];

  const [marketplaceResult, securityResult] = await Promise.all([
    supabase
      .from('trip_status_logs')
      .select('id, status, note, booking_id, cargo_request_id, changed_by, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('security_events')
      .select('id, event_type, severity, actor_user_id, route, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  if (marketplaceResult.error) {
    throw toError(marketplaceResult.error, 'Үйлдлийн түүх уншихад алдаа гарлаа.');
  }

  const logs = marketplaceResult.data || [];
  const securityLogs = securityResult.error ? [] : securityResult.data || [];
  const actorIds = Array.from(new Set([
    ...logs.map((item) => item.changed_by),
    ...securityLogs.map((item) => item.actor_user_id),
  ].filter(Boolean) as string[]));
  const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', actorIds);
  const namesById = new Map((profiles || []).map((p) => [p.id, p.full_name]));

  const marketplaceItems: AdminAuditLogItem[] = logs.map((l) => ({
    id: l.id as string,
    status: l.status as string,
    note: (l.note as string) || undefined,
    bookingId: (l.booking_id as string) || undefined,
    cargoRequestId: (l.cargo_request_id as string) || undefined,
    actorName: l.changed_by ? namesById.get(l.changed_by as string) || undefined : undefined,
    source: 'marketplace',
    createdAt: l.created_at as string,
  }));

  const securityItems: AdminAuditLogItem[] = securityLogs.map((item) => ({
    id: item.id as string,
    status: item.event_type as string,
    note: [
      item.severity ? `Түвшин: ${item.severity}` : '',
      item.route ? `Зам: ${item.route}` : '',
    ].filter(Boolean).join(' · ') || undefined,
    actorName: item.actor_user_id
      ? namesById.get(item.actor_user_id as string) || undefined
      : undefined,
    source: 'security',
    createdAt: item.created_at as string,
  }));

  return [...marketplaceItems, ...securityItems]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 200);
}
