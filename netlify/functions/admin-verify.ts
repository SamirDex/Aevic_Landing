import type { Handler, HandlerEvent } from '@netlify/functions';
import { supabase, getSessionToken } from './_adminAuthUtils';

export const handler: Handler = async (event: HandlerEvent) => {
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed.' }),
    };
  }

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
};
