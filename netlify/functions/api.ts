import type { Handler, HandlerEvent } from '@netlify/functions';
import { createTeamsApiHandler } from '../../server/teamsApiCore';

const handleApi = createTeamsApiHandler(process.env.AEVIC_DATA_DIR || '/tmp/aevic-data');

const toSearchParams = (event: HandlerEvent) => {
  const params = new URLSearchParams();

  if (event.queryStringParameters) {
    for (const [key, value] of Object.entries(event.queryStringParameters)) {
      if (value != null) {
        params.set(key, value);
      }
    }
  }

  if (event.multiValueQueryStringParameters) {
    for (const [key, values] of Object.entries(event.multiValueQueryStringParameters)) {
      for (const value of values ?? []) {
        if (value != null) {
          params.append(key, value);
        }
      }
    }
  }

  return params;
};

const resolvePathname = (event: HandlerEvent) => {
  if (event.path?.startsWith('/api')) {
    return event.path;
  }

  if (event.rawUrl) {
    try {
      return new URL(event.rawUrl).pathname;
    } catch {
      // ignore
    }
  }

  return '/api';
};

export const handler: Handler = async (event) => {
  const method = event.httpMethod || 'GET';
  const pathname = resolvePathname(event);

  let body: Record<string, unknown> = {};

  if (method !== 'GET' && method !== 'HEAD' && event.body) {
    try {
      body = JSON.parse(event.body) as Record<string, unknown>;
    } catch {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ error: 'Yanlış JSON formatı.' }),
      };
    }
  }

  try {
    const result = await handleApi({
      method,
      pathname,
      searchParams: toSearchParams(event),
      body,
      headers: Object.fromEntries(
        Object.entries(event.headers ?? {}).map(([key, value]) => [key.toLowerCase(), value ?? '']),
      ),
    });

    if (result.rawBody) {
      return {
        statusCode: result.status,
        headers: {
          ...(result.headers ?? {}),
          'Content-Type': result.headers?.['Content-Type'] ?? 'application/octet-stream',
        },
        body: result.rawBody.toString('base64'),
        isBase64Encoded: true,
      };
    }

    return {
      statusCode: result.status,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(result.payload ?? {}),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Server xətası.',
      }),
    };
  }
};
