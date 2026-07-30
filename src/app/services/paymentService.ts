import { supabase } from '../lib/supabase';
import { safeUploadFileName, validateUploadFile } from '../utils/fileValidation';

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

export async function uploadPaymentProof(input: UploadPaymentProofInput): Promise<UploadPaymentProofResult> {
  if (!supabase) throw new Error('Системийн холболт тохируулагдаагүй байна. Админд мэдэгдэнэ үү.');

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw toError(userError, 'User session check failed.');

  const userId = userData.user?.id;
  if (!userId) throw new Error('Төлбөрийн баримт илгээхийн тулд дахин нэвтэрнэ үү.');

  validateUploadFile(input.file, {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.pdf'],
    maxBytes: 10 * 1024 * 1024,
    typeError: 'Зөвхөн JPG, PNG, WEBP эсвэл PDF баримт оруулна уу.',
    sizeError: 'Файлын хэмжээ 10MB-аас бага байх ёстой.',
  });

  const path = `${userId}/${input.target}/${input.targetId}/${Date.now()}-${safeUploadFileName(input.file.name, 'payment-proof')}`;

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

  const { data, error: cargoPaymentError } = await supabase.rpc('submit_cargo_payment_proof', {
    p_cargo_id: input.targetId,
    p_amount: amount,
    p_proof_url: storedPath,
    p_note: input.note || null,
  });
  if (cargoPaymentError) {
    const messageByCode: Record<string, string> = {
      not_your_cargo: 'Энэ ачааны хүсэлт таных биш байна.',
      cargo_not_payable: 'Энэ ачааны хүсэлт одоо төлбөр хүлээж авах төлөвт байхгүй байна.',
      invalid_amount: 'Төлбөрийн дүн буруу байна.',
      proof_required: 'Төлбөрийн баримтаа оруулна уу.',
    };
    const known = Object.entries(messageByCode)
      .find(([code]) => toError(cargoPaymentError, '').message.includes(code))?.[1];
    throw known ? new Error(known) : toError(cargoPaymentError, 'Ачааны төлбөрийн баримт хадгалахад алдаа гарлаа.');
  }

  const result = (data || {}) as { payment_id?: string; proof_id?: string };
  if (!result.payment_id || !result.proof_id) {
    throw new Error('Ачааны төлбөрийн баримтын хариу буруу байна.');
  }

  return {
    paymentId: result.payment_id,
    proofId: result.proof_id,
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
