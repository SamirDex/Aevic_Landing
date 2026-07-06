import { randomBytes, createHash } from 'node:crypto';
import type { TeamsApiRequest, TeamsApiResponse } from './teamsApiCore';

const ADMIN_SECRET = process.env.ADMIN_SERVER_KEY?.trim() ?? '';
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

// JWT-like token verification (stateless for serverless)
export function generateAdminSession(): string {
  const timestamp = Date.now();
  const payload = `${timestamp}:${ADMIN_SECRET}`;
  const signature = createHash('sha256').update(payload).digest('hex');
  return Buffer.from(`${timestamp}:${signature}`).toString('base64');
}

export function verifyAdminSession(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [timestampStr, signature] = decoded.split(':');
    
    if (!timestampStr || !signature) return false;
    
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;
    
    // Check TTL
    if (Date.now() - timestamp > SESSION_TTL) {
      return false;
    }
    
    // Verify signature
    const payload = `${timestamp}:${ADMIN_SECRET}`;
    const expectedSignature = createHash('sha256').update(payload).digest('hex');
    
    return signature === expectedSignature;
  } catch {
    return false;
  }
}

export async function handleAdminLogin(apiReq: TeamsApiRequest): Promise<TeamsApiResponse> {
  const { body } = apiReq;
  const { key } = body as { key?: string };
  const adminKey = process.env.ADMIN_SERVER_KEY?.trim() ?? '';

  // DIAGNOSTIC LOGS
  const trimmedKey = key?.trim() ?? '';
  console.log('[ADMIN LOGIN DIAGNOSTIC]');
  console.log('  - Incoming key length:', trimmedKey.length);
  console.log('  - ADMIN_SERVER_KEY length:', adminKey.length);
  console.log('  - Incoming key first 2 char codes:', trimmedKey.length >= 2 ? [trimmedKey.charCodeAt(0), trimmedKey.charCodeAt(1)] : 'N/A');
  console.log('  - Incoming key last 2 char codes:', trimmedKey.length >= 2 ? [trimmedKey.charCodeAt(trimmedKey.length - 2), trimmedKey.charCodeAt(trimmedKey.length - 1)] : 'N/A');
  console.log('  - ADMIN_SERVER_KEY first 2 char codes:', adminKey.length >= 2 ? [adminKey.charCodeAt(0), adminKey.charCodeAt(1)] : 'N/A');
  console.log('  - ADMIN_SERVER_KEY last 2 char codes:', adminKey.length >= 2 ? [adminKey.charCodeAt(adminKey.length - 2), adminKey.charCodeAt(adminKey.length - 1)] : 'N/A');
  console.log('  - ADMIN_SERVER_KEY is undefined:', process.env.ADMIN_SERVER_KEY === undefined);
  console.log('  - ADMIN_SERVER_KEY is empty string:', process.env.ADMIN_SERVER_KEY === '');
  console.log('  - Raw ADMIN_SERVER_KEY value:', process.env.ADMIN_SERVER_KEY ? `"${process.env.ADMIN_SERVER_KEY}"` : 'undefined');
  // END DIAGNOSTIC LOGS

  if (!adminKey) {
    return { status: 500, payload: { error: 'Server configuration error: ADMIN_SERVER_KEY not set.' } };
  }

  if (!key || key.trim() !== adminKey) {
    return { status: 403, payload: { error: 'İcazə yoxdur. Yanlış admin açarı.' } };
  }

  const sessionId = generateAdminSession();
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    status: 200,
    payload: { ok: true },
    headers: {
      'Set-Cookie': `aevic_admin_session=${sessionId}; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Lax; Path=/; Max-Age=86400`,
    },
  };
}

export async function handleAdminLogout(apiReq: TeamsApiRequest): Promise<TeamsApiResponse> {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    status: 200,
    payload: { ok: true },
    headers: {
      'Set-Cookie': `aevic_admin_session=; HttpOnly; ${isProduction ? 'Secure;' : ''} SameSite=Strict; Path=/; Max-Age=0`,
    },
  };
}

export function isAdminRequest(apiReq: TeamsApiRequest): boolean {
  const headers = apiReq.headers ?? {};
  const authHeader = headers['x-admin-key'] ?? '';
  const cookieHeader = headers['cookie'] ?? '';
  const adminKey = process.env.ADMIN_SERVER_KEY?.trim() ?? '';
  
  // Check for API key (for server-to-server)
  if (authHeader && authHeader === adminKey) {
    return true;
  }
  
  // Check for session cookie
  const sessionCookieMatch = cookieHeader.match(/aevic_admin_session=([^;]+)/);
  if (sessionCookieMatch) {
    return verifyAdminSession(sessionCookieMatch[1]);
  }
  
  return false;
}
