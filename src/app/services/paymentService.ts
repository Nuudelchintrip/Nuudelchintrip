import { supabase } from '../lib/supabase';

type PaymentTarget = 'booking' | 'cargo';

interface UploadPaymentProofInput {
  target: PaymentTarget;
  targetId: string;
  amount: number;
  file: File;
  note?: string;
}

export interface UploadPaymentProofResult {
  paymentId: string;
  proofId: string;
  proofPath: string;
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

function safeFileName(name: string) {
  const extension = name.includes('.') ? `.${name.split('.').pop()}` : '';
  const base = name
    .replace(extension, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return `${base || 'payment-proof'}${extension.toLowerCase()}`;
}

export async function uploadPaymentProof(input: UploadPaymentProofInput): Promise<UploadPaymentProofResult> {
  if (!supabase) throw new Error('Supabase env тохируулагдаагүй байна.');

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw toError(userError, 'User session check failed.');

  const userId = userData.user?.id;
  if (!userId) throw new Error('Төлбөрийн баримт илгээхийн тулд дахин нэвтэрнэ үү.');

  if (input.file.size > 10 * 1024 * 1024) {
    throw new Error('Файлын хэмжээ 10MB-аас бага байх ёстой.');
  }

  const targetColumn = input.target === 'booking' ? 'booking_id' : 'cargo_request_id';
  const statusTable = input.target === 'booking' ? 'passenger_bookings' : 'cargo_requests';
  const reviewStatus = input.target === 'booking' ? 'payment_review' : 'payment_review';
  const path = `${userId}/${input.target}/${input.targetId}/${Date.now()}-${safeFileName(input.file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from('payment-proofs')
    .upload(path, input.file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw toError(uploadError, 'Төлбөрийн баримтын файл upload хийхэд алдаа гарлаа.');

  const storedPath = `payment-proofs/${path}`;

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      [targetColumn]: input.targetId,
      amount: Math.max(0, Math.round(input.amount)),
      status: 'proof_uploaded',
      proof_url: storedPath,
    })
    .select('id')
    .single();

  if (paymentError) throw toError(paymentError, 'Төлбөрийн мөр хадгалахад алдаа гарлаа.');

  const { data: proof, error: proofError } = await supabase
    .from('proofs')
    .insert({
      user_id: userId,
      [targetColumn]: input.targetId,
      proof_type: 'payment',
      file_url: storedPath,
      note: input.note || null,
    })
    .select('id')
    .single();

  if (proofError) throw toError(proofError, 'Proof timeline хадгалахад алдаа гарлаа.');

  const { error: statusError } = await supabase
    .from(statusTable)
    .update({ status: reviewStatus })
    .eq('id', input.targetId);

  if (statusError) throw toError(statusError, 'Booking status шинэчлэхэд алдаа гарлаа.');

  return {
    paymentId: payment.id as string,
    proofId: proof.id as string,
    proofPath: storedPath,
  };
}
