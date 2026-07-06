import type { Handler, HandlerEvent } from '@netlify/functions';
import { randomBytes } from 'node:crypto';
import { supabase, ADMIN_KEY, timingSafeEqualString, setSessionCookie } from './_adminAuthUtils';

const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const handler: Handler = async (event: HandlerEvent) => {
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed.' }),
    };
  }

  // Check if admin key is configured
  if (!ADMIN_KEY) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server configuration error: ADMIN_SERVER_KEY not set.' }),
    };
  }

  // Parse request body
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

  // Timing-safe comparison
  if (!timingSafeEqualString(incomingKey, ADMIN_KEY)) {
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
    console.error('[admin-login] Session insert error:', insertError);
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
};
