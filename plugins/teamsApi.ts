import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createTeamsApiHandler, type TeamsApiRequest, startRateLimitCleanup, stopRateLimitCleanup } from '../server/teamsApiCore';

const loadDotEnv = () => {
  try {
    const content = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (key && !(key in process.env)) process.env[key] = value;
    }
  } catch {}
};

const readBody = async (req: IncomingMessage) => {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
};

const sendResponse = (res: ServerResponse, result: Awaited<ReturnType<ReturnType<typeof createTeamsApiHandler>>>) => {
  res.statusCode = result.status;

  if (result.rawBody) {
    if (result.headers) {
      for (const [key, value] of Object.entries(result.headers)) {
        res.setHeader(key, value);
      }
    }

    res.end(result.rawBody);
    return;
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(result.payload ?? {}));
};

export const teamsApiPlugin = (dataDir: string): Plugin => {
  loadDotEnv();
  const handleApi = createTeamsApiHandler(dataDir);

  const handler = async (req: IncomingMessage, res: ServerResponse, next: (error?: unknown) => void) => {
    if (!req.url?.startsWith('/api/')) {
      next();
      return;
    }

    try {
      const requestUrl = new URL(req.url, 'http://localhost');
      const method = req.method || 'GET';
      const body =
        method === 'GET' || method === 'HEAD'
          ? {}
          : ((await readBody(req)) as Record<string, unknown>);

      const apiReq: TeamsApiRequest = {
        method,
        pathname: requestUrl.pathname,
        searchParams: requestUrl.searchParams,
        body,
        headers: Object.fromEntries(
          Object.entries(req.headers).map(([key, value]) => [
            key.toLowerCase(),
            Array.isArray(value) ? value.join(',') : value ?? '',
          ]),
        ),
      };

      const result = await handleApi(apiReq);
      sendResponse(res, result);
    } catch (error) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Server xətası.',
        }),
      );
    }
  };

  return {
    name: 'teams-api',
    configureServer(server) {
      startRateLimitCleanup();
      server.middlewares.use(handler);
      server.httpServer?.on('close', () => {
        stopRateLimitCleanup();
      });
    },
    configurePreviewServer(server) {
      startRateLimitCleanup();
      server.middlewares.use(handler);
      server.httpServer?.on('close', () => {
        stopRateLimitCleanup();
      });
    },
    closeBundle() {
      stopRateLimitCleanup();
    },
  };
};
