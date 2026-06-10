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

  const path = `${userId}/${input.target}/${input.targetId}/${Date.now()}-${safeFileName(input.file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from('payment-proofs')
    .upload(path, input.file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw toError(uploadError, 'Төлбөрийн баримтын файл upload хийхэд алдаа гарлаа.');

  const storedPath = `payment-proofs/${path}`;
  const amount = Math.max(0, Math.round(input.amount));

  if (input.target === 'booking') {
    // Atomic: payment row + proof row + booking → payment_review in one transaction.
    const { data: paymentId, error: rpcError } = await supabase.rpc('submit_payment_proof', {
      p_booking_id: input.targetId,
      p_amount: amount,
      p_proof_url: storedPath,
      p_note: input.note || null,
    });
    if (rpcError) {
      const messageByCode: Record<string, string> = {
        not_your_booking: 'Энэ захиалга таных биш байна.',
        booking_not_payable: 'Энэ захиалга одоо төлбөр хүлээж авах төлөвт байхгүй байна.',
        invalid_amount: 'Төлбөрийн дүн буруу байна.',
        proof_required: 'Төлбөрийн баримтаа оруулна уу.',
      };
      const known = Object.entries(messageByCode).find(([code]) => toError(rpcError, '').message.includes(code))?.[1];
      throw known ? new Error(known) : toError(rpcError, 'Төлбөрийн баримт хадгалахад алдаа гарлаа.');
    }
    return { paymentId: paymentId as string, proofId: '', proofPath: storedPath };
  }

  // Cargo path (refined in Phase 9) — keep the direct inserts for now.
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      cargo_request_id: input.targetId,
      amount,
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
      cargo_request_id: input.targetId,
      proof_type: 'payment',
      file_url: storedPath,
      note: input.note || null,
    })
    .select('id')
    .single();
  if (proofError) throw toError(proofError, 'Proof timeline хадгалахад алдаа гарлаа.');

  const { error: statusError } = await supabase.rpc('set_cargo_request_status', {
    p_cargo_id: input.targetId,
    p_status: 'payment_review',
    p_note: 'Илгээгч төлбөрийн баримт илгээв.',
  });
  if (statusError) throw toError(statusError, 'Ачааны төлөв шинэчлэхэд алдаа гарлаа.');

  return {
    paymentId: payment.id as string,
    proofId: proof.id as string,
    proofPath: storedPath,
  };
}

export interface PlatformPaymentInfo {
  holder: string;
  bankName: string;
  account: string;
}

/** Read the admin-configured platform bank account travelers pay into. */
export async function fetchPlatformPaymentInfo(): Promise<PlatformPaymentInfo | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('get_platform_payment_info');
  if (error || !data) return null;
  const row = data as { holder?: string; bank_name?: string; account?: string };
  return {
    holder: row.holder || '',
    bankName: row.bank_name || '',
    account: row.account || '',
  };
}
