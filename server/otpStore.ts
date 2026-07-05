// server/otpStore.ts
// Supabase-based OTP store (Netlify Functions serverless environment üçün etibarlı)

import { getSupabaseAdmin, isSupabasePersistEnabled } from './supabasePersist';

const cleanupExpired = async () => {
  const client = getSupabaseAdmin();
  if (!client) return;

  const now = Date.now();
  try {
    await client
      .from('otp_codes')
      .delete()
      .lt('expires_at', now);
  } catch (error) {
    console.error('[otp-store] Cleanup error:', error);
  }
};

export const saveOtp = async (
  dataDir: string,
  email: string,
  code: string,
  registrationData: unknown,
): Promise<void> => {
  // dataDir parameter saxlanılır (backward compatibility), amma istifadə olunmur
  const client = getSupabaseAdmin();
  if (!client) {
    throw new Error('Supabase konfiqurasiya olunmayıb.');
  }

  // Əvvəlki OTP-ləri təmizlə
  await cleanupExpired();

  const normalizedEmail = email.toLowerCase();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 dəqiqə

  // Eyni email üçün mövcud OTP-ni sil (upsert)
  await client
    .from('otp_codes')
    .delete()
    .eq('email', normalizedEmail);

  // Yeni OTP əlavə et
  await client
    .from('otp_codes')
    .insert({
      email: normalizedEmail,
      code,
      expires_at: expiresAt,
      registration_data: registrationData as Record<string, unknown>,
    });
};

export const verifyAndConsumeOtp = async (
  dataDir: string,
  email: string,
  code: string,
): Promise<{ ok: true; registrationData: unknown } | { ok: false; error: string }> => {
  // dataDir parameter saxlanılır (backward compatibility), amma istifadə olunmur
  const client = getSupabaseAdmin();
  if (!client) {
    return { ok: false, error: 'Supabase konfiqurasiya olunmayıb.' };
  }

  const normalizedEmail = email.toLowerCase();
  const now = Date.now();

  // Əvvəl expired OTP-ləri təmizlə
  await cleanupExpired();

  // OTP-ni tap
  const { data, error } = await client
    .from('otp_codes')
    .select('*')
    .eq('email', normalizedEmail)
    .eq('code', code.trim())
    .gt('expires_at', now)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: 'Kod tapılmadı. Yenidən qeydiyyatdan keçin.' };
  }

  // Kod düzgündür - sil və qaytar
  await client
    .from('otp_codes')
    .delete()
    .eq('id', data.id);

  return { ok: true, registrationData: data.registration_data };
};

export const getOtpData = async (
  dataDir: string,
  email: string,
): Promise<{ ok: true; registrationData: unknown } | { ok: false; error: string }> => {
  // dataDir parameter saxlanılır (backward compatibility), amma istifadə olunmur
  const client = getSupabaseAdmin();
  if (!client) {
    return { ok: false, error: 'Supabase konfiqurasiya olunmayıb.' };
  }

  const normalizedEmail = email.toLowerCase();
  const now = Date.now();

  // Əvvəl expired OTP-ləri təmizlə
  await cleanupExpired();

  const { data, error } = await client
    .from('otp_codes')
    .select('*')
    .eq('email', normalizedEmail)
    .gt('expires_at', now)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: 'OTP tapılmadı.' };
  }

  return { ok: true, registrationData: data.registration_data };
};
