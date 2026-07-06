import type { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { randomBytes, timingSafeEqual } from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ADMIN_SERVER_KEY = process.env.ADMIN_SERVER_KEY?.trim() || '';
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase credentials not configured');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Timing-safe comparison for admin key
function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  return timingSafeEqual(aBuffer, bBuffer);
}

// Extract session token from cookie
function getSessionToken(event: HandlerEvent): string | null {
  const cookieHeader = event.headers?.cookie || event.headers?.Cookie || '';
  const match = cookieHeader.match(/aevic_admin_session=([^;]+)/);
  return match ? match[1] : null;
}

// Set session cookie
function setSessionCookie(token: string): string {
  const isProduction = process.env.NODE_ENV === 'production';
  return `aevic_admin_session=${token}; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Strict; Path=/; Max-Age=86400`;
}

// Clear session cookie
function clearSessionCookie(): string {
  const isProduction = process.env.NODE_ENV === 'production';
  return `aevic_admin_session=; HttpOnly; ${isProduction ? 'Secure;' : ''} SameSite=Strict; Path=/; Max-Age=0`;
}

// POST /api/admin/login
async function handleLogin(event: HandlerEvent): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> {
  if (!ADMIN_SERVER_KEY) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server configuration error: ADMIN_SERVER_KEY not set.' }),
    };
  }

  let body: { key?: string };
  try {
    body = JSON.parse(event.body || '{}') as { key?: string };
  } catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON.' }),
    };
  }

  const incomingKey = body.key?.trim() || '';

  if (!timingSafeEqualString(incomingKey, ADMIN_SERVER_KEY)) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Yanlış açar.' }),
    };
  }

  // Generate secure session token
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL).toISOString();

  // Store session in Supabase
  const { error: insertError } = await supabase
    .from('admin_sessions')
    .insert({ token, expires_at: expiresAt });

  if (insertError) {
    console.error('[admin-auth] Session insert error:', insertError);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Session creation failed.' }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': setSessionCookie(token),
    },
    body: JSON.stringify({ ok: true }),
  };
}

// POST /api/admin/verify
async function handleVerify(event: HandlerEvent): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> {
  const token = getSessionToken(event);

  if (!token) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authenticated: false }),
    };
  }

  const { data: session, error } = await supabase
    .from('admin_sessions')
    .select('expires_at')
    .eq('token', token)
    .maybeSingle();

  if (error || !session) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authenticated: false }),
    };
  }

  // Check if session is expired
  if (new Date(session.expires_at) < new Date()) {
    // Clean up expired session
    await supabase.from('admin_sessions').delete().eq('token', token);
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authenticated: false }),
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authenticated: true }),
  };
}

// POST /api/admin/logout
async function handleLogout(event: HandlerEvent): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> {
  const token = getSessionToken(event);

  if (token) {
    await supabase.from('admin_sessions').delete().eq('token', token);
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': clearSessionCookie(),
    },
    body: JSON.stringify({ ok: true }),
  };
}

// Main handler
export const handler: Handler = async (event) => {
  const method = event.httpMethod || 'GET';
  const path = event.path || '';

  // Route based on path
  if (method === 'POST' && path === '/api/admin/login') {
    return handleLogin(event);
  }

  if (method === 'POST' && path === '/api/admin/verify') {
    return handleVerify(event);
  }

  if (method === 'POST' && path === '/api/admin/logout') {
    return handleLogout(event);
  }

  return {
    statusCode: 404,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Endpoint not found.' }),
  };
};
