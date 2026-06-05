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
