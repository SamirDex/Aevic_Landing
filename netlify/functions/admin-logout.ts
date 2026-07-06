import type { Handler, HandlerEvent } from '@netlify/functions';
import { supabase, getSessionToken, clearSessionCookie } from './_adminAuthUtils';

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
};
