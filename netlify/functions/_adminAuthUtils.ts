import type { HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ADMIN_SERVER_KEY = process.env.ADMIN_SERVER_KEY?.trim() || '';
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase credentials not configured');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const ADMIN_KEY = ADMIN_SERVER_KEY;

// Timing-safe comparison for admin key
export function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  return timingSafeEqual(aBuffer, bBuffer);
}

// Extract session token from cookie
export function getSessionToken(event: HandlerEvent): string | null {
  const cookieHeader = event.headers?.cookie || event.headers?.Cookie || '';
  const match = cookieHeader.match(/aevic_admin_session=([^;]+)/);
  return match ? match[1] : null;
}

// Set session cookie
export function setSessionCookie(token: string): string {
  const isProduction = process.env.NODE_ENV === 'production';
  return `aevic_admin_session=${token}; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Strict; Path=/; Max-Age=86400`;
}

// Clear session cookie
export function clearSessionCookie(): string {
  const isProduction = process.env.NODE_ENV === 'production';
  return `aevic_admin_session=; HttpOnly; ${isProduction ? 'Secure;' : ''} SameSite=Strict; Path=/; Max-Age=0`;
}
