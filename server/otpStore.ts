// server/otpStore.ts
// File-based OTP store (Netlify Functions serverless environment üçün etibarlı)

import fs from 'node:fs/promises';
import path from 'node:path';

type OtpEntry = {
  code: string;
  expiresAt: number;
  registrationData: unknown;
};

type OtpStore = Record<string, OtpEntry>;

let otpCache: OtpStore | null = null;

const getOtpStorePath = (dataDir: string): string => path.join(dataDir, 'otp.json');

const readOtpStore = async (dataDir: string): Promise<OtpStore> => {
  if (otpCache !== null) {
    return otpCache;
  }

  try {
    const storePath = getOtpStorePath(dataDir);
    const raw = await fs.readFile(storePath, 'utf8');
    const parsed = JSON.parse(raw) as OtpStore;
    otpCache = parsed;
    return parsed;
  } catch {
    // Fayl yoxdursa boş obyekt qaytar
    otpCache = {};
    return {};
  }
};

const writeOtpStore = async (dataDir: string, store: OtpStore): Promise<void> => {
  const storePath = getOtpStorePath(dataDir);
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(store, null, 2), 'utf8');
  otpCache = store;
};

const cleanupExpired = (store: OtpStore): OtpStore => {
  const now = Date.now();
  const cleaned: OtpStore = {};
  for (const [email, entry] of Object.entries(store)) {
    if (entry.expiresAt > now) {
      cleaned[email] = entry;
    }
  }
  return cleaned;
};

export const saveOtp = async (
  dataDir: string,
  email: string,
  code: string,
  registrationData: unknown,
): Promise<void> => {
  const store = await readOtpStore(dataDir);
  const cleaned = cleanupExpired(store);
  cleaned[email.toLowerCase()] = {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 dəqiqə
    registrationData,
  };
  await writeOtpStore(dataDir, cleaned);
};

export const verifyAndConsumeOtp = async (
  dataDir: string,
  email: string,
  code: string,
): Promise<{ ok: true; registrationData: unknown } | { ok: false; error: string }> => {
  const store = await readOtpStore(dataDir);
  const cleaned = cleanupExpired(store);
  const entry = cleaned[email.toLowerCase()];

  if (!entry) {
    await writeOtpStore(dataDir, cleaned);
    return { ok: false, error: 'Kod tapılmadı. Yenidən qeydiyyatdan keçin.' };
  }

  if (entry.code !== code.trim()) {
    await writeOtpStore(dataDir, cleaned);
    return { ok: false, error: 'Kod yanlışdır.' };
  }

  // Kod düzgündür - sil və qaytar
  delete cleaned[email.toLowerCase()];
  await writeOtpStore(dataDir, cleaned);
  return { ok: true, registrationData: entry.registrationData };
};

export const getOtpData = async (
  dataDir: string,
  email: string,
): Promise<{ ok: true; registrationData: unknown } | { ok: false; error: string }> => {
  const store = await readOtpStore(dataDir);
  const cleaned = cleanupExpired(store);
  const entry = cleaned[email.toLowerCase()];

  if (!entry) {
    return { ok: false, error: 'OTP tapılmadı.' };
  }

  return { ok: true, registrationData: entry.registrationData };
};
